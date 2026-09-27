import crypto from 'node:crypto'
import { promisify } from 'node:util'

const scrypt = promisify(crypto.scrypt)
const PARAMS = { N: 2 ** 17, r: 8, p: 1, maxmem: 256 * 1024 * 1024 }
const KEY_LENGTH = 64

export const PASSWORD_MIN = 10
export const PASSWORD_MAX = 128

export async function hashPassword(password) {
  const salt = crypto.randomBytes(16)
  const key = await scrypt(password.normalize('NFKC'), salt, KEY_LENGTH, PARAMS)
  return `scrypt$${PARAMS.N}$${PARAMS.r}$${PARAMS.p}$${salt.toString('base64')}$${key.toString('base64')}`
}

export async function verifyPassword(password, stored) {
  if (!stored) return false
  const [algo, N, r, p, saltB64, keyB64] = stored.split('$')
  if (algo !== 'scrypt') return false
  const expected = Buffer.from(keyB64, 'base64')
  const key = await scrypt(password.normalize('NFKC'), Buffer.from(saltB64, 'base64'), expected.length, {
    N: Number(N), r: Number(r), p: Number(p), maxmem: PARAMS.maxmem
  })
  return crypto.timingSafeEqual(key, expected)
}

let dummyHash
export async function burnPasswordTime(password) {
  dummyHash ??= await hashPassword('manifiest-dummy-password')
  await verifyPassword(password, dummyHash)
  return false
}

const COMMON = new Set(['1234567890', 'password123', 'contraseña', 'contrasena1', 'qwertyuiop', '0123456789', 'manifiesto', 'manifestacion'])

export function passwordProblem(password, email = '') {
  if (typeof password !== 'string') return 'Contraseña inválida'
  if (password.length < PASSWORD_MIN) return `La contraseña debe tener al menos ${PASSWORD_MIN} caracteres`
  if (password.length > PASSWORD_MAX) return `La contraseña no puede superar ${PASSWORD_MAX} caracteres`
  if (COMMON.has(password.toLowerCase())) return 'Esa contraseña es demasiado común'
  if (email && password.toLowerCase().includes(email.split('@')[0].toLowerCase()) && email.split('@')[0].length >= 4) {
    return 'La contraseña no puede contener tu email'
  }
  if (new Set(password).size < 5) return 'La contraseña es demasiado repetitiva'
  return null
}
