import bcrypt from 'bcryptjs'
import { createHash } from 'crypto' // placeholder for fallback (node only namespaced, in browser not used)
// argon2-browser exports a default with hash function
import * as argon2 from 'argon2-browser'

export function bcryptHash(password: string, rounds = 10) {
  return bcrypt.hashSync(password, rounds)
}
export function bcryptCompare(password: string, hash: string) {
  return bcrypt.compareSync(password, hash)
}

export async function argon2Hash(password: string) {
  const res = await argon2.hash({ pass: password, salt: crypto.getRandomValues(new Uint8Array(16)), time: 2, mem: 1024 })
  // res.hash is base64
  return res.hash
}
