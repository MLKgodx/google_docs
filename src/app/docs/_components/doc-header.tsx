"use client"

import { useRouter } from "next/navigation"
import { FileText } from "lucide-react"

interface DocHeaderProps {
  name: string
  onNameChange: (name: string) => void
  onSave?: () => Promise<void> | void
}

export function DocHeader({ name, onNameChange, onSave }: DocHeaderProps) {
  const router = useRouter()

  const handleGoBack = async () => {
    await onSave?.()
    router.push("/docs")
    router.refresh()
  }

  return (
    <div className="flex items-center gap-3 border-b border-gray-200 bg-white px-4 py-2">
      <button
        onClick={handleGoBack}
        className="group relative flex-shrink-0 rounded-full p-1.5 hover:bg-gray-200 active:scale-90 active:bg-gray-300 transition-transform"
      >
        <FileText size={28} className="text-blue-600" />
        <span className="pointer-events-none absolute left-0 top-full mt-1 hidden whitespace-nowrap rounded bg-black/100 px-2 py-1 text-xs font-bold text-white group-hover:block">
          Page d&apos;accueil Docs Clone
        </span>
      </button>
      <input
        type="text"
        value={name}
        onChange={(e) => onNameChange(e.target.value)}
        placeholder="Sans titre"
        className="text-lg font-medium text-gray-800 outline-none placeholder:text-gray-400 focus:border-b-2 focus:border-blue-500"
      />
    </div>
  )
}
