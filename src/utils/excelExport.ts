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
