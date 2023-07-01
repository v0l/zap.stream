interface StateEventMap {
  log: CustomEvent<LogEvent>;
  status: CustomEvent<StatusEvent>;
}

interface StateEventTarget extends EventTarget {
  addEventListener<K extends keyof StateEventMap>(
    type: K,
    listener: (ev: StateEventMap[K]) => void,
    options?: boolean | AddEventListenerOptions
  ): void;
  addEventListener(
    type: string,
    callback: EventListenerOrEventListenerObject | null,
    options?: EventListenerOptions | boolean
  ): void;
}

export const TypedEventTarget = EventTarget as {
  new (): StateEventTarget;
  prototype: StateEventTarget;
};

export interface LogEvent {
  message: string;
}

export interface StatusEvent {
  status: Status;
}

export type Status = "connected" | "disconnected";
