import { NostrLink, NostrPrefix } from "@snort/system";
import { ReactNode, createContext, useContext, useState } from "react";

interface StreamState {
  link: NostrLink;
  showDetails: boolean;
  update: (fn: (c: StreamState) => StreamState) => void;
}

const initialState = {
  link: new NostrLink(NostrPrefix.Address, ""),
  showDetails: false,
  update: c => c,
} as StreamState;

const StreamContext = createContext<StreamState>(initialState);

export function StreamContextProvider({ children, link }: { children?: ReactNode; link: NostrLink }) {
  const [state, setState] = useState<StreamState>({
    ...initialState,
    link,
  });
  return (
    <StreamContext.Provider
      value={{
        ...state,
        update: (fn: (c: StreamState) => StreamState) => {
          setState(fn);
        },
      }}>
      {children}
    </StreamContext.Provider>
  );
}

export function useStream() {
  return useContext(StreamContext);
}
