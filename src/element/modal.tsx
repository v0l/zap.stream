import classNames from "classnames";
import React, { ReactNode, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { IconButton } from "./buttons";

export interface ModalProps {
  id: string;
  className?: string;
  bodyClassName?: string;
  onClose?: (e: React.MouseEvent | KeyboardEvent) => void;
  onClick?: (e: React.MouseEvent) => void;
  children: ReactNode;
  showClose?: boolean;
  ready?: boolean;
}

export default function Modal(props: ModalProps) {
  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === "Escape" && props.onClose) {
      props.onClose(e);
    }
  };

  useEffect(() => {
    document.body.classList.add("scroll-lock");
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.classList.remove("scroll-lock");
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
        "z-[42] w-screen h-screen top-0 left-0 fixed bg-black/80 flex justify-center overflow-y-auto",
      )}
      onMouseDown={handleBackdropClick}
      onClick={e => {
        e.stopPropagation();
      }}>
      <div
        className={
          props.bodyClassName ??
          classNames(
            "relative bg-layer-1 p-8 transition max-xl:translate-y-[50vh] max-xl:rounded-t-3xl xl:rounded-3xl max-xl:mt-auto xl:my-auto lg:w-[500px] max-lg:w-full",
            { "max-xl:translate-y-0": props.ready ?? true },
          )
        }
        onMouseDown={e => e.stopPropagation()}
        onClick={e => {
          e.stopPropagation();
          props.onClick?.(e);
        }}>
        {(props.showClose ?? true) && (
          <div className="absolute right-4 top-4">
            <IconButton
              iconName="x"
              onClick={e => {
                e.stopPropagation();
                props.onClose?.(e);
              }}
              className="rounded-full aspect-square bg-layer-2 p-3"
              iconSize={10}
            />
          </div>
        )}
        {props.children}
      </div>
    </div>,
    document.body,
  );
}
