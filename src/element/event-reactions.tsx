import { formatSats } from "@/number";
import { EventKind, NostrLink, ParsedZap, TaggedNostrEvent } from "@snort/system";
import { useReactions, useEventReactions, SnortContext } from "@snort/system-react";
import { Icon } from "./icon";
import { useLogin } from "@/hooks/login";
import AsyncButton from "./async-button";
import { useContext } from "react";
import { ZapEvent } from "./send-zap";

export default function EventReactions({ ev, replyKind }: { ev: TaggedNostrEvent; replyKind?: EventKind }) {
  const link = NostrLink.fromEvent(ev)!;
  const login = useLogin();
  const system = useContext(SnortContext);
  const reactions = useReactions(`reactions:${link.id}`, [link]);
  const grouped = useEventReactions(link, reactions);

  const didReact = (evs: TaggedNostrEvent[] | ParsedZap[], kind: EventKind) => {
    if (evs.length === 0) return false;
    if ("amount" in evs[0]) {
      return (evs as ParsedZap[]).some(a => a.sender === login?.pubkey);
    } else {
      return (evs as TaggedNostrEvent[]).some(a => a.pubkey === login?.pubkey && a.kind === kind);
    }
  };

  const reactedIcon = (
    name: string,
    nameReacted: string,
    classReacted: string,
    evs: Array<TaggedNostrEvent> | Array<ParsedZap>,
    kind: EventKind,
  ) => {
    const r = didReact(evs, kind);
    return <Icon name={r ? nameReacted : name} className={r ? classReacted : undefined} />;
  };

  const pub = login?.publisher();
  const totalZaps = grouped.zaps.reduce((acc, v) => acc + v.amount, 0);
  const iconClass = "flex gap-2 items-center tabular-nums cursor-pointer select-none hover:text-primary transition";
  return (
    <div className="flex flex-wrap gap-4 mt-2 items-center text-neutral-500">
      {replyKind && (
        <AsyncButton
          className={iconClass}
          onClick={async () => {
            if (pub) {
              const evReact = await pub.react(ev);
              await system.BroadcastEvent(evReact);
            }
          }}>
          <Icon name="message-circle" />
          {grouped.replies.length > 0 ? grouped.replies.length : undefined}
        </AsyncButton>
      )}
      <ZapEvent ev={ev}>
        <div className={iconClass}>
          {reactedIcon("zap", "zap-filled", "text-zap", grouped.zaps, EventKind.ZapReceipt)}
          {totalZaps > 0 ? formatSats(totalZaps) : undefined}
        </div>
      </ZapEvent>
      <AsyncButton
        className={iconClass}
        onClick={async () => {
          if (pub) {
            const evReact = await pub.react(ev);
            await system.BroadcastEvent(evReact);
          }
        }}>
        {reactedIcon("heart", "heart-solid", "text-red-500", grouped.reactions.positive, EventKind.Reaction)}
        {grouped.reactions.positive.length > 0 ? grouped.reactions.positive.length : undefined}
      </AsyncButton>
      <AsyncButton
        className={iconClass}
        onClick={async () => {
          if (pub) {
            const evReact = await pub.repost(ev);
            await system.BroadcastEvent(evReact);
          }
        }}>
        <Icon name="repost" />
        {grouped.reposts.length > 0 ? grouped.reposts.length : undefined}
      </AsyncButton>
    </div>
  );
}
