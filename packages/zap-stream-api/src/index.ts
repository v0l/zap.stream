// Core types
export { type NostrEvent, type Signer, unixNow, appendDedupe, throwIfOffline, buildUnsignedEvent } from "./types";

// Provider — the main API client
export {
  NostrStreamProvider,
  TimeSync,
  timeSync,
  type StreamDetails,
  type AccountResponse,
  type ForwardDest,
  type IngestEndpoint,
  type TopUpResponse,
  type BalanceHistoryResult,
  type StreamKeyItem,
  type StreamKeysResult,
  type MetricsMessage,
  type StreamInfo,
} from "./provider";

// Game database
export { GameDatabase, type GameInfo, type GameCover, type GameGenre } from "./game-database";

// Constants
export {
  HTTP_AUTH_KIND,
  LIVE_STREAM,
  N94_LIVE_STREAM,
  LIVE_STREAM_KINDS,
  LIVE_STREAM_CHAT,
  LIVE_STREAM_RAID,
  LIVE_STREAM_CLIP,
  GOAL,
  VIDEO_KIND,
  SHORTS_KIND,
  OLD_VIDEO_KIND,
  OLD_SHORTS_KIND,
  StreamState,
  DEFAULT_API_URL,
} from "./constants";

// Utilities
export { findTag, sortStreamTags, extractGameId, extractStreamInfo } from "./utils";
