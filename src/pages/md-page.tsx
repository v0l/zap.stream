import { ZAP_STREAM_PUBKEY } from "@/const";
import Markdown from "@/element/markdown";
import { NostrPrefix } from "@snort/shared";
import { EventKind, NostrLink } from "@snort/system";
import { useEventFeed } from "@snort/system-react";
import type { ReactNode } from "react";

export default function MarkdownPage({ dTag, title }: { dTag: string, title: ReactNode }) {
  const faqLink = new NostrLink(NostrPrefix.Address, dTag, EventKind.LongFormTextNote, ZAP_STREAM_PUBKEY);
  const ev = useEventFeed(faqLink);
  return (
    <div className="flex flex-col gap-4 w-[45rem] mx-auto">
      <h1>
        {title}
      </h1>
      {ev && <Markdown content={ev?.content} />}
    </div>
  );
}
