import { useState } from "react";
import { FormattedMessage } from "react-intl";
import { Toggle } from "../toggle";
import { useUserCards } from "@/hooks/cards";
import { AddCard } from "./add-card";
import { Card } from "./card-item";
import { ToNostrEventTag } from "@snort/system";
import { Tag } from "@/types";

interface StreamCardEditorProps {
  pubkey: string;
  tags: Array<ToNostrEventTag>;
}

export function StreamCardEditor({ pubkey, tags }: StreamCardEditorProps) {
  const cards = useUserCards(
    pubkey,
    tags.map(a => a.toEventTag() as Tag),
    true,
  );
  const [isEditing, setIsEditing] = useState(false);
  return (
    <>
      <div className="text-xl flex items-center gap-2">
        <FormattedMessage defaultMessage="Edit Cards" id="bD/ZwY" />
        <Toggle onClick={() => setIsEditing(s => !s)} checked={isEditing} size={40} />
      </div>

      <div className="grid lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {cards.map(ev => (
          <Card canEdit={isEditing} cards={cards} key={ev.id} ev={ev} />
        ))}
        {isEditing && <AddCard cards={cards} />}
      </div>
    </>
  );
}
