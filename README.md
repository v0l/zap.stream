# zap.stream

Nostr live streaming powered by Bitcoin & Nostr

This is a [NIP-53](https://github.com/nostr-protocol/nips/blob/master/53.md) nostr client.

## Sign in with a signer

- **Browser extension**: enable Bark, Alby or another NIP-07 extension for the site's origin,
  then choose **Login → Browser extension**. The extension manages its own signer connection.
- **Remote signer**: choose **Login → Remote signer** and paste a `bunker://` link from Signet
  or another NIP-46 signer. Alternatively, choose **Pair by QR code instead**, select a relay
  reachable by your signer, create the code and approve it in your signer. The default pairing
  relay is `wss://relay.primal.net`; bunker links use their supplied relay addresses.

Remote signing uses NIP-44 encrypted NIP-46 requests. The browser stores a generated client
connection key, relay addresses and the selected public identity in local storage to reconnect
after reload. It never receives your identity private key, and one-time pairing secrets are not
retained. Treat the saved client connection as a credential. Logout removes it and closes the
connection in other open tabs; revoke the client in your signer to withdraw its permission.

The NIP-46 backend is `Nip46Signer` from `@snort/system`. This candidate includes a temporary
Bun patch for the companion Snort fixes; see the [dependency prerequisite](docs/verification/remote-login.md#snort-prerequisite)
before merging it upstream.

If your signer requests web approval, the app shows its HTTPS link and host until approval,
cancellation or timeout, including after reload. Check that host before opening the link.
Cancelling or timing out closes the connection; a later action can reconnect with the saved client key.

## Login verification

```bash
bun install --frozen-lockfile
bun test src packages/zap-stream-api/src/
bun tsc --noEmit
bun biome lint src/ packages/zap-stream-api/src/ e2e/ playwright.config.ts
bun run build
bunx playwright install chromium
bun run test:e2e
```

The browser suite covers extension login, nsec/hex private keys, account creation and remote
signer bunker/QR pairing, including signing, reload, rejection and logout. It uses disposable
identities, an encrypted loopback relay and protocol providers; public HTTP requests are blocked
and public relay WebSockets intercepted. It does not install Bark or Signet or make payments.
See [the verification matrix](docs/verification/remote-login.md) for scope and manual checks.

## Building

```bash
bun install && bun run build
```

## Packages

| Package | Description |
|---------|-------------|
| [`@zap.stream/api`](./packages/zap-stream-api/) | API client for live streaming & account management |

## Translations

[![Crowdin](https://badges.crowdin.net/zapstream/localized.svg)](https://crowdin.com/project/zapstream)
