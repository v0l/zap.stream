import { NostrPublisher } from "@snort/system";

export default class StreamService {
  readonly url = "https://api.zap.stream/api/v1";
  private publisher?: NostrPublisher;

  constructor(publisher?: NostrPublisher) {
    this.publisher = publisher;
  }

  async deleteStream(streamId: string): Promise<boolean> {
    try {
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };

      // Add authentication if available
      if (this.publisher) {
        // This would need to be implemented based on how the API expects authentication
        // For now, assuming it might use a signed request or bearer token
        const auth = await this.getAuthHeader();
        if (auth) {
          headers["Authorization"] = auth;
        }
      }

      const rsp = await fetch(`${this.url}/streams/${streamId}`, {
        method: "DELETE",
        headers,
      });
      return rsp.ok;
    } catch (error) {
      console.error("Failed to delete stream:", error);
      return false;
    }
  }

  private async getAuthHeader(): Promise<string | null> {
    // This would implement the authentication logic required by the API
    // For now, returning null as we don't know the exact auth mechanism
    return null;
  }
}