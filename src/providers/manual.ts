import { NostrEvent } from "@snort/system";
import { System } from "index";
import { StreamProvider, StreamProviderInfo, StreamProviders } from "providers";

export class ManualProvider implements StreamProvider {
  get name(): string {
    return "Manual";
  }

  get type() {
    return StreamProviders.Manual;
  }

  info(): Promise<StreamProviderInfo> {
    return Promise.resolve({
      name: this.name,
    } as StreamProviderInfo);
  }

  createConfig() {
    return {
      type: StreamProviders.Manual,
    };
  }

  updateStreamInfo(ev: NostrEvent): Promise<void> {
    System.BroadcastEvent(ev);
    return Promise.resolve();
  }

  topup(): Promise<string> {
    throw new Error("Method not implemented.");
  }

  acceptTos(): Promise<void> {
    throw new Error("Method not implemented.");
  }
}
