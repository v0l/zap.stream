import { expect, test } from "bun:test"
import { NostrLink } from "@snort/system"
import { mutedPubkeys } from "./muted-pubkeys"

const alice = "63fe6318dc58583cfe16810f86dd09e18bfd76aabc24a0081ce2856f330504ed"
const bob = "1".repeat(64)

test("muted pubkeys come from p tags of the mute list", () => {
  const muted = NostrLink.fromAllTags([
    ["p", alice],
    ["t", "spam"],
    ["e", "2".repeat(64)],
    ["word", "bad"],
  ])
  const keys = mutedPubkeys(muted)
  expect([...keys]).toEqual([alice])
  expect(muted.filter(m => m.equals(NostrLink.publicKey(alice))).length).toBe(1)
  expect(keys.has(bob)).toBe(false)
})
