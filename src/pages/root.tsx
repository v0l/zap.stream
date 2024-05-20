import { useStreamsFeed } from "@/hooks/live-streams";
import CategoryLink from "@/element/category/category-link";
import VideoGridSorted from "@/element/video-grid-sorted";
import { AllCategories } from "./category";

export function RootPage() {
  const streams = useStreamsFeed();

  return (
    <div className="flex flex-col gap-6 p-4">
      <div className="min-w-0 w-[calc(100dvw-2rem)]">
        <div className="flex gap-4 overflow-x-scroll scrollbar-hidden">
          {AllCategories.filter(a => a.priority === 0).map(a => (
            <CategoryLink key={a.id} name={a.name} id={a.id} icon={a.icon} />
          ))}
        </div>
      </div>
      <VideoGridSorted evs={streams} showEnded={false} showPopular={true} showRecentClips={false} />
    </div>
  );
}
