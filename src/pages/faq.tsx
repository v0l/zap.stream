import { ZAP_STREAM_PUBKEY } from "@/const";
import Markdown from "@/element/markdown";
import { NostrPrefix } from "@snort/shared";
import { EventKind, NostrLink } from "@snort/system";
import { useEventFeed } from "@snort/system-react";
import { FormattedMessage } from "react-intl";

export default function FaqPage() {
  const faqLink = new NostrLink(NostrPrefix.Address, "faq-en", EventKind.LongFormTextNote, ZAP_STREAM_PUBKEY);
  const ev = useEventFeed(faqLink);
  return (
    <div className="flex flex-col gap-4 w-[45rem] mx-auto">
      <h1>
        <FormattedMessage defaultMessage="FAQ" description="Title: FAQ page" />
      </h1>
      {ev && <Markdown content={ev?.content} />}
    </div>
  );
}
