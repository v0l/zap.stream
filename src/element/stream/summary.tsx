import { useState } from "react";
import { FormattedMessage } from "react-intl";

export function StreamSummary({ text }: { text: string }) {
  const [expand, setExpand] = useState(false);

  const cutOff = 100;
  const shouldExpand = text.length > cutOff;
  return (
    <div className="whitespace-pre text-pretty">
      {shouldExpand && !expand ? text.slice(0, cutOff) : text}
      {shouldExpand && (
        <span
          className="text-primary text-bold cursor-pointer"
          onClick={() => {
            setExpand(x => !x);
          }}>
          {expand && <FormattedMessage defaultMessage="Hide" />}
          {!expand && <FormattedMessage defaultMessage="...more" />}
        </span>
      )}
    </div>
  );
}
