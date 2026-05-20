import { supabase } from '../lib/supabase'
import { assertSession, assertSupabaseConfigured } from '../lib/requireAuth'
import type { Bid, BidInput } from '../types/nfe'
import {
  isSchemaMissingError,
  BIDS_SCHEMA_HINT,
} from '../utils/supabaseErrors'

function isBidsTableMissing(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false
  const e = error as { code?: string; message?: string }
  const msg = (e.message ?? '').toLowerCase()
  return (
    e.code === 'PGRST205' ||
    msg.includes('bids') ||
    (msg.includes('relation') && msg.includes('does not exist'))
  )
}

export async function fetchBids(): Promise<Bid[]> {
  await assertSession()

  const { data, error } = await supabase
    .from('bids')
    .select('*')
    .order('updated_at', { ascending: false })

  if (error) {
    if (isSchemaMissingError(error) || isBidsTableMissing(error)) {
      throw new Error(BIDS_SCHEMA_HINT)
    }
    throw error
  }
  return (data ?? []) as Bid[]
}

export async function createBid(
  input: BidInput,
  userId: string,
): Promise<Bid> {
  assertSupabaseConfigured()
  if (!userId) {
    throw new Error('Faça login para cadastrar licitações.')
  }

  const { data, error } = await supabase
    .from('bids')
    .insert({
      user_id: userId,
      titulo: input.titulo.trim(),
      numero_edital: input.numero_edital?.trim() || null,
      orgao: input.orgao?.trim() || null,
      processo: input.processo?.trim() || null,
      observacoes: input.observacoes?.trim() || null,
    })
    .select()
    .single()

  if (error) {
    if (isBidsTableMissing(error)) {
      throw new Error(BIDS_SCHEMA_HINT)
    }
    throw error
  }
  return data as Bid
}

export async function updateBid(id: string, input: BidInput): Promise<Bid> {
  await assertSession()

  const { data, error } = await supabase
    .from('bids')
    .update({
      titulo: input.titulo.trim(),
      numero_edital: input.numero_edital?.trim() || null,
      orgao: input.orgao?.trim() || null,
      processo: input.processo?.trim() || null,
      observacoes: input.observacoes?.trim() || null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data as Bid
}

export async function deleteBid(id: string): Promise<void> {
  await assertSession()

  const { error } = await supabase.from('bids').delete().eq('id', id)
  if (error) throw error
}

export function formatBidLabel(bid: Bid): string {
  const parts = [bid.titulo]
  if (bid.numero_edital) parts.push(`Edital ${bid.numero_edital}`)
  if (bid.orgao) parts.push(bid.orgao)
  return parts.join(' · ')
}
