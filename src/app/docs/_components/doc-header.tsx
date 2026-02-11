"use client"

import { useRouter } from "next/navigation"
import { FileText } from "lucide-react"

interface DocHeaderProps {
  name: string
  onNameChange: (name: string) => void
  onSave?: () => void
}

export function DocHeader({ name, onNameChange, onSave }: DocHeaderProps) {
  const router = useRouter()

  const handleClick = () => {
    onSave?.()
    router.push("/docs")
  }

  return (
    <div className="flex items-center gap-3 border-b border-gray-200 bg-white px-4 py-2">
      <button onClick={handleClick} className="flex-shrink-0">
        <FileText size={28} className="text-blue-600 hover:text-blue-700" />
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
