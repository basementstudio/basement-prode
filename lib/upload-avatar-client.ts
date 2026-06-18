'use client'

import { isAcceptedAvatarType } from '@/lib/avatar-utils'

type UploadAvatarResponse = {
  avatarUrl?: string
  error?: string
}

export async function uploadAvatarFromFile(file: File): Promise<string> {
  if (!isAcceptedAvatarType(file.type)) {
    throw new Error('Unsupported format. Use JPG, PNG, or WebP.')
  }

  const formData = new FormData()
  formData.append('file', file)

  const response = await fetch('/api/upload/avatar', {
    method: 'POST',
    body: formData,
    credentials: 'include',
  })

  const data = (await response.json()) as UploadAvatarResponse
  if (!response.ok || !data.avatarUrl) {
    throw new Error(data.error ?? 'Could not upload photo. Try again.')
  }

  return data.avatarUrl
}
