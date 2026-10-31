import { expect, test } from "bun:test"
import { categoryStats } from "./category-stats"

const categories = [
  { id: "gaming", tags: ["gaming"] },
  { id: "music", tags: ["music", "radio"] },
]

test("counts live streams and viewers per category", () => {
  const { categories: c } = categoryStats(
    [
      { tags: ["gaming"], participants: "5" },
      { tags: [], gameId: "internal:gaming", participants: "2" },
      { tags: ["Radio"] },
    ],
    categories,
  )
  expect(c.gaming).toEqual({ id: "gaming", live: 2, viewers: 7 })
  expect(c.music).toEqual({ id: "music", live: 1, viewers: 0 })
})

test("games are ranked by viewers then streams", () => {
  const { games } = categoryStats(
    [
      { tags: ["gaming"], gameId: "igdb:1", participants: "1" },
      { tags: ["gaming"], gameId: "igdb:2", participants: "9" },
      { tags: ["gaming"], gameId: "igdb:1", participants: "1" },
      { tags: [], gameId: "igdb:3" },
    ],
    categories,
  )
  expect(games.map(g => g.id)).toEqual(["igdb:2", "igdb:1", "igdb:3"])
})
