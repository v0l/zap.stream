import { useParams } from "react-router-dom";
import { unwrap } from "@snort/shared";
import { FollowTagButton } from "@/element/follow-button";
import { useStreamsFeed } from "@/hooks/live-streams";
import VideoGridSorted from "@/element/video-grid-sorted";

export function TagPage() {
  const { tag } = useParams();
  const streams = useStreamsFeed(tag);
  return (
    <div>
      <div className="flex items-center justify-between">
        <h1>#{tag}</h1>
        <FollowTagButton tag={unwrap(tag)} />
      </div>
      <VideoGridSorted evs={streams} />
    </div>
  );
}
