import * as XLSX from 'xlsx'
import type { InvoiceWithItems } from '../types/nfe'
import { formatCurrency, formatDate } from './format'

export function exportInvoiceToExcel(invoice: InvoiceWithItems): void {
  const resumo = [
    ['Campo', 'Valor'],
    ['Número NF', invoice.numero_nf ?? ''],
    ['Série', invoice.serie ?? ''],
    ['Chave de Acesso', invoice.chave_acesso ?? ''],
    ['Data de Emissão', formatDate(invoice.data_emissao)],
    ['Natureza da Operação', invoice.natureza_operacao ?? ''],
    ['Emitente', invoice.emitente ?? ''],
    ['CNPJ Emitente', invoice.emitente_cnpj ?? ''],
    ['Destinatário', invoice.destinatario ?? ''],
    ['Documento Destinatário', invoice.destinatario_doc ?? ''],
    ['Valor Total', invoice.valor_total ?? 0],
    ['Frete', invoice.frete ?? 0],
    ['Desconto', invoice.desconto ?? 0],
  ]

  const produtosHeader = [
    'Código',
    'Produto',
    'NCM',
    'CFOP',
    'Quantidade',
    'Valor Unitário',
    'Total',
    'ICMS',
    'IPI',
    'PIS',
    'COFINS',
  ]

  const produtosRows = invoice.invoice_items.map((item) => [
    item.codigo ?? '',
    item.descricao ?? '',
    item.ncm ?? '',
    item.cfop ?? '',
    item.quantidade ?? 0,
    item.valor_unitario ?? 0,
    item.valor_total ?? 0,
    item.icms ?? 0,
    item.ipi ?? 0,
    item.pis ?? 0,
    item.cofins ?? 0,
  ])

  const wb = XLSX.utils.book_new()
  const wsResumo = XLSX.utils.aoa_to_sheet(resumo)
  const wsProdutos = XLSX.utils.aoa_to_sheet([produtosHeader, ...produtosRows])

  wsResumo['!cols'] = [{ wch: 28 }, { wch: 48 }]
  wsProdutos['!cols'] = [
    { wch: 12 },
    { wch: 40 },
    { wch: 12 },
    { wch: 8 },
    { wch: 12 },
    { wch: 14 },
    { wch: 14 },
    { wch: 10 },
    { wch: 10 },
    { wch: 10 },
    { wch: 10 },
  ]

  XLSX.utils.book_append_sheet(wb, wsResumo, 'Resumo')
  XLSX.utils.book_append_sheet(wb, wsProdutos, 'Produtos')

  const fileName = `NF-${invoice.numero_nf ?? invoice.id.slice(0, 8)}.xlsx`
  XLSX.writeFile(wb, fileName)
}

export function exportInvoicesListToExcel(invoices: InvoiceWithItems[]): void {
  const rows = invoices.map((inv) => ({
    'Número NF': inv.numero_nf,
    Série: inv.serie,
    Emitente: inv.emitente,
    'Valor Total': inv.valor_total,
    'Data Emissão': formatDate(inv.data_emissao),
    'Qtd. Itens': inv.invoice_items.length,
  }))

  const wb = XLSX.utils.book_new()
  const ws = XLSX.utils.json_to_sheet(rows)
  XLSX.utils.book_append_sheet(wb, ws, 'Notas Fiscais')
  XLSX.writeFile(wb, `notas-fiscais-${new Date().toISOString().slice(0, 10)}.xlsx`)
}

export function formatCurrencyForDisplay(value: number | null | undefined): string {
  return formatCurrency(value)
}

export function proofExcelFileName(invoice: InvoiceWithItems): string {
  const n = invoice.numero_nf?.replace(/\W/g, '') || invoice.id.slice(0, 8)
  return `Comprovacao-NF-${n}.xlsx`
}

export function workbookProofExcel(invoice: InvoiceWithItems): XLSX.WorkBook {
  const header = [
    ['COMPROVAÇÃO DE PREÇO — NOTA FISCAL'],
    [],
    ['Número NF', invoice.numero_nf ?? ''],
    ['Série', invoice.serie ?? ''],
    ['Data de emissão', formatDate(invoice.data_emissao)],
    ['Emitente (fornecedor)', invoice.emitente ?? ''],
    ['CNPJ emitente', invoice.emitente_cnpj ?? ''],
    ['Destinatário', invoice.destinatario ?? ''],
    ['Chave de acesso', invoice.chave_acesso ?? ''],
    ['Valor total da NF', invoice.valor_total ?? 0],
    ['Licitação / edital', invoice.bid?.titulo ?? ''],
    ['Nº edital', invoice.bid?.numero_edital ?? ''],
    ['Órgão', invoice.bid?.orgao ?? ''],
    [],
    [
      'Código',
      'Descrição do produto/serviço',
      'NCM',
      'Quantidade',
      'Valor unitário (R$)',
      'Valor total do item (R$)',
    ],
  ]

  const productRows = invoice.invoice_items.map((item) => [
    item.codigo ?? '',
    item.descricao ?? '',
    item.ncm ?? '',
    item.quantidade ?? 0,
    item.valor_unitario ?? 0,
    item.valor_total ?? 0,
  ])

  const footer = [
    [],
    [
      'Documento gerado para fins de comprovação de preço em processos licitatórios.',
    ],
    [`Gerado em: ${new Date().toLocaleString('pt-BR')}`],
  ]

  const wb = XLSX.utils.book_new()
  const ws = XLSX.utils.aoa_to_sheet([...header, ...productRows, ...footer])
  ws['!cols'] = [
    { wch: 14 },
    { wch: 48 },
    { wch: 12 },
    { wch: 12 },
    { wch: 18 },
    { wch: 18 },
  ]
  XLSX.utils.book_append_sheet(wb, ws, 'Comprovação')
  return wb
}
