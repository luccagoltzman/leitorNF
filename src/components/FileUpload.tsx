import { useCallback, useState } from 'react'

interface FileUploadProps {
  onFilesSelected: (files: File[]) => void
  disabled?: boolean
  multiple?: boolean
}

export function FileUpload({
  onFilesSelected,
  disabled = false,
  multiple = true,
}: FileUploadProps) {
  const [dragOver, setDragOver] = useState(false)

  const handleFiles = useCallback(
    (fileList: FileList | null) => {
      if (!fileList?.length) return
      const xmlFiles = Array.from(fileList).filter((f) =>
        f.name.toLowerCase().endsWith('.xml'),
      )
      if (xmlFiles.length) onFilesSelected(xmlFiles)
    },
    [onFilesSelected],
  )

  return (
    <label
      className={`flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed px-6 py-12 transition-colors ${
        dragOver
          ? 'border-primary-500 bg-primary-50'
          : 'border-border bg-card hover:border-primary-500/50'
      } ${disabled ? 'pointer-events-none opacity-50' : ''}`}
      onDragOver={(e) => {
        e.preventDefault()
        setDragOver(true)
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={(e) => {
        e.preventDefault()
        setDragOver(false)
        handleFiles(e.dataTransfer.files)
      }}
    >
      <input
        type="file"
        accept=".xml,application/xml,text/xml"
        multiple={multiple}
        disabled={disabled}
        className="sr-only"
        onChange={(e) => {
          handleFiles(e.target.files)
          e.target.value = ''
        }}
      />
      <svg
        className="mb-4 h-12 w-12 text-primary-500"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
        />
      </svg>
      <p className="text-center text-base font-medium text-slate-900">
        Arraste XMLs da NF-e aqui
      </p>
      <p className="mt-1 text-center text-sm text-muted">
        ou clique para selecionar · máx. 5 MB por arquivo
      </p>
    </label>
  )
}
