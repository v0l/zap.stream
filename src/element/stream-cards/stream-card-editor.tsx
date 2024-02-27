import { useState } from "react";
import { FormattedMessage } from "react-intl";
import { Toggle } from "../toggle";
import { useUserCards } from "@/hooks/cards";
import { AddCard } from "./add-card";
import { Tags } from "@/types";
import { Card } from "./card-item";

interface StreamCardEditorProps {
  pubkey: string;
  tags: Tags;
}

export function StreamCardEditor({ pubkey, tags }: StreamCardEditorProps) {
  const cards = useUserCards(pubkey, tags, true);
  const [isEditing, setIsEditing] = useState(false);
  return (
    <>
      <div className="text-xl flex items-center gap-2">
        <FormattedMessage defaultMessage="Edit Cards" id="bD/ZwY" />
        <Toggle onClick={() => setIsEditing(s => !s)} checked={isEditing} size={40} />
      </div>

      <div className="max-xl:hidden grid lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {cards.map(ev => (
          <Card canEdit={isEditing} cards={cards} key={ev.id} ev={ev} />
        ))}
        {isEditing && <AddCard cards={cards} />}
      </div>
    </>
  );
}
