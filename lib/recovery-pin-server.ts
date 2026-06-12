import 'server-only'

import { randomBytes, scrypt, timingSafeEqual } from 'node:crypto'
import { promisify } from 'node:util'

import { normalizeRecoveryPin } from '@/lib/recovery-pin'

const scryptAsync = promisify(scrypt)
const KEY_LENGTH = 64

export async function hashRecoveryPin(pin: string): Promise<string> {
  const salt = randomBytes(16).toString('hex')
  const derived = (await scryptAsync(normalizeRecoveryPin(pin), salt, KEY_LENGTH)) as Buffer
  return `scrypt:${salt}:${derived.toString('hex')}`
}

export async function verifyRecoveryPin(pin: string, hash: string): Promise<boolean> {
  const [scheme, salt, storedHex] = hash.split(':')
  if (scheme !== 'scrypt' || !salt || !storedHex) return false

  const derived = (await scryptAsync(normalizeRecoveryPin(pin), salt, KEY_LENGTH)) as Buffer
  const stored = Buffer.from(storedHex, 'hex')
  if (derived.length !== stored.length) return false

  return timingSafeEqual(derived, stored)
}
