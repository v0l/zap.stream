import { ReactNode } from "react";

export function StreamInput({ label, children }: { label: ReactNode; children?: ReactNode }) {
  return (
    <div>
      <div className="mb-1 text-layer-4 text-sm font-medium">{label}</div>
      <div>{children}</div>
    </div>
  );
}
