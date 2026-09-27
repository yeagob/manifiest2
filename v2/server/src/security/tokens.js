import crypto from 'node:crypto'
import jwt from 'jsonwebtoken'

export const ACCESS_TOKEN_TTL_SECONDS = 15 * 60
export const REFRESH_TOKEN_TTL_MS = 30 * 24 * 60 * 60 * 1000
const ISSUER = 'manifiest'
const AUDIENCE = 'manifiest-app'

export function randomToken(bytes = 32) {
  return crypto.randomBytes(bytes).toString('base64url')
}

export function sha256(value) {
  return crypto.createHash('sha256').update(value).digest('hex')
}

export function randomCode(length = 6) {
  let code = ''
  for (let i = 0; i < length; i++) code += crypto.randomInt(0, 10)
  return code
}

export function safeEqual(a, b) {
  const ba = Buffer.from(String(a))
  const bb = Buffer.from(String(b))
  return ba.length === bb.length && crypto.timingSafeEqual(ba, bb)
}

export function signAccessToken(secret, user) {
  return jwt.sign({ role: user.role }, secret, {
    algorithm: 'HS256',
    subject: user.id,
    expiresIn: ACCESS_TOKEN_TTL_SECONDS,
    issuer: ISSUER,
    audience: AUDIENCE
  })
}

export function verifyAccessToken(secret, token) {
  return jwt.verify(token, secret, { algorithms: ['HS256'], issuer: ISSUER, audience: AUDIENCE })
}

export function pkcePair() {
  const verifier = randomToken(48)
  const challenge = crypto.createHash('sha256').update(verifier).digest('base64url')
  return { verifier, challenge }
}
