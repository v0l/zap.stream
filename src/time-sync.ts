import { timeSync as _timeSync, TimeSync as _TimeSyncClass } from "@zap.stream/api";

/**
 * @deprecated Import `timeSync` or `TimeSync` from `@zap.stream/api` instead.
 *
 * For backward compatibility, this module re-exports the shared TimeSync
 * singleton and its offset as a mutable variable.
 */
export let TimeSync = 0;

/** Sync the clock with the API server and keep the legacy `TimeSync` variable updated. */
export async function syncClock() {
  await _timeSync.syncClock();
  TimeSync = _timeSync.offset;
}

export { _TimeSyncClass as TimeSyncClass };
