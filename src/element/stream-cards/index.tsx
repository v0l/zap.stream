import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";

import { useLogin } from "@/hooks/login";
import { useCards } from "@/hooks/cards";
import { StreamCardEditor } from "./stream-card-editor";
import { Card } from "./card-item";

export interface CardType {
  identifier: string;
  content: string;
  title?: string;
  image?: string;
  link?: string;
}

export type NewCard = Omit<CardType, "identifier">;

export interface CardItem {
  identifier: string;
}

interface StreamCardsProps {
  host: string;
}

export function ReadOnlyStreamCards({ host }: StreamCardsProps) {
  const cards = useCards(host);
  return (
    <div className="max-xl:hidden grid lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
      {cards.map(ev => (
        <Card cards={cards} key={ev.id} ev={ev} />
      ))}
    </div>
  );
}

export function StreamCards({ host }: StreamCardsProps) {
  const login = useLogin();
  const canEdit = login?.pubkey === host;
  return (
    <DndProvider backend={HTML5Backend}>
      {canEdit ? (
        <StreamCardEditor tags={login.cards.tags} pubkey={login.pubkey} />
      ) : (
        <ReadOnlyStreamCards host={host} />
      )}
    </DndProvider>
  );
}
