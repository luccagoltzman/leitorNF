import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
import type { InvoiceWithItems } from '../types/nfe'
import {
  formatCnpjCpf,
  formatCurrency,
  formatDate,
  formatQuantity,
} from './format'

export function pdfFileName(invoice: InvoiceWithItems): string {
  const n = invoice.numero_nf?.replace(/\W/g, '') || invoice.id.slice(0, 8)
  return `NF-${n}.pdf`
}

export function buildInvoicePdf(invoice: InvoiceWithItems): jsPDF {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' })
  const margin = 14
  let y = 18

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(16)
  doc.text('Nota Fiscal Eletronica (NF-e)', margin, y)

  y += 8
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(11)
  const titulo = `NF ${invoice.numero_nf ?? '-'}${invoice.serie ? ` · Serie ${invoice.serie}` : ''}`
  doc.text(titulo, margin, y)

  y += 5
  doc.setFontSize(9)
  doc.setTextColor(80, 80, 80)
  doc.text(
    invoice.natureza_operacao ?? 'Natureza da operacao nao informada',
    margin,
    y,
  )
  doc.setTextColor(0, 0, 0)

  const resumoBody: string[][] = [
    ['Chave de acesso', invoice.chave_acesso ?? '-'],
    ['Data de emissao', formatDate(invoice.data_emissao)],
    ['Emitente', invoice.emitente ?? '-'],
    ['CNPJ emitente', formatCnpjCpf(invoice.emitente_cnpj)],
    ['Destinatario', invoice.destinatario ?? '-'],
    ['Documento dest.', formatCnpjCpf(invoice.destinatario_doc)],
    ['Valor total', formatCurrency(invoice.valor_total)],
    ['Frete', formatCurrency(invoice.frete)],
    ['Desconto', formatCurrency(invoice.desconto)],
  ]

  autoTable(doc, {
    startY: y + 4,
    head: [['Campo', 'Valor']],
    body: resumoBody,
    theme: 'striped',
    styles: { fontSize: 9, cellPadding: 2 },
    headStyles: { fillColor: [37, 99, 235] },
    columnStyles: {
      0: { cellWidth: 45, fontStyle: 'bold' },
      1: { cellWidth: 130 },
    },
    margin: { left: margin, right: margin },
  })

  const afterResumo =
    (doc as jsPDF & { lastAutoTable?: { finalY: number } }).lastAutoTable
      ?.finalY ?? y + 40

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  doc.text(
    `Produtos (${invoice.invoice_items?.length ?? 0})`,
    margin,
    afterResumo + 10,
  )

  const items = invoice.invoice_items ?? []
  autoTable(doc, {
    startY: afterResumo + 14,
    head: [
      ['Codigo', 'Descricao', 'NCM', 'CFOP', 'Qtd', 'Unit.', 'Total'],
    ],
    body: items.map((item) => [
      item.codigo ?? '',
      (item.descricao ?? '').slice(0, 80),
      item.ncm ?? '',
      item.cfop ?? '',
      formatQuantity(item.quantidade),
      formatCurrency(item.valor_unitario),
      formatCurrency(item.valor_total),
    ]),
    theme: 'grid',
    styles: { fontSize: 7, cellPadding: 1.5, overflow: 'linebreak' },
    headStyles: { fillColor: [37, 99, 235], fontSize: 7 },
    columnStyles: {
      0: { cellWidth: 18 },
      1: { cellWidth: 52 },
      2: { cellWidth: 16 },
      3: { cellWidth: 12 },
      4: { cellWidth: 14, halign: 'right' },
      5: { cellWidth: 22, halign: 'right' },
      6: { cellWidth: 22, halign: 'right' },
    },
    margin: { left: margin, right: margin },
    didDrawPage: (data) => {
      doc.setFontSize(8)
      doc.setTextColor(120, 120, 120)
      doc.text(
        `Gerado em ${new Date().toLocaleString('pt-BR')} · Leitor NF-e`,
        margin,
        doc.internal.pageSize.height - 8,
      )
      doc.setTextColor(0, 0, 0)
      if (data.pageNumber > 1) {
        doc.setFontSize(8)
        doc.text(
          `NF ${invoice.numero_nf ?? ''} — pag. ${data.pageNumber}`,
          margin,
          10,
        )
      }
    },
  })

  return doc
}

export function invoiceToPdfBlob(invoice: InvoiceWithItems): Blob {
  return buildInvoicePdf(invoice).output('blob')
}

export function exportInvoiceToPdf(invoice: InvoiceWithItems): void {
  buildInvoicePdf(invoice).save(pdfFileName(invoice))
}
