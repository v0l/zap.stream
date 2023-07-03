import { NostrEvent } from "@snort/system";
import { System } from "index";
import { StreamProvider, StreamProviderInfo, StreamProviders } from "providers";

export class ManualProvider implements StreamProvider {
    get name(): string {
        return "Manual"
    }
    info(): Promise<StreamProviderInfo> {
        return Promise.resolve({
            type: StreamProviders.Manual,
            name: this.name
        } as StreamProviderInfo)
    }

    createConfig() {
        return {
            type: StreamProviders.Manual
        }
    }

    updateStreamInfo(ev: NostrEvent): Promise<void> {
        System.BroadcastEvent(ev);
        return Promise.resolve();
    }
}