import { categoryQueryTags } from "./category-tags"

export interface CategoryStreamInfo {
  tags: Array<string>
  gameId?: string
  participants?: string
}

export interface CategoryStats {
  id: string
  live: number
  viewers: number
}

export function categoryStats(
  streams: Array<CategoryStreamInfo>,
  categories: Array<{ id: string; tags: Array<string> }>,
) {
  const internal: Record<string, CategoryStats> = {}
  const games: Record<string, CategoryStats> = {}
  for (const s of streams) {
    const viewers = Number(s.participants ?? 0) || 0
    for (const c of categories) {
      const match = categoryQueryTags(c.id, categories)
      if (s.tags.some(t => match.includes(t.toLowerCase())) || (s.gameId && match.includes(s.gameId))) {
        internal[c.id] ??= { id: c.id, live: 0, viewers: 0 }
        internal[c.id].live++
        internal[c.id].viewers += viewers
      }
    }
    if (s.gameId && !s.gameId.startsWith("internal:")) {
      games[s.gameId] ??= { id: s.gameId, live: 0, viewers: 0 }
      games[s.gameId].live++
      games[s.gameId].viewers += viewers
    }
  }
  const byPopularity = (a: CategoryStats, b: CategoryStats) => b.viewers - a.viewers || b.live - a.live
  return { categories: internal, games: Object.values(games).sort(byPopularity) }
}
