import sharp from 'sharp'
import { supabase } from '../supabase'

export async function uploadImage(
  buffer: Buffer,
  originalName: string,
  bucket: 'product-images' | 'category-images'
): Promise<string> {
  const filename = `${Date.now()}-${originalName.replace(/\s+/g, '-').replace(/\.[^.]+$/, '')}.webp`

  const optimized = await sharp(buffer)
    .resize({ width: 1200, withoutEnlargement: true })
    .webp({ quality: 85 })
    .toBuffer()

  const { error } = await supabase.storage
    .from(bucket)
    .upload(filename, optimized, { contentType: 'image/webp', upsert: false })

  if (error) throw new Error(error.message)

  const {
    data: { publicUrl },
  } = supabase.storage.from(bucket).getPublicUrl(filename)

  return publicUrl
}

export async function deleteImage(bucket: string, filename: string): Promise<void> {
  await supabase.storage.from(bucket).remove([filename])
}
