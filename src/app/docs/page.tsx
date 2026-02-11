/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
"use client"

import { useRouter } from "next/navigation"
import { FileText, Plus } from "lucide-react"
import { api } from "~/trpc/react"

export default function DocsPage() {
  const router = useRouter()
  const { data: fichiers, isLoading } = api.fichier.getAll.useQuery()

  const createMutation = api.fichier.create.useMutation({
    onSuccess: (data) => {
      router.push(`/docs/${data.id}`)
    },
  })

  const handleCreate = () => {
    createMutation.mutate({
      name: "Sans titre",
      type: "Document",
    })
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="border-b border-gray-200 bg-white px-8 py-4">
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <div className="flex items-center gap-3">
            <FileText size={28} className="text-blue-600" />
            <h1 className="text-xl font-semibold text-gray-800">Mes documents</h1>
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

      {/* Content */}
      <div className="mx-auto max-w-5xl px-8 py-8">
        {isLoading ? (
          <p className="text-center text-gray-500">Chargement...</p>
        ) : !fichiers?.length ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <FileText size={64} className="mb-4 text-gray-300" />
            <p className="text-lg text-gray-500">Aucun document</p>
            <p className="mt-1 text-sm text-gray-400">
              Cliquez sur &quot;Nouveau document&quot; pour commencer
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {fichiers.map((fichier) => (
              <button
                key={fichier.id}
                onClick={() => router.push(`/docs/${fichier.id}`)}
                className="group flex flex-col rounded-lg border border-gray-200 bg-white p-4 text-left transition-shadow hover:shadow-md"
              >
                <div className="mb-3 flex h-32 items-center justify-center rounded bg-gray-50">
                  <FileText size={48} className="text-blue-400 group-hover:text-blue-500" />
                </div>
                <h3 className="truncate text-sm font-medium text-gray-800">
                  {fichier.name}
                </h3>
                <p className="mt-1 text-xs text-gray-400">
                  {new Date(fichier.updatedAt).toLocaleDateString("fr-FR", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </p>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
