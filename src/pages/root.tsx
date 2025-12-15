import { useStreamsFeed } from "@/hooks/live-streams";
import CategoryLink from "@/element/category/category-link";
import VideoGridSorted from "@/element/video-grid-sorted";
import { AllCategories } from "./category";
import { Icon } from "@/element/icon";
import { Link } from "react-router-dom";

export function RootPage() {
  const streams = useStreamsFeed();
  return (
    <div className="flex flex-col gap-6 p-4 min-w-0 grow">
      <Link to="/app" className="flex gap-2 items-center px-4 py-2 rounded-xl bg-layer-2">
        <Icon name="link" />
        Get the new zap.stream app!
      </Link>
      <div className="min-w-0 overflow-x-scroll scrollbar-hidden">
        <div className="flex gap-4 ">
          {AllCategories.filter(a => a.priority === 0).map(a => (
            <CategoryLink key={a.id} name={a.name} id={a.id} icon={a.icon} />
          ))}
        </div>
      </div>
      <VideoGridSorted evs={streams} showEnded={false} showPopular={true} showRecentClips={false} />
    </div>
  );
}
