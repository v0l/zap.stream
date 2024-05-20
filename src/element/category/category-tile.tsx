import useGameInfo from "@/hooks/game-info";
import Pill from "../pill";
import { ReactNode } from "react";
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
      <div className="flex gap-8">
        {game?.cover && (
          <img src={game?.cover} className="max-lg:w-full sm:h-full lg:h-[200px] xl:h-[250px] aspect-[3/4]" />
        )}
        {!game?.cover && game?.className && (
          <div className={classNames("w-full aspect-[3/4] xl:h-[250px]", game.className)} />
        )}
        {showDetail && (
          <div className="flex flex-col gap-4">
            <h1>{game?.name}</h1>
            {game?.genres && <div className="flex gap-2">{game?.genres?.map(a => <Pill>{a}</Pill>)}</div>}
            {extraDetail}
          </div>
        )}
      </div>
      {showFooterTitle && <p>{game?.name}</p>}
      {children}
    </div>
  );
}
