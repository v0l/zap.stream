import { type ReactNode, useEffect, useState } from "react";

export function Async<T>({ loader, then }: { loader: () => Promise<T>; then: (v: T) => ReactNode }) {
  const [res, setResult] = useState<T>();
  useEffect(() => {
    loader().then(setResult);
  }, []);
  if (!res) return;
  return then(res);
}
