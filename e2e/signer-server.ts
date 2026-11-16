import { Nip46Fixture } from "../src/test/nip46-fixture"

const fixtures = new Map<string, Nip46Fixture>()
const server = Bun.serve({
  hostname: "127.0.0.1",
  port: 5180,
  async fetch(request) {
    const path = new URL(request.url).pathname
    if (path === "/health") return new Response("ready")
    if (path === "/fixtures" && request.method === "POST") {
      const options = (await request.json()) as { secret?: string }
      const id = crypto.randomUUID()
      const fixture = new Nip46Fixture(options)
      fixtures.set(id, fixture)
      return Response.json({ id, bunkerUri: fixture.bunkerUri, pubkey: fixture.pubkey, relayUrl: fixture.relayUrl })
    }
    const [, , id, action] = path.split("/")
    const fixture = fixtures.get(id)
    if (!fixture) return new Response("not found", { status: 404 })
    if (request.method === "DELETE") {
      fixture[Symbol.dispose]()
      fixtures.delete(id)
      return new Response("closed")
    }
    if (action === "pair" && request.method === "POST") {
      const { uri } = (await request.json()) as { uri: string }
      await fixture.waitForSubscription(new URL(uri).hostname)
      fixture.acceptPairing(uri)
      return new Response("paired")
    }
    return new Response("not found", { status: 404 })
  },
})
function close() {
  for (const fixture of fixtures.values()) fixture[Symbol.dispose]()
  void server.stop(true)
  process.exit(0)
}
process.on("SIGINT", close)
process.on("SIGTERM", close)
