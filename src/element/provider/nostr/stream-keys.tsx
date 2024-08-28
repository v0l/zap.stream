import { StreamState } from "@/const";
import { Layer2Button } from "@/element/buttons";
import Copy from "@/element/copy";
import { StatePill } from "@/element/state-pill";
import { NostrStreamProvider } from "@/providers";
import { StreamKeysResult } from "@/providers/zsz";
import { eventLink, extractStreamInfo } from "@/utils";
import { useEffect, useState } from "react";
import { FormattedMessage } from "react-intl";
import { Link } from "react-router-dom";

export default function StreamKeyList({ provider }: { provider: NostrStreamProvider }) {
  const [keys, setKeys] = useState<StreamKeysResult>();

  async function loadKeys() {
    const k = await provider.streamKeys();
    setKeys(k);
  }

  useEffect(() => {
    loadKeys();
  }, []);

  return (
    <div className="flex flex-col gap-2">
      <h3>
        <FormattedMessage defaultMessage="Stream Keys" />
      </h3>
      <table>
        <thead>
          <tr>
            <th>
              <FormattedMessage defaultMessage="Created" />
            </th>
            <th>
              <FormattedMessage defaultMessage="Expires" />
            </th>
            <th>
              <FormattedMessage defaultMessage="Key" />
            </th>
            <th>
              <FormattedMessage defaultMessage="Stream" />
            </th>
          </tr>
        </thead>
        <tbody>
          {keys?.items.map(a => (
            <tr>
              <td>{new Date(a.created * 1000).toLocaleString()}</td>
              <td>{a.expires && new Date(a.expires * 1000).toLocaleString()}</td>
              <td>
                <Copy text={a.key} hideText={true} />
              </td>
              <td>
                {a.stream && (
                  <Link to={`/${eventLink(a.stream)}`}>
                    <StatePill state={extractStreamInfo(a.stream).status as StreamState} />
                  </Link>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {keys?.items.length === 0 && <FormattedMessage defaultMessage="No keys" />}
      <Layer2Button
        onClick={async () => {
          await provider.createStreamKey();
          loadKeys();
        }}>
        <FormattedMessage defaultMessage="Add" />
      </Layer2Button>
    </div>
  );
}
