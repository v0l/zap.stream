import { useLogin } from "@/hooks/login";
import { NostrStreamProvider } from "@/providers";
import { FormattedMessage } from "react-intl";
import AsyncButton from "./async-button";
import { LIVE_STREAM_CLIP } from "@/const";
import { NostrLink, TaggedNostrEvent } from "@snort/system";
import { extractStreamInfo } from "@/utils";
import { unwrap } from "@snort/shared";
import { useContext } from "react";
import { SnortContext } from "@snort/system-react";
import { Icon } from "./icon";
import { StreamState } from "..";

export function ClipButton({ ev }: { ev: TaggedNostrEvent }) {
  const system = useContext(SnortContext);
  const { id, service, status } = extractStreamInfo(ev);
  const login = useLogin();

  if (!service || status !== StreamState.Live) return;

  async function makeClip() {
    if (!service || !id) return;
    const publisher = login?.publisher();
    if (!publisher) return;

    const provider = new NostrStreamProvider("", service, publisher);
    const clip = await provider.createClip(id);
    console.debug(clip);

    const ee = await publisher.generic(eb => {
      return eb
        .kind(LIVE_STREAM_CLIP)
        .tag(unwrap(NostrLink.fromEvent(ev).toEventTag("root")))
        .tag(["r", clip.url])
        .tag(["alt", `Live stream clip created on https://zap.stream\n${clip.url}`]);
    });
    console.debug(ee);
    await system.BroadcastEvent(ee);
  }

  return (
    <AsyncButton onClick={makeClip} className="btn btn-primary">
      <Icon name="clapperboard" />
      <FormattedMessage defaultMessage="Create Clip" id="PA0ej4" />
    </AsyncButton>
  );
}
