import { forwardRef, lazy, Suspense } from "react"
import { ExternalLink } from "../external-link"
import type { NewCard } from "."
import classNames from "classnames"
import { safeMediaUrl } from "@/utils"
const Markdown = lazy(() => import("../markdown"))

interface CardPreviewProps extends NewCard {
  style: object
}

function isEmpty(s: string | undefined) {
  return s === undefined || s.trim().length === 0
}

export const CardPreview = forwardRef<HTMLDivElement, CardPreviewProps>(
  ({ style, title, link, image, content }: CardPreviewProps, ref) => {
    const safeImage = safeMediaUrl(image)
    const isImageOnly = !isEmpty(image) && isEmpty(content) && isEmpty(title)
    return (
      <div
        className={classNames("flex flex-col gap-4 w-full max-w-full overflow-hidden", { "": isImageOnly })}
        ref={ref}
        style={style}
      >
        {title && <h2>{title}</h2>}
        {safeImage &&
          (link && link?.length > 0 ? (
            <ExternalLink href={link}>
              <img src={safeImage} alt={title} />
            </ExternalLink>
          ) : (
            <img src={safeImage} alt={title} />
          ))}
        {content && (
          <Suspense>
            <Markdown content={content} />
          </Suspense>
        )}
      </div>
    )
  },
)
