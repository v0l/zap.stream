// NIP-98 HTTP Authentication
export const HTTP_AUTH_KIND = 27_235;

// Live stream event kinds
export const LIVE_STREAM = 30_311;
export const N94_LIVE_STREAM = 1053;
export const LIVE_STREAM_KINDS = [LIVE_STREAM, N94_LIVE_STREAM];
export const LIVE_STREAM_CHAT = 1_311;
export const LIVE_STREAM_RAID = 1_312;
export const LIVE_STREAM_CLIP = 1_313;
export const GOAL = 9041;

export const VIDEO_KIND = 21;
export const SHORTS_KIND = 22;
export const OLD_VIDEO_KIND = 34_235;
export const OLD_SHORTS_KIND = 34_236;

export enum StreamState {
  Live = "live",
  Ended = "ended",
  Planned = "planned",
  VOD = "vod",
}

/** Default zap.stream API URL. */
export const DEFAULT_API_URL = "https://api-core.zap.stream/api/v1";
