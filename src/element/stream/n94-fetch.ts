export const MAX_SEGMENT_BYTES = 64 * 1024 * 1024

/** Read a response body, aborting as soon as `max` bytes are exceeded (content-length can be absent or a lie). */
export async function readCapped(res: Response, max: number, abort: () => void): Promise<Uint8Array | undefined> {
  const declared = Number(res.headers.get("content-length"))
  if (Number.isFinite(declared) && declared > max) {
    abort()
    return undefined
  }
  if (!res.body) {
    const buf = new Uint8Array(await res.arrayBuffer())
    return buf.byteLength > max ? undefined : buf
  }
  const reader = res.body.getReader()
  const chunks: Uint8Array[] = []
  let total = 0
  for (;;) {
    const { done, value } = await reader.read()
    if (done) break
    total += value.byteLength
    if (total > max) {
      abort()
      await reader.cancel().catch(() => {})
      return undefined
    }
    chunks.push(value)
  }
  const out = new Uint8Array(total)
  let off = 0
  for (const c of chunks) {
    out.set(c, off)
    off += c.byteLength
  }
  return out
}
