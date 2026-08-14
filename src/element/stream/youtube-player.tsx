import type { YouTubeLink } from "@/youtube"

interface YouTubePlayerProps {
  video: YouTubeLink
  title?: string
  className?: string
  id?: string
}

/**
 * Embedded YouTube player. Used when a stream/recording URL is a YouTube link,
 * which cannot be played by a <video> element.
 */
export default function YouTubePlayer({ video, title, className, id }: YouTubePlayerProps) {
  const params = new URLSearchParams({
    autoplay: "1",
    playsinline: "1",
    rel: "0",
  })
  if (video.start) {
    params.set("start", String(video.start))
  }

  return (
    <iframe
      id={id}
      className={className}
      src={`https://www.youtube-nocookie.com/embed/${video.id}?${params.toString()}`}
      title={title ?? `YouTube video ${video.id}`}
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
      referrerPolicy="strict-origin-when-cross-origin"
      allowFullScreen
    />
  )
}
