import { SHORTS_KIND } from "@/const";
import VideoGrid from "@/element/video-grid";
import { VideoTile } from "@/element/video/video-tile";
import { findTag } from "@/utils";
import { RequestBuilder } from "@snort/system";
import { useRequestBuilder } from "@snort/system-react";
import { FormattedMessage } from "react-intl";

export function ShortsPage() {
  const rb = new RequestBuilder("shorts");
  rb.withFilter().kinds([SHORTS_KIND]);

  const videos = useRequestBuilder(rb);

  const sorted = videos.sort((a, b) => {
    const pubA = findTag(a, "published_at");
    const pubB = findTag(b, "published_at");
    return Number(pubA) > Number(pubB) ? -1 : 1;
  });

  return (
    <div className="p-4">
      <h2>
        <FormattedMessage defaultMessage="Latest Shorts" />
      </h2>
      <br />
      <VideoGrid>
        {sorted.map(a => (
          <VideoTile ev={a} key={a.id} style="grid" />
        ))}
      </VideoGrid>
    </div>
  );
}
