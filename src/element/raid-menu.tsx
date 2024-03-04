import { useStreamsFeed } from "@/hooks/live-streams";
import { getHost, getTagValues } from "@/utils";
import { dedupe, unwrap } from "@snort/shared";
import { FormattedMessage } from "react-intl";
import { Profile } from "./profile";
import { useLogin } from "@/hooks/login";
import { useContext, useState } from "react";
import { NostrLink, parseNostrLink } from "@snort/system";
import { SnortContext } from "@snort/system-react";
import { LIVE_STREAM_RAID } from "@/const";
import { DefaultButton } from "./buttons";

export function DashboardRaidMenu({ link, onClose }: { link: NostrLink; onClose: () => void }) {
  const system = useContext(SnortContext);
  const login = useLogin();
  const { live } = useStreamsFeed();
  const [raiding, setRaiding] = useState("");
  const [msg, setMsg] = useState("");

  const mutedHosts = new Set(getTagValues(login?.muted.tags ?? [], "p"));
  const livePubkeys = dedupe(live.map(a => getHost(a))).filter(a => !mutedHosts.has(a));

  async function raid() {
    if (login) {
      const ev = await login.publisher().generic(eb => {
        return eb
          .kind(LIVE_STREAM_RAID)
          .tag(unwrap(link.toEventTag("root")))
          .tag(unwrap(parseNostrLink(raiding).toEventTag("mention")))
          .content(msg);
      });

      await system.BroadcastEvent(ev);
      onClose();
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <h2>
        <FormattedMessage defaultMessage="Start Raid" id="MTHO1W" />
      </h2>
      <div className="flex flex-col gap-1">
        <p className="text-layer-4 uppercase font-semibold text-sm">
          <FormattedMessage defaultMessage="Live now" id="+sdKx8" />
        </p>
        <div className="flex gap-2 flex-wrap">
          {livePubkeys.map(a => (
            <div
              className="border border-layer-1 rounded-full px-4 py-2 bg-layer-2 pointer"
              onClick={() => {
                const liveEvent = live.find(b => getHost(b) === a);
                if (liveEvent) {
                  setRaiding(NostrLink.fromEvent(liveEvent).encode());
                }
              }}>
              <Profile pubkey={a} options={{ showAvatar: false }} linkToProfile={false} />
            </div>
          ))}
        </div>
      </div>
      <div className="flex flex-col gap-1">
        <p className="text-layer-4 uppercase font-semibold text-sm">
          <FormattedMessage defaultMessage="Raid target" id="Zse7yG" />
        </p>
        <div className="paper">
          <input type="text" placeholder="naddr.." value={raiding} onChange={e => setRaiding(e.target.value)} />
        </div>
      </div>
      <div className="flex flex-col gap-1">
        <p className="text-layer-4 uppercase font-semibold text-sm">
          <FormattedMessage defaultMessage="Raid Message" id="RS6smY" />
        </p>
        <div className="paper">
          <input type="text" value={msg} onChange={e => setMsg(e.target.value)} />
        </div>
      </div>
      <DefaultButton onClick={raid}>
        <FormattedMessage defaultMessage="Raid!" id="aqjZxs" />
      </DefaultButton>
    </div>
  );
}
