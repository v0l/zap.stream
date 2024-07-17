import { useParams } from "react-router-dom";
import { useStreamsFeed } from "@/hooks/live-streams";
import VideoGridSorted from "@/element/video-grid-sorted";

export function TagPage() {
  const { tag } = useParams();
  const streams = useStreamsFeed(tag);
  return (
    <div>
      <div className="flex items-center justify-between">
        <h1>#{tag}</h1>
      </div>
      <VideoGridSorted evs={streams} />
    </div>
  );
}
