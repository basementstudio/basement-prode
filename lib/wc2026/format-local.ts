function formatParts(kickoffUtc: string, timeZone: string, options: Intl.DateTimeFormatOptions) {
  return new Intl.DateTimeFormat('en-US', { timeZone, ...options }).format(new Date(kickoffUtc))
}

export function getUserTimezone(): string {
  return Intl.DateTimeFormat().resolvedOptions().timeZone
}

export function getLocalDateKey(kickoffUtc: string, timeZone: string): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date(kickoffUtc))

  const get = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find(p => p.type === type)?.value ?? ''

  return `${get('year')}-${get('month')}-${get('day')}`
}

export function formatKickoffDate(kickoffUtc: string, timeZone: string): string {
  return formatParts(kickoffUtc, timeZone, { day: '2-digit', month: 'short' }).toUpperCase()
}

export function formatKickoffDay(kickoffUtc: string, timeZone: string): string {
  return formatParts(kickoffUtc, timeZone, { weekday: 'short' }).toUpperCase()
}

export function formatKickoffTime(kickoffUtc: string, timeZone: string): string {
  return formatParts(kickoffUtc, timeZone, {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    hourCycle: 'h23',
  })
}

export function formatTimezoneLabel(timeZone: string): string {
  try {
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone,
      timeZoneName: 'shortOffset',
    }).formatToParts(new Date())
    const tzName = parts.find(p => p.type === 'timeZoneName')?.value
    return tzName ?? timeZone
  } catch {
    return timeZone
  }
}
