import { expect, test } from "bun:test"
import { playWithMutedFallback } from "./autoplay"

function fakeVideo(refuseUnmuted: boolean) {
  const calls: Array<boolean> = []
  const el = {
    muted: false,
    play() {
      calls.push(this.muted)
      if (refuseUnmuted && !this.muted) {
        return Promise.reject(new DOMException("blocked", "NotAllowedError"))
      }
      return Promise.resolve()
    },
  }
  return { el, calls }
}

test("autoplay blocked with sound plays muted instead", async () => {
  const { el, calls } = fakeVideo(true)
  await playWithMutedFallback(el)
  expect(calls).toEqual([false, true])
  expect(el.muted).toBe(true)
})

test("autoplay allowed with sound stays unmuted", async () => {
  const { el, calls } = fakeVideo(false)
  await playWithMutedFallback(el)
  expect(calls).toEqual([false])
  expect(el.muted).toBe(false)
})

test("other play errors do not mute", async () => {
  const el = {
    muted: false,
    play: () => Promise.reject(new DOMException("gone", "AbortError")),
  }
  await playWithMutedFallback(el)
  expect(el.muted).toBe(false)
})
