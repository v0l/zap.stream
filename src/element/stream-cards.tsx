import "./stream-cards.css";

import { useState, forwardRef } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import * as Dialog from "@radix-ui/react-dialog";
import { DndProvider, useDrag, useDrop } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";

import { TaggedNostrEvent } from "@snort/system";

import { Toggle } from "element/toggle";
import { Icon } from "element/icon";
import { ExternalLink } from "element/external-link";
import { FileUploader } from "element/file-uploader";
import { Markdown } from "element/markdown";
import { useLogin } from "hooks/login";
import { useCards, useUserCards } from "hooks/cards";
import { CARD, USER_CARDS } from "const";
import { toTag, findTag } from "utils";
import { Login, System } from "index";
import type { Tags } from "types";

interface CardType {
  identifier: string;
  content: string;
  title?: string;
  image?: string;
  link?: string;
}

type NewCard = Omit<CardType, "identifier">;

function isEmpty(s?: string) {
  return !s || s.trim().length === 0;
}

interface CardPreviewProps extends NewCard {
  style: object;
}

const CardPreview = forwardRef(({ style, title, link, image, content }: CardPreviewProps, ref) => {
  const isImageOnly = !isEmpty(image) && isEmpty(content) && isEmpty(title);
  return (
    <div
      className={`stream-card ${isImageOnly ? "image-card" : ""}`}
      // @ts-expect-error: Type 'ForwardRef<unknown>'
      ref={ref}
      style={style}>
      {title && <h1 className="card-title">{title}</h1>}
      {image &&
        (link && link?.length > 0 ? (
          <ExternalLink href={link}>
            <img className="card-image" src={image} alt={title} />
          </ExternalLink>
        ) : (
          <img className="card-image" src={image} alt={title} />
        ))}
      <Markdown content={content} />
    </div>
  );
});

interface CardProps {
  canEdit?: boolean;
  ev: TaggedNostrEvent;
  cards: TaggedNostrEvent[];
}

interface CardItem {
  identifier: string;
}

function Card({ canEdit, ev, cards }: CardProps) {
  const login = useLogin();
  const identifier = findTag(ev, "d") ?? "";
  const title = findTag(ev, "title") || findTag(ev, "subject");
  const image = findTag(ev, "image");
  const link = findTag(ev, "r");
  const content = ev.content;
  const evCard = { title, image, link, content, identifier };
  const tags = cards.map(toTag);
  const [style, dragRef] = useDrag(
    () => ({
      type: "card",
      item: { identifier } as CardItem,
      canDrag: () => {
        return Boolean(canEdit);
      },
      collect: monitor => {
        const isDragging = monitor.isDragging();
        return {
          opacity: isDragging ? 0.1 : 1,
          cursor: !canEdit ? "auto" : isDragging ? "grabbing" : "grab",
        };
      },
    }),
    [canEdit, identifier]
  );

  function findTagByIdentifier(d: string) {
    return tags.find(t => t[1].endsWith(`:${d}`));
  }

  const [dropStyle, dropRef] = useDrop(
    () => ({
      accept: ["card"],
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
      async drop(item) {
        const typed = item as CardItem;
        if (identifier === typed.identifier) {
          return;
        }
        const newItem = findTagByIdentifier(typed.identifier);
        const oldItem = findTagByIdentifier(identifier);
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
          System.BroadcastEvent(userCardsEv);
          Login.setCards(newTags, userCardsEv.created_at);
        }
      },
    }),
    [canEdit, tags, identifier]
  );

  const card = (
    <CardPreview ref={dropRef} title={title} link={link} image={image} content={content} style={dropStyle} />
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
  onSave(ev: NewCard): void;
  onCancel(): void;
}

function CardDialog({ header, cta, cancelCta, card, onSave, onCancel }: CardDialogProps) {
  const [title, setTitle] = useState(card?.title ?? "");
  const [image, setImage] = useState(card?.image ?? "");
  const [content, setContent] = useState(card?.content ?? "");
  const [link, setLink] = useState(card?.link ?? "");
  const { formatMessage } = useIntl();

  return (
    <div className="new-card">
      <h3>{header || <FormattedMessage defaultMessage="Add card" />}</h3>
      <div className="form-control">
        <label htmlFor="card-title">
          <FormattedMessage defaultMessage="Title" />
        </label>
        <input
          id="card-title"
          type="text"
          value={title}
          onChange={e => setTitle(e.target.value)}
          placeholder={formatMessage({ defaultMessage: "e.g. about me" })}
        />
      </div>
      <div className="form-control">
        <label htmlFor="card-image">
          <FormattedMessage defaultMessage="Image" />
        </label>
        <FileUploader defaultImage={image} onFileUpload={setImage} onClear={() => setImage("")} />
      </div>
      <div className="form-control">
        <label htmlFor="card-image-link">
          <FormattedMessage defaultMessage="Image Link" />
        </label>
        <input
          id="card-image-link"
          type="text"
          placeholder="https://"
          value={link}
          onChange={e => setLink(e.target.value)}
        />
      </div>
      <div className="form-control">
        <label htmlFor="card-content">
          <FormattedMessage defaultMessage="Content" />
        </label>
        <textarea
          placeholder={formatMessage({ defaultMessage: "Start typing" })}
          value={content}
          onChange={e => setContent(e.target.value)}
        />
        <span className="help-text">
          <FormattedMessage
            defaultMessage="Supports {markdown}"
            values={{
              markdown: (
                <ExternalLink href="https://www.markdownguide.org/cheat-sheet">
                  <FormattedMessage defaultMessage="Markdown" />
                </ExternalLink>
              ),
            }}
          />
        </span>
      </div>
      <div className="new-card-buttons">
        <button className="btn btn-primary add-button" onClick={() => onSave({ title, image, content, link })}>
          {cta || <FormattedMessage defaultMessage="Add Card" />}
        </button>
        <button className="btn delete-button" onClick={onCancel}>
          {cancelCta || <FormattedMessage defaultMessage="Cancel" />}
        </button>
      </div>
    </div>
  );
}

interface EditCardProps {
  card: CardType;
  cards: TaggedNostrEvent[];
}

function EditCard({ card, cards }: EditCardProps) {
  const login = useLogin();
  const [isOpen, setIsOpen] = useState(false);
  const identifier = card.identifier;
  const tags = cards.map(toTag);
  const { formatMessage } = useIntl();

  async function editCard({ title, image, link, content }: CardType) {
    const pub = login?.publisher();
    if (pub) {
      const ev = await pub.generic(eb => {
        eb.kind(CARD).content(content).tag(["d", card.identifier]);
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
      console.debug(ev);
      System.BroadcastEvent(ev);
      setIsOpen(false);
    }
  }

  async function onCancel() {
    const pub = login?.publisher();
    if (pub) {
      const newTags = tags.filter(t => !t[1].endsWith(`:${identifier}`));
      const userCardsEv = await pub.generic(eb => {
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
        <button className="btn btn-primary">
          <FormattedMessage defaultMessage="Edit" />
        </button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="dialog-overlay" />
        <Dialog.Content className="dialog-content">
          <CardDialog
            header={formatMessage({ defaultMessage: "Edit card" })}
            cta={formatMessage({ defaultMessage: "Save card" })}
            cancelCta={formatMessage({ defaultMessage: "Delete" })}
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
  cards: TaggedNostrEvent[];
}

function AddCard({ cards }: AddCardProps) {
  const login = useLogin();
  const tags = cards.map(toTag);
  const [isOpen, setIsOpen] = useState(false);

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

interface StreamCardEditorProps {
  pubkey: string;
  tags: Tags;
}

export function StreamCardEditor({ pubkey, tags }: StreamCardEditorProps) {
  const cards = useUserCards(pubkey, tags, true);
  const [isEditing, setIsEditing] = useState(false);
  return (
    <>
      <div className="stream-cards">
        {cards.map(ev => (
          <Card canEdit={isEditing} cards={cards} key={ev.id} ev={ev} />
        ))}
        {isEditing && <AddCard cards={cards} />}
      </div>
      <div className="edit-container">
        <Toggle pressed={isEditing} onPressedChange={setIsEditing} label="Toggle edit mode" text="Edit cards" />
      </div>
    </>
  );
}

interface StreamCardsProps {
  host: string;
}

export function ReadOnlyStreamCards({ host }: StreamCardsProps) {
  const cards = useCards(host);
  return (
    <div className="stream-cards">
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
