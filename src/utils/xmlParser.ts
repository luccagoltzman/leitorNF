import { XMLParser } from 'fast-xml-parser'
import type { NfeProduct, ParsedNfe } from '../types/nfe'

const MAX_XML_SIZE = 5 * 1024 * 1024

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
  removeNSPrefix: true,
  trimValues: true,
  parseTagValue: false,
})

function asRecord(value: unknown): Record<string, unknown> | null {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return value as Record<string, unknown>
  }
  return null
}

function pick<T>(obj: Record<string, unknown> | null, ...keys: string[]): T | undefined {
  if (!obj) return undefined
  for (const key of keys) {
    if (obj[key] !== undefined && obj[key] !== null) return obj[key] as T
  }
  return undefined
}

function toArray<T>(value: T | T[] | undefined): T[] {
  if (value == null) return []
  return Array.isArray(value) ? value : [value]
}

function toNumber(value: unknown): number {
  if (value == null || value === '') return 0
  const n = Number(String(value).replace(',', '.'))
  return Number.isFinite(n) ? n : 0
}

function toString(value: unknown): string {
  if (value == null) return ''
  return String(value).trim()
}

function extractChave(infNFe: Record<string, unknown>, prot?: Record<string, unknown>): string {
  const id = toString(infNFe['@_Id'])
  if (id.startsWith('NFe')) return id.slice(3)
  const infProt = asRecord(pick(prot, 'infProt'))
  return toString(pick<string>(infProt, 'chNFe'))
}

function buildEndereco(ender: Record<string, unknown> | null): string {
  if (!ender) return ''
  const parts = [
    toString(pick(ender, 'xLgr')),
    toString(pick(ender, 'nro')),
    toString(pick(ender, 'xBairro')),
    toString(pick(ender, 'xMun')),
    toString(pick(ender, 'UF')),
    toString(pick(ender, 'CEP')),
  ].filter(Boolean)
  return parts.join(', ')
}

function parseImposto(imposto: Record<string, unknown> | null) {
  const icms = asRecord(pick(imposto, 'ICMS'))
  const ipi = asRecord(pick(imposto, 'IPI'))
  const pis = asRecord(pick(imposto, 'PIS'))
  const cofins = asRecord(pick(imposto, 'COFINS'))

  const icmsChild = icms
    ? asRecord(Object.values(icms).find((v) => typeof v === 'object'))
    : null
  const ipiChild = ipi
    ? asRecord(pick(ipi, 'IPITrib', 'IPINT'))
    : null
  const pisChild = pis
    ? asRecord(Object.values(pis).find((v) => typeof v === 'object'))
    : null
  const cofinsChild = cofins
    ? asRecord(Object.values(cofins).find((v) => typeof v === 'object'))
    : null

  return {
    icms: toNumber(pick(icmsChild, 'vICMS')),
    ipi: toNumber(pick(ipiChild, 'vIPI')),
    pis: toNumber(pick(pisChild, 'vPIS')),
    cofins: toNumber(pick(cofinsChild, 'vCOFINS')),
  }
}

function parseProdutos(detList: Record<string, unknown>[]): NfeProduct[] {
  return detList.map((det) => {
    const prod = asRecord(pick(det, 'prod')) ?? {}
    const imposto = asRecord(pick(det, 'imposto'))
    const taxes = parseImposto(imposto)

    return {
      codigo: toString(pick(prod, 'cProd')),
      descricao: toString(pick(prod, 'xProd')),
      ncm: toString(pick(prod, 'NCM')),
      cfop: toString(pick(prod, 'CFOP')),
      quantidade: toNumber(pick(prod, 'qCom', 'qTrib')),
      valorUnitario: toNumber(pick(prod, 'vUnCom', 'vUnTrib')),
      valorTotal: toNumber(pick(prod, 'vProd')),
      ...taxes,
    }
  })
}

export function validateXmlFile(file: File): string | null {
  if (!file.name.toLowerCase().endsWith('.xml')) {
    return 'Apenas arquivos XML são aceitos no MVP.'
  }
  if (file.size > MAX_XML_SIZE) {
    return 'Arquivo excede o limite de 5 MB.'
  }
  if (file.type && !['text/xml', 'application/xml', ''].includes(file.type)) {
    return 'Tipo de arquivo inválido. Envie um XML de NF-e.'
  }
  return null
}

export function parseNfeXml(xmlContent: string): ParsedNfe {
  if (xmlContent.length > MAX_XML_SIZE) {
    throw new Error('XML excede o tamanho máximo permitido.')
  }

  if (/<!ENTITY/i.test(xmlContent) || /<!DOCTYPE/i.test(xmlContent)) {
    throw new Error('XML contém construções não permitidas por segurança.')
  }

  const parsed = parser.parse(xmlContent)
  const root = asRecord(parsed)
  if (!root) throw new Error('XML inválido ou vazio.')

  const nfeProc = asRecord(pick(root, 'nfeProc', 'NFe', 'nfe'))
  const nfe = asRecord(pick(nfeProc ?? root, 'NFe', 'nfe')) ?? nfeProc ?? root
  const infNFe = asRecord(pick(nfe, 'infNFe', 'infNfe'))
  if (!infNFe) throw new Error('Estrutura de NF-e não reconhecida no XML.')

  const ide = asRecord(pick(infNFe, 'ide'))
  const emit = asRecord(pick(infNFe, 'emit'))
  const dest = asRecord(pick(infNFe, 'dest'))
  const total = asRecord(pick(infNFe, 'total'))
  const icmsTot = asRecord(pick(total, 'ICMSTot', 'icmsTot'))
  const protNFe = asRecord(pick(nfeProc ?? root, 'protNFe', 'protNfe'))

  const detList = toArray(pick<Record<string, unknown>>(infNFe, 'det'))
  const produtos = parseProdutos(detList)

  const destDoc =
    toString(pick(dest, 'CNPJ')) ||
    toString(pick(dest, 'CPF')) ||
    toString(pick(dest, 'idEstrangeiro'))

  return {
    numeroNf: toString(pick(ide, 'nNF')),
    serie: toString(pick(ide, 'serie')),
    chaveAcesso: extractChave(infNFe, protNFe ?? undefined),
    dataEmissao: toString(pick(ide, 'dhEmi', 'dEmi')),
    naturezaOperacao: toString(pick(ide, 'natOp')),
    emitente: {
      razaoSocial: toString(pick(emit, 'xNome', 'xFant')),
      cnpj: toString(pick(emit, 'CNPJ', 'CPF')),
      endereco: buildEndereco(asRecord(pick(emit, 'enderEmit'))),
    },
    destinatario: {
      nome: toString(pick(dest, 'xNome')),
      documento: destDoc,
    },
    produtos,
    totais: {
      valorTotal: toNumber(pick(icmsTot, 'vNF')),
      frete: toNumber(pick(icmsTot, 'vFrete')),
      desconto: toNumber(pick(icmsTot, 'vDesc')),
      icms: toNumber(pick(icmsTot, 'vICMS')),
      ipi: toNumber(pick(icmsTot, 'vIPI')),
      pis: toNumber(pick(icmsTot, 'vPIS')),
      cofins: toNumber(pick(icmsTot, 'vCOFINS')),
    },
  }
}

export async function readXmlFile(file: File): Promise<string> {
  const error = validateXmlFile(file)
  if (error) throw new Error(error)
  return file.text()
}
