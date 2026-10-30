import { expect, test } from "bun:test"
import { makeUploadKey } from "./upload-key"

test("same size videos with different names get different keys", () => {
  const a = makeUploadKey({ id: "a.mp4", size: 100 }, "https://s", "video")
  const b = makeUploadKey({ id: "b.mp4", size: 100 }, "https://s", "video")
  expect(a).not.toBe(b)
})

test("same file to same server gets the same key", () => {
  const a = makeUploadKey({ id: "a.mp4", size: 100 }, "https://s", "video")
  expect(makeUploadKey({ id: "a.mp4", size: 100 }, "https://s", "video")).toBe(a)
})
