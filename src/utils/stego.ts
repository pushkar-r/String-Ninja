export async function hideTextInImage(file: File, text: string): Promise<string> {
  const img = await fileToImage(file)
  const { canvas, ctx } = imageToCanvas(img)
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
  const data = imageData.data

  const enc = new TextEncoder()
  const bytes = enc.encode(text)
  const len = bytes.length
  const header = new Uint8Array(4)
  new DataView(header.buffer).setUint32(0, len, true)

  const payload = new Uint8Array(header.length + bytes.length)
  payload.set(header, 0)
  payload.set(bytes, header.length)

  if (payload.length * 8 > data.length) throw new Error('Image too small for this message.')

  let dataIndex = 0
  for (let i = 0; i < payload.length; i++) {
    for (let bit = 0; bit < 8; bit++) {
      while (dataIndex % 4 === 3) dataIndex++ // skip alpha
      const bitVal = (payload[i] >> bit) & 1
      data[dataIndex] = (data[dataIndex] & 0xFE) | bitVal
      dataIndex++
    }
  }

  ctx.putImageData(imageData, 0, 0)
  return canvas.toDataURL('image/png')
}

export async function extractTextFromImage(file: File): Promise<string> {
  const img = await fileToImage(file)
  const { canvas, ctx } = imageToCanvas(img)
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
  const data = imageData.data

  function readBits(n: number, startIndex=0): { bits: number[]; next: number } {
    const bits: number[] = []
    let i = startIndex
    while (bits.length < n) {
      if (i % 4 !== 3) bits.push(data[i] & 1)
      i++
    }
    return { bits, next: i }
  }

  function bitsToBytes(bits: number[]): Uint8Array {
    const bytes = new Uint8Array(Math.ceil(bits.length / 8))
    for (let i = 0; i < bits.length; i++) {
      const byteIndex = Math.floor(i / 8)
      const bitIndex = i % 8
      bytes[byteIndex] |= (bits[i] & 1) << bitIndex
    }
    return bytes
  }

  const { bits: headerBits, next } = readBits(32, 0)
  const len = new DataView(bitsToBytes(headerBits).buffer).getUint32(0, true)
  const { bits: msgBits } = readBits(len * 8, next)
  const msgBytes = bitsToBytes(msgBits)
  return new TextDecoder().decode(msgBytes)
}

function fileToImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = url
  })
}

function imageToCanvas(img: HTMLImageElement) {
  const canvas = document.createElement('canvas')
  canvas.width = img.naturalWidth
  canvas.height = img.naturalHeight
  const ctx = canvas.getContext('2d')!
  ctx.drawImage(img, 0, 0)
  return { canvas, ctx }
}
