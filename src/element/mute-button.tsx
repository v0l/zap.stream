import { FormattedMessage } from "react-intl";

import { useLogin } from "@/hooks/login";
import { DefaultButton } from "./buttons";
import { NostrLink } from "@snort/system";

export function useMute(pubkey: string) {
  const login = useLogin();
  const link = NostrLink.publicKey(pubkey);

  async function unmute() {
    await login?.state?.unmute(link, true);
  }

  async function mute() {
    try {
      await login?.state?.mute(link, true);
    } catch (e) {
      console.error(e);
    }
  }

  return {
    isMuted: login?.state?.muted.some(a => a.equals(link)) ?? false,
    mute,
    unmute,
  };
}

export function LoggedInMuteButton({ pubkey }: { pubkey: string }) {
  const { isMuted, mute, unmute } = useMute(pubkey);

  return (
    <DefaultButton onClick={() => (isMuted ? unmute() : mute())}>
      {isMuted ? (
        <FormattedMessage defaultMessage="Unmute" id="W9355R" />
      ) : (
        <FormattedMessage defaultMessage="Mute" id="x82IOl" />
      )}
    </DefaultButton>
  );
}

export function MuteButton({ pubkey }: { pubkey: string }) {
  const login = useLogin();
  return login?.pubkey ? <LoggedInMuteButton pubkey={pubkey} /> : null;
}
