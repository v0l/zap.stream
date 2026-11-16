import { test as base, expect, type Page } from "@playwright/test"
import { finalizeEvent, generateSecretKey, getPublicKey, verifyEvent, type Event } from "nostr-tools/pure"
import { nip19 } from "nostr-tools"
import { encrypt, decrypt, getConversationKey } from "nostr-tools/nip44"

function unwrap<T>(value: T | null | undefined): T {
  if (value == null) throw new Error("Expected fixture value is missing")
  return value
}

const key = generateSecretKey()
const pubkey = getPublicKey(key)
const hex = Array.from(key, b => b.toString(16).padStart(2, "0")).join("")
const test = base.extend<{ published: Event[] }>({
  published: async ({ context }, use) => {
    const events: Event[] = []
    const errors: string[] = []
    const observe = (page: Page) => page.on("pageerror", error => errors.push(error.stack || error.message))
    context.pages().forEach(observe)
    context.on("page", observe)
    await context.route("**/*", route => {
      const url = new URL(route.request().url())
      return ["127.0.0.1", "localhost"].includes(url.hostname) ? route.continue() : route.abort()
    })
    await context.routeWebSocket(/^wss:/, socket =>
      socket.onMessage(raw => {
        const [type, data] = JSON.parse(String(raw))
        if (type === "REQ") socket.send(JSON.stringify(["EOSE", data]))
        if (type === "EVENT") {
          events.push(data)
          socket.send(JSON.stringify(["OK", data.id, true, ""]))
        }
      }),
    )
    await use(events)
    expect(errors, "uncaught browser errors").toEqual([])
  },
})

async function login(page: Page, option: string) {
  await page.goto("/")
  await page.getByRole("button", { name: "Login", exact: true }).click()
  await page.getByRole("button", { name: new RegExp(option) }).click()
}

async function session(page: Page, type: string) {
  await page.waitForFunction(t => JSON.parse(localStorage.getItem("session") ?? "{}").type === t, type)
  return await page.evaluate(
    () => JSON.parse(localStorage.getItem("session") ?? "{}") as { type: string; pubkey: string; privateKey?: string },
  )
}

async function publishLocally(page: Page) {
  return (await page.evaluate(async () => {
    const moduleUrl = "/src/login.ts"
    const { Login, getPublisher } = await import(moduleUrl)
    return await getPublisher(Login.snapshot()).note("automated local check", (eb: { kind: (kind: number) => void }) =>
      eb.kind(1311),
    )
  })) as Event
}

async function logout(page: Page) {
  await page.locator(".profile-menu").click()
  await page.getByRole("menuitem", { name: /Logout/ }).click()
  await expect(page.getByRole("button", { name: "Login", exact: true })).toBeVisible()
  expect(await page.evaluate(() => localStorage.getItem("session"))).toBeNull()
}

async function extension(page: Page, rejection = false, legacy = false) {
  await page.exposeFunction("testPublicKey", () => {
    if (rejection) throw new Error("User rejected extension access")
    return pubkey
  })
  await page.exposeFunction("testSign", (event: Event) => finalizeEvent(event, key))
  await page.exposeFunction("testEncrypt", (peer: string, plain: string) =>
    encrypt(plain, getConversationKey(key, peer)),
  )
  await page.exposeFunction("testDecrypt", (peer: string, cipher: string) =>
    decrypt(cipher, getConversationKey(key, peer)),
  )
  await page.addInitScript(legacy => {
    const bindings = window as unknown as {
      testPublicKey: () => Promise<string>
      testSign: (event: unknown) => Promise<unknown>
      testEncrypt: (peer: string, plain: string) => Promise<string>
      testDecrypt: (peer: string, cipher: string) => Promise<string>
    }
    Object.defineProperty(window, "nostr", {
      value: {
        getPublicKey: () => bindings.testPublicKey(),
        signEvent: (event: unknown) => bindings.testSign(event),
        ...(legacy
          ? {}
          : {
              nip44: {
                encrypt: (peer: string, plain: string) => bindings.testEncrypt(peer, plain),
                decrypt: (peer: string, cipher: string) => bindings.testDecrypt(peer, cipher),
              },
            }),
      },
    })
  }, legacy)
}

test("extension login still signs, reloads and logs out through NIP-07", async ({ page, published }) => {
  expect(published).toHaveLength(0)
  await extension(page)
  await login(page, "Browser extension")
  expect((await session(page, "nip7")).pubkey).toBe(pubkey)
  expect(verifyEvent(await publishLocally(page))).toBe(true)
  await page.reload()
  expect((await session(page, "nip7")).pubkey).toBe(pubkey)
  expect(verifyEvent(await publishLocally(page))).toBe(true)
  await logout(page)
})

test("a NIP-07 provider without optional NIP-44 still signs", async ({ page, published }) => {
  expect(published).toHaveLength(0)
  await extension(page, false, true)
  await login(page, "Browser extension")
  await session(page, "nip7")
  expect(verifyEvent(await publishLocally(page))).toBe(true)
  await logout(page)
})

test("extension rejection and absence leave the user logged out", async ({ page, context, published }) => {
  expect(published).toHaveLength(0)
  await login(page, "Browser extension")
  await expect(page.getByText(/No Nostr extension found/)).toBeVisible()
  expect(await page.evaluate(() => localStorage.getItem("session"))).toBeNull()
  const denied = await context.newPage()
  await extension(denied, true)
  await login(denied, "Browser extension")
  await expect(denied.getByText(/User rejected extension access/)).toBeVisible()
  expect(await denied.evaluate(() => localStorage.getItem("session"))).toBeNull()
})

for (const [name, value] of [
  ["nsec", nip19.nsecEncode(key)],
  ["hex", hex],
]) {
  test(`existing ${name} private-key login signs before and after reload`, async ({ page, published }) => {
    expect(published).toHaveLength(0)
    await login(page, "Private key")
    await page.getByLabel("Private key", { exact: true }).fill(value)
    await page.getByRole("button", { name: "Log In", exact: true }).click()
    expect((await session(page, "private-key")).pubkey).toBe(pubkey)
    expect(verifyEvent(await publishLocally(page))).toBe(true)
    await page.reload()
    await session(page, "private-key")
    expect(verifyEvent(await publishLocally(page))).toBe(true)
    await logout(page)
  })
}

test("invalid private keys leave login open and store no session", async ({ page, published }) => {
  expect(published).toHaveLength(0)
  await login(page, "Private key")
  await page.getByLabel("Private key", { exact: true }).fill("not-a-key")
  await page.getByRole("button", { name: "Log In", exact: true }).click()
  await expect(page.getByText("That doesn't look like a valid private key")).toBeVisible()
  expect(await page.evaluate(() => localStorage.getItem("session"))).toBeNull()
})

test("original account creation saves a usable key and signs its profile without public publishing", async ({
  page,
  published,
}) => {
  await page.goto("/")
  await page.getByRole("button", { name: "Login", exact: true }).click()
  await page.getByRole("button", { name: "Create an account", exact: true }).click()
  await page.getByLabel("Display name").fill("Automated disposable account")
  await page.getByRole("button", { name: "Continue", exact: true }).click()
  await expect(page.getByLabel("Lightning address")).toHaveValue(/@127.0.0.1:5179$/)
  await page.getByLabel("Lightning address").fill("fixture@localhost:5179")
  await page.getByRole("button", { name: "Continue", exact: true }).click()
  await page.getByRole("checkbox").check()
  await page.getByRole("button", { name: "Finish", exact: true }).click()
  const saved = await session(page, "private-key")
  expect(saved.privateKey).toMatch(/^[0-9a-f]{64}$/)
  expect(saved.pubkey).toBe(getPublicKey(Uint8Array.from(Buffer.from(unwrap(saved.privateKey), "hex"))))
  expect(verifyEvent(await publishLocally(page))).toBe(true)
  await expect.poll(() => published.some(event => event.kind === 0)).toBe(true)
  const profile = unwrap(published.find(event => event.kind === 0))
  expect(verifyEvent(profile)).toBe(true)
  expect(JSON.parse(profile.content).name).toBe("Automated disposable account")
  await page.reload()
  expect((await session(page, "private-key")).pubkey).toBe(saved.pubkey)
  await logout(page)
})

for (const pairing of [false, true]) {
  test(`remote signer ${pairing ? "QR" : "bunker"} login signs after reload and logs out across tabs`, async ({
    page,
    context,
    request,
    published,
  }) => {
    expect(published).toHaveLength(0)
    const response = await request.post("http://127.0.0.1:5180/fixtures", {
      data: { secret: pairing ? undefined : "once" },
    })
    const fixture = (await response.json()) as { id: string; pubkey: string; bunkerUri: string; relayUrl: string }
    try {
      await login(page, "Remote signer")
      if (pairing) {
        await page.getByText("Pair by QR code instead", { exact: true }).click()
        await page.getByLabel("Pairing relay").fill(fixture.relayUrl)
        await page.getByRole("button", { name: "Create pairing code", exact: true }).click()
        const link = page.getByRole("textbox", { name: "Signer connection link" })
        await expect(link).toHaveValue(/^nostrconnect:/)
        const uri = await link.inputValue()
        await request.post(`http://127.0.0.1:5180/fixtures/${fixture.id}/pair`, { data: { uri } })
      } else {
        await page.getByLabel("Bunker link").fill(fixture.bunkerUri)
        await page.getByRole("button", { name: "Connect signer", exact: true }).click()
      }
      expect((await session(page, "nip46")).pubkey).toBe(fixture.pubkey)
      expect(verifyEvent(await publishLocally(page))).toBe(true)
      await page.reload()
      await session(page, "nip46")
      expect(verifyEvent(await publishLocally(page))).toBe(true)
      const other = await context.newPage()
      await other.goto("/")
      await session(other, "nip46")
      await logout(page)
      await expect.poll(() => other.evaluate(() => localStorage.getItem("session"))).toBeNull()
      await other.waitForFunction(async () => {
        const moduleUrl = "/src/login.ts"
        return !(await import(moduleUrl)).Login.snapshot()
      })
    } finally {
      await request.delete(`http://127.0.0.1:5180/fixtures/${fixture.id}`)
    }
  })
}
