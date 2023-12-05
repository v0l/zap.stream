import { HTMLProps, ReactNode } from "react";

type ProgressBarProps = {
  value: number;
  setValue: (n: number) => void;
  marker?: ReactNode;
} & Omit<HTMLProps<HTMLDivElement>, "width">;

export function ProgressBar({ value, setValue, marker, ...props }: ProgressBarProps) {
  function onValue(e: React.MouseEvent) {
    const bb = (e.currentTarget as HTMLDivElement).getBoundingClientRect();
    const x = e.clientX - bb.x;
    const pos = Math.max(0, Math.min(1.0, x / bb.width));
    setValue(pos);
  }
  return (
    <div
      {...props}
      className="relative pointer border bg-[rgba(255,255,255,0.25)]"
      onMouseDown={onValue}
      onMouseMove={e => {
        if (e.buttons > 0) {
          onValue(e);
        }
      }}>
      <div
        className="absolute h-full bg-white"
        style={{
          width: `${Math.ceil(100 * value)}%`,
        }}>
        {marker && <div className="absolute right-0 flex items-center justify-center">{marker}</div>}
      </div>
    </div>
  );
}
