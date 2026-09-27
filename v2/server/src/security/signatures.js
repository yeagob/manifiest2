import crypto from 'node:crypto'

const ED25519_SPKI_PREFIX = Buffer.from('302a300506032b6570032100', 'hex')

export function ed25519PublicKey(rawBase64) {
  const raw = Buffer.from(rawBase64, 'base64')
  if (raw.length !== 32) throw new Error('Clave pública Ed25519 inválida')
  return crypto.createPublicKey({ key: Buffer.concat([ED25519_SPKI_PREFIX, raw]), format: 'der', type: 'spki' })
}

export function verifyEd25519(rawPublicKeyBase64, message, signatureBase64) {
  try {
    const signature = Buffer.from(signatureBase64, 'base64')
    if (signature.length !== 64) return false
    return crypto.verify(null, Buffer.from(message), ed25519PublicKey(rawPublicKeyBase64), signature)
  } catch {
    return false
  }
}

export function hmacBase64(algorithm, key, body) {
  return crypto.createHmac(algorithm, key).update(body).digest('base64')
}
