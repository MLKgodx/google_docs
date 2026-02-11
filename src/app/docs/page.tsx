/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
"use client"

import { useState } from "react"
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
  Trash2,
} from "lucide-react"
import toast from "react-hot-toast"
import { api } from "~/trpc/react"

type ViewMode = "grid" | "list"
type SortOrder = "newest" | "oldest"

const PER_PAGE = 12

export default function DocsPage() {
  const router = useRouter()

  const [search, setSearch] = useState("")
  const [viewMode, setViewMode] = useState<ViewMode>("grid")
  const [sortOrder, setSortOrder] = useState<SortOrder>("newest")
  const [page, setPage] = useState(1)

  const { data, isLoading } = api.fichier.search.useQuery(
    { query: search || undefined, sort: sortOrder, page, perPage: PER_PAGE },
    { keepPreviousData: true },
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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="border-b border-gray-200 bg-white px-8 py-4">
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <div className="flex items-center gap-3">
            <FileText size={28} className="text-blue-600" />
            <h1 className="text-xl font-semibold text-gray-800">
              Mes documents
            </h1>
          </div>
          <button
            onClick={handleCreate}
            disabled={createMutation.isPending}
            className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
          >
            <Plus size={18} />
            {createMutation.isPending ? "Création..." : "Nouveau document"}
          </button>
        </div>
      </div>

      {/* Toolbar */}
      <div className="mx-auto max-w-5xl px-8 pt-6">
        <div className="flex flex-wrap items-center gap-3">
          {/* Search */}
          <div className="relative flex-1">
            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              type="text"
              value={search}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder="Rechercher un document..."
              className="w-full rounded-lg border border-gray-200 bg-white py-2 pl-10 pr-4 text-sm text-gray-800 outline-none transition-colors placeholder:text-gray-400 focus:border-blue-400 focus:ring-1 focus:ring-blue-400"
            />
          </div>

          {/* Sort */}
          <button
            onClick={toggleSortOrder}
            className="flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-600 transition-colors hover:bg-gray-50"
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
                  ? "bg-blue-600 text-white"
                  : "bg-white text-gray-600 hover:bg-gray-50"
              }`}
              title="Grille"
            >
              <Grid3X3 size={18} />
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`p-2 transition-colors ${
                viewMode === "list"
                  ? "bg-blue-600 text-white"
                  : "bg-white text-gray-600 hover:bg-gray-50"
              }`}
              title="Liste"
            >
              <List size={18} />
            </button>
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
        ) : viewMode === "grid" ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {fichiers.map((fichier) => (
              <div
                key={fichier.id}
                className="group relative flex flex-col rounded-lg border border-gray-200 bg-white p-4 text-left transition-shadow hover:shadow-md"
              >
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    deleteMutation.mutate({ id: fichier.id })
                  }}
                  className="absolute right-2 top-2 rounded p-1 text-gray-400 opacity-0 transition-opacity hover:bg-red-50 hover:text-red-500 group-hover:opacity-100"
                  title="Supprimer"
                >
                  <Trash2 size={16} />
                </button>
                <button
                  onClick={() => router.push(`/docs/${fichier.id}`)}
                  className="flex flex-1 flex-col"
                >
                  <div className="mb-3 flex h-32 items-center justify-center rounded bg-gray-50">
                    <FileText
                      size={48}
                      className="text-blue-400 group-hover:text-blue-500"
                    />
                  </div>
                  <h3 className="truncate text-sm font-medium text-gray-800">
                    {fichier.name}
                  </h3>
                  <p className="mt-1 text-xs text-gray-400">
                    {formatDate(fichier.updatedAt)}
                  </p>
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
            {fichiers.map((fichier, i) => (
              <div
                key={fichier.id}
                className={`group flex items-center gap-4 px-4 py-3 transition-colors hover:bg-gray-50 ${
                  i > 0 ? "border-t border-gray-100" : ""
                }`}
              >
                <button
                  onClick={() => router.push(`/docs/${fichier.id}`)}
                  className="flex flex-1 items-center gap-4"
                >
                  <FileText
                    size={24}
                    className="flex-shrink-0 text-blue-400 group-hover:text-blue-500"
                  />
                  <span className="flex-1 truncate text-sm font-medium text-gray-800">
                    {fichier.name}
                  </span>
                  <span className="flex-shrink-0 text-xs text-gray-400">
                    {formatDate(fichier.updatedAt)}
                  </span>
                </button>
                <button
                  onClick={() => deleteMutation.mutate({ id: fichier.id })}
                  className="flex-shrink-0 rounded p-1 text-gray-400 opacity-0 transition-opacity hover:bg-red-50 hover:text-red-500 group-hover:opacity-100"
                  title="Supprimer"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-6 flex items-center justify-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="rounded-lg border border-gray-200 bg-white p-2 text-gray-600 transition-colors hover:bg-gray-50 disabled:opacity-40"
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
                    : "border border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
                }`}
              >
                {p}
              </button>
            ))}
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="rounded-lg border border-gray-200 bg-white p-2 text-gray-600 transition-colors hover:bg-gray-50 disabled:opacity-40"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
