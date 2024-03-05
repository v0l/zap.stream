import { formatSats } from "@/number";
import { NostrLink, TaggedNostrEvent } from "@snort/system";
import { useReactions, useEventReactions, SnortContext } from "@snort/system-react";
import { Icon } from "./icon";
import { useLogin } from "@/hooks/login";
import AsyncButton from "./async-button";
import { useContext } from "react";
import { ZapEvent } from "./send-zap";

export default function EventReactions({ ev }: { ev: TaggedNostrEvent }) {
  const link = NostrLink.fromEvent(ev)!;
  const login = useLogin();
  const system = useContext(SnortContext);
  const reactions = useReactions(`reactions:${link.id}`, [link]);
  const grouped = useEventReactions(link, reactions);

  const pub = login?.publisher();
  const totalZaps = grouped.zaps.reduce((acc, v) => acc + v.amount, 0);
  const iconClass = "flex gap-2 items-center tabular-nums cursor-pointer select-none hover:text-primary transition";
  return (
    <div className="flex gap-4 items-center">
      <ZapEvent ev={ev}>
        <div className={iconClass}>
          <Icon name="zap-filled" />
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
        <Icon name="heart-solid" />
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
