import useGameInfo from "@/hooks/game-info";
import type { GameInfo } from "@/service/game-database";
import classNames from "classnames";
import { Link } from "react-router";
import Pill from "./pill";

interface GameInfoCardProps {
  gameId?: string;
  gameInfo?: GameInfo;
  imageSize?: number;
  showImage?: boolean;
  showDetail?: boolean;
  link?: boolean;
}

export default function GameInfoCard({ gameId, gameInfo, imageSize, showImage, link, showDetail }: GameInfoCardProps) {
  const game = useGameInfo(gameId, gameInfo);
  if (!game) return;

  const inner = (
    <div className="flex gap-2 items-center">
      {(showImage ?? true) && (
        <img
          src={game.cover}
          style={{ height: imageSize ?? 20 }}
          className={classNames("object-contain", game.className)}
          alt="Game cover"
        />
      )}
      <div className="flex flex-col">
        <span className={link ? "text-primary text-xl" : "text-xl"}>{game.name}</span>
        {(showDetail ?? false) && <>
          {game.summary && <div className="text-layer-4 text-sm">{game.summary}</div>}
          <div className="flex gap-2 text-sm">
            {game.genres.map(a => <Pill key={a}>{a}</Pill>)}
          </div>
        </>}
      </div>
    </div>
  );

  if (link) {
    return (
      <Link to={`/category/${gameId}`}>
        {inner}
      </Link>
    );
  } else {
    return inner;
  }
}
