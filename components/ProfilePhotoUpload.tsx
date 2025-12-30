'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Image from 'next/image'

interface ProfilePhotoUploadProps {
  userId: string
  currentPhotoUrl?: string | null
  onUploadSuccess: (url: string) => void
}

export default function ProfilePhotoUpload({ userId, currentPhotoUrl, onUploadSuccess }: ProfilePhotoUploadProps) {
  const supabase = createClient()
  const [uploading, setUploading] = useState(false)
  const [preview, setPreview] = useState<string | null>(currentPhotoUrl || null)

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file')
      return
    }

    // Max 2MB
    if (file.size > 2 * 1024 * 1024) {
      alert('Image must be less than 2MB')
      return
    }

    setUploading(true)

    try {
      // Create file path: userId/profile-photo.jpg
      const fileExt = file.name.split('.').pop()
      const fileName = `${userId}/profile-photo.${fileExt}`

      // Delete old photo if exists
      if (currentPhotoUrl) {
        const oldPath = currentPhotoUrl.split('/').pop()
        if (oldPath) {
          await supabase.storage
            .from('profile-photos')
            .remove([`${userId}/${oldPath}`])
        }
      }

      // Upload new photo
      const { error: uploadError } = await supabase.storage
        .from('profile-photos')
        .upload(fileName, file, { upsert: true })

      if (uploadError) throw uploadError

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('profile-photos')
        .getPublicUrl(fileName)

      // Update profile in database
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ profile_photo_url: publicUrl })
        .eq('id', userId)

      if (updateError) throw updateError

      setPreview(publicUrl)
      onUploadSuccess(publicUrl)
      alert('✅ Profile photo updated!')
    } catch (error: any) {
      console.error('Upload error:', error)
      alert(error.message || 'Failed to upload photo')
    } finally {
      setUploading(false)
    }
  }

  return (
  <div className="flex flex-col items-center gap-4">
    {/* Photo Preview */}
    <div className="relative w-32 h-32 rounded-full overflow-hidden bg-gradient-to-br from-blue-600 to-cyan-600 flex items-center justify-center">
      {preview ? (
        <img
          src={preview}
          alt="Profile photo"
          className="w-full h-full object-cover object-center"
          style={{ objectPosition: 'center 30%' }}
        />
      ) : (
        <span className="text-4xl text-white font-bold">
          {userId.charAt(0).toUpperCase()}
        </span>
      )}
    </div>

    {/* Upload Button */}
    <label className="cursor-pointer">
      <input
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        disabled={uploading}
        className="hidden"
      />
      <span className={`px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition inline-block ${
        uploading ? 'opacity-50 cursor-not-allowed' : ''
      }`}>
        {uploading ? 'Uploading...' : preview ? 'Change Photo' : 'Upload Photo'}
      </span>
    </label>

    <p className="text-xs text-gray-500 text-center">
      Passport-style photo recommended<br />
      Max 2MB, JPG or PNG
    </p>
  </div>
)
}