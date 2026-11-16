import { expect, test } from "bun:test"
import { readCapped } from "./n94-fetch"

const streamOf = (n: number, chunk = 1024) =>
  new ReadableStream<Uint8Array>({
    pull(c) {
      if (n <= 0) return c.close()
      c.enqueue(new Uint8Array(Math.min(chunk, n)))
      n -= chunk
    },
  })

test("returns bytes under the cap", async () => {
  const out = await readCapped(new Response(streamOf(3000)), 4096, () => {})
  expect(out?.byteLength).toBe(3000)
})

test("aborts mid-stream when the cap is exceeded without content-length", async () => {
  let aborted = false
  const out = await readCapped(new Response(streamOf(1_000_000)), 4096, () => {
    aborted = true
  })
  expect(out).toBeUndefined()
  expect(aborted).toBe(true)
})

test("rejects on declared content-length before reading", async () => {
  let aborted = false
  const res = new Response(streamOf(10), { headers: { "content-length": "999999999" } })
  expect(await readCapped(res, 4096, () => (aborted = true))).toBeUndefined()
  expect(aborted).toBe(true)
})
