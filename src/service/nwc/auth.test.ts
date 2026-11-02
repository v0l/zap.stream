import { expect, test } from "bun:test"
import { NostrConnectWallet } from "@snort/wallet"

test("nwc wallet answers the relay AUTH challenge", async () => {
  const secret = "1".repeat(64)
  const walletPubkey = "b".repeat(64)
  let authEvent: { kind: number; tags: string[][] } | undefined
  const authed = Promise.withResolvers<void>()
  const server = Bun.serve({
    port: 0,
    fetch(req, srv) {
      return srv.upgrade(req) ? undefined : new Response("no")
    },
    websocket: {
      open(ws) {
        ws.send(JSON.stringify(["AUTH", "challenge-123"]))
      },
      message(ws, data) {
        const msg = JSON.parse(String(data))
        if (msg[0] === "AUTH") {
          authEvent = msg[1]
          ws.send(JSON.stringify(["OK", msg[1].id, true, ""]))
          authed.resolve()
        }
      },
    },
  })
  const wallet = new NostrConnectWallet(
    `nostr+walletconnect://${walletPubkey}?relay=ws://localhost:${server.port}&secret=${secret}`,
  )
  wallet.login().catch(() => {})
  const timeout = new Promise((_, rej) => setTimeout(() => rej(new Error("no AUTH reply")), 3000))
  try {
    await Promise.race([authed.promise, timeout])
    expect(authEvent?.kind).toBe(22242)
    expect(authEvent?.tags).toContainEqual(["challenge", "challenge-123"])
  } finally {
    await wallet.close()
    server.stop(true)
  }
})
