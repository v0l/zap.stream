import type { MouseEventHandler } from "react"
import Icons from "@/icons.svg"

type Props = {
  name: string
  size?: number
  className?: string
  onClick?: MouseEventHandler<SVGSVGElement>
}

export function Icon(props: Props) {
  const size = props.size || 20
  const href = `${Icons}#${props.name}`

  return (
    <svg
      width={size}
      height={size}
      className={props.className}
      onClick={props.onClick}
      role={props.onClick ? "button" : "img"}
      aria-label={props.name}
      onKeyDown={
        props.onClick
          ? e => {
              if (e.key === "Enter" || e.key === " ") {
                props.onClick?.(e as unknown as React.MouseEvent<SVGSVGElement>)
              }
            }
          : undefined
      }
    >
      <title>{props.name}</title>
      <use href={href} />
    </svg>
  )
}
