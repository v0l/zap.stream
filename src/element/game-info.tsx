import useGameInfo from "@/hooks/game-info";
import { GameInfo } from "@/service/game-database";
import classNames from "classnames";
import { Link } from "react-router-dom";

interface GameInfoCardProps {
  gameId?: string;
  gameInfo?: GameInfo;
  imageSize?: number;
  showImage?: boolean;
  link?: boolean;
}

export default function GameInfoCard({ gameId, gameInfo, imageSize, showImage, link }: GameInfoCardProps) {
  const game = useGameInfo(gameId, gameInfo);
  if (!game) return;

  const inner = (
    <div className="flex gap-2 items-center">
      {(showImage ?? true) && (
        <img
          src={game.cover}
          style={{ height: imageSize ?? 20 }}
          className={classNames("object-contain", game.className)}
        />
      )}
      {game.name}
    </div>
  );

  if (link) {
    return (
      <Link to={`/category/${gameId}`} className="text-primary">
        {inner}
      </Link>
    );
  } else {
    return inner;
  }
}
