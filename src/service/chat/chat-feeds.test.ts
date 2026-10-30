import { afterEach, beforeEach, expect, test } from "bun:test"
import { TwitchChat } from "./twitch-chat"
import { KickChat } from "./kick"

class FakeSocket {
  static all: Array<FakeSocket> = []
  onopen?: (e: unknown) => void
  onmessage?: (e: { data: string }) => void
  onclose?: (e: unknown) => void
  onerror?: (e: unknown) => void
  closed = false
  sent: Array<string> = []

  constructor(readonly url: string) {
    FakeSocket.all.push(this)
    queueMicrotask(() => this.onopen?.({}))
  }

  send(data: string) {
    this.sent.push(data)
  }

  close() {
    if (this.closed) return
    this.closed = true
    this.onclose?.({})
  }

  drop() {
    this.closed = true
    this.onclose?.({})
  }

  receive(msg: object) {
    this.onmessage?.({ data: JSON.stringify(msg) })
  }

  welcome(id: string, keepalive = 10) {
    this.receive({
      metadata: { message_id: "m", message_type: "session_welcome", message_timestamp: "" },
      payload: { session: { id, status: "connected", keepalive_timeout_seconds: keepalive, connected_at: "" } },
    })
  }
}

const realSocket = globalThis.WebSocket
const realFetch = globalThis.fetch
let subscribedSessions: Array<string> = []

const tick = () => new Promise(r => setTimeout(r, 0))

async function waitFor(fn: () => boolean) {
  for (let i = 0; i < 100; i++) {
    if (fn()) return
    await tick()
  }
  throw new Error("timed out")
}

beforeEach(() => {
  FakeSocket.all = []
  subscribedSessions = []
  globalThis.WebSocket = FakeSocket as unknown as typeof WebSocket
  globalThis.fetch = (async (url: string, init?: RequestInit) => {
    if (url.includes("oauth2/validate")) {
      return Response.json({ user_id: "42", login: "streamer", client_id: "c", expires_in: 1, scopes: [] })
    }
    if (url.includes("eventsub/subscriptions") && init?.method === "POST") {
      const body = JSON.parse(String(init.body))
      subscribedSessions.push(body.transport.session_id)
      return Response.json({ data: [{ id: `sub-${subscribedSessions.length}` }] })
    }
    if (url.includes("chatroom")) {
      return Response.json({ id: 7 })
    }
    return Response.json({})
  }) as typeof fetch
})

afterEach(() => {
  globalThis.WebSocket = realSocket
  globalThis.fetch = realFetch
})

async function connectTwitch(chat: TwitchChat, sessionId: string) {
  const connected = chat.connectFeed()
  await waitFor(() => FakeSocket.all.length > 0)
  FakeSocket.all.at(-1)?.welcome(sessionId)
  await connected
}

test("twitch chat resubscribes after the socket drops", async () => {
  const chat = new TwitchChat("client", "bearer", 0)
  await connectTwitch(chat, "s1")
  expect(subscribedSessions).toEqual(["s1"])

  FakeSocket.all[0].drop()
  await waitFor(() => FakeSocket.all.length === 2)
  FakeSocket.all[1].welcome("s2")
  await waitFor(() => subscribedSessions.length === 2)

  expect(subscribedSessions).toEqual(["s1", "s2"])
  await chat.disconnect()
})

test("twitch chat follows session_reconnect without resubscribing", async () => {
  const chat = new TwitchChat("client", "bearer", 0)
  await connectTwitch(chat, "s1")
  const first = FakeSocket.all[0]

  first.receive({
    metadata: { message_id: "m", message_type: "session_reconnect", message_timestamp: "" },
    payload: { session: { id: "s1", status: "reconnecting", reconnect_url: "wss://next", connected_at: "" } },
  })
  await waitFor(() => FakeSocket.all.length === 2)
  const second = FakeSocket.all[1]
  expect(second.url).toBe("wss://next")
  second.welcome("s1")
  await waitFor(() => first.closed)
  await tick()

  expect(FakeSocket.all.length).toBe(2)
  expect(subscribedSessions).toEqual(["s1"])

  const events: Array<string> = []
  chat.on("chat", e => events.push(e.id))
  second.receive({
    metadata: {
      message_id: "m",
      message_type: "notification",
      message_timestamp: "2024-01-01T00:00:00Z",
      subscription_type: "channel.chat.message",
    },
    payload: { event: { message_id: "hello" } },
  })
  expect(events).toEqual(["hello"])
  await chat.disconnect()
})

test("twitch chat does not reconnect after disconnect", async () => {
  const chat = new TwitchChat("client", "bearer", 0)
  await connectTwitch(chat, "s1")
  await chat.disconnect()
  await tick()
  await tick()
  expect(FakeSocket.all.length).toBe(1)
  expect(FakeSocket.all[0].closed).toBe(true)
})

test("kick chat disconnect closes the socket", async () => {
  const chat = new KickChat("someone")
  await chat.connectFeed()
  expect(FakeSocket.all.length).toBe(1)
  await chat.disconnect()
  expect(FakeSocket.all[0].closed).toBe(true)
})
