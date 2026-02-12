"use client"

import { type Editor } from "@tiptap/react"
import { ChevronRight } from "lucide-react"
import { type DragEvent, useRef, useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Upload } from "lucide-react"

interface MenuBarProps {
  editor: Editor | null
  onSave?: () => Promise<void> | void
  docName?: string
}

interface MenuItem {
  label: string
  shortcut?: string
  onClick?: () => void
  disabled?: boolean
  separator?: false
  children?: MenuItem[]
  customPanel?: React.ReactNode
}

interface MenuSeparator {
  separator: true
}

type MenuEntry = MenuItem | MenuSeparator

function SubMenu({ item, onClose }: { item: MenuItem; onClose: () => void }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  return (
    <div
      ref={ref}
      className="relative"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <button
        type="button"
        className="flex w-full items-center justify-between px-4 py-1.5 text-left text-sm text-gray-700 hover:bg-gray-100"
        onMouseDown={(e) => e.preventDefault()}
      >
        <span>{item.label}</span>
        <ChevronRight size={14} className="text-gray-400" />
      </button>
      {open && item.customPanel}
      {open && !item.customPanel && item.children && (
        <div className="absolute left-full top-0 z-50 min-w-[200px] rounded-md border border-gray-200 bg-white py-1 shadow-lg">
          {item.children.map((child, i) => (
            <button
              key={i}
              type="button"
              disabled={child.disabled}
              className="flex w-full items-center justify-between px-4 py-1.5 text-left text-sm text-gray-700 hover:bg-gray-100 disabled:text-gray-300"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => {
                child.onClick?.()
                onClose()
              }}
            >
              <span>{child.label}</span>
              {child.shortcut && (
                <span className="ml-6 text-xs text-gray-400">{child.shortcut}</span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

function MenuDropdown({
  label,
  items,
  isOpen,
  onOpen,
  onClose,
}: {
  label: string
  items: MenuEntry[]
  isOpen: boolean
  onOpen: () => void
  onClose: () => void
}) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!isOpen) return
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose()
      }
    }
    document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [isOpen, onClose])

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        className={`rounded px-2.5 py-1 text-sm transition-colors ${
          isOpen ? "bg-gray-200 text-gray-900" : "text-gray-700 hover:bg-gray-100"
        }`}
        onClick={() => (isOpen ? onClose() : onOpen())}
        onMouseDown={(e) => e.preventDefault()}
      >
        {label}
      </button>
      {isOpen && (
        <div className="absolute left-0 top-full z-50 mt-0.5 min-w-[220px] rounded-md border border-gray-200 bg-white py-1 shadow-lg">
          {items.map((item, i) =>
            item.separator ? (
              <div key={i} className="my-1 border-t border-gray-100" />
            ) : (item.children ?? item.customPanel) ? (
              <SubMenu key={i} item={item} onClose={onClose} />
            ) : (
              <button
                key={i}
                type="button"
                disabled={item.disabled}
                className="flex w-full items-center justify-between px-4 py-1.5 text-left text-sm text-gray-700 hover:bg-gray-100 disabled:text-gray-300"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  item.onClick?.()
                  onClose()
                }}
              >
                <span>{item.label}</span>
                {item.shortcut && (
                  <span className="ml-6 text-xs text-gray-400">{item.shortcut}</span>
                )}
              </button>
            ),
          )}
        </div>
      )}
    </div>
  )
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

function getBaseName(docName?: string) {
  return (docName ?? "Document").replace(/[/\\?%*:|"<>]/g, "_")
}

function getPrintHtml(html: string) {
  return `<style>
    body { font-family: Inter, sans-serif; font-size: 16px; color: #000; margin: 0; padding: 0; }
    p { margin: 0.75em 0; }
    h1 { font-size: 2em; font-weight: 700; margin: 0.67em 0; }
    h2 { font-size: 1.5em; font-weight: 600; margin: 0.75em 0; }
    h3 { font-size: 1.25em; font-weight: 600; margin: 0.83em 0; }
    ul, ol { padding-left: 1.5em; margin: 0.75em 0; }
    ul { list-style-type: disc; }
    ol { list-style-type: decimal; }
    blockquote { border-left: 3px solid #d1d5db; padding-left: 1em; margin: 0.75em 0; color: #6b7280; }
    code { background-color: #f3f4f6; border-radius: 0.25em; padding: 0.15em 0.3em; font-size: 0.9em; }
    pre { background-color: #1f2937; color: #f9fafb; border-radius: 0.5em; padding: 1em; margin: 0.75em 0; }
    pre code { background: none; color: inherit; padding: 0; }
    hr { border: none; border-top: 1px solid #d1d5db; margin: 1.5em 0; }
    table { border-collapse: collapse; width: 100%; margin: 1em 0; }
    td, th { border: 1px solid #d1d5db; padding: 0.5em 0.75em; vertical-align: top; }
    th { background-color: #f3f4f6; font-weight: 600; }
    img { max-width: 100%; height: auto; }
    mark { border-radius: 0.15em; padding: 0.05em 0.1em; }
    sub { vertical-align: sub; font-size: 0.75em; }
    sup { vertical-align: super; font-size: 0.75em; }
  </style>${html}`
}

function ImageUploadPanel({
  onFile,
  onUrl,
  onClose,
  fileInputRef,
}: {
  onFile: (file: File) => void
  onUrl: () => void
  onClose: () => void
  fileInputRef: React.RefObject<HTMLInputElement | null>
}) {
  const [dragging, setDragging] = useState(false)

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files[0]
    if (file?.type.startsWith("image/")) {
      onFile(file)
      onClose()
    }
  }

  return (
    <div className="absolute left-full top-0 z-50 w-64 rounded-md border border-gray-200 bg-white p-3 shadow-lg">
      <div
        onDragOver={(e) => {
          e.preventDefault()
          setDragging(true)
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`mb-2 flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-4 transition-colors ${
          dragging
            ? "border-blue-500 bg-blue-50"
            : "border-gray-300 hover:border-gray-400 hover:bg-gray-50"
        }`}
      >
        <Upload size={24} className={dragging ? "text-blue-500" : "text-gray-400"} />
        <p className="mt-1 text-center text-xs text-gray-500">
          Glisser une image ici ou <span className="text-blue-600">parcourir</span>
        </p>
      </div>
      <button
        type="button"
        onMouseDown={(e) => {
          e.preventDefault()
          onUrl()
          onClose()
        }}
        className="w-full rounded px-3 py-1.5 text-left text-sm text-gray-700 hover:bg-gray-100"
      >
        Insérer via URL
      </button>
    </div>
  )
}

export function MenuBar({ editor, onSave, docName }: MenuBarProps) {
  const [openMenu, setOpenMenu] = useState<string | null>(null)
  const router = useRouter()
  const menuImageInputRef = useRef<HTMLInputElement>(null)

  const close = () => setOpenMenu(null)

  const fichierItems: MenuEntry[] = [
    {
      label: "Nouveau document",
      shortcut: "Ctrl+N",
      onClick: () => window.open("/docs", "_blank"),
    },
    { separator: true },
    {
      label: "Télécharger",
      children: [
        {
          label: "Document PDF (.pdf)",
          onClick: () => {
            if (!editor) return
            void (async () => {
              const html2pdf = (await import("html2pdf.js")).default
              const container = document.createElement("div")
              container.innerHTML = getPrintHtml(editor.getHTML())
              container.style.width = "210mm"
              container.style.padding = "0"
              document.body.appendChild(container)
              await html2pdf()
                .set({
                  margin: [25, 30, 25, 30],
                  filename: `${getBaseName(docName)}.pdf`,
                  image: { type: "jpeg", quality: 0.98 },
                  html2canvas: { scale: 2 },
                  jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
                })
                .from(container)
                .save()
              document.body.removeChild(container)
            })()
          },
        },
        {
          label: "Microsoft Word (.doc)",
          onClick: () => {
            if (!editor) return
            const content = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40"><head><meta charset="utf-8"><style>${getPrintHtml("")}</style></head><body>${editor.getHTML()}</body></html>`
            const blob = new Blob(["\ufeff", content], { type: "application/msword" })
            downloadBlob(blob, `${getBaseName(docName)}.doc`)
          },
        },
        {
          label: "Texte brut (.txt)",
          onClick: () => {
            if (!editor) return
            const blob = new Blob([editor.getText()], { type: "text/plain;charset=utf-8" })
            downloadBlob(blob, `${getBaseName(docName)}.txt`)
          },
        },
      ],
    },
    { separator: true },
    {
      label: "Imprimer",
      shortcut: "Ctrl+P",
      onClick: () => {
        if (!editor) return
        const printWindow = window.open("", "_blank")
        if (!printWindow) return
        const styledHtml = getPrintHtml(editor.getHTML())
        printWindow.document.write(`<!DOCTYPE html>
<html>
<head>
  <title>${docName ?? "Document"}</title>
  <style>@page { size: A4; margin: 0; } body { padding: 25mm 30mm; }</style>
</head>
<body>${styledHtml}</body>
</html>`)
        printWindow.document.close()
        printWindow.onload = () => {
          printWindow.print()
          printWindow.close()
        }
      },
    },
    { separator: true },
    {
      label: "Retour aux documents",
      onClick: () => router.push("/docs"),
    },
  ]

  const editionItems: MenuEntry[] = [
    {
      label: "Annuler",
      shortcut: "Ctrl+Z",
      onClick: () => editor?.chain().focus().undo().run(),
      disabled: !editor?.can().undo(),
    },
    {
      label: "Rétablir",
      shortcut: "Ctrl+Y",
      onClick: () => editor?.chain().focus().redo().run(),
      disabled: !editor?.can().redo(),
    },
    { separator: true },
    {
      label: "Tout sélectionner",
      shortcut: "Ctrl+A",
      onClick: () => editor?.chain().focus().selectAll().run(),
    },
  ]

  const affichageItems: MenuEntry[] = [
    {
      label: "Plein écran",
      shortcut: "F11",
      onClick: () => {
        if (document.fullscreenElement) {
          void document.exitFullscreen()
        } else {
          void document.documentElement.requestFullscreen()
        }
      },
    },
  ]

  const handleImageFile = (file: File) => {
    if (!editor) return
    const reader = new FileReader()
    reader.onload = () => {
      const dataUrl = reader.result as string
      editor.chain().focus().setImage({ src: dataUrl }).run()
    }
    reader.readAsDataURL(file)
  }

  const handleImageUrl = () => {
    const url = window.prompt("URL de l'image")
    if (url) editor?.chain().focus().setImage({ src: url }).run()
  }

  const insertionItems: MenuEntry[] = [
    {
      label: "Image",
      customPanel: (
        <ImageUploadPanel
          onFile={handleImageFile}
          onUrl={handleImageUrl}
          onClose={close}
          fileInputRef={menuImageInputRef}
        />
      ),
    },
    {
      label: "Lien",
      shortcut: "Ctrl+K",
      onClick: () => {
        const url = window.prompt("URL")
        if (url) editor?.chain().focus().setLink({ href: url }).run()
      },
    },
    { separator: true },
    {
      label: "Tableau (3×3)",
      onClick: () =>
        editor?.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run(),
    },
    {
      label: "Ligne horizontale",
      onClick: () => editor?.chain().focus().setHorizontalRule().run(),
    },
    { separator: true },
    {
      label: "Bloc de code",
      onClick: () => editor?.chain().focus().toggleCodeBlock().run(),
    },
    {
      label: "Citation",
      onClick: () => editor?.chain().focus().toggleBlockquote().run(),
    },
  ]

  const formatItems: MenuEntry[] = [
    {
      label: "Gras",
      shortcut: "Ctrl+B",
      onClick: () => editor?.chain().focus().toggleBold().run(),
    },
    {
      label: "Italique",
      shortcut: "Ctrl+I",
      onClick: () => editor?.chain().focus().toggleItalic().run(),
    },
    {
      label: "Souligné",
      shortcut: "Ctrl+U",
      onClick: () => editor?.chain().focus().toggleUnderline().run(),
    },
    {
      label: "Barré",
      onClick: () => editor?.chain().focus().toggleStrike().run(),
    },
    { separator: true },
    {
      label: "Indice",
      onClick: () => editor?.chain().focus().toggleSubscript().run(),
    },
    {
      label: "Exposant",
      onClick: () => editor?.chain().focus().toggleSuperscript().run(),
    },
    { separator: true },
    {
      label: "Effacer la mise en forme",
      shortcut: "Ctrl+\\",
      onClick: () => editor?.chain().focus().unsetAllMarks().clearNodes().run(),
    },
  ]

  const outilsItems: MenuEntry[] = [
    {
      label: "Nombre de mots",
      onClick: () => {
        if (!editor) return
        const text = editor.getText()
        const words = text.trim() ? text.trim().split(/\s+/).length : 0
        const chars = text.length
        window.alert(`Mots : ${words}\nCaractères : ${chars}`)
      },
    },
  ]

  const menus = [
    { key: "fichier", label: "Fichier", items: fichierItems },
    { key: "edition", label: "Edition", items: editionItems },
    { key: "affichage", label: "Affichage", items: affichageItems },
    { key: "insertion", label: "Insertion", items: insertionItems },
    { key: "format", label: "Format", items: formatItems },
    { key: "outils", label: "Outils", items: outilsItems },
  ]

  return (
    <>
      <input
        ref={menuImageInputRef}
        type="file"
        accept="image/*"
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) handleImageFile(file)
          e.target.value = ""
        }}
        className="hidden"
      />
      <div className="flex items-center gap-0.5 px-2 py-0.5">
        {menus.map((menu) => (
          <MenuDropdown
            key={menu.key}
            label={menu.label}
            items={menu.items}
            isOpen={openMenu === menu.key}
            onOpen={() => setOpenMenu(menu.key)}
            onClose={close}
          />
        ))}
      </div>
    </>
  )
}
