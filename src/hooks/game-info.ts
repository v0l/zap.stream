import { AllCategories } from "@/pages/category";
import GameDatabase, { type GameInfo } from "@/service/game-database";
import { useEffect, useState } from "react";

export default function useGameInfo(gameId?: string, gameInfo?: GameInfo) {
  const [game, setGame] = useState<GameInfo | undefined>(gameInfo);

  useEffect(() => {
    if (!gameInfo && gameId) {
      const [prefix, id] = gameId.split(":");
      if (prefix === "internal" || !gameId.includes(":")) {
        const ix = AllCategories.find(a => a.id === id || a.id === gameId);
        if (ix) {
          setGame({
            ...ix,
            id: `internal:${ix.id}`,
            name: ix.name,
            genres: ix.tags,
            className: ix.className,
            cover: ix.cover,
          });
        }
      } else {
        new GameDatabase().getGame(gameId).then(setGame);
      }
    }
  }, [gameInfo, gameId]);

  return game;
}
