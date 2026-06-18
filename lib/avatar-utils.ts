export const ACCEPTED_AVATAR_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const

export function isAcceptedAvatarType(type: string): type is (typeof ACCEPTED_AVATAR_TYPES)[number] {
  return (ACCEPTED_AVATAR_TYPES as readonly string[]).includes(type)
}
