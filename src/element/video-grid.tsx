import { ReactNode } from "react";

export default function VideoGrid({ children }: { children: ReactNode }) {
  return (
    <div className="grid gap-8 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-7 3xl:grid-cols-8">
      {children}
    </div>
  );
}
