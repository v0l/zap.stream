import { type ReactNode, createContext, useContext, useState } from "react";

interface LayoutContextType {
  leftNav: boolean;
  leftNavExpand: boolean;
  showHeader: boolean;
  theme: string;
  update: (fn: (c: LayoutContextType) => LayoutContextType) => void;
}
const defaultLayoutContext: LayoutContextType = {
  leftNav: true,
  leftNavExpand: false,
  showHeader: true,
  theme: "",
  update: c => c,
};
const LayoutContext = createContext<LayoutContextType>(defaultLayoutContext);

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

export function useLayout() {
  return useContext(LayoutContext);
}
