import { FormattedMessage } from "react-intl";
import StepHeader from "./step-header";
import { DefaultButton } from "@/element/buttons";
import { DefaultProvider } from "@/providers";
import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import CategoryInput from "@/element/stream-editor/category-input";
import { GameInfo } from "@/service/game-database";
import { extractGameTag, sortStreamTags } from "@/utils";
import { appendDedupe } from "@snort/shared";

export default function DashboardIntroStep2() {
  const navigate = useNavigate();
  const location = useLocation();
  const [game, setGame] = useState<GameInfo>();
  const [gameId, setGameId] = useState<string>();
  const [tags, setTags] = useState<Array<string>>([]);

  useEffect(() => {
    DefaultProvider.info().then(i => {
      const { regularTags, prefixedTags } = sortStreamTags(i.streamInfo?.tags ?? []);
      const { gameInfo, gameId } = extractGameTag(prefixedTags);
      setGame(gameInfo);
      setGameId(gameId);
      setTags(regularTags);
    });
  }, []);

  return (
    <div className="mx-auto flex flex-col items-center ">
      <StepHeader />
      <div className="flex flex-col gap-4 w-[30rem]">
        <h2 className="text-center">
          <FormattedMessage defaultMessage="Choose a category" />
        </h2>
        <CategoryInput
          tags={tags}
          game={game}
          gameId={gameId}
          setTags={setTags}
          setGame={setGame}
          setGameId={setGameId}
        />
        <DefaultButton
          onClick={async () => {
            const newState = {
              ...location.state,
              tags: appendDedupe(tags, gameId ? [gameId] : undefined),
            };
            await DefaultProvider.updateStream(newState);
            navigate("/dashboard/step-3", {
              state: newState,
            });
          }}>
          <FormattedMessage defaultMessage="Continue" />
        </DefaultButton>
      </div>
    </div>
  );
}
