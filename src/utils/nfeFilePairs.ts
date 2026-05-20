import type { InvoiceWithItems } from '../types/nfe'

const MAX_PDF_SIZE = 20 * 1024 * 1024

export function baseName(filename: string): string {
  return filename.replace(/\.(xml|pdf)$/i, '').toLowerCase()
}

export function validatePdfFile(file: File): string | null {
  if (!file.name.toLowerCase().endsWith('.pdf')) {
    return 'O PDF deve ter extensão .pdf'
  }
  if (file.size > MAX_PDF_SIZE) {
    return 'PDF excede o limite de 20 MB.'
  }
  return null
}

/** Encontra o PDF que pertence ao mesmo XML (nome base ou chave na NF). */
export function findPdfForXml(
  xmlFile: File,
  chaveAcesso: string,
  pdfFiles: File[],
): File | undefined {
  const xmlBase = baseName(xmlFile.name)
  const byName = pdfFiles.find((f) => baseName(f.name) === xmlBase)
  if (byName) return byName

  const chave = chaveAcesso.replace(/\D/g, '')
  if (chave.length >= 20) {
    const byChave = pdfFiles.find((f) =>
      f.name.replace(/\D/g, '').includes(chave),
    )
    if (byChave) return byChave
  }

  return undefined
}

export function buildPdfLookup(files: File[]): File[] {
  return files.filter((f) => f.name.toLowerCase().endsWith('.pdf'))
}

/** Tenta associar um PDF a uma nota que ainda não tem PDF guardado. */
export function findInvoiceForPdf(
  pdfFile: File,
  invoices: InvoiceWithItems[],
): InvoiceWithItems | undefined {
  const pending = invoices.filter((i) => !i.pdf_url)
  if (!pending.length) return undefined

  const digitsInName = pdfFile.name.replace(/\D/g, '')

  if (digitsInName.length >= 20) {
    const byChave = pending.find((inv) => {
      const chave = inv.chave_acesso?.replace(/\D/g, '') ?? ''
      return chave && (digitsInName.includes(chave) || chave.includes(digitsInName))
    })
    if (byChave) return byChave
  }

  for (const inv of pending) {
    if (inv.numero_nf && pdfFile.name.includes(inv.numero_nf)) return inv
    if (baseName(pdfFile.name) === baseName(`nf-${inv.numero_nf}.pdf`)) return inv
  }

  if (pending.length === 1) return pending[0]

  return undefined
}
