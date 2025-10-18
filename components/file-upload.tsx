'use client'

import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { uploadFile } from '@/lib/upload'
import { Upload, File, X, CheckCircle, AlertCircle } from 'lucide-react'

interface FileUploadProps {
  onUploadComplete: (url: string, path: string) => void
  onUploadError: (error: string) => void
  bucket: string
  folder?: string
  userId: string
  acceptedTypes?: string[]
  maxSize?: number
  label: string
  description?: string
  required?: boolean
}

export function FileUpload({
  onUploadComplete,
  onUploadError,
  bucket,
  folder = '',
  userId,
  acceptedTypes = ['.pdf'],
  maxSize = 10,
  label,
  description,
  required = false
}: FileUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [uploadedFile, setUploadedFile] = useState<{ name: string; url: string; path: string } | null>(null)
  const [dragOver, setDragOver] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = async (file: File) => {
    setUploading(true)

    try {
      const result = await uploadFile(file, bucket, folder, userId)

      if (result.error) {
        onUploadError(result.error)
      } else {
        setUploadedFile({
          name: file.name,
          url: result.url,
          path: result.path
        })
        onUploadComplete(result.url, result.path)
      }
    } catch (error) {
      onUploadError('Upload failed. Please try again.')
    } finally {
      setUploading(false)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      handleFileSelect(file)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    
    const file = e.dataTransfer.files[0]
    if (file) {
      handleFileSelect(file)
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
  }

  const removeFile = () => {
    setUploadedFile(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const openFileDialog = () => {
    fileInputRef.current?.click()
  }

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      
      {description && (
        <p className="text-sm text-gray-600">{description}</p>
      )}

      {!uploadedFile ? (
        <div
          className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
            dragOver
              ? 'border-purple-400 bg-purple-50'
              : 'border-gray-300 hover:border-gray-400'
          }`}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
        >
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            accept={acceptedTypes.join(',')}
            onChange={handleFileChange}
            disabled={uploading}
          />

          {uploading ? (
            <div className="flex flex-col items-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mb-2"></div>
              <p className="text-sm text-gray-600">Uploading...</p>
            </div>
          ) : (
            <div className="flex flex-col items-center">
              <Upload className="h-8 w-8 text-gray-400 mb-2" />
              <p className="text-sm font-medium text-gray-900 mb-1">
                Click to upload or drag and drop
              </p>
              <p className="text-xs text-gray-500">
                {acceptedTypes.join(', ').toUpperCase()} up to {maxSize}MB
              </p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="mt-3"
                onClick={openFileDialog}
              >
                Choose File
              </Button>
            </div>
          )}
        </div>
      ) : (
        <div className="border border-green-200 bg-green-50 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm font-medium text-green-900">
                  {uploadedFile.name}
                </p>
                <p className="text-xs text-green-700">Upload successful</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                asChild
              >
                <a
                  href={uploadedFile.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-green-700 hover:text-green-900"
                >
                  <File className="h-4 w-4" />
                </a>
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={removeFile}
                className="text-red-600 hover:text-red-800"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
