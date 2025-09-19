import { FormattedMessage } from "react-intl";
import StepHeader from "./step-header";
import { DefaultButton } from "@/element/buttons";
import { useStreamProvider } from "@/hooks/stream-provider";
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
  const { provider: streamProvider } = useStreamProvider();

  useEffect(() => {
    streamProvider.info().then(i => {
      const { regularTags, prefixedTags } = sortStreamTags(i.details?.tags ?? []);
      const { gameInfo, gameId } = extractGameTag(prefixedTags);
      setGame(gameInfo);
      setGameId(gameId);
      setTags(regularTags);
    });
  }, [streamProvider]);

  return (
    <div className="mx-auto flex flex-col items-center md:w-[30rem] max-md:w-full max-md:px-3">
      <StepHeader />
      <div className="flex flex-col gap-4 w-full">
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
            await streamProvider.updateStream(newState);
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
