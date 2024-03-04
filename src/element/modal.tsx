import classNames from "classnames";
import React, { ReactNode, useEffect } from "react";
import { createPortal } from "react-dom";
import { IconButton } from "./buttons";

export interface ModalProps {
  id: string;
  className?: string;
  bodyClassName?: string;
  onClose?: (e: React.MouseEvent | KeyboardEvent) => void;
  onClick?: (e: React.MouseEvent) => void;
  children: ReactNode;
}

let scrollbarWidth: number | null = null;

const getScrollbarWidth = () => {
  if (scrollbarWidth !== null) {
    return scrollbarWidth;
  }

  const outer = document.createElement("div");
  outer.style.visibility = "hidden";
  outer.style.width = "100px";

  document.body.appendChild(outer);

  const widthNoScroll = outer.offsetWidth;
  outer.style.overflow = "scroll";

  const inner = document.createElement("div");
  inner.style.width = "100%";
  outer.appendChild(inner);

  const widthWithScroll = inner.offsetWidth;

  outer.parentNode?.removeChild(outer);

  scrollbarWidth = widthNoScroll - widthWithScroll;
  return scrollbarWidth;
};

export default function Modal(props: ModalProps) {
  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === "Escape" && props.onClose) {
      props.onClose(e);
    }
  };

  useEffect(() => {
    document.body.classList.add("scroll-lock");
    document.body.style.paddingRight = `${getScrollbarWidth()}px`;

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.classList.remove("scroll-lock");
      document.body.style.paddingRight = "";
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  const handleBackdropClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    props.onClose?.(e);
  };

  return createPortal(
    <div
      className={classNames(
        "z-[42] w-screen h-screen top-0 left-0 fixed bg-black/80 flex justify-center overflow-y-auto"
      )}
      onMouseDown={handleBackdropClick}
      onClick={e => {
        e.stopPropagation();
      }}>
      <div
        className={props.bodyClassName ?? "bg-layer-1 p-8 rounded-3xl my-auto lg:w-[500px] max-lg:w-full"}
        onMouseDown={e => e.stopPropagation()}
        onClick={e => {
          e.stopPropagation();
          props.onClick?.(e);
        }}>
        <div className="absolute right-4 top-4">
          <IconButton
            iconName="x"
            onClick={e => {
              e.stopPropagation();
              props.onClose?.(e);
            }}
            className="rounded-full aspect-square"
            iconSize={10}
          />
        </div>
        {props.children}
      </div>
    </div>,
    document.body
  );
}
