import crypto from 'node:crypto'

export function createCipher(key) {
  return {
    encrypt(plaintext) {
      if (plaintext == null) return null
      const iv = crypto.randomBytes(12)
      const cipher = crypto.createCipheriv('aes-256-gcm', key, iv)
      const data = Buffer.concat([cipher.update(String(plaintext), 'utf8'), cipher.final()])
      return `v1.${iv.toString('base64url')}.${cipher.getAuthTag().toString('base64url')}.${data.toString('base64url')}`
    },
    decrypt(payload) {
      if (payload == null) return null
      const [version, iv, tag, data] = payload.split('.')
      if (version !== 'v1') throw new Error('Formato de cifrado desconocido')
      const decipher = crypto.createDecipheriv('aes-256-gcm', key, Buffer.from(iv, 'base64url'))
      decipher.setAuthTag(Buffer.from(tag, 'base64url'))
      return Buffer.concat([decipher.update(Buffer.from(data, 'base64url')), decipher.final()]).toString('utf8')
    }
  }
}
