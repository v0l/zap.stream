import VideoGrid from "@/element/video-grid";
import { VideoTile } from "@/element/video-tile";
import { EventKind, RequestBuilder } from "@snort/system";
import { useRequestBuilder } from "@snort/system-react";
import { useMemo } from "react";
import { FormattedMessage } from "react-intl";
import { useParams } from "react-router-dom";

export const SearchRelays = [
  "wss://relay.nostr.band",
  "wss://search.nos.today",
  "wss://relay.noswhere.com",
  "wss://saltivka.org",
];

export default function SearchPage() {
  const { term } = useParams();
  const sub = useMemo(() => {
    if (!term) return;
    const rb = new RequestBuilder(`search:${term}`);
    rb.withOptions({
      skipDiff: true,
    });
    rb.withFilter().relay(SearchRelays).kinds([EventKind.LiveEvent]).search(term).limit(50);
    return rb;
  }, [term]);

  const results = useRequestBuilder(sub);
  return (
    <div>
      <h2 className="mb-4">
        <FormattedMessage
          defaultMessage="Search results: {term}"
          id="A1zT+z"
          values={{
            term,
          }}
        />
      </h2>
      <VideoGrid>
        {results.map(a => (
          <VideoTile ev={a} key={a.id} />
        ))}
      </VideoGrid>
    </div>
  );
}
