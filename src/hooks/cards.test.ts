import { expect, test } from "bun:test"
import { CARD } from "@/const"
import { latestCardTags } from "./cards"

const author = "a".repeat(64)
const tag = (d: string) => ["a", `${CARD}:${author}:${d}`]

test("the newest card list wins even when an older one is returned first", () => {
  const old = { created_at: 100, tags: [tag("1")] }
  const next = { created_at: 200, tags: [tag("1"), tag("2")] }
  expect(latestCardTags([old, next])).toEqual([tag("1"), tag("2")])
  expect(latestCardTags([next, old])).toEqual([tag("1"), tag("2")])
})

test("non card references are ignored and no list yields no cards", () => {
  expect(latestCardTags([])).toEqual([])
  expect(latestCardTags([{ created_at: 1, tags: [["a", `30023:${author}:x`], tag("1")] }])).toEqual([tag("1")])
})
