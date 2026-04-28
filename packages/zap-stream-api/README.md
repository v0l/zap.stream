# @zap.stream/api

TypeScript API client for [zap.stream](https://zap.stream) — live streaming & account management for Nostr.

Zero Nostr-library dependencies. Bring your own signer.

## Install

```bash
bun add @zap.stream/api
```

## Usage

### Setup

Create a `Signer` — the only crypto interface the library needs. Any Nostr library works:

```ts
import { NostrStreamProvider, type Signer } from "@zap.stream/api";

const signer: Signer = {
  getPubKey: () => myPublicKey,                        // hex pubkey string
  sign: async (event) => myNostrLib.signEvent(event),  // returns event with id & sig
};

const provider = new NostrStreamProvider("zap.stream", "https://api-core.zap.stream/api/v1", signer);
```

### Getting started — stream key & balance

The main flow: check your balance, get your stream key, top up if needed.

```ts
// 1. Check account info
const account = await provider.info();
console.log(`Balance: ${account.balance} sats`);

// Endpoints contain the stream key you push to via RTMP
for (const ep of account.endpoints) {
  console.log(`Endpoint: ${ep.name}`);
  console.log(`  URL: ${ep.url}`);
  console.log(`  Stream key: ${ep.key}`);
  console.log(`  Cost: ${ep.cost.rate} sats/${ep.cost.unit}`);
}

// 2. Top up if balance is low
if (account.balance < 1000) {
  const invoice = await provider.topup(10000); // 10k sats
  // Hand this invoice to the user's wallet
  console.log(`Pay this invoice: ${invoice.pr}`);
}
```

### Withdrawing

```ts
const result = await provider.withdraw(bolt11Invoice);
console.log(`Fee: ${result.fee} sats`);
console.log(`Preimage: ${result.preimage}`);
```

### Balance history

```ts
const history = await provider.history(0, 20);
for (const item of history.items) {
  console.log(`${new Date(item.created * 1000).toISOString()}: ${item.amount} sats`);
}
```

### Accepting terms of service

New accounts need to accept TOS before streaming:

```ts
const account = await provider.info();
if (account.tos && !account.tos.accepted) {
  console.log(`TOS available at: ${account.tos.link}`);
  await provider.acceptTos();
}
```

### Updating stream details

```ts
await provider.updateStream({
  title: "Building stuff live",
  summary: "Nostr dev stream",
  tags: ["coding", "nostr"],
  image: "https://example.com/thumbnail.jpg",
});

// Or update from a Nostr live event
import { extractStreamInfo } from "@zap.stream/api";
await provider.updateStreamFromEvent(myLiveEvent, extractStreamInfo);
```

### Real-time metrics (WebSocket)

```ts
provider.subscribeToMetrics(streamId, (metrics) => {
  console.log(`Viewers: ${metrics.data?.viewers}`);
  const stats = metrics.data?.endpoint_stats;
  if (stats) {
    for (const ep of Object.values(stats)) {
      console.log(`${ep.name}: ${ep.bitrate} bps`);
    }
  }
});

provider.unsubscribeFromMetrics(streamId);
provider.closeWebSocket();
```

### Wallet integration (NWC)

```ts
await provider.configureNwc("nostr+wallet://…");
await provider.removeNwc();
```

### Stream forwarding

```ts
await provider.addForward("my-relay", "wss://relay.example.com");
await provider.removeForward(forwardId);
```

### Clips

```ts
const clip = await provider.prepareClip(streamId);
const result = await provider.createClip(streamId, clip.id, start, length);
```

### Notifications (Web Push)

```ts
const { publicKey } = await provider.getNotificationsInfo();
await provider.subscribeNotifications({ endpoint, key, auth, scope });
```

### Game database

```ts
import { GameDatabase } from "@zap.stream/api";

const db = new GameDatabase();
const games = await db.searchGames("minecraft", 10);
const game = await db.getGame("igdb:1234");
```

### Clock sync

```ts
import { timeSync } from "@zap.stream/api";

await timeSync.syncClock();   // call once at startup
console.log(timeSync.offset); // ms offset from server
```

## The Signer interface

The **only** crypto dependency. Two methods:

```ts
interface Signer {
  getPubKey(): string | Promise<string>;
  sign(event: NostrEvent): Promise<NostrEvent>;
}
```

### Adapting @snort/system

```ts
import { EventPublisher } from "@snort/system";

function adaptPublisher(pub: EventPublisher): Signer {
  return {
    getPubKey: () => pub.pubKey,
    sign: async (event) => {
      return await pub.generic(eb => {
        let builder = eb.kind(event.kind).content(event.content).createdAt(event.created_at);
        for (const tag of event.tags) {
          builder = builder.tag(tag);
        }
        return builder;
      });
    },
  };
}
```

## Dependencies

- [`@scure/base`](https://github.com/paulmillr/scure-base) — base64 encoding for NIP-98 auth tokens

No Nostr library, no framework, no bundler plugin required.

## License

MIT
