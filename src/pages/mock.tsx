import { LIVE_STREAM } from "@/const";
import { LiveChat } from "@/element/live-chat";
import { SendZapsDialog } from "@/element/send-zap";
import { EventBuilder, NostrLink } from "@snort/system";

export default function MockPage() {
  const pubkey = "cf45a6ba1363ad7ed213a078e710d24115ae721c9b47bd1ebf4458eaefb4c2a5";
  const fakeStream = new EventBuilder()
    .kind(LIVE_STREAM)
    .pubKey(pubkey)
    .tag(["d", "mock"])
    .tag(["title", "Example Stream"])
    .tag(["summary", "An example mock stream for debugging"])
    .tag(["streaming", "https://example.com/live.m3u8"])
    .tag(["t", "nostr"])
    .tag(["t", "mock"])
    .processContent()
    .build();
  const fakeStreamLink = NostrLink.fromEvent(fakeStream);

  return (
    <div className="">
      <LiveChat link={fakeStreamLink} ev={fakeStream} height={600} />
      <SendZapsDialog lnurl="donate@snort.social" aTag={fakeStreamLink.toEventTag()![1]} pubkey={pubkey} />
    </div>
  );
}
