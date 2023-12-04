import { NostrEvent, SystemInterface } from "@snort/system";
import { StreamProvider, StreamProviderInfo, StreamProviders } from "@/providers";

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

  async updateStreamInfo(system: SystemInterface, ev: NostrEvent): Promise<void> {
    await system.BroadcastEvent(ev);
  }

  topup(): Promise<string> {
    throw new Error("Method not implemented.");
  }

  acceptTos(): Promise<void> {
    throw new Error("Method not implemented.");
  }
}
