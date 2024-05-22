import { VIDEO_KIND } from "@/const";
import VideoGrid from "@/element/video-grid";
import { VideoTile } from "@/element/video-tile";
import { findTag } from "@/utils";
import { RequestBuilder } from "@snort/system";
import { useRequestBuilder } from "@snort/system-react";
import { FormattedMessage } from "react-intl";

export function VideosPage() {
  const rb = new RequestBuilder("videos");
  rb.withFilter().kinds([VIDEO_KIND]);

  const videos = useRequestBuilder(rb);

  const sorted = videos.sort((a, b) => {
    const pubA = findTag(a, "published_at");
    const pubB = findTag(b, "published_at");
    return Number(pubA) > Number(pubB) ? -1 : 1;
  });

  return (
    <div className="p-4">
      <h2>
        <FormattedMessage defaultMessage="Latest Videos" />
      </h2>
      <br />
      <VideoGrid>
        {sorted.map(a => (
          <VideoTile ev={a} key={a.id} showStatus={false} style="grid" />
        ))}
      </VideoGrid>
    </div>
  );
}
