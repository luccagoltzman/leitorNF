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

export function proofPdfFileName(invoice: InvoiceWithItems): string {
  const n = invoice.numero_nf?.replace(/\W/g, '') || invoice.id.slice(0, 8)
  return `Comprovacao-NF-${n}.pdf`
}

export function buildProofPdf(invoice: InvoiceWithItems): jsPDF {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' })
  const margin = 14
  let y = 18

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(15)
  doc.text('Comprovação de Preço', margin, y)

  y += 7
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.text(
    'Documento auxiliar para processos licitatórios — baseado na NF-e cadastrada.',
    margin,
    y,
  )

  y += 6
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(12)
  doc.text(
    `NF ${invoice.numero_nf ?? '-'}${invoice.serie ? ` · Série ${invoice.serie}` : ''}`,
    margin,
    y,
  )

  const resumoBody: string[][] = [
    ['Data da compra (emissão)', formatDate(invoice.data_emissao)],
    ['Fornecedor', invoice.emitente ?? '-'],
    ['CNPJ fornecedor', formatCnpjCpf(invoice.emitente_cnpj)],
    ['Comprador', invoice.destinatario ?? '-'],
    ['Chave NF-e', invoice.chave_acesso ?? '-'],
    ['Valor total da nota', formatCurrency(invoice.valor_total)],
    ['Licitação / edital', invoice.bid?.titulo ?? '-'],
    ['Nº edital', invoice.bid?.numero_edital ?? '-'],
    ['Órgão', invoice.bid?.orgao ?? '-'],
  ]

  autoTable(doc, {
    startY: y + 4,
    head: [['Informação', 'Valor']],
    body: resumoBody,
    theme: 'striped',
    styles: { fontSize: 9, cellPadding: 2 },
    headStyles: { fillColor: [22, 101, 52] },
    columnStyles: {
      0: { cellWidth: 52, fontStyle: 'bold' },
      1: { cellWidth: 123 },
    },
    margin: { left: margin, right: margin },
  })

  const afterResumo =
    (doc as jsPDF & { lastAutoTable?: { finalY: number } }).lastAutoTable
      ?.finalY ?? y + 40

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  doc.text('Itens e preços comprovados', margin, afterResumo + 10)

  const items = invoice.invoice_items ?? []
  autoTable(doc, {
    startY: afterResumo + 14,
    head: [['Descrição', 'Qtd', 'Valor unitário', 'Total']],
    body: items.map((item) => [
      (item.descricao ?? '').slice(0, 90),
      formatQuantity(item.quantidade),
      formatCurrency(item.valor_unitario),
      formatCurrency(item.valor_total),
    ]),
    theme: 'grid',
    styles: { fontSize: 8, cellPadding: 2 },
    headStyles: { fillColor: [22, 101, 52], fontSize: 8 },
    columnStyles: {
      0: { cellWidth: 85 },
      1: { cellWidth: 22, halign: 'right' },
      2: { cellWidth: 35, halign: 'right' },
      3: { cellWidth: 35, halign: 'right' },
    },
    margin: { left: margin, right: margin },
  })

  const finalY =
    (doc as jsPDF & { lastAutoTable?: { finalY: number } }).lastAutoTable
      ?.finalY ?? afterResumo + 50

  doc.setFontSize(8)
  doc.setTextColor(80, 80, 80)
  doc.text(
    'Anexe o PDF original da NF-e (DANFE) quando disponível. Este resumo não substitui o documento fiscal oficial.',
    margin,
    finalY + 12,
    { maxWidth: 180 },
  )
  doc.text(
    `Gerado em ${new Date().toLocaleString('pt-BR')} · Leitor NF-e`,
    margin,
    doc.internal.pageSize.height - 10,
  )

  return doc
}
