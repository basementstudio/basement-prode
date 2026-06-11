interface DisplayNameInput {
  displayName?: string | null
  name?: string | null
  email: string
}

function titleCaseWord(word: string) {
  if (!word) return ''
  return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
}

export function resolveDisplayName({
  displayName,
  name,
  email,
}: DisplayNameInput): string {
  const trimmedDisplayName = displayName?.trim()
  if (trimmedDisplayName) return trimmedDisplayName

  const trimmedName = name?.trim()
  if (trimmedName && !trimmedName.includes('@')) return trimmedName

  const prefix = email.split('@')[0] ?? ''
  if (!prefix) return 'Usuario'

  return prefix
    .replace(/[._-]+/g, ' ')
    .split(' ')
    .filter(Boolean)
    .map(titleCaseWord)
    .join(' ')
}
