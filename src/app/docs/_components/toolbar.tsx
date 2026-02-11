"use client"

import type { Editor } from "@tiptap/react"
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Code,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  ListChecks,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Quote,
  Minus,
  Undo2,
  Redo2,
  Link,
  Unlink,
  Image,
  Table,
  Subscript,
  Superscript,
  RemoveFormatting,
  Indent,
  Outdent,
  CodeSquare,
  Paintbrush,
  Type,
  Palette,
  ChevronDown,
  TableCellsMerge,
  TableCellsSplit,
  Trash2,
  Plus,
} from "lucide-react"
import { useCallback, useRef, useState } from "react"

interface ToolbarProps {
  editor: Editor | null
}

const FONT_FAMILIES = [
  { label: "Sans Serif", value: "Inter, sans-serif" },
  { label: "Serif", value: "Georgia, serif" },
  { label: "Monospace", value: "'Courier New', monospace" },
  { label: "Arial", value: "Arial, sans-serif" },
  { label: "Times New Roman", value: "'Times New Roman', serif" },
  { label: "Verdana", value: "Verdana, sans-serif" },
  { label: "Trebuchet MS", value: "'Trebuchet MS', sans-serif" },
  { label: "Comic Sans MS", value: "'Comic Sans MS', cursive" },
]

const FONT_SIZES = [
  "8", "9", "10", "11", "12", "14", "16", "18", "20", "24", "28", "32", "36", "48", "72",
]

const TEXT_COLORS = [
  "#000000", "#434343", "#666666", "#999999", "#cccccc",
  "#ef4444", "#f97316", "#eab308", "#22c55e", "#14b8a6",
  "#3b82f6", "#6366f1", "#a855f7", "#ec4899", "#f43f5e",
  "#991b1b", "#9a3412", "#854d0e", "#166534", "#115e59",
  "#1e40af", "#3730a3", "#6b21a8", "#9d174d", "#9f1239",
]

const HIGHLIGHT_COLORS = [
  "transparent", "#fef08a", "#bbf7d0", "#bfdbfe", "#e9d5ff",
  "#fecaca", "#fed7aa", "#d1fae5", "#dbeafe", "#fce7f3",
]

function ToolbarButton({
  onClick,
  isActive = false,
  disabled = false,
  title,
  children,
}: {
  onClick: () => void
  isActive?: boolean
  disabled?: boolean
  title: string
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`flex h-8 w-8 items-center justify-center rounded transition-colors ${
        isActive
          ? "bg-blue-100 text-blue-700"
          : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
      } disabled:cursor-not-allowed disabled:opacity-40`}
    >
      {children}
    </button>
  )
}

function Divider() {
  return <div className="mx-1 h-6 w-px bg-gray-300" />
}

function Dropdown({
  label,
  children,
  width = "w-40",
}: {
  label: React.ReactNode
  children: React.ReactNode
  width?: string
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        className="flex h-8 items-center gap-1 rounded px-2 text-sm text-gray-700 hover:bg-gray-100"
      >
        {label}
        <ChevronDown size={14} />
      </button>
      {open && (
        <div
          className={`absolute top-full left-0 z-50 mt-1 ${width} overflow-hidden rounded-lg border border-gray-200 bg-white py-1 shadow-lg`}
        >
          {children}
        </div>
      )}
    </div>
  )
}

function ColorPicker({
  colors,
  currentColor,
  onSelect,
  icon: Icon,
  title,
}: {
  colors: string[]
  currentColor: string | undefined
  onSelect: (color: string) => void
  icon: React.ComponentType<{ size?: number; className?: string }>
  title: string
}) {
  const [open, setOpen] = useState(false)

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        onBlur={() => setTimeout(() => setOpen(false), 200)}
        title={title}
        className="flex h-8 w-8 items-center justify-center rounded text-gray-600 hover:bg-gray-100 hover:text-gray-900"
      >
        <Icon size={16} />
      </button>
      {open && (
        <div className="absolute top-full left-0 z-50 mt-1 grid w-40 grid-cols-5 gap-1 rounded-lg border border-gray-200 bg-white p-2 shadow-lg">
          {colors.map((color) => (
            <button
              key={color}
              type="button"
              onClick={() => {
                onSelect(color)
                setOpen(false)
              }}
              className={`h-6 w-6 rounded border ${
                currentColor === color ? "border-blue-500 ring-2 ring-blue-200" : "border-gray-300"
              }`}
              style={{
                backgroundColor: color === "transparent" ? "white" : color,
                backgroundImage:
                  color === "transparent"
                    ? "linear-gradient(135deg, white 45%, red 45%, red 55%, white 55%)"
                    : undefined,
              }}
              title={color === "transparent" ? "None" : color}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export function Toolbar({ editor }: ToolbarProps) {
  if (!editor) return null

  const setLink = useCallback(() => {
    const previousUrl = editor.getAttributes("link").href as string | undefined
    const url = window.prompt("URL", previousUrl)
    if (url === null) return
    if (url === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run()
      return
    }
    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run()
  }, [editor])

  const addImage = useCallback(() => {
    const url = window.prompt("Image URL")
    if (url) {
      editor.chain().focus().setImage({ src: url }).run()
    }
  }, [editor])

  const insertTable = useCallback(() => {
    editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()
  }, [editor])

  const currentHeading = editor.isActive("heading", { level: 1 })
    ? "Heading 1"
    : editor.isActive("heading", { level: 2 })
      ? "Heading 2"
      : editor.isActive("heading", { level: 3 })
        ? "Heading 3"
        : "Normal"

  const currentFontFamily =
    (editor.getAttributes("textStyle").fontFamily as string) ?? FONT_FAMILIES[0]!.value

  const currentFontLabel =
    FONT_FAMILIES.find((f) => f.value === currentFontFamily)?.label ?? "Sans Serif"

  return (
    <div className="flex flex-wrap items-center gap-0.5 border-b border-gray-200 bg-gray-50 px-2 py-1.5">
      {/* Undo / Redo */}
      <ToolbarButton
        onClick={() => editor.chain().focus().undo().run()}
        disabled={!editor.can().undo()}
        title="Undo (Ctrl+Z)"
      >
        <Undo2 size={16} />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().redo().run()}
        disabled={!editor.can().redo()}
        title="Redo (Ctrl+Y)"
      >
        <Redo2 size={16} />
      </ToolbarButton>

      <Divider />

      {/* Heading dropdown */}
      <Dropdown label={<span className="min-w-[70px] text-left text-xs">{currentHeading}</span>}>
        <button
          type="button"
          className="block w-full px-3 py-1.5 text-left text-sm hover:bg-gray-100"
          onMouseDown={(e) => {
            e.preventDefault()
            editor.chain().focus().setParagraph().run()
          }}
        >
          Normal
        </button>
        {([1, 2, 3] as const).map((level) => (
          <button
            key={level}
            type="button"
            className="block w-full px-3 py-1.5 text-left text-sm font-bold hover:bg-gray-100"
            style={{ fontSize: `${1.4 - level * 0.15}em` }}
            onMouseDown={(e) => {
              e.preventDefault()
              editor.chain().focus().toggleHeading({ level }).run()
            }}
          >
            Heading {level}
          </button>
        ))}
      </Dropdown>

      <Divider />

      {/* Font Family */}
      <Dropdown
        label={<span className="min-w-[80px] text-left text-xs">{currentFontLabel}</span>}
        width="w-48"
      >
        {FONT_FAMILIES.map((font) => (
          <button
            key={font.value}
            type="button"
            className="block w-full px-3 py-1.5 text-left text-sm hover:bg-gray-100"
            style={{ fontFamily: font.value }}
            onMouseDown={(e) => {
              e.preventDefault()
              editor.chain().focus().setFontFamily(font.value).run()
            }}
          >
            {font.label}
          </button>
        ))}
      </Dropdown>

      <Divider />

      {/* Font Size */}
      <Dropdown label={<span className="min-w-[24px] text-center text-xs">16</span>} width="w-20">
        {FONT_SIZES.map((size) => (
          <button
            key={size}
            type="button"
            className="block w-full px-3 py-1.5 text-left text-sm hover:bg-gray-100"
            onMouseDown={(e) => {
              e.preventDefault()
              editor.chain().focus().setMark("textStyle", { fontSize: `${size}px` }).run()
            }}
          >
            {size}
          </button>
        ))}
      </Dropdown>

      <Divider />

      {/* Bold / Italic / Underline / Strikethrough */}
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleBold().run()}
        isActive={editor.isActive("bold")}
        title="Bold (Ctrl+B)"
      >
        <Bold size={16} />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleItalic().run()}
        isActive={editor.isActive("italic")}
        title="Italic (Ctrl+I)"
      >
        <Italic size={16} />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleUnderline().run()}
        isActive={editor.isActive("underline")}
        title="Underline (Ctrl+U)"
      >
        <Underline size={16} />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleStrike().run()}
        isActive={editor.isActive("strike")}
        title="Strikethrough"
      >
        <Strikethrough size={16} />
      </ToolbarButton>

      <Divider />

      {/* Text Color */}
      <ColorPicker
        colors={TEXT_COLORS}
        currentColor={editor.getAttributes("textStyle").color as string | undefined}
        onSelect={(color) => editor.chain().focus().setColor(color).run()}
        icon={Palette}
        title="Text color"
      />

      {/* Highlight */}
      <ColorPicker
        colors={HIGHLIGHT_COLORS}
        currentColor={editor.getAttributes("highlight").color as string | undefined}
        onSelect={(color) => {
          if (color === "transparent") {
            editor.chain().focus().unsetHighlight().run()
          } else {
            editor.chain().focus().toggleHighlight({ color }).run()
          }
        }}
        icon={Paintbrush}
        title="Highlight color"
      />

      <Divider />

      {/* Link */}
      <ToolbarButton onClick={setLink} isActive={editor.isActive("link")} title="Insert link">
        <Link size={16} />
      </ToolbarButton>
      {editor.isActive("link") && (
        <ToolbarButton
          onClick={() => editor.chain().focus().unsetLink().run()}
          title="Remove link"
        >
          <Unlink size={16} />
        </ToolbarButton>
      )}

      {/* Image */}
      <ToolbarButton onClick={addImage} title="Insert image">
        <Image size={16} />
      </ToolbarButton>

      <Divider />

      {/* Alignment */}
      <ToolbarButton
        onClick={() => editor.chain().focus().setTextAlign("left").run()}
        isActive={editor.isActive({ textAlign: "left" })}
        title="Align left"
      >
        <AlignLeft size={16} />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().setTextAlign("center").run()}
        isActive={editor.isActive({ textAlign: "center" })}
        title="Align center"
      >
        <AlignCenter size={16} />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().setTextAlign("right").run()}
        isActive={editor.isActive({ textAlign: "right" })}
        title="Align right"
      >
        <AlignRight size={16} />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().setTextAlign("justify").run()}
        isActive={editor.isActive({ textAlign: "justify" })}
        title="Justify"
      >
        <AlignJustify size={16} />
      </ToolbarButton>

      <Divider />

      {/* Lists */}
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        isActive={editor.isActive("bulletList")}
        title="Bullet list"
      >
        <List size={16} />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        isActive={editor.isActive("orderedList")}
        title="Numbered list"
      >
        <ListOrdered size={16} />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleTaskList().run()}
        isActive={editor.isActive("taskList")}
        title="Checklist"
      >
        <ListChecks size={16} />
      </ToolbarButton>

      <Divider />

      {/* Indent / Outdent */}
      <ToolbarButton
        onClick={() => editor.chain().focus().sinkListItem("listItem").run()}
        disabled={!editor.can().sinkListItem("listItem")}
        title="Increase indent"
      >
        <Indent size={16} />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().liftListItem("listItem").run()}
        disabled={!editor.can().liftListItem("listItem")}
        title="Decrease indent"
      >
        <Outdent size={16} />
      </ToolbarButton>

      <Divider />

      {/* Subscript / Superscript */}
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleSubscript().run()}
        isActive={editor.isActive("subscript")}
        title="Subscript"
      >
        <Subscript size={16} />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleSuperscript().run()}
        isActive={editor.isActive("superscript")}
        title="Superscript"
      >
        <Superscript size={16} />
      </ToolbarButton>

      <Divider />

      {/* Blockquote */}
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
        isActive={editor.isActive("blockquote")}
        title="Blockquote"
      >
        <Quote size={16} />
      </ToolbarButton>

      {/* Code */}
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleCode().run()}
        isActive={editor.isActive("code")}
        title="Inline code"
      >
        <Code size={16} />
      </ToolbarButton>

      {/* Code Block */}
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleCodeBlock().run()}
        isActive={editor.isActive("codeBlock")}
        title="Code block"
      >
        <CodeSquare size={16} />
      </ToolbarButton>

      <Divider />

      {/* Table */}
      <ToolbarButton onClick={insertTable} title="Insert table">
        <Table size={16} />
      </ToolbarButton>
      {editor.isActive("table") && (
        <>
          <ToolbarButton
            onClick={() => editor.chain().focus().addColumnAfter().run()}
            title="Add column"
          >
            <Plus size={14} />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().addRowAfter().run()}
            title="Add row"
          >
            <Plus size={14} />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().deleteColumn().run()}
            title="Delete column"
          >
            <Trash2 size={14} />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().deleteRow().run()}
            title="Delete row"
          >
            <Trash2 size={14} />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().mergeCells().run()}
            title="Merge cells"
          >
            <TableCellsMerge size={14} />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().splitCell().run()}
            title="Split cell"
          >
            <TableCellsSplit size={14} />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().deleteTable().run()}
            title="Delete table"
          >
            <Trash2 size={14} className="text-red-500" />
          </ToolbarButton>
        </>
      )}

      {/* Horizontal Rule */}
      <ToolbarButton
        onClick={() => editor.chain().focus().setHorizontalRule().run()}
        title="Horizontal rule"
      >
        <Minus size={16} />
      </ToolbarButton>

      <Divider />

      {/* Clear Formatting */}
      <ToolbarButton
        onClick={() => editor.chain().focus().unsetAllMarks().clearNodes().run()}
        title="Clear formatting"
      >
        <RemoveFormatting size={16} />
      </ToolbarButton>
    </div>
  )
}
