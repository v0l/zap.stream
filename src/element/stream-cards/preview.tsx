import { isEmpty } from "lodash";
import { forwardRef, lazy, Suspense } from "react";
import { ExternalLink } from "../external-link";
import { NewCard } from ".";
import classNames from "classnames";
const Markdown = lazy(() => import("../markdown"));

interface CardPreviewProps extends NewCard {
    style: object;
}

export const CardPreview = forwardRef<HTMLDivElement, CardPreviewProps>(({ style, title, link, image, content }: CardPreviewProps, ref) => {
    const isImageOnly = !isEmpty(image) && isEmpty(content) && isEmpty(title);
    return (
        <div
            className={classNames("flex flex-col gap-4", { "": isImageOnly })}
            ref={ref}
            style={style}>
            {title && <h2>{title}</h2>}
            {image &&
                (link && link?.length > 0 ? (
                    <ExternalLink href={link}>
                        <img src={image} alt={title} />
                    </ExternalLink>
                ) : (
                    <img src={image} alt={title} />
                ))}
            {content &&
                <Suspense>
                    <Markdown content={content} />
                </Suspense>
            }
        </div>
    );
});
