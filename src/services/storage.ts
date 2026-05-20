import { supabase } from '../lib/supabase'

const BUCKET = 'invoices'
const SIGNED_URL_TTL_SEC = 3600

export async function uploadToStorage(
  userId: string,
  file: Blob | File,
  filename: string,
  contentType: string,
): Promise<string> {
  const safeName = filename.replace(/[^a-zA-Z0-9._-]/g, '_')
  const path = `${userId}/${Date.now()}-${safeName}`

  const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
    contentType,
    upsert: false,
  })
  if (error) throw error
  return path
}

export async function getSignedFileUrl(
  storagePath: string | null | undefined,
): Promise<string | null> {
  if (!storagePath) return null
  const { data, error } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(storagePath, SIGNED_URL_TTL_SEC)
  if (error) throw error
  return data.signedUrl
}

export async function removeStoragePaths(
  paths: (string | null | undefined)[],
): Promise<void> {
  const toRemove = paths.filter((p): p is string => Boolean(p))
  if (!toRemove.length) return
  const { error } = await supabase.storage.from(BUCKET).remove(toRemove)
  if (error) console.warn('[Storage] Falha ao remover arquivos:', error.message)
}
