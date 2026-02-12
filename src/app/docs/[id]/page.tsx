"use client"

import { type DragEvent, useCallback, useEffect, useRef, useState } from "react"
import { useParams } from "next/navigation"
import { EditorContent, useEditor } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"
import Underline from "@tiptap/extension-underline"
import TextAlign from "@tiptap/extension-text-align"
import Highlight from "@tiptap/extension-highlight"
import Color from "@tiptap/extension-color"
import { TextStyle } from "@tiptap/extension-text-style"
import FontFamily from "@tiptap/extension-font-family"
import Subscript from "@tiptap/extension-subscript"
import Superscript from "@tiptap/extension-superscript"
import Link from "@tiptap/extension-link"
import Image from "@tiptap/extension-image"
import { Table } from "@tiptap/extension-table"
import TableRow from "@tiptap/extension-table-row"
import TableCell from "@tiptap/extension-table-cell"
import TableHeader from "@tiptap/extension-table-header"
import TaskList from "@tiptap/extension-task-list"
import TaskItem from "@tiptap/extension-task-item"
import Typography from "@tiptap/extension-typography"
import { Toolbar } from "../_components/toolbar"
import { MenuBar } from "../_components/menu-bar"
import { DocHeader } from "../_components/doc-header"
import { FontSize } from "../_components/font-size"
import { api } from "~/trpc/react"

const LOCAL_SAVE_DELAY = 500
const DB_SAVE_INTERVAL = 5 * 60 * 1000 // 5 minutes

function getLocalStorageKey(id: string) {
  return `doc-${id}`
}

function parseContent(raw: string): string | Record<string, unknown> {
  try {
    const parsed = JSON.parse(raw) as Record<string, unknown>
    if (parsed.type === "doc") return parsed
  } catch { /* not JSON, treat as HTML */ }
  return raw
}

export default function EditorPage() {
  const { id } = useParams<{ id: string }>()
  const [docName, setDocName] = useState("Sans titre")
  const localSaveRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const dbIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const hasLoadedContent = useRef(false)
  const docNameRef = useRef(docName)

  // Keep ref in sync and update browser tab title
  useEffect(() => {
    docNameRef.current = docName
    document.title = docName || "Sans titre"
  }, [docName])

  const { data: fichier } = api.fichier.getById.useQuery(
    { id },
    { enabled: !!id },
  )

  const utils = api.useUtils()
  const saveMutation = api.fichier.save.useMutation()

  const saveToDb = useCallback(
    (content: string) => {
      return saveMutation.mutateAsync({
        id,
        name: docNameRef.current,
        content,
      })
    },
    [id, saveMutation],
  )

  const saveToLocal = useCallback(
    (content: string) => {
      localStorage.setItem(getLocalStorageKey(id), JSON.stringify({
        content,
        name: docNameRef.current,
        savedAt: Date.now(),
      }))
    },
    [id],
  )

  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      TextStyle,
      FontFamily,
      FontSize,
      Color,
      Highlight.configure({ multicolor: true }),
      TextAlign.configure({
        types: ["heading", "paragraph"],
      }),
      Subscript,
      Superscript,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: "text-blue-600 underline cursor-pointer",
        },
      }),
      Image.configure({
        inline: false,
        allowBase64: true,
      }),
      Table.configure({
        resizable: true,
      }),
      TableRow,
      TableCell,
      TableHeader,
      TaskList,
      TaskItem.configure({
        nested: true,
      }),
      Typography,
    ],
    content: "",
    immediatelyRender: false,
  })

  const getContent = useCallback(() => {
    if (!editor) return ""
    return JSON.stringify(editor.getJSON())
  }, [editor])

  // Load content: compare localStorage and DB timestamps, use the most recent
  useEffect(() => {
    if (!editor || hasLoadedContent.current) return

    let localContent: string | null = null
    let localName: string | null = null
    let localSavedAt = 0

    const localData = localStorage.getItem(getLocalStorageKey(id))
    if (localData) {
      try {
        const parsed = JSON.parse(localData) as { content: string; name: string; savedAt?: number }
        if (parsed.content) {
          localContent = parsed.content
          localName = parsed.name
          localSavedAt = parsed.savedAt ?? 0
        }
      } catch { /* ignore */ }
    }

    if (fichier) {
      hasLoadedContent.current = true
      const dbSavedAt = new Date(fichier.updatedAt).getTime()

      if (localContent && localSavedAt > dbSavedAt) {
        // localStorage is more recent
        editor.commands.setContent(parseContent(localContent))
        setDocName(localName ?? fichier.name)
      } else {
        // DB is more recent (or no local data)
        setDocName(fichier.name)
        if (fichier.content) {
          editor.commands.setContent(parseContent(fichier.content))
        }
      }
    } else if (localContent) {
      // DB not loaded yet, show local data in the meantime
      editor.commands.setContent(parseContent(localContent))
      if (localName) setDocName(localName)
    }
  }, [fichier, editor, id])

  // Debounced save to localStorage on editor changes
  useEffect(() => {
    if (!editor) return

    const onUpdate = () => {
      if (localSaveRef.current) clearTimeout(localSaveRef.current)
      localSaveRef.current = setTimeout(() => {
        saveToLocal(getContent())
      }, LOCAL_SAVE_DELAY)
    }

    editor.on("update", onUpdate)
    return () => {
      editor.off("update", onUpdate)
      if (localSaveRef.current) clearTimeout(localSaveRef.current)
    }
  }, [editor, saveToLocal, getContent])

  // Also save to localStorage when the name changes
  useEffect(() => {
    if (!editor || !hasLoadedContent.current) return
    if (localSaveRef.current) clearTimeout(localSaveRef.current)
    localSaveRef.current = setTimeout(() => {
      saveToLocal(getContent())
    }, LOCAL_SAVE_DELAY)
  }, [docName, editor, saveToLocal, getContent])

  const handleEditorDrop = useCallback(
    (e: DragEvent<HTMLDivElement>) => {
      const file = e.dataTransfer?.files[0]
      if (!file?.type.startsWith("image/") || !editor) return
      e.preventDefault()
      const reader = new FileReader()
      reader.onload = () => {
        const dataUrl = reader.result as string
        editor.chain().focus().setImage({ src: dataUrl }).run()
      }
      reader.readAsDataURL(file)
    },
    [editor],
  )

  // Save to DB every 5 minutes (stable interval, reads latest values via refs)
  useEffect(() => {
    if (!editor) return

    dbIntervalRef.current = setInterval(() => {
      void saveToDb(getContent())
    }, DB_SAVE_INTERVAL)

    return () => {
      if (dbIntervalRef.current) clearInterval(dbIntervalRef.current)
    }
  }, [editor, saveToDb, getContent])

  return (
    <div className="flex min-h-screen flex-col bg-gray-100">
      <div className="sticky top-0 z-10 bg-white">
        <DocHeader
          name={docName}
          onNameChange={setDocName}
          onSave={async () => {
            if (editor) {
              const content = getContent()
              saveToLocal(content)
              await saveToDb(content)
              await utils.fichier.search.invalidate()
            }
          }}
        />
        <MenuBar
          editor={editor}
          docName={docName}
          onSave={async () => {
            if (editor) {
              const content = getContent()
              saveToLocal(content)
              await saveToDb(content)
              await utils.fichier.search.invalidate()
            }
          }}
        />
        <Toolbar editor={editor} />
      </div>
      <div
        className="flex flex-1 justify-center py-8"
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleEditorDrop}
      >
        <div
          className="tiptap-editor a4-page cursor-text"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              editor?.chain().focus("end").run()
            }
          }}
        >
          <EditorContent editor={editor} />
        </div>
      </div>
    </div>
  )
}
