import { useContext, useState } from "react";
import { removeUndefined, unwrap } from "@snort/shared";
import { NostrLink, TaggedNostrEvent } from "@snort/system";
import { SnortContext } from "@snort/system-react";
import { Icon } from "../icon";
import { useLogin } from "@/hooks/login";
import { CARD, USER_CARDS } from "@/const";
import Modal from "../modal";
import { NewCard } from ".";
import { CardDialog } from "./new-card";

interface AddCardProps {
  cards: TaggedNostrEvent[];
}

export function AddCard({ cards }: AddCardProps) {
  const system = useContext(SnortContext);
  const login = useLogin();
  const tags = removeUndefined(cards.map(a => NostrLink.fromEvent(a).toEventTag()));
  const [open, setOpen] = useState(false);

  async function createCard({ title, image, link, content }: NewCard) {
    const pub = login?.publisher();
    if (pub) {
      const ev = await pub.generic(eb => {
        const d = String(Date.now());
        eb.kind(CARD).content(content).tag(["d", d]);
        if (title && title?.length > 0) {
          eb.tag(["title", title]);
        }
        if (image && image?.length > 0) {
          eb.tag(["image", image]);
        }
        if (link && link?.length > 0) {
          eb.tag(["r", link]);
        }
        return eb;
      });
      const userCardsEv = await pub.generic(eb => {
        eb.kind(USER_CARDS).content("");
        tags.forEach(a => eb.tag(a));
        eb.tag(unwrap(NostrLink.fromEvent(ev).toEventTag()));
        return eb;
      });

      console.debug(ev);
      console.debug(userCardsEv);

      await system.BroadcastEvent(ev);
      await system.BroadcastEvent(userCardsEv);
      setOpen(false);
    }
  }

  return (
    <div
      className="flex flex-col items-center justify-center bg-layer-1 rounded-xl gap-4 p-2 cursor-pointer"
      onClick={() => setOpen(true)}>
      <Icon name="plus" />
      {open && (
        <Modal id="add-card" onClose={() => setOpen(false)}>
          <CardDialog onSave={createCard} onCancel={() => setOpen(false)} />
        </Modal>
      )}
    </div>
  );
}
