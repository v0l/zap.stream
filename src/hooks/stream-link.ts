import { NIP5_DOMAIN } from "@/const";
import { fetchNip05Pubkey } from "@snort/shared";
import { NostrEvent, NostrLink, NostrPrefix, tryParseNostrLink } from "@snort/system";
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

export function useStreamLink(evPreload?: NostrEvent) {
  const params = useParams();
  const [link, setLink] = useState<NostrLink | undefined>(evPreload ? NostrLink.fromEvent(evPreload) : undefined);

  useEffect(() => {
    if (params.id) {
      const parsedLink = tryParseNostrLink(params.id);
      if (parsedLink) {
        setLink(parsedLink);
      } else {
        const [handle, domain] = (params.id.includes("@") ? params.id : `${params.id}@${NIP5_DOMAIN}`).split("@");
        fetchNip05Pubkey(handle, domain).then(d => {
          if (d) {
            setLink(new NostrLink(NostrPrefix.PublicKey, d));
          }
        });
      }
    }
  }, [params.id]);
  return link;
}
