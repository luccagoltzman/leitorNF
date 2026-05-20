export interface NfeProduct {
  codigo: string
  descricao: string
  ncm: string
  cfop: string
  quantidade: number
  valorUnitario: number
  valorTotal: number
  icms: number
  ipi: number
  pis: number
  cofins: number
}

export interface ParsedNfe {
  numeroNf: string
  serie: string
  chaveAcesso: string
  dataEmissao: string
  naturezaOperacao: string
  emitente: {
    razaoSocial: string
    cnpj: string
    endereco: string
  }
  destinatario: {
    nome: string
    documento: string
  }
  produtos: NfeProduct[]
  totais: {
    valorTotal: number
    frete: number
    desconto: number
    icms: number
    ipi: number
    pis: number
    cofins: number
  }
}

export interface Bid {
  id: string
  user_id: string
  titulo: string
  numero_edital: string | null
  orgao: string | null
  processo: string | null
  observacoes: string | null
  created_at: string
  updated_at: string
}

export interface BidInput {
  titulo: string
  numero_edital?: string
  orgao?: string
  processo?: string
  observacoes?: string
}

export interface Invoice {
  id: string
  user_id: string
  bid_id: string | null
  numero_nf: string | null
  serie: string | null
  chave_acesso: string | null
  emitente: string | null
  emitente_cnpj: string | null
  destinatario: string | null
  destinatario_doc: string | null
  valor_total: number | null
  frete: number | null
  desconto: number | null
  data_emissao: string | null
  natureza_operacao: string | null
  arquivo_url: string | null
  pdf_url: string | null
  created_at: string
}

export interface InvoiceItem {
  id: string
  invoice_id: string
  codigo: string | null
  descricao: string | null
  ncm: string | null
  cfop: string | null
  quantidade: number | null
  valor_unitario: number | null
  valor_total: number | null
  icms: number | null
  ipi: number | null
  pis: number | null
  cofins: number | null
}

export interface InvoiceWithItems extends Invoice {
  invoice_items: InvoiceItem[]
  bid?: Bid | null
}

export type InvoiceCompletenessFilter = 'all' | 'complete' | 'incomplete'

export interface InvoiceFilters {
  search?: string
  productSearch?: string
  dateFrom?: string
  dateTo?: string
  completeness?: InvoiceCompletenessFilter
  bidId?: string
  unlinkedOnly?: boolean
}
