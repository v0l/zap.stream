import { useHover } from "usehooks-ts"
import { IconButton } from "../buttons"
import { type RefObject, forwardRef } from "react"

interface ChatMenuProps {
  zapTarget?: string
  onPickEmoji: (e: React.MouseEvent) => void
  onMuteUser: (e: React.MouseEvent) => void
  onZapping: (e: React.MouseEvent) => void
  showMuteButton?: boolean
}
export const ChatMenu = forwardRef<HTMLDivElement | null, ChatMenuProps>(
  ({ zapTarget, onPickEmoji, onMuteUser, onZapping, showMuteButton }, ref) => {
    // usehooks-ts bundles a pre-React-19 RefObject type whose `current` is non-nullable
    const isHovering = useHover((ref && "current" in ref ? ref : { current: null }) as RefObject<HTMLDivElement>)
    if (!ref || !("current" in ref)) return
    const topOffset = ref?.current?.getBoundingClientRect().top
    const leftOffset = ref?.current?.getBoundingClientRect().left

    if (ref?.current && isHovering) {
      return (
        <div
          className="fixed rounded-lg p-2 bg-layer-1 border border-layer-2 flex gap-1 z-10"
          style={{
            top: topOffset ? topOffset + 24 : 0,
            left: leftOffset ? leftOffset : 0,
            opacity: isHovering ? 1 : 0,
            pointerEvents: isHovering ? "auto" : "none",
          }}
        >
          {zapTarget && (
            <IconButton
              iconName="zap"
              iconSize={14}
              className="p-2 rounded-full bg-layer-2 aspect-square"
              onClick={onZapping}
            />
          )}
          <IconButton
            onClick={onPickEmoji}
            iconName="face"
            iconSize={14}
            className="p-2 rounded-full bg-layer-2 aspect-square"
          />
          {showMuteButton && (
            <IconButton
              onClick={onMuteUser}
              iconName="user-x"
              iconSize={14}
              className="p-2 rounded-full bg-layer-2 aspect-square"
            />
          )}
        </div>
      )
    }
  },
)
