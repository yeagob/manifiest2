import nacl from 'tweetnacl'
import * as SecureStore from 'expo-secure-store'
import * as Crypto from 'expo-crypto'

nacl.setPRNG((out, n) => out.set(Crypto.getRandomBytes(n)))

const KEY = 'manifiest.identity.v1'
const OPTIONS = { keychainAccessible: SecureStore.AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY }

const toB64 = bytes => globalThis.btoa(String.fromCharCode(...bytes))
const fromB64 = b64 => Uint8Array.from(globalThis.atob(b64), c => c.charCodeAt(0))

export async function loadIdentity() {
  const raw = await SecureStore.getItemAsync(KEY, OPTIONS)
  return raw ? JSON.parse(raw) : null
}

export async function createKeys() {
  const pair = nacl.sign.keyPair()
  return { publicKey: toB64(pair.publicKey), secretKey: toB64(pair.secretKey) }
}

export async function saveIdentity(identity) {
  await SecureStore.setItemAsync(KEY, JSON.stringify(identity), OPTIONS)
}

export async function forgetIdentity() {
  await SecureStore.deleteItemAsync(KEY, OPTIONS)
}

export function sign(identity, message) {
  const bytes = new TextEncoder().encode(message)
  return toB64(nacl.sign.detached(bytes, fromB64(identity.secretKey)))
}

export function nonce() {
  return toB64(Crypto.getRandomBytes(18)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}
