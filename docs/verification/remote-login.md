# Remote login verification

The change adds NIP-46 login while preserving NIP-07 extensions, private-key login and account
creation. Android NIP-55 support is outside this contribution. No deployment or publishing
workflow changes are included.

## Automated evidence

Run the commands in the README. The Playwright suite executes each case on desktop Chromium
and the Pixel 7 browser profile with one worker and no retries. The mobile profile exercises
browser layout and interaction; it is not an Android operating system or installed signer.

| Route | Assertions |
| --- | --- |
| NIP-07 extension | Selected public identity, genuine signature, signing after reload, menu logout, absent/rejected provider, provider without optional NIP-44 |
| Private key | nsec and hex, genuine signature before/after reload, menu logout, invalid input |
| Create account | Generated key derives saved identity, genuine signed profile intercepted locally, reload, logout |
| NIP-46 bunker and QR | Encrypted loopback WebSocket requests, distinct transport/signing identities, genuine signature, signing after reload, logout and cross-tab invalidation |

Browser cases fail on uncaught page errors. This includes the remote logout path: local authority
is revoked synchronously before queued subscription CLOSE messages finish and sockets are destroyed.
Publisher calls construct signed events without broadcasting chat; account-creation profile
publication is intercepted. The browser fixture blocks HTTP requests to public hosts and intercepts
public relay WebSockets. All transport and signing keys in automated tests are disposable.

Unit/integration checks cover exact identity and event binding, forged signatures, NIP-44 peer
round trips, QR secret and recipient binding, restored identity changes, revoked/rejected access,
unsafe approval URLs, approval after reload, cancellation, timeouts, storage failure, cross-tab
logout/account replacement and retained callbacks after logout or account switching. Regression
cases also initialise a genuinely encrypted mute-list event, cancel its approval and verify it is
loaded by the replacement signer. Refused initial decryption is also retried with an open
transport; a completed sync preserves decrypted mutes and pending list changes across later
cancellation, including when a relay subsequently returns no event. Queued storage-event cases check stale preference/state saves,
signing access and logout without reviving credentials or deleting a replacement account.

The NIP-07 provider is a protocol fixture. NIP-46 uses `Nip46Signer` from the existing
`@snort/system` dependency against a nostr-tools signer over a real loopback WebSocket relay.
`nostr-tools` is a development dependency used by tests only; it is not the application's
remote-signing backend. These cases do not claim installed extension/app, physical-device
or hosted production acceptance.

## Snort prerequisite

The application delegates relay transport, pairing, signing and NIP-04/NIP-44 operations to
Snort. Its adapter owns saved account binding, approval UI, cancellation and session lifetime.
The existing login routes and session-recovery tests are retained.

The published `@snort/system@2.2.0` needs the companion [Snort PR #637](https://github.com/v0l/snort/pull/637)
at `97c0c7bc4a66679d320a3a72f4872c01bd328c60` for NIP-44 RPCs,
validated QR discovery, returned-event verification, prompt cancellation and saved-client
restoration. This working branch carries those changes as an explicit Bun dependency patch
to make the complete candidate reproducible. It is a prerequisite bridge for testing, not
an independent NIP-46 implementation. Before upstream merge, use a release containing the
reviewed Snort fixes and remove the patch. Do not treat local verification as upstream approval.

Snort currently selects the first relay from a connection link; this adapter follows that
behaviour. Parsing retains the supplied relay choices, but automatic relay failover is not
claimed. Restored connections preserve the client key and omit one-time pairing secrets.

## Verified candidate: 16 November 2026

Updated to upstream zap.stream `663ace4` via merge `5c82666`, replacing the remote-signing
backend from closed PR #99. The companion Snort branch starts from `1fcf820`.

- Fresh-cache Bun installation applied the dependency patch successfully.
- zap.stream: TypeScript, lint, production build, 170 unit/integration tests and 18 Playwright
  desktop/Pixel 7 browser checks passed. Production source maps contain no `nostr-tools` sources
  (44 maps, 1,295 source entries checked).
- Snort: full monorepo build, 801 tests (8 skipped), app typecheck and lint passed. Lint reports
  existing repository warnings. An earlier system-only run hit the unchanged randomised NIP-45
  HLL tolerance test; its isolated rerun and the final full suite passed.
- The patch contains only the Snort NIP-46 source and its three generated JavaScript/declaration
  artefacts. `nostr-tools` remains a development dependency for the independent signer fixture.

Physical Signet/Bark acceptance, deployment and upstream approval remain pending. No Android
OS acceptance is inferred from the Playwright mobile profile. No task-owned test servers remain
running after the suite exits.

## Manual Signet and Bark checks

Record the exact frontend revision and URL, signer/extension versions, selected disposable
identity, relay and each result. Use an unlocked signer and a reachable relay. Do not publish chat,
make payments or change unrelated identities or grants.

1. Enable Bark for the reviewed frontend's origin. Choose **Login → Browser extension**, approve,
   request a controlled signature without broadcasting, independently verify it, then reload and
   sign again. Use the profile-menu logout and confirm the saved session is removed.
2. Repeat with Signet via **Login → Remote signer**, first with its bunker link, then by approving
   the generated QR/connection link. Verify the signing identity, event fields and signature before
   and after reload. A visible public identity alone is not evidence that signing works.
3. After reload, request an operation requiring web approval. Confirm the app shows the HTTPS
   host and link, opens nothing automatically and retains the prompt until completion. Exercise
   refusal, cancellation, timeout and retry; each failed request must remain unsigned.
4. Open a second tab, start a signing request and log out in the first tab. Both tabs must lose
   the session; pending signing must reject and a retained callback must not reconnect it.
5. Record unexercised checks separately from passes. Stop task-owned servers and fixtures and
   remove task-owned captures after retaining the review evidence.
