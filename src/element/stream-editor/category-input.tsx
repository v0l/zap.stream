import { GameInfo } from "@/service/game-database";
import { FormattedMessage } from "react-intl";
import { IconButton } from "../buttons";
import GameInfoCard from "../game-info";
import { SearchCategory } from "./category-search";
import { StreamInput } from "./input";
import { TagsInput } from "react-tag-input-component";

export default function CategoryInput({
  tags,
  game,
  gameId,
  setTags,
  setGame,
  setGameId,
}: {
  tags: Array<string>;
  game: GameInfo | undefined;
  gameId: string | undefined;
  setTags: (v: Array<string>) => void;
  setGame: (g: GameInfo | undefined) => void;
  setGameId: (id: string | undefined) => void;
}) {
  return (
    <>
      <StreamInput label={<FormattedMessage defaultMessage="Category" />}>
        {!gameId && (
          <SearchCategory
            onSelect={g => {
              setGame(g);
              setGameId(g.id);
            }}
          />
        )}
        {gameId && (
          <div className="flex justify-between rounded-xl px-3 py-2 border border-layer-2">
            <GameInfoCard gameInfo={game} gameId={gameId} imageSize={80} />
            <IconButton
              iconName="x"
              iconSize={12}
              className="text-layer-4"
              onClick={() => {
                setGame(undefined);
                setGameId(undefined);
              }}
            />
          </div>
        )}
      </StreamInput>
      <StreamInput label={<FormattedMessage defaultMessage="Tags" />}>
        <TagsInput value={tags} onChange={setTags} placeHolder="Music,DJ,English" separators={["Enter", ","]} />
      </StreamInput>
    </>
  );
}
