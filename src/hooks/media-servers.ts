import { EventKind, UnknownTag } from "@snort/system";
import { useLogin } from "./login";
import { removeUndefined, sanitizeRelayUrl } from "@snort/shared";
import { Nip96Server } from "@/service/upload/nip96";
import { useMemo } from "react";

export const DefaultMediaServers = [
  //"https://media.zap.stream",
  new UnknownTag(["server", "https://nostr.build/"]),
  new UnknownTag(["server", "https://nostrcheck.me/"]),
  new UnknownTag(["server", "https://files.v0l.io/"]),
];

export function useMediaServerList() {
  const login = useLogin();

  let servers = login?.state?.getList(EventKind.StorageServerList) ?? [];
  if (servers.length === 0) {
    servers = DefaultMediaServers;
  }

  return useMemo(
    () => ({
      servers: removeUndefined(servers.map(a => a.toEventTag()))
        .filter(a => a[0] === "server")
        .map(a => a[1]),
      addServer: async (s: string) => {
        const pub = login?.publisher();
        if (!pub) return;

        const u = sanitizeRelayUrl(s);
        if (!u) return;
        const server = new Nip96Server(u, pub);
        await server.loadInfo();
        await login?.state?.addToList(EventKind.StorageServerList, new UnknownTag(["server", u]), true);
      },
      removeServer: async (s: string) => {
        const u = sanitizeRelayUrl(s);
        if (!u) return;
        await login?.state?.removeFromList(EventKind.StorageServerList, new UnknownTag(["server", u]), true);
      },
    }),
    [servers],
  );
}
