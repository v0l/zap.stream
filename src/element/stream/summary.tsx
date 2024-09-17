import { useState } from "react";
import { FormattedMessage } from "react-intl";
import { Text } from "../text";

export function StreamSummary({ text }: { text: string }) {
  const [expand, setExpand] = useState(false);

  const cutOff = Math.min(100, [...text].reduce((acc, v, i) => {
    if (v === '\n' && acc[0] < 3) {
      acc[0] += 1;
      acc[1] = i;
    }
    return acc;
  }, [0, 0])[1]);
  const shouldExpand = text.length > cutOff;
  return (
    <div className="whitespace-pre text-pretty">
      {shouldExpand && !expand ? text.slice(0, cutOff) : <Text content={text} tags={[]} />}
      {shouldExpand && <>
        <span
          className="text-primary text-bold cursor-pointer"
          onClick={() => {
            setExpand(x => !x);
          }}>
          &nbsp;
          {!expand && <FormattedMessage defaultMessage="...more" />}
        </span>
        {expand && <div className="text-primary text-bold cursor-pointer"
          onClick={() => {
            setExpand(x => !x);
          }}>
          <FormattedMessage defaultMessage="Hide" />
        </div>}
      </>
      }
    </div>
  );
}
