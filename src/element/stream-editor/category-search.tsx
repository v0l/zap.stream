import { useEffect, useRef, useState } from "react"
import { useIntl } from "react-intl"
import { ControlledMenu, MenuItem } from "@szhsin/react-menu"
import { debounce } from "@/utils"
import { AllCategories } from "@/pages/category"
import GameDatabase, { type GameInfo } from "@/service/game-database"
import GameInfoCard from "@/element/game-info"

export function SearchCategory({ onSelect }: { onSelect?: (game: GameInfo) => void }) {
  const ref = useRef<HTMLInputElement | null>(null)
  const { formatMessage } = useIntl()
  const [search, setSearch] = useState("")
  const [categoryResults, setCategoryResults] = useState<Array<GameInfo>>([])

  function searchNonGames(s: string) {
    return AllCategories.filter(a => {
      if (a.id.toLowerCase().includes(s.toLowerCase())) {
        return true
      }
      if (a.tags.some(b => b.toLowerCase().includes(s.toLowerCase()))) {
        return true
      }
      return false
    }).map(
      (a): GameInfo => ({
        id: `internal:${a.id}`,
        name: a.name,
        genres: a.tags.map((t, idx) => ({ id: idx, name: t })),
        className: a.className,
      }),
    )
  }

  const db = new GameDatabase()
  useEffect(() => {
    if (search) {
      return debounce(500, async () => {
        setCategoryResults([])
        const games = await db.searchGames(search)
        setCategoryResults([...searchNonGames(search), ...games])
      })
    } else {
      setCategoryResults([])
    }
  }, [search])

  return (
    <>
      <input
        ref={ref}
        type="text"
        value={search}
        onChange={e => setSearch(e.target.value)}
        placeholder={formatMessage({
          defaultMessage: "Gaming",
        })}
      />
      <ControlledMenu
        gap={2}
        menuClassName="ctx-menu gap-1"
        state={categoryResults.length > 0 ? "open" : "closed"}
        // react-menu types anchorRef as non-nullable RefObject<Element>; React 19's
        // useRef(null) widens to include null, so narrow back to the library's shape.
        anchorRef={ref as React.RefObject<HTMLInputElement>}
        captureFocus={false}
      >
        {categoryResults.map(a => (
          <MenuItem
            key={a.id}
            className="!px-2 !py-0"
            onClick={() => {
              setCategoryResults([])
              setSearch("")
              onSelect?.(a)
            }}
          >
            <GameInfoCard gameInfo={a} imageSize={40} />
          </MenuItem>
        ))}
      </ControlledMenu>
    </>
  )
}
