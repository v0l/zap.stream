import { EventKind, UnknownTag } from "@snort/system";
import { useLogin } from "./login";
import { removeUndefined, sanitizeRelayUrl } from "@snort/shared";
import { useMemo } from "react";

const ServerTag = "server";

export const DefaultMediaServers = [new UnknownTag([ServerTag, "https://nostr.download/"])];

export function useMediaServerList() {
  const login = useLogin();

  let servers = login?.state?.getList(EventKind.BlossomServerList) ?? [];
  if (servers.length === 0) {
    servers = DefaultMediaServers;
  }

  return useMemo(
    () => ({
      servers: removeUndefined(servers.map(a => a.toEventTag()))
        .filter(a => a[0] === ServerTag)
        .map(a => a[1]),
      addServer: async (s: string) => {
        const pub = login?.publisher();
        if (!pub) return;

        const u = sanitizeRelayUrl(s);
        if (!u) return;
        login?.state?.addToList(EventKind.BlossomServerList, new UnknownTag([ServerTag, u]), true);
      },
      removeServer: async (s: string) => {
        const u = sanitizeRelayUrl(s);
        if (!u) return;
        login?.state?.removeFromList(EventKind.BlossomServerList, new UnknownTag([ServerTag, u]), true);
      },
    }),
    [servers],
  );
}
