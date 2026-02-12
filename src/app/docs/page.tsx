"use client"

import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import {
  ArrowDownAZ,
  ArrowUpAZ,
  ChevronLeft,
  ChevronRight,
  FileText,
  Grid3X3,
  List,
  Plus,
  Search,
  MoreVertical,
  Pencil,
  Trash2,
} from "lucide-react"
import toast from "react-hot-toast"
import { api } from "~/trpc/react"

type ViewMode = "grid" | "list"
type SortOrder = "newest" | "oldest"

const PER_PAGE = 12

export default function DocsPage() {
  const router = useRouter()

  useEffect(() => {
    document.title = "Google Docs Clone"
  }, [])

  const [search, setSearch] = useState("")
  const [viewMode, setViewMode] = useState<ViewMode>("grid")
  const [sortOrder, setSortOrder] = useState<SortOrder>("newest")
  const [page, setPage] = useState(1)

  const { data, isLoading } = api.fichier.search.useQuery(
    { query: search || undefined, sort: sortOrder, page, perPage: PER_PAGE },
    { placeholderData: (prev) => prev },
  )

  const utils = api.useUtils()

  const createMutation = api.fichier.create.useMutation({
    onSuccess: (newDoc) => {
      router.push(`/docs/${newDoc.id}`)
    },
  })

  const deleteMutation = api.fichier.delete.useMutation({
    onSuccess: () => {
      void utils.fichier.search.invalidate()
      toast.success("Document supprimé")
    },
    onError: () => {
      toast.error("Erreur lors de la suppression")
    },
  })

  const renameMutation = api.fichier.rename.useMutation({
    onSuccess: () => {
      void utils.fichier.search.invalidate()
      toast.success("Document renommé")
    },
    onError: () => {
      toast.error("Erreur lors du renommage")
    },
  })

  const [openMenuId, setOpenMenuId] = useState<string | null>(null)
  const [renamingId, setRenamingId] = useState<string | null>(null)
  const [renameValue, setRenameValue] = useState("")
  const menuRef = useRef<HTMLDivElement>(null)

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpenMenuId(null)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const handleRenameSubmit = (id: string) => {
    const trimmed = renameValue.trim()
    if (trimmed) {
      renameMutation.mutate({ id, name: trimmed })
    }
    setRenamingId(null)
  }

  const handleCreate = () => {
    createMutation.mutate({ name: "Sans titre", type: "Document" })
  }

  const handleSearchChange = (value: string) => {
    setSearch(value)
    setPage(1)
  }

  const toggleSortOrder = () => {
    setSortOrder((s) => (s === "newest" ? "oldest" : "newest"))
    setPage(1)
  }

  const extractPreviewText = (content: string | null): string => {
    if (!content) return ""
    // Try JSON (TipTap JSON format)
    try {
      const doc = JSON.parse(content) as { type?: string; content?: Array<{ content?: Array<{ text?: string }> }> }
      if (doc.type === "doc" && doc.content) {
        const texts: string[] = []
        for (const node of doc.content) {
          if (node.content) {
            for (const inline of node.content) {
              if (inline.text) texts.push(inline.text)
            }
          }
          if (texts.join(" ").length > 200) break
        }
        return texts.join(" ")
      }
    } catch { /* not JSON, try HTML */ }
    // HTML content: strip tags
    const text = content.replace(/<[^>]*>/g, " ").replace(/&[a-z]+;/gi, " ").replace(/\s+/g, " ").trim()
    return text.substring(0, 300)
  }

  const formatDate = (date: Date) =>
    new Date(date).toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "short",
      year: "numeric",
    })

  const fichiers = data?.items ?? []
  const totalPages = data?.totalPages ?? 1
  const total = data?.total ?? 0

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="border-b border-gray-200 bg-white px-8 py-4">
        <div className="mx-auto flex max-w-5xl items-center gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push("/docs")}
              className="group relative rounded-full p-1.5 hover:bg-gray-200 active:scale-90 active:bg-gray-300 transition-transform"
            >
              <FileText size={28} className="text-blue-600" />
              <span className="pointer-events-none absolute left-0 top-full mt-1 hidden whitespace-nowrap rounded bg-black/100 px-2 py-1 text-xs font-bold text-white group-hover:block">
                Docs Clone
              </span>
            </button>
            <h1 className="text-xl font-semibold text-gray-800">
              Docs
            </h1>
          </div>
          <div className="relative flex-1">
            <Search
              size={20}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              type="text"
              value={search}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder="Rechercher un document"
              className="w-full rounded-lg border border-gray-200 bg-gray-100 py-3 pl-12 pr-4 text-base text-gray-800 outline-none transition-colors placeholder:text-gray-400 focus:border-blue-400 focus:ring-1 focus:ring-blue-400"
            />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="mx-auto max-w-5xl px-8 py-6">
        {isLoading ? (
          <p className="text-center text-gray-500">Chargement...</p>
        ) : total === 0 && !search ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <FileText size={64} className="mb-4 text-gray-300" />
            <p className="text-lg text-gray-500">Aucun document</p>
            <p className="mt-1 text-sm text-gray-400">
              Cliquez sur &quot;Nouveau document&quot; pour commencer
            </p>
          </div>
        ) : total === 0 && search ? (
          <p className="py-12 text-center text-gray-500">
            Aucun document trouvé pour &quot;{search}&quot;
          </p>
        ) : (
          <div className="space-y-6">
            {/* Créer un document */}
            <div>
              <h2 className="mb-3 text-lg font-semibold text-gray-800">Créer un document</h2>
              {viewMode === "grid" ? (
                <button
                  onClick={handleCreate}
                  disabled={createMutation.isPending}
                  className="flex w-48 flex-col items-center justify-center rounded-lg border-2 border-solid border-gray-300 bg-gray-50 p-4 transition-colors hover:border-blue-400 disabled:opacity-50"
                >
                  <div className="mb-3 flex h-44 items-center justify-center">
                    <Plus size={48} className="text-gray-400" />
                  </div>
                  <span className="text-sm font-medium text-gray-500">
                    {createMutation.isPending ? "Création..." : ""}
                  </span>
                </button>
              ) : (
                <button
                  onClick={handleCreate}
                  disabled={createMutation.isPending}
                  className="flex w-full items-center gap-4 rounded-lg border border-gray-200 bg-white px-4 py-3 transition-colors hover:bg-blue-50 disabled:opacity-50"
                >
                  <Plus size={24} className="flex-shrink-0 text-gray-400" />
                  <span className="flex-1 text-left text-sm font-medium text-gray-500">
                    {createMutation.isPending ? "Création..." : ""}
                  </span>
                </button>
              )}
            </div>

            {/* Mes documents */}
            <div>
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-800">Mes documents</h2>
                <div className="flex items-center gap-3">
                  {/* Sort */}
                  <button
                    onClick={toggleSortOrder}
                    className="flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-600 transition-colors hover:border-blue-400"
                    title={sortOrder === "newest" ? "Plus récents" : "Plus anciens"}
                  >
                    {sortOrder === "newest" ? (
                      <ArrowDownAZ size={18} />
                    ) : (
                      <ArrowUpAZ size={18} />
                    )}
                    <span className="hidden sm:inline">
                      {sortOrder === "newest" ? "Plus récents" : "Plus anciens"}
                    </span>
                  </button>
                  {/* View toggle */}
                  <div className="flex overflow-hidden rounded-lg border border-gray-200">
                    <button
                      onClick={() => setViewMode("grid")}
                      className={`p-2 transition-colors ${
                        viewMode === "grid"
                          ? "bg-blue-600 text-white hover:border-blue-400"
                          : "bg-white text-gray-600 hover:bg-gray-50 hover:border-blue-400"
                      }`}
                      title="Grille"
                    >
                      <Grid3X3 size={18} />
                    </button>
                    <button
                      onClick={() => setViewMode("list")}
                      className={`p-2 transition-colors ${
                        viewMode === "list"
                          ? "bg-blue-600 text-white hover:border-blue-400"
                          : "bg-white text-gray-600 hover:bg-gray-50 hover:border-blue-400"
                      }`}
                      title="Liste"
                    >
                      <List size={18} />
                    </button>
                  </div>
                </div>
              </div>

              {viewMode === "grid" ? (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                  {fichiers.map((fichier) => (
                    <div
                      key={fichier.id}
                      className="group relative flex flex-col rounded border border-gray-200 bg-white text-left transition-all hover:border-blue-400"
                    >
                      <button
                        onClick={() => router.push(`/docs/${fichier.id}`)}
                        className="flex flex-1 flex-col"
                      >
                        <div className="flex h-44 items-center justify-center overflow-hidden rounded-t bg-gray-50 px-3 py-2">
                          {extractPreviewText(fichier.content) ? (
                            <p className="line-clamp-6 self-start text-left text-xs leading-relaxed text-gray-500">
                              {extractPreviewText(fichier.content)}
                            </p>
                          ) : (
                            <FileText
                              size={48}
                              className="text-blue-400 group-hover:text-blue-500"
                            />
                          )}
                        </div>
                        <div className="px-4 pb-4 pt-3">
                          {renamingId === fichier.id ? (
                            <input
                              autoFocus
                              value={renameValue}
                              onChange={(e) => setRenameValue(e.target.value)}
                              onBlur={() => handleRenameSubmit(fichier.id)}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") handleRenameSubmit(fichier.id)
                                if (e.key === "Escape") setRenamingId(null)
                              }}
                              onClick={(e) => e.stopPropagation()}
                              className="truncate rounded border border-blue-400 px-1 text-sm font-medium text-gray-800 outline-none"
                            />
                          ) : (
                            <h3 className="truncate text-sm font-medium text-gray-800">
                              {fichier.name}
                            </h3>
                          )}
                          <p className="mt-1 text-xs text-gray-400">
                            {formatDate(fichier.updatedAt)}
                          </p>
                        </div>
                      </button>
                      {/* 3-dot menu */}
                      <div className="absolute bottom-2 right-2" ref={openMenuId === fichier.id ? menuRef : undefined}>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            setOpenMenuId(openMenuId === fichier.id ? null : fichier.id)
                          }}
                          className="rounded-full p-1.5 text-gray-900 transition-all hover:bg-gray-200 active:bg-blue-100"
                        >
                          <MoreVertical size={20} />
                        </button>
                        {openMenuId === fichier.id && (
                          <div className="absolute bottom-full right-0 z-20 mb-1 w-40 rounded-lg border border-gray-200 bg-white py-1 shadow-lg">
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                setRenamingId(fichier.id)
                                setRenameValue(fichier.name)
                                setOpenMenuId(null)
                              }}
                              className="flex w-full items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                            >
                              <Pencil size={14} />
                              Renommer
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                deleteMutation.mutate({ id: fichier.id })
                                setOpenMenuId(null)
                              }}
                              className="flex w-full items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                            >
                              <Trash2 size={14} />
                              Supprimer
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
                  {fichiers.map((fichier) => (
                    <div
                      key={fichier.id}
                      className="group flex items-center gap-4 border-t border-gray-100 px-4 py-3 first:border-t-0 transition-colors hover:bg-gray-50"
                    >
                      <button
                        onClick={() => router.push(`/docs/${fichier.id}`)}
                        className="flex flex-1 items-center gap-4"
                      >
                        <FileText
                          size={24}
                          className="flex-shrink-0 text-blue-400 group-hover:text-blue-500"
                        />
                        {renamingId === fichier.id ? (
                          <input
                            autoFocus
                            value={renameValue}
                            onChange={(e) => setRenameValue(e.target.value)}
                            onBlur={() => handleRenameSubmit(fichier.id)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") handleRenameSubmit(fichier.id)
                              if (e.key === "Escape") setRenamingId(null)
                            }}
                            onClick={(e) => e.stopPropagation()}
                            className="flex-1 truncate rounded border border-blue-400 px-1 text-sm font-medium text-gray-800 outline-none"
                          />
                        ) : (
                          <span className="flex-1 truncate text-sm font-medium text-gray-800">
                            {fichier.name}
                          </span>
                        )}
                        <span className="flex-shrink-0 text-xs text-gray-400">
                          {formatDate(fichier.updatedAt)}
                        </span>
                      </button>
                      <div className="relative" ref={openMenuId === fichier.id ? menuRef : undefined}>
                        <button
                          onClick={() => setOpenMenuId(openMenuId === fichier.id ? null : fichier.id)}
                          className="flex-shrink-0 rounded-full p-1.5 text-gray-900 transition-all hover:bg-gray-200 active:bg-blue-100"
                        >
                          <MoreVertical size={20} />
                        </button>
                        {openMenuId === fichier.id && (
                          <div className="absolute right-0 top-full z-20 mt-1 w-40 rounded-lg border border-gray-200 bg-white py-1 shadow-lg">
                            <button
                              onClick={() => {
                                setRenamingId(fichier.id)
                                setRenameValue(fichier.name)
                                setOpenMenuId(null)
                              }}
                              className="flex w-full items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                            >
                              <Pencil size={14} />
                              Renommer
                            </button>
                            <button
                              onClick={() => {
                                deleteMutation.mutate({ id: fichier.id })
                                setOpenMenuId(null)
                              }}
                              className="flex w-full items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                            >
                              <Trash2 size={14} />
                              Supprimer
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-6 flex items-center justify-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="rounded-lg border border-gray-200 bg-white p-2 text-gray-600 transition-colors hover:border-blue-400 hover:bg-gray-50 disabled:opacity-40"
            >
              <ChevronLeft size={18} />
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <button
                key={p}
                onClick={() => setPage(p)}
                className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                  p === page
                    ? "bg-blue-600 text-white"
                    : "border border-gray-200 bg-white text-gray-600 hover:border-blue-400 hover:bg-gray-50"
                }`}
              >
                {p}
              </button>
            ))}
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="rounded-lg border border-gray-200 bg-white p-2 text-gray-600 transition-colors hover:border-blue-400 hover:bg-gray-50 disabled:opacity-40"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
