import classNames from "classnames"
import type React from "react"
import { type ReactNode, useEffect, useRef } from "react"
import { createPortal } from "react-dom"
import { IconButton } from "./buttons"
import { useHydrated } from "@/hooks/hydrated"
import { useIntl } from "react-intl"

export interface ModalProps {
  id: string
  title?: ReactNode
  size?: "sm" | "md" | "lg"
  className?: string
  bodyClassName?: string
  onClose?: (e: React.MouseEvent | KeyboardEvent) => void
  onClick?: (e: React.MouseEvent) => void
  children?: ReactNode
  showClose?: boolean
  ready?: boolean
  largeModal?: boolean
}

let openModals = 0

export default function Modal(props: ModalProps) {
  const hydrated = useHydrated()
  const { formatMessage } = useIntl()
  const dialogRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    openModals++
    document.body.classList.add("scroll-lock")

    return () => {
      openModals--
      if (openModals === 0) {
        document.body.classList.remove("scroll-lock")
      }
    }
  }, [])

  useEffect(() => {
    if (hydrated && !dialogRef.current?.contains(document.activeElement)) {
      dialogRef.current?.focus({ preventScroll: true })
    }
  }, [hydrated])

  const handleBackdropClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    props.onClose?.(e)
  }

  if (!hydrated) return null

  const close = (e: React.MouseEvent) => {
    e.stopPropagation()
    props.onClose?.(e)
  }
  const closeOnEscape = (e: React.KeyboardEvent) => {
    e.stopPropagation()
    if (e.key === "Escape") props.onClose?.(e.nativeEvent)
  }
  const closeButton = (
    <IconButton
      iconName="x"
      onClick={close}
      className="rounded-full aspect-square bg-layer-2 hover:bg-layer-3 p-2.5"
      iconSize={10}
      aria-label={formatMessage({ defaultMessage: "Close" })}
    />
  )
  const showClose = (props.showClose ?? true) && props.onClose !== undefined
  const size = props.size ?? (props.largeModal ? "lg" : "md")

  return createPortal(
    <div
      className="z-[42] fixed inset-0 bg-black/70 backdrop-blur-sm flex justify-center items-end sm:items-center sm:p-6"
      ref={dialogRef}
      role="dialog"
      aria-modal="true"
      tabIndex={-1}
      onMouseDown={handleBackdropClick}
      onClick={e => {
        e.stopPropagation()
      }}
      onKeyDown={closeOnEscape}
    >
      <div
        className={
          props.bodyClassName ??
          classNames(
            "relative flex flex-col w-full bg-layer-1 border border-layer-2 shadow-2xl transition",
            "max-sm:rounded-t-2xl sm:rounded-2xl max-h-[92dvh] sm:max-h-[min(860px,calc(100dvh-48px))]",
            {
              "max-sm:translate-y-full": !(props.ready ?? true),
              "sm:max-w-[440px]": size === "sm",
              "sm:max-w-[600px]": size === "md",
              "sm:max-w-[960px]": size === "lg",
            },
          )
        }
        role="document"
        tabIndex={-1}
        onMouseDown={e => e.stopPropagation()}
        onClick={e => {
          e.stopPropagation()
          props.onClick?.(e)
        }}
        onKeyDown={closeOnEscape}
      >
        {props.bodyClassName ? (
          props.children
        ) : (
          <>
            {props.title ? (
              <div className="flex items-center gap-4 px-6 pt-5 pb-1 shrink-0">
                <h3 className="flex-1 min-w-0 truncate">{props.title}</h3>
                {showClose && closeButton}
              </div>
            ) : (
              showClose && <div className="absolute right-4 top-4 z-10">{closeButton}</div>
            )}
            <div
              className={classNames(
                "flex flex-col gap-5 px-6 pb-6 overflow-y-auto min-h-0",
                props.title ? "pt-3" : "pt-6",
                props.className,
              )}
            >
              {props.children}
            </div>
          </>
        )}
      </div>
    </div>,
    document.body,
  )
}
