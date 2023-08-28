import { fetchNip05Pubkey, hexToBech32 } from "@snort/shared";
import { NostrLink, tryParseNostrLink, NostrPrefix } from "@snort/system";
import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";

export function useStreamLink() {
  const params = useParams();
  const [link, setLink] = useState<NostrLink>();

  useEffect(() => {
    if (params.id) {
      const parsedLink = tryParseNostrLink(params.id);
      if (parsedLink) {
        setLink(parsedLink);
      } else {
        const [handle, domain] = (params.id.includes("@") ? params.id : `${params.id}@zap.stream`).split("@");
        fetchNip05Pubkey(handle, domain).then(d => {
          if (d) {
            setLink({
              id: d,
              type: NostrPrefix.PublicKey,
              encode: () => hexToBech32(NostrPrefix.PublicKey, d),
            } as NostrLink);
          }
        });
      }
    }
  }, [params.id]);
  return link;
}
