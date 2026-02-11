/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
"use client"

import { useCallback, useEffect, useRef, useState } from "react"
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
import { DocHeader } from "../_components/doc-header"
import { FontSize } from "../_components/font-size"
import { api } from "~/trpc/react"

const LOCAL_SAVE_DELAY = 500
const DB_SAVE_INTERVAL = 5 * 60 * 1000 // 5 minutes

function getLocalStorageKey(id: string) {
  return `doc-${id}`
}

export default function EditorPage() {
  const { id } = useParams<{ id: string }>()
  const [docName, setDocName] = useState("Sans titre")
  const localSaveRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const dbIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const hasLoadedContent = useRef(false)
  const docNameRef = useRef(docName)

  // Keep ref in sync so callbacks always use latest name
  useEffect(() => {
    docNameRef.current = docName
  }, [docName])

  const { data: fichier } = api.fichier.getById.useQuery(
    { id },
    { enabled: !!id },
  )

  const utils = api.useUtils()
  const saveMutation = api.fichier.save.useMutation()

  const saveToDb = useCallback(
    (html: string) => {
      return saveMutation.mutateAsync({
        id,
        name: docNameRef.current,
        content: html,
      })
    },
    [id, saveMutation],
  )

  const saveToLocal = useCallback(
    (html: string) => {
      localStorage.setItem(getLocalStorageKey(id), JSON.stringify({
        content: html,
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
        editor.commands.setContent(localContent)
        setDocName(localName ?? fichier.name)
      } else {
        // DB is more recent (or no local data)
        setDocName(fichier.name)
        if (fichier.content) {
          editor.commands.setContent(fichier.content)
        }
      }
    } else if (localContent) {
      // DB not loaded yet, show local data in the meantime
      editor.commands.setContent(localContent)
      if (localName) setDocName(localName)
    }
  }, [fichier, editor, id])

  // Debounced save to localStorage on editor changes
  useEffect(() => {
    if (!editor) return

    const onUpdate = () => {
      if (localSaveRef.current) clearTimeout(localSaveRef.current)
      localSaveRef.current = setTimeout(() => {
        saveToLocal(editor.getHTML())
      }, LOCAL_SAVE_DELAY)
    }

    editor.on("update", onUpdate)
    return () => {
      editor.off("update", onUpdate)
      if (localSaveRef.current) clearTimeout(localSaveRef.current)
    }
  }, [editor, saveToLocal])

  // Also save to localStorage when the name changes
  useEffect(() => {
    if (!editor || !hasLoadedContent.current) return
    if (localSaveRef.current) clearTimeout(localSaveRef.current)
    localSaveRef.current = setTimeout(() => {
      saveToLocal(editor.getHTML())
    }, LOCAL_SAVE_DELAY)
  }, [docName, editor, saveToLocal])

  // Save to DB every 5 minutes (stable interval, reads latest values via refs)
  useEffect(() => {
    if (!editor) return

    dbIntervalRef.current = setInterval(() => {
      saveToDb(editor.getHTML())
    }, DB_SAVE_INTERVAL)

    return () => {
      if (dbIntervalRef.current) clearInterval(dbIntervalRef.current)
    }
  }, [editor, saveToDb])

  return (
    <div className="flex min-h-screen flex-col bg-gray-100">
      <div className="sticky top-0 z-10 bg-white">
        <DocHeader
          name={docName}
          onNameChange={setDocName}
          onSave={async () => {
            if (editor) {
              const html = editor.getHTML()
              saveToLocal(html)
              await saveToDb(html)
              await utils.fichier.search.invalidate()
            }
          }}
        />
        <Toolbar editor={editor} />
      </div>
      <div className="flex flex-1 justify-center py-8">
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
