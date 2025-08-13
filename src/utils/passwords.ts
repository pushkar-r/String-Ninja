import bcrypt from 'bcryptjs'
import { argon2id } from 'hash-wasm'

export function bcryptHash(password: string, rounds = 10) {
  return bcrypt.hashSync(password, rounds)
}
export function bcryptCompare(password: string, hash: string) {
  return bcrypt.compareSync(password, hash)
}

export async function argon2Hash(password: string) {
  const salt = crypto.getRandomValues(new Uint8Array(16))
  return await argon2id({
    password,
    salt,
    parallelism: 1,
    iterations: 2,
    memorySize: 1024, // KB
    hashLength: 32,
    outputType: 'encoded'
  })
}
