import { FormattedMessage } from "react-intl"

import IRLImage from "@/images/irl.jpeg"
import GamingImage from "@/images/gaming.jpeg"
import MusicImage from "@/images/music.jpeg"
import TalkImage from "@/images/talk.jpeg"
import ArtImage from "@/images/art.jpeg"

export const AllCategories = [
  {
    id: "irl",
    name: <FormattedMessage defaultMessage="IRL" />,
    icon: "face",
    tags: ["irl"],
    priority: 0,
    className: "bg-category-gradient-1",
    cover: IRLImage,
  },
  {
    id: "gaming",
    name: <FormattedMessage defaultMessage="Gaming" />,
    icon: "gaming-pad",
    tags: ["gaming"],
    priority: 0,
    className: "bg-category-gradient-2",
    cover: GamingImage,
  },
  {
    id: "music",
    name: <FormattedMessage defaultMessage="Music" />,
    icon: "music",
    tags: ["music", "radio"],
    priority: 0,
    className: "bg-category-gradient-3",
    cover: MusicImage,
  },
  {
    id: "talk",
    name: <FormattedMessage defaultMessage="Talk" />,
    icon: "mic",
    tags: ["talk"],
    priority: 0,
    className: "bg-category-gradient-4",
    cover: TalkImage,
  },
  {
    id: "art",
    name: <FormattedMessage defaultMessage="Art" />,
    icon: "art",
    tags: ["art"],
    priority: 0,
    className: "bg-category-gradient-5",
    cover: ArtImage,
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
]
