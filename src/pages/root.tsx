import { useStreamsFeed } from "@/hooks/live-streams";
import CategoryLink from "@/element/category-link";
import VideoGridSorted from "@/element/video-grid-sorted";
import { AllCategories } from "./category";

export function RootPage() {
  const streams = useStreamsFeed();

  return (
    <div className="flex flex-col gap-6">
      <div className="flex gap-4 overflow-x-scroll scrollbar-hidden">
        {AllCategories.filter(a => a.priority === 0).map(a => (
          <CategoryLink key={a.id} {...a} />
        ))}
      </div>
      <VideoGridSorted evs={streams} />
    </div>
  );
}
