import useGameInfo from "@/hooks/game-info";
import Pill from "../pill";
import type { ReactNode } from "react";
import classNames from "classnames";

export function CategoryTile({
  gameId,
  showDetail,
  children,
  showFooterTitle,
  extraDetail,
}: {
  gameId: string;
  showDetail?: boolean;
  showFooterTitle?: boolean;
  children?: ReactNode;
  extraDetail?: ReactNode;
}) {
  const game = useGameInfo(gameId);

  return (
    <div className="flex flex-col gap-2">
      <div className="flex gap-8 max-lg:flex-col">
        <div className="max-lg:h-[140px] lg:h-[200px] xl:h-[250px] aspect-[3/4]">
          {game?.cover && <img src={game?.cover.url} className="object-fit w-full h-full rounded-xl" />}
          {!game?.cover && game?.className && (
            <div className={classNames("aspect-[3/4] h-full rounded-xl", game.className)} />
          )}
        </div>
        {showDetail && (
          <div className="flex flex-col gap-4">
            <h1>{game?.name}</h1>
            {game?.genres && <div className="flex gap-2">{game?.genres?.map(a => <Pill key={a.id}>{a.name}</Pill>)}</div>}
            {extraDetail}
          </div>
        )}
      </div>
      {showFooterTitle && <p>{game?.name}</p>}
      {children}
    </div>
  );
}
