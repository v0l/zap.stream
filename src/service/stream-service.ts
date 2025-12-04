import { base64 } from "@scure/base";
import { EventKind, EventPublisher } from "@snort/system";
import { unixNow } from "@snort/shared";
import { TimeSync } from "@/time-sync";

export default class StreamService {
  readonly url = "https://api.zap.stream/api/v1";
  private publisher?: EventPublisher;

  constructor(publisher?: EventPublisher) {
    this.publisher = publisher;
  }

  async deleteStream(streamId: string): Promise<boolean> {
    if (!this.publisher) {
      console.error("No publisher available for authentication");
      return false;
    }

    try {
      const fullUrl = `${this.url}/stream/${streamId}`;
      const auth = await this.getAuthHeader(fullUrl, "DELETE");

      const rsp = await fetch(fullUrl, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: auth,
        },
      });
      return rsp.ok;
    } catch (error) {
      console.error("Failed to delete stream:", error);
      return false;
    }
  }

  private async getAuthHeader(url: string, method: string): Promise<string> {
    if (!this.publisher) {
      throw new Error("No publisher available");
    }
    const auth = await this.publisher.generic(eb => {
      return eb
        .kind(EventKind.HttpAuthentication)
        .content("")
        .tag(["u", url])
        .tag(["method", method])
        .createdAt(unixNow() + Math.floor(TimeSync / 1000));
    });
    return `Nostr ${base64.encode(new TextEncoder().encode(JSON.stringify(auth)))}`;
  }
}