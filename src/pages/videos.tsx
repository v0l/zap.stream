import { VIDEO_KIND } from "@/const";
import VideoGrid from "@/element/video-grid";
import { findTag, getHost } from "@/utils";
import { NostrLink, RequestBuilder } from "@snort/system";
import { useRequestBuilder } from "@snort/system-react";
import { FormattedMessage } from "react-intl";
import { VideoTile } from "@/element/video/video-tile";
import { useLogin } from "@/hooks/login";

export function VideosPage() {
  const login = useLogin();

  const rb = new RequestBuilder("videos");
  rb.withFilter().kinds([VIDEO_KIND]);

  const videos = useRequestBuilder(rb);

  console.debug(login?.state?.muted);
  const sorted = videos
    .filter(a => {
      const host = getHost(a);
      const link = NostrLink.publicKey(host);
      return (login?.state?.muted.length ?? 0) === 0 || !login?.state?.muted.some(a => a.equals(link));
    })
    .sort((a, b) => {
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
          <VideoTile ev={a} key={a.id} style="grid" />
        ))}
      </VideoGrid>
    </div>
  );
}
