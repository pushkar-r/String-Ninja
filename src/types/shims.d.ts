declare module 'pako' {
  export function inflateRaw(data: Uint8Array): Uint8Array
}

declare module 'bcryptjs' {
  const bcrypt: {
    hashSync(password: string, rounds?: number): string
    compareSync(password: string, hash: string): boolean
  }
  export default bcrypt
}

declare module 'csso' {
  export function minify(code: string): { css: string }
}

declare module 'js-beautify' {
  export const js: (code: string, options?: any) => string
  export const css: (code: string, options?: any) => string
  export const html: (code: string, options?: any) => string
}

declare module 'uuid' {
  export function v4(): string
}

declare module 'qrcode' {
  const QRCode: {
    toDataURL(text: string): Promise<string>
  }
  export default QRCode
}
