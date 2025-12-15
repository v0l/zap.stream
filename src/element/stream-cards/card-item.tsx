import { useContext } from "react";
import { useDrag, useDrop } from "react-dnd";
import { removeUndefined, unwrap } from "@snort/shared";
import { NostrLink, type TaggedNostrEvent } from "@snort/system";
import { SnortContext } from "@snort/system-react";
import type { CardItem } from ".";
import { USER_CARDS } from "@/const";
import { useLogin } from "@/hooks/login";
import type { Tags } from "@/types";
import { findTag } from "@/utils";
import { EditCard } from "./edit-card";
import { CardPreview } from "./preview";

interface CardProps {
  canEdit?: boolean;
  ev: TaggedNostrEvent;
  cards: TaggedNostrEvent[];
}
export function Card({ canEdit, ev, cards }: CardProps) {
  const system = useContext(SnortContext);
  const login = useLogin();
  const evCard = {
    title: findTag(ev, "title") || findTag(ev, "subject"),
    image: findTag(ev, "image"),
    link: findTag(ev, "r"),
    content: ev.content,
    identifier: unwrap(findTag(ev, "d")),
  };
  const tags = removeUndefined(cards.map(a => NostrLink.fromEvent(a).toEventTag()));
  const [style, dragRef] = useDrag(
    () => ({
      type: "card",
      item: { id: evCard.identifier },
      collect: monitor => {
        const isDragging = monitor.isDragging();
        return {
          opacity: isDragging ? 0.1 : 1,
          cursor: !canEdit ? "auto" : isDragging ? "grabbing" : "grab",
        };
      },
    }),
    [canEdit, evCard],
  );

  function findTagByIdentifier(d: string) {
    return tags.find(t => t[1].endsWith(`:${d}`));
  }

  const [dropStyle, dropRef] = useDrop(
    () => ({
      accept: "card",
      canDrop: () => {
        return Boolean(canEdit);
      },
      collect: monitor => {
        const isOvering = monitor.isOver({ shallow: true });
        return {
          opacity: isOvering ? 0.3 : 1,
          animation: isOvering ? "shake 0.1s 3" : "",
        };
      },
      hover: console.debug,
      async drop(item) {
        const typed = item as CardItem;
        if (evCard.identifier === typed.identifier) {
          return;
        }
        const newItem = findTagByIdentifier(typed.identifier);
        const oldItem = findTagByIdentifier(evCard.identifier);
        const newTags = tags.map(t => {
          if (t === oldItem) {
            return newItem;
          }
          if (t === newItem) {
            return oldItem;
          }
          return t;
        }) as Tags;
        const pub = login?.publisher();
        if (pub) {
          const userCardsEv = await pub.generic(eb => {
            eb.kind(USER_CARDS).content("");
            for (const tag of newTags) {
              eb.tag(tag);
            }
            return eb;
          });
          console.debug(userCardsEv);
          await system.BroadcastEvent(userCardsEv);
        }
      },
    }),
    [canEdit, tags, evCard],
  );

  const card = <CardPreview ref={dropRef} {...evCard} style={dropStyle} />;
  if (canEdit) {
    return (
      <div ref={dragRef} style={style}>
        {card}
        <EditCard card={evCard} cards={cards} />
      </div>
    );
  }
  return card;
}
