import "./tag.css";
import { useParams } from "react-router-dom";
import { unwrap } from "@snort/shared";

import { VideoTile } from "element/video-tile";
import { FollowTagButton } from "element/follow-button";
import { useStreamsFeed } from "hooks/live-streams";

export function TagPage() {
  const { tag } = useParams();
  const { live } = useStreamsFeed(tag);
  return (
    <div className="tag-page">
      <div className="tag-page-header">
        <h1>#{tag}</h1>
        <FollowTagButton tag={unwrap(tag)} />
      </div>
      <div className="video-grid">
        {live.map(e => (
          <VideoTile ev={e} key={e.id} />
        ))}
      </div>
    </div>
  );
}
