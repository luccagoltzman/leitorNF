import JSZip from 'jszip'
import * as XLSX from 'xlsx'
import type { InvoiceWithItems } from '../types/nfe'
import { getInvoiceFileUrls } from '../services/invoices'
import { buildProofPdf, proofPdfFileName } from './pdfExport'
import { proofExcelFileName, workbookProofExcel } from './excelExport'

async function fetchBlobFromUrl(url: string): Promise<Blob | null> {
  try {
    const res = await fetch(url)
    if (!res.ok) return null
    return await res.blob()
  } catch {
    return null
  }
}

function baseName(invoice: InvoiceWithItems): string {
  return `NF-${(invoice.numero_nf ?? invoice.id.slice(0, 8)).replace(/\W/g, '')}`
}

export async function exportProofPackage(
  invoice: InvoiceWithItems,
): Promise<void> {
  const zip = new JSZip()
  const folder = zip.folder(baseName(invoice))!

  const wb = workbookProofExcel(invoice)
  const excelBuf = XLSX.write(wb, { bookType: 'xlsx', type: 'array' }) as ArrayBuffer
  folder.file(proofExcelFileName(invoice), excelBuf)

  const proofPdf = buildProofPdf(invoice)
  folder.file(proofPdfFileName(invoice), proofPdf.output('arraybuffer'))

  const { xmlUrl, pdfUrl } = await getInvoiceFileUrls(invoice)

  if (pdfUrl) {
    const pdfBlob = await fetchBlobFromUrl(pdfUrl)
    if (pdfBlob) {
      folder.file(`DANFE-original.pdf`, pdfBlob)
    }
  }

  if (xmlUrl) {
    const xmlBlob = await fetchBlobFromUrl(xmlUrl)
    if (xmlBlob) {
      folder.file(`NF-e-original.xml`, xmlBlob)
    }
  }

  const content = await zip.generateAsync({ type: 'blob' })
  const link = document.createElement('a')
  link.href = URL.createObjectURL(content)
  link.download = `Comprovacao-${baseName(invoice)}.zip`
  link.click()
  URL.revokeObjectURL(link.href)
}

/** Fallback sem ZIP: baixa Excel e PDF de comprovação. */
export function exportProofDocuments(invoice: InvoiceWithItems): void {
  const wb = workbookProofExcel(invoice)
  XLSX.writeFile(wb, proofExcelFileName(invoice))
  buildProofPdf(invoice).save(proofPdfFileName(invoice))
}
