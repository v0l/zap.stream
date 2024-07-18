import { CSSProperties, ReactNode } from "react";
import { IconButton } from "./buttons";
import { createPortal } from "react-dom";
import classNames from "classnames";

export default function Flyout({
  show,
  children,
  onClose,
  side,
}: {
  show: boolean;
  children: ReactNode;
  onClose: () => void;
  side: "left" | "right";
}) {
  const styles = {
    "--flyout-w": "200px",
    transition: "all 0.2s ease-in-out",
    transform:
      side === "right"
        ? `translate(${show ? "0" : "var(--flyout-w)"},0)`
        : `translate(${show ? "0" : "calc(-1 * var(--flyout-w))"},0)`,
  } as CSSProperties;

  return createPortal(
    <div
      className={classNames("absolute z-20 top-0 overflow-hidden", {
        "pointer-events-none": !show,
        "right-0": side == "right",
        "left-0": side === "left",
      })}>
      <div className="bg-layer-2/90 h-[100dvh] px-3 py-4" style={styles}>
        <IconButton iconName="x" className="rounded-xl w-10 h-10 mb-6" iconSize={16} onClick={onClose} />
        {children}
      </div>
    </div>,
    document.body,
  ) as React.ReactNode;
}
