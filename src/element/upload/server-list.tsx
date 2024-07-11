import { DefaultMediaServers, useMediaServerList } from "@/hooks/media-servers";
import { IconButton, PrimaryButton } from "../buttons";
import { FormattedMessage } from "react-intl";
import { useState } from "react";
import { sanitizeRelayUrl } from "@snort/shared";

export function ServerList() {
  const [newServer, setNewServer] = useState("");
  const servers = useMediaServerList();

  async function tryAddServer(s: string) {
    await servers.addServer(s);
  }

  async function tryRemoveServer(s: string) {
    await servers.removeServer(s);
  }

  return (
    <div className="flex flex-col gap-2">
      <h3>
        <FormattedMessage defaultMessage="Media Server List" />
      </h3>
      {servers.servers.map(a => (
        <div className="flex items-center justify-between py-2 px-3 bg-layer-2 rounded-xl" key={a}>
          {a}
          <IconButton iconName="x" className="text-warning" iconSize={16} onClick={() => tryRemoveServer(a)} />
        </div>
      ))}
      <h4>
        <FormattedMessage defaultMessage="Add server" />
      </h4>
      <div className="flex gap-2">
        <input
          type="text"
          placeholder="https://my-media-server.com"
          value={newServer}
          onChange={e => setNewServer(e.target.value)}
        />
        <PrimaryButton disabled={sanitizeRelayUrl(newServer) === undefined} onClick={() => tryAddServer(newServer)}>
          <FormattedMessage defaultMessage="Add" />
        </PrimaryButton>
      </div>
      <h4>
        <FormattedMessage defaultMessage="Suggested Servers" />
      </h4>
      {DefaultMediaServers.map(a => a.value[1])
        .filter(a => !servers.servers.includes(a))
        .map(a => (
          <div className="flex items-center justify-between py-2 px-3 bg-layer-2 rounded-xl" key={a}>
            {a}
            <PrimaryButton disabled={sanitizeRelayUrl(a) === undefined} onClick={() => tryAddServer(a)}>
              <FormattedMessage defaultMessage="Add" />
            </PrimaryButton>
          </div>
        ))}
    </div>
  );
}
