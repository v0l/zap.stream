import "./async-button.css";
import { forwardRef, useState } from "react";
import Spinner from "./spinner";

export interface AsyncButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  disabled?: boolean;
  onClick?: (e: React.MouseEvent) => Promise<void> | void;
  children?: React.ReactNode;
}

const AsyncButton = forwardRef<HTMLButtonElement, AsyncButtonProps>((props: AsyncButtonProps, ref) => {
  const [loading, setLoading] = useState<boolean>(false);

  async function handle(e: React.MouseEvent) {
    e.stopPropagation();
    if (loading || props.disabled) return;
    setLoading(true);
    try {
      if (props.onClick) {
        await props.onClick(e);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      ref={ref}
      disabled={loading || props.disabled}
      {...props}
      onClick={handle}
      className={props.className}>
      <span
        style={{ visibility: loading ? "hidden" : "visible" }}
        className="whitespace-nowrap flex gap-2 items-center justify-center">
        {props.children}
      </span>
      {loading && (
        <span className="spinner-wrapper">
          <Spinner />
        </span>
      )}
    </button>
  );
});
export default AsyncButton;
