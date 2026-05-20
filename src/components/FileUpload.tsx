import { useCallback, useState } from 'react'

interface FileUploadProps {
  onFileSelected: (file: File) => void
  disabled?: boolean
  accept: string
  acceptMime?: string
  title: string
  hint: string
}

export function FileUpload({
  onFileSelected,
  disabled = false,
  accept,
  acceptMime,
  title,
  hint,
}: FileUploadProps) {
  const [dragOver, setDragOver] = useState(false)

  const handleOne = useCallback(
    (fileList: FileList | null) => {
      if (!fileList?.length) return
      const file = fileList[0]
      onFileSelected(file)
    },
    [onFileSelected],
  )

  return (
    <label
      className={`flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed px-6 py-10 transition-colors ${
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
        handleOne(e.dataTransfer.files)
      }}
    >
      <input
        type="file"
        accept={acceptMime ?? accept}
        multiple={false}
        disabled={disabled}
        className="sr-only"
        onChange={(e) => {
          handleOne(e.target.files)
          e.target.value = ''
        }}
      />
      <svg
        className="mb-3 h-10 w-10 text-primary-500"
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
      <p className="text-center text-base font-medium text-slate-900">{title}</p>
      <p className="mt-1 max-w-md text-center text-sm text-muted">{hint}</p>
    </label>
  )
}
