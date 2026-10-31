import { useParams } from "react-router"
import { useStreamsFeed } from "@/hooks/live-streams"
import VideoGridSorted from "@/element/video-grid-sorted"

export function TagPage() {
  const { tag } = useParams()
  const streams = useStreamsFeed(tag)
  return (
    <div className="flex flex-col gap-6 p-4 sm:px-8 sm:py-7 min-w-0 max-w-[1560px]">
      <h1 className="text-[clamp(28px,4vw,44px)]">
        <span className="text-primary">#</span>
        {tag}
      </h1>
      <VideoGridSorted evs={streams} />
    </div>
  )
}
