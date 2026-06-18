import { auth } from '@/lib/auth'
import { isAcceptedAvatarType } from '@/lib/avatar-utils'
import { uploadOptimizedAvatar } from '@/lib/upload-avatar-server'

const MAX_INPUT_BYTES = 5 * 1024 * 1024

export async function POST(request: Request) {
  const session = await auth.api.getSession({ headers: request.headers })
  if (!session?.user) {
    return Response.json({ error: 'Sign in to upload a profile photo.' }, { status: 401 })
  }

  const formData = await request.formData()
  const file = formData.get('file')
  if (!(file instanceof File)) {
    return Response.json({ error: 'No file provided.' }, { status: 400 })
  }

  if (!isAcceptedAvatarType(file.type)) {
    return Response.json({ error: 'Unsupported format. Use JPG, PNG, or WebP.' }, { status: 400 })
  }

  if (file.size > MAX_INPUT_BYTES) {
    return Response.json({ error: 'File is too large.' }, { status: 400 })
  }

  try {
    const input = Buffer.from(await file.arrayBuffer())
    const avatarUrl = await uploadOptimizedAvatar(session.user.id, input)
    return Response.json({ avatarUrl })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Could not upload photo. Try again.'
    return Response.json({ error: message }, { status: 400 })
  }
}
