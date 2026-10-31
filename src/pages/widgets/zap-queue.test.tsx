import "@/test/dom"
import { expect, test } from "bun:test"
import { act } from "react"
import { createRoot } from "react-dom/client"
import { unixNow } from "@snort/shared"
import type { ParsedZap } from "@snort/system"
import { useZapQueue } from "./zaps"

;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true

const ShowFor = 20

function zap(id: string, created_at: number): ParsedZap {
  return {
    id,
    valid: true,
    content: "",
    zapService: "",
    anonZap: true,
    errors: [],
    amount: 21,
    targetEvents: [],
    created_at,
  }
}

const shown: Array<string> = []
function Probe({ zaps }: { zaps: Array<ParsedZap> }) {
  const current = useZapQueue(zaps, ShowFor)
  if (current && shown.at(-1) !== current.id) shown.push(current.id)
  return null
}

function newestFirst(zaps: Array<ParsedZap>) {
  return [...zaps].sort((a, b) => b.created_at - a.created_at)
}

async function wait(ms: number) {
  await act(async () => {
    await new Promise(r => setTimeout(r, ms))
  })
}

test("alerts keep firing after the streamer starts a new stream", async () => {
  shown.length = 0
  const now = unixNow() + 1
  const root = createRoot(document.createElement("div"))
  act(() => root.render(<Probe zaps={newestFirst([zap("a", now), zap("b", now + 1)])} />))
  await wait(ShowFor * 4)
  act(() => root.render(<Probe zaps={newestFirst([zap("c", now + 2)])} />))
  await wait(ShowFor * 2)
  expect(shown).toEqual(["a", "b", "c"])
  act(() => root.unmount())
})

test("a late zap receipt is shown once and nothing repeats", async () => {
  shown.length = 0
  const now = unixNow() + 5
  const root = createRoot(document.createElement("div"))
  const a = zap("a", now)
  const b = zap("b", now + 2)
  act(() => root.render(<Probe zaps={newestFirst([a, b])} />))
  await wait(ShowFor * 1.5)
  act(() => root.render(<Probe zaps={newestFirst([a, b, zap("late", now - 1)])} />))
  await wait(ShowFor * 5)
  expect(shown).toEqual(["a", "b", "late"])
  act(() => root.unmount())
})
