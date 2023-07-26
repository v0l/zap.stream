import "./stream-cards.css";

import { useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";

import type { NostrEvent } from "@snort/system";

import { useLogin } from "hooks/login";
import { useCards } from "hooks/cards";
import { CARD, USER_CARDS } from "const";
import { toTag } from "utils";
import { System } from "index";
import { findTag } from "utils";
import { Icon } from "./icon";
import { ExternalLink } from "./external-link";
import { FileUploader } from "./file-uploader";
import { Markdown } from "./markdown";

interface CardType {
  identifier?: string;
  title?: string;
  image?: string;
  link?: string;
  content: string;
}

interface CardProps {
  canEdit?: boolean;
  ev: NostrEvent;
  cards: NostrEvent[];
}

function Card({ canEdit, ev, cards }: CardProps) {
  const identifier = findTag(ev, "d");
  const title = findTag(ev, "title") || findTag(ev, "subject");
  const image = findTag(ev, "image");
  const link = findTag(ev, "r");
  const evCard = { title, image, link, content: ev.content, identifier };

  const card = (
    <>
      <div className="stream-card">
        {title && <h1 className="card-title">{title}</h1>}
        {image && <img src={image} alt={title} />}
        <Markdown children={ev.content} />
      </div>
    </>
  );
  const editor = canEdit && (
    <div className="editor-buttons">
      <EditCard card={evCard} />
      <DeleteCard card={ev} cards={cards} />
    </div>
  );
  return link && !canEdit ? (
    <div className="card-container">
      <ExternalLink href={link}>{card}</ExternalLink>
      {editor}
    </div>
  ) : (
    <div className="card-container">
      {card}
      {editor}
    </div>
  );
}

interface CardDialogProps {
  header?: string;
  cta?: string;
  card?: CardType;
  onSave(ev: CardType): void;
  onCancel(): void;
}

function CardDialog({ header, cta, card, onSave, onCancel }: CardDialogProps) {
  const [title, setTitle] = useState(card?.title ?? "");
  const [image, setImage] = useState(card?.image ?? "");
  const [content, setContent] = useState(card?.content ?? "");
  const [link, setLink] = useState(card?.link ?? "");

  return (
    <div className="new-card">
      <h3>{header || "Add card"}</h3>
      <div className="form-control">
        <label for="card-title">Title</label>
        <input
          id="card-title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. about me"
        />
      </div>
      <div className="form-control">
        <label for="card-image">Image</label>
        <FileUploader onFileUpload={setImage} />
      </div>
      <div className="form-control">
        <label for="card-image-link">Link</label>
        <input
          id="card-image-link"
          type="text"
          placeholder="https://"
          value={link}
          onChange={(e) => setLink(e.target.value)}
        />
      </div>
      <div className="form-control">
        <label for="card-content">Content</label>
        <textarea
          placeholder="Start typing..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
        />
        <span className="help-text">
          Supports{" "}
          <ExternalLink href="https://www.markdownguide.org/cheat-sheet">
            Markdown
          </ExternalLink>
        </span>
      </div>
      <div className="new-card-buttons">
        <button
          className="btn btn-primary add-button"
          onClick={() => onSave({ title, image, content, link })}
        >
          {cta || "Add Card"}
        </button>
        <button className="btn delete-button" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </div>
  );
}

interface EditCardProps {
  card: CardType;
}

function EditCard({ card }: EditCardProps) {
  const login = useLogin();
  const [isOpen, setIsOpen] = useState(false);

  async function editCard({ title, image, link, content }) {
    const pub = login?.publisher();
    if (pub) {
      const ev = await pub.generic((eb) => {
        eb.kind(CARD).content(content).tag(["d", card.identifier]);
        if (title?.length > 0) {
          eb.tag(["title", title]);
        }
        if (image?.length > 0) {
          eb.tag(["image", image]);
        }
        if (link?.lenght > 0) {
          eb.tag(["r", link]);
        }
        return eb;
      });
      console.debug(ev);
      System.BroadcastEvent(ev);
      setIsOpen(false);
    }
  }

  function onCancel() {
    setIsOpen(false);
  }

  return (
    <Dialog.Root open={isOpen} onOpenChange={setIsOpen}>
      <Dialog.Trigger asChild>
        <button className="btn btn-primary">Edit</button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="dialog-overlay" />
        <Dialog.Content className="dialog-content">
          <CardDialog
            header="Edit card"
            cta="Save Card"
            card={card}
            onSave={editCard}
            onCancel={onCancel}
          />
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

interface DeleteCardProps {
  card: NostrEvent;
  cards: NostrEvent[];
}

function DeleteCard({ card, cards }: DeleteCardProps) {
  const login = useLogin();
  const tags = cards.map(toTag);

  async function deleteCard() {
    const pub = login?.publisher();
    if (pub) {
      const userCardsEv = await pub.generic((eb) => {
        eb.kind(USER_CARDS).content("");
        for (const tag of tags) {
          if (tag.at(1) !== toTag(card).at(1)) {
            eb.tag(tag);
          }
        }
        return eb;
      });

      console.log(userCardsEv);

      System.BroadcastEvent(userCardsEv);
    }
  }

  return (
    <button className="btn delete-button" onClick={deleteCard}>
      Delete
    </button>
  );
}

interface AddCardProps {
  cards: NostrEvent[];
}

function AddCard({ cards }: AddCardProps) {
  const login = useLogin();
  const tags = cards.map(toTag);
  const [isOpen, setIsOpen] = useState(false);

  async function createCard({ title, image, link, content }) {
    const pub = login?.publisher();
    if (pub) {
      const ev = await pub.generic((eb) => {
        const d = String(Date.now());
        eb.kind(CARD).content(content).tag(["d", d]);
        if (title?.length > 0) {
          eb.tag(["title", title]);
        }
        if (image?.length > 0) {
          eb.tag(["image", image]);
        }
        if (link?.length > 0) {
          eb.tag(["r", link]);
        }
        return eb;
      });
      const userCardsEv = await pub.generic((eb) => {
        eb.kind(USER_CARDS).content("");
        for (const tag of tags) {
          eb.tag(tag);
        }
        eb.tag(toTag(ev));
        return eb;
      });

      console.debug(ev);
      console.debug(userCardsEv);

      System.BroadcastEvent(ev);
      System.BroadcastEvent(userCardsEv);
      setIsOpen(false);
    }
  }

  function onCancel() {
    setIsOpen(false);
  }

  return (
    <div className="stream-card add-card">
      <Dialog.Root open={isOpen} onOpenChange={setIsOpen}>
        <Dialog.Trigger asChild>
          <Icon name="plus" className="add-icon" />
        </Dialog.Trigger>
        <Dialog.Portal>
          <Dialog.Overlay className="dialog-overlay" />
          <Dialog.Content className="dialog-content">
            <CardDialog onSave={createCard} onCancel={onCancel} />
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}

export function StreamCards({ host }) {
  const login = useLogin();
  const canEdit = login?.pubkey === host;
  const cards = useCards(host, canEdit);
  return (
    <div className="stream-cards">
      {cards.map((ev) => (
        <Card canEdit={canEdit} cards={cards} key={ev.id} ev={ev} />
      ))}
      {canEdit && <AddCard cards={cards} />}
    </div>
  );
}
