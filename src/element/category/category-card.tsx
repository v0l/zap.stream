import useGameInfo from "@/hooks/game-info"
import { formatSats } from "@/number"
import classNames from "classnames"
import type { ReactNode } from "react"
import { FormattedMessage } from "react-intl"
import { Link } from "react-router"

export function GameCard({ id, live, viewers }: { id: string; live: number; viewers: number }) {
  const game = useGameInfo(id)
  return (
    <CategoryCard
      to={`/category/${id}`}
      name={game?.name ?? id}
      cover={game?.cover?.url}
      className={game?.className}
      live={live}
      viewers={viewers}
    />
  )
}

export function CategoryCard({
  to,
  name,
  cover,
  className,
  live,
  viewers,
}: {
  to: string
  name: ReactNode
  cover?: string
  className?: string
  live: number
  viewers: number
}) {
  return (
    <Link to={to} className="group flex flex-col gap-2">
      <div className="relative aspect-[3/4] rounded-xl overflow-hidden bg-layer-1 outline-2 outline-transparent group-hover:outline-layer-3 transition-[outline-color]">
        {cover ? (
          <img src={cover} alt="" loading="lazy" className="w-full h-full object-cover" />
        ) : (
          <div className={classNames("w-full h-full", className)} />
        )}
        {live > 0 && (
          <span className="absolute left-2.5 top-2.5 flex items-center gap-1.5 rounded-md bg-layer-0/80 px-2 py-0.5 text-[13px] font-semibold backdrop-blur-sm">
            <span className="w-[7px] h-[7px] rounded-full bg-primary" />
            <FormattedMessage defaultMessage="{n} live" values={{ n: live }} />
          </span>
        )}
      </div>
      <div className="flex flex-col">
        <span className="font-semibold leading-tight line-clamp-2">{name}</span>
        <span className="text-sm text-layer-4">
          {viewers > 0 ? (
            <FormattedMessage defaultMessage="{n} watching" values={{ n: formatSats(viewers) }} />
          ) : live > 0 ? (
            <FormattedMessage defaultMessage="Live now" />
          ) : (
            <FormattedMessage defaultMessage="Nobody live" />
          )}
        </span>
      </div>
    </Link>
  )
}
