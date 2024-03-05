import CategoryLink from "@/element/category-link";
import VideoGridSorted from "@/element/video-grid-sorted";
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
];

export default function Category() {
  const { id } = useParams();

  const cat = AllCategories.find(a => a.id === id);
  const sub = useMemo(() => {
    if (!cat) return;
    const rb = new RequestBuilder(`category:${cat.id}`);
    rb.withFilter().kinds([EventKind.LiveEvent]).tag("t", cat.tags);
    return rb;
  }, [cat]);
  const results = useRequestBuilder(sub);
  return (
    <div>
      <div className="flex gap-4">
        {AllCategories.map(a => (
          <CategoryLink key={a.id} {...a} />
        ))}
      </div>
      <h1 className="uppercase my-4">{id}</h1>
      <VideoGridSorted evs={results} showAll={true} />
    </div>
  );
}
