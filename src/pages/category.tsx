import CategoryLink from "@/element/category-link";
import Pill from "@/element/pill";
import VideoGridSorted from "@/element/video-grid-sorted";
import useGameInfo from "@/hooks/game-info";
import { EventKind, RequestBuilder } from "@snort/system";
import { useRequestBuilder } from "@snort/system-react";
import { useMemo } from "react";
import { FormattedMessage } from "react-intl";
import { useParams } from "react-router-dom";

export const AllCategories = [
  {
    id: "irl",
    name: <FormattedMessage defaultMessage="IRL" />,
    icon: "face",
    tags: ["irl"],
    priority: 0,
    className: "bg-category-gradient-1",
  },
  {
    id: "gaming",
    name: <FormattedMessage defaultMessage="Gaming" />,
    icon: "gaming-pad",
    tags: ["gaming"],
    priority: 0,
    className: "bg-category-gradient-2",
  },
  {
    id: "music",
    name: <FormattedMessage defaultMessage="Music" />,
    icon: "music",
    tags: ["music"],
    priority: 0,
    className: "bg-category-gradient-3",
  },
  {
    id: "talk",
    name: <FormattedMessage defaultMessage="Talk" />,
    icon: "mic",
    tags: ["talk"],
    priority: 0,
    className: "bg-category-gradient-4",
  },
  {
    id: "art",
    name: <FormattedMessage defaultMessage="Art" />,
    icon: "art",
    tags: ["art"],
    priority: 0,
    className: "bg-category-gradient-5",
  },
  {
    id: "gambling",
    name: <FormattedMessage defaultMessage="Gambling" />,
    icon: "dice",
    tags: ["gambling", "casino", "slots"],
    priority: 1,
    className: "bg-category-gradient-6",
  },
  {
    id: "science-and-technology",
    name: <FormattedMessage defaultMessage="Science & Technology" />,
    icon: "dice",
    tags: ["science", "technology"],
    priority: 1,
    className: "bg-category-gradient-7",
  },
];

export default function Category() {
  const { id } = useParams();
  const game = useGameInfo(id);

  const sub = useMemo(() => {
    if (!id) return;

    const cat = AllCategories.find(a => a.id === id);
    const rb = new RequestBuilder(`category:${id}`);
    rb.withFilter()
      .kinds([EventKind.LiveEvent])
      .tag("t", cat?.tags ?? [id]);
    return rb;
  }, [id]);

  const results = useRequestBuilder(sub);
  return (
    <div>
      <div className="flex gap-4">
        {AllCategories.map(a => (
          <CategoryLink key={a.id} {...a} />
        ))}
      </div>
      <div className="flex gap-8 py-8">
        {game?.cover && <img src={game?.cover} className="h-[250px]" />}
        <div className="flex flex-col gap-4">
          <h1>{game?.name}</h1>
          {game?.genres && (
            <div className="flex gap-2">
              {game?.genres?.map(a => (
                <Pill>{a}</Pill>
              ))}
            </div>
          )}
        </div>
      </div>
      <VideoGridSorted evs={results} showAll={true} />
    </div>
  );
}
