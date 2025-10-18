import { supabase } from './supabase'

export interface UploadResult {
  url: string
  path: string
  error?: string
}

export async function uploadFile(
  file: File,
  bucket: string,
  folder: string = '',
  userId: string
): Promise<UploadResult> {
  try {
    // Validate file type
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg']
    if (!allowedTypes.includes(file.type)) {
      return { url: '', path: '', error: 'File type not allowed. Please upload PDF, JPG, or PNG files.' }
    }

    // Validate file size (10MB max)
    const maxSize = 10 * 1024 * 1024 // 10MB
    if (file.size > maxSize) {
      return { url: '', path: '', error: 'File size too large. Maximum size is 10MB.' }
    }

    // Generate unique filename
    const timestamp = Date.now()
    const randomString = Math.random().toString(36).substring(2, 15)
    const fileExtension = file.name.split('.').pop()
    const fileName = `${timestamp}_${randomString}.${fileExtension}`
    
    // Create file path
    const filePath = folder ? `${folder}/${userId}/${fileName}` : `${userId}/${fileName}`

    // Upload file to Supabase Storage
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      })

    if (error) {
      console.error('Upload error:', error)
      return { url: '', path: '', error: error.message }
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from(bucket)
      .getPublicUrl(filePath)

    return {
      url: urlData.publicUrl,
      path: filePath,
    }

  } catch (error) {
    console.error('Upload error:', error)
    return { url: '', path: '', error: 'Upload failed. Please try again.' }
  }
}

export async function deleteFile(bucket: string, path: string): Promise<boolean> {
  try {
    const { error } = await supabase.storage
      .from(bucket)
      .remove([path])

    if (error) {
      console.error('Delete error:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('Delete error:', error)
    return false
  }
}

export function getFileUrl(bucket: string, path: string): string {
  const { data } = supabase.storage
    .from(bucket)
    .getPublicUrl(path)

  return data.publicUrl
}
