import { useState } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import { ExternalLink } from "../external-link";
import { FileUploader } from "../file-uploader";
import { DefaultButton, WarningButton } from "../buttons";
import { CardType, NewCard } from ".";


interface CardDialogProps {
  header?: string;
  cta?: string;
  cancelCta?: string;
  card?: CardType;
  onSave(ev: NewCard): void;
  onCancel(): void;
}

export function CardDialog({ header, cta, cancelCta, card, onSave, onCancel }: CardDialogProps) {
  const [title, setTitle] = useState(card?.title ?? "");
  const [image, setImage] = useState(card?.image ?? "");
  const [content, setContent] = useState(card?.content ?? "");
  const [link, setLink] = useState(card?.link ?? "");
  const { formatMessage } = useIntl();

  return (
    <div className="flex flex-col gap-2">
      <h3>{header || <FormattedMessage defaultMessage="Add card" id="nwA8Os" />}</h3>
      {/* TITLE */}
      <label htmlFor="card-title">
        <FormattedMessage defaultMessage="Title" id="9a9+ww" />
      </label>
      <input
        id="card-title"
        type="text"
        value={title}
        onChange={e => setTitle(e.target.value)}
        placeholder={formatMessage({ defaultMessage: "e.g. about me", id: "k21gTS" })} />
      {/* IMAGE */}
      <label htmlFor="card-image">
        <FormattedMessage defaultMessage="Image" id="+0zv6g" />
      </label>
      <FileUploader defaultImage={image} onFileUpload={setImage} onClear={() => setImage("")} />
      {image.length > 0 && <>
        {/* IMAGE LINK */}
        <label htmlFor="card-image-link">
          <FormattedMessage defaultMessage="Image Link" id="s5ksS7" />
        </label>
        <input
          id="card-image-link"
          type="text"
          placeholder="https://"
          value={link}
          onChange={e => setLink(e.target.value)} />
      </>}
      {/* CONTENT */}
      <label htmlFor="card-content">
        <FormattedMessage defaultMessage="Content" id="Jq3FDz" />
      </label>
      <textarea
        placeholder={formatMessage({ defaultMessage: "Start typing", id: "w0Xm2F" })}
        value={content}
        rows={5}
        onChange={e => setContent(e.target.value)} />
      <span className="help-text">
        <FormattedMessage
          defaultMessage="Supports {markdown}"
          id="I1kjHI"
          values={{
            markdown: (
              <ExternalLink href="https://www.markdownguide.org/cheat-sheet">
                <FormattedMessage defaultMessage="Markdown" id="jr4+vD" />
              </ExternalLink>
            ),
          }} />
      </span>
      <div className="flex justify-between">
        <WarningButton onClick={onCancel}>
          {cancelCta || <FormattedMessage defaultMessage="Cancel" id="47FYwb" />}
        </WarningButton>

        <DefaultButton onClick={() => onSave({ title, image, content, link })}>
          {cta || <FormattedMessage defaultMessage="Add Card" id="UJBFYK" />}
        </DefaultButton>
      </div>
    </div>
  );
}
