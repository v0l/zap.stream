import { expect, test } from "bun:test"
import { categoryQueryTags } from "./category-tags"

const categories = [
  { id: "gaming", tags: ["gaming"] },
  { id: "music", tags: ["music", "radio"] },
]

test("category page finds streams tagged by the stream editor", () => {
  expect(categoryQueryTags("gaming", categories)).toContain("internal:gaming")
  expect(categoryQueryTags("music", categories)).toEqual(["music", "radio", "internal:music"])
})

test("game categories query their own id", () => {
  expect(categoryQueryTags("igdb:1942", categories)).toEqual(["igdb:1942"])
})

test("internal prefixed links resolve to the category", () => {
  expect(categoryQueryTags("internal:music", categories)).toEqual(["music", "radio", "internal:music"])
})
