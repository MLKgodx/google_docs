"use client"

import { useRouter } from "next/navigation"
import { FileText, Save } from "lucide-react"
import toast from "react-hot-toast"

interface DocHeaderProps {
  name: string
  onNameChange: (name: string) => void
  onSave?: () => void
}

export function DocHeader({ name, onNameChange, onSave }: DocHeaderProps) {
  const router = useRouter()

  const handleGoBack = () => {
    onSave?.()
    router.push("/docs")
    router.refresh()
  }

  const handleSave = () => {
    onSave?.()
    toast.success("Document sauvegardé")
    router.push("/docs")
    router.refresh()
  }

  return (
    <div className="flex items-center gap-3 border-b border-gray-200 bg-white px-4 py-2">
      <button onClick={handleGoBack} className="flex-shrink-0">
        <FileText size={28} className="text-blue-600 hover:text-blue-700" />
      </button>
      <input
        type="text"
        value={name}
        onChange={(e) => onNameChange(e.target.value)}
        placeholder="Sans titre"
        className="text-lg font-medium text-gray-800 outline-none placeholder:text-gray-400 focus:border-b-2 focus:border-blue-500"
      />
      <button
        onClick={handleSave}
        className="ml-auto flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-1.5 text-sm font-medium text-white transition-colors hover:bg-blue-700"
      >
        <Save size={16} />
        Sauvegarder
      </button>
    </div>
  )
}
