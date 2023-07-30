import "./stream-cards.css";

import { useState, forwardRef } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { DndProvider, useDrag, useDrop } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";

import type { NostrEvent } from "@snort/system";

import { Toggle } from "element/toggle";
import { useLogin } from "hooks/login";
import { useUserCards } from "hooks/cards";
import { CARD, USER_CARDS } from "const";
import { toTag } from "utils";
import { Login, System } from "index";
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

function isEmpty(s?: string) {
  return !s || s.trim().length === 0;
}

const CardPreview = forwardRef(
  ({ style, title, link, image, content }, ref) => {
    const isImageOnly = !isEmpty(image) && isEmpty(content) && isEmpty(title);
    return (
      <div
        className={`stream-card ${isImageOnly ? "image-card" : ""}`}
        ref={ref}
        style={style}
      >
        {title && <h1 className="card-title">{title}</h1>}
        {image &&
          (link?.length > 0 ? (
            <ExternalLink href={link}>
              <img className="card-image" src={image} alt={title} />
            </ExternalLink>
          ) : (
            <img className="card-image" src={image} alt={title} />
          ))}
        <Markdown children={content} />
      </div>
    );
  },
);

function Card({ canEdit, ev, cards }: CardProps) {
  const login = useLogin();
  const identifier = findTag(ev, "d");
  const title = findTag(ev, "title") || findTag(ev, "subject");
  const image = findTag(ev, "image");
  const link = findTag(ev, "r");
  const content = ev.content;
  const evCard = { title, image, link, content, identifier };
  const tags = cards.map(toTag);
  const [style, dragRef] = useDrag(
    () => ({
      type: "card",
      item: { identifier },
      canDrag: () => {
        return canEdit;
      },
      collect: (monitor) => {
        const isDragging = monitor.isDragging();
        return {
          opacity: isDragging ? 0.1 : 1,
          cursor: !canEdit ? "auto" : isDragging ? "grabbing" : "grab",
        };
      },
    }),
    [canEdit, identifier],
  );

  function findTagByIdentifier(d) {
    return tags.find((t) => t.at(1).endsWith(`:${d}`));
  }

  const [dropStyle, dropRef] = useDrop(
    () => ({
      accept: ["card"],
      canDrop: () => {
        return canEdit;
      },
      collect: (monitor) => {
        const isOvering = monitor.isOver({ shallow: true });
        return {
          opacity: isOvering ? 0.3 : 1,
          animation: isOvering ? "shake 0.1s 3" : "",
        };
      },
      async drop(item) {
        if (identifier === item.identifier) {
          return;
        }
        const newItem = findTagByIdentifier(item.identifier);
        const oldItem = findTagByIdentifier(identifier);
        const newTags = tags.map((t) => {
          if (t === oldItem) {
            return newItem;
          }
          if (t === newItem) {
            return oldItem;
          }
          return t;
        });
        const pub = login?.publisher();
        const userCardsEv = await pub.generic((eb) => {
          eb.kind(USER_CARDS).content("");
          for (const tag of newTags) {
            eb.tag(tag);
          }
          return eb;
        });
        console.debug(userCardsEv);
        System.BroadcastEvent(userCardsEv);
        Login.setCards(newTags, userCardsEv.created_at);
      },
    }),
    [canEdit, tags, identifier],
  );

  const card = (
    <CardPreview
      ref={dropRef}
      title={title}
      link={link}
      image={image}
      content={content}
      style={dropStyle}
    />
  );
  const editor = canEdit && (
    <div className="editor-buttons">
      <EditCard card={evCard} cards={cards} />
    </div>
  );
  return canEdit ? (
    <div className="card-container" ref={dragRef} style={style}>
      {card}
      {editor}
    </div>
  ) : (
    <div className="card-container">{card}</div>
  );
}

interface CardDialogProps {
  header?: string;
  cta?: string;
  cancelCta?: string;
  card?: CardType;
  onSave(ev: CardType): void;
  onCancel(): void;
}

function CardDialog({
  header,
  cta,
  cancelCta,
  card,
  onSave,
  onCancel,
}: CardDialogProps) {
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
        <FileUploader
          defaultImage={image}
          onFileUpload={setImage}
          onClear={() => setImage("")}
        />
      </div>
      <div className="form-control">
        <label for="card-image-link">Image Link</label>
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
          {cancelCta || "Cancel"}
        </button>
      </div>
    </div>
  );
}

interface EditCardProps {
  card: CardType;
  cards: NostrEvent[];
}

function EditCard({ card, cards }: EditCardProps) {
  const login = useLogin();
  const [isOpen, setIsOpen] = useState(false);
  const identifier = card.identifier;
  const tags = cards.map(toTag);

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

  async function onCancel() {
    const pub = login?.publisher();
    if (pub) {
      const newTags = tags.filter((t) => !t.at(1).endsWith(`:${identifier}`));
      const userCardsEv = await pub.generic((eb) => {
        eb.kind(USER_CARDS).content("");
        for (const tag of newTags) {
          eb.tag(tag);
        }
        return eb;
      });

      console.debug(userCardsEv);
      System.BroadcastEvent(userCardsEv);
      Login.setCards(newTags, userCardsEv.created_at);
      setIsOpen(false);
    }
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
            cancelCta="Delete"
            card={card}
            onSave={editCard}
            onCancel={onCancel}
          />
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
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
  const cards = useUserCards(login.pubkey, login.cards.tags, canEdit);
  const [isEditing, setIsEditing] = useState(false);
  const components = (
    <>
      <div className="stream-cards">
        {cards.map((ev) => (
          <Card canEdit={isEditing} cards={cards} key={ev.id} ev={ev} />
        ))}
        {isEditing && <AddCard cards={cards} />}
      </div>
      {canEdit && (
        <div className="edit-container">
          <Toggle
            pressed={isEditing}
            onPressedChange={setIsEditing}
            label="Toggle edit mode"
            text="Edit cards"
          />
        </div>
      )}
    </>
  );
  return <DndProvider backend={HTML5Backend}>{components}</DndProvider>;
}
