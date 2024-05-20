import { NostrLink, RequestBuilder } from "@snort/system";
import { useRequestBuilder } from "@snort/system-react";
import { useMemo } from "react";
import VideoComment from "./comment";

export default function VideoComments({ link }: { link: NostrLink }) {
  const sub = useMemo(() => {
    const rb = new RequestBuilder(`video-comments:${link.id}`);
    rb.withFilter().kinds([1]).replyToLink([link]);

    return rb;
  }, [link.id]);

  const comments = useRequestBuilder(sub);

  return (
    <div className="flex flex-col gap-4">
      {comments.map(a => (
        <VideoComment key={a.id} ev={a} />
      ))}
    </div>
  );
}
