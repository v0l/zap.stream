import { ReactNode, createContext, useState } from "react";

interface LayoutContextType {
  leftNav: boolean;
  theme: string;
  update: (fn: (c: LayoutContextType) => LayoutContextType) => void;
}
const defaultLayoutContext: LayoutContextType = {
  leftNav: true,
  theme: "",
  update: c => c,
};
export const LayoutContext = createContext<LayoutContextType>(defaultLayoutContext);

export function LayoutContextProvider({ children }: { children: ReactNode }) {
  const [value, setValue] = useState<LayoutContextType>(defaultLayoutContext);
  return (
    <LayoutContext.Provider
      value={{
        ...value,
        update: fn => {
          setValue(fn);
        },
      }}>
      {children}
    </LayoutContext.Provider>
  );
}
