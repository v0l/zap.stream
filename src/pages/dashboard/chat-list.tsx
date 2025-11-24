import { MuteButton } from "@/element/mute-button";
import { Profile } from "@/element/profile";
import { dedupe } from "@snort/shared";
import { useMemo } from "react";
import { FormattedMessage } from "react-intl";
import { DefaultButton } from "@/element/buttons";
import { useStream } from "@/element/stream/stream-state";

export function DashboardChatList() {
  const { feed } = useStream();
  const pubkeys = useMemo(() => {
    return dedupe(feed.map(a => a.pubkey));
  }, [feed]);

  return pubkeys.map(a => (
    <div className="flex justify-between items-center px-4 py-2 border-b border-layer-1">
      <Profile pubkey={a} avatarSize={32} gap={4} />
      <div className="flex gap-2">
        <MuteButton pubkey={a} />
        <DefaultButton onClick={() => {}} className="font-bold">
          <FormattedMessage defaultMessage="Zap" id="fBI91o" />
        </DefaultButton>
      </div>
    </div>
  ));
}
