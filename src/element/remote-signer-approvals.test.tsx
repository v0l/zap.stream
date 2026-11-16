import "@/test/dom"
import { expect, test } from "bun:test"
import { act } from "react"
import { createRoot } from "react-dom/client"
import { IntlProvider } from "react-intl"
import { waitFor } from "@testing-library/dom"
import { RemoteApprovals } from "@/remote-approvals"
import { RemoteSigner } from "@/remote-signer"
import { Nip46Fixture } from "@/test/nip46-fixture"
import { RemoteSignerApprovals } from "./remote-signer-approvals"

;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true

function render() {
  const element = document.createElement("div")
  const root = createRoot(element)
  act(() =>
    root.render(
      <IntlProvider locale="en">
        <RemoteSignerApprovals />
      </IntlProvider>,
    ),
  )
  return { element, close: () => act(() => root.unmount()) }
}

test("a restored signer shows a safe approval link outside the login form and completes after approval", async () => {
  using fixture = new Nip46Fixture()
  const initial = await RemoteSigner.connect(fixture.bunkerUri)
  const saved = initial.connection
  initial.close()
  fixture.approvalUrl = "https://signer.example/approve"
  const restored = RemoteSigner.restore(saved)
  const ui = render()
  try {
    const pending = restored.getPubKey().then(
      pubkey => ({ pubkey }),
      error => ({ error }),
    )
    await act(async () => await waitFor(() => expect(ui.element.querySelector("a")?.href).toBe(fixture.approvalUrl)))
    const link = ui.element.querySelector("a")
    expect(link?.target).toBe("_blank")
    expect(link?.rel).toBe("noopener noreferrer")
    expect(ui.element.textContent).toContain("signer.example")
    await act(async () => {
      fixture.approvePending()
      expect(await pending).toEqual({ pubkey: fixture.pubkey })
    })
    expect(ui.element.querySelector("aside")).toBeNull()
  } finally {
    act(() => restored.close())
    ui.close()
  }
})

test("cancelling a displayed approval rejects pending signing and removes the link", async () => {
  using fixture = new Nip46Fixture()
  const signer = await RemoteSigner.connect(fixture.bunkerUri)
  await signer.init()
  fixture.approvalUrl = "https://signer.example/sign"
  const ui = render()
  try {
    const result = signer.sign({ kind: 1311, created_at: 1_800_000_000, content: "pending", tags: [] }).then(
      () => "signed",
      (error: Error) => error.message,
    )
    await act(async () => await waitFor(() => expect(ui.element.querySelector("button")).not.toBeNull()))
    act(() => ui.element.querySelector("button")?.click())
    expect(await result).toContain("closed")
    expect(ui.element.querySelector("aside")).toBeNull()
    expect(signer.closed).toBe(true)
  } finally {
    act(() => signer.close())
    ui.close()
  }
})

test.each(["timeout", "unsafe"])(
  "an %s approval failure closes the connection and clears the prompt",
  async failure => {
    using fixture = new Nip46Fixture()
    const initial = await RemoteSigner.connect(fixture.bunkerUri)
    const saved = initial.connection
    initial.close()
    fixture.approvalUrl = failure === "unsafe" ? "javascript:alert(1)" : "https://signer.example/approve"
    const restored = RemoteSigner.restore(saved, { timeoutMs: 2_000 })
    const ui = render()
    try {
      const pending = restored.getPubKey().then(
        () => "approved",
        (error: Error) => error.message,
      )
      if (failure === "timeout") {
        await act(async () => await waitFor(() => expect(ui.element.querySelector("a")).not.toBeNull()))
      }
      await act(async () => expect(await pending).toContain(failure === "timeout" ? "timed out" : "closed"))
      expect(restored.closed).toBe(true)
      expect(ui.element.querySelector("aside")).toBeNull()
    } finally {
      act(() => restored.close())
      ui.close()
    }
  },
)

test("unsafe approval links are rejected and separate connections keep their own pending approvals", () => {
  const owner = Symbol()
  const other = Symbol()
  const cancel = () => RemoteApprovals.clear(owner)
  const ui = render()
  try {
    for (const url of [
      "javascript:alert(1)",
      "http://signer.example/approve",
      "https://user:secret@signer.example/",
      "bad",
    ]) {
      expect(RemoteApprovals.show(owner, url, cancel)).toBeUndefined()
    }
    act(() => {
      RemoteApprovals.show(owner, "https://first.example/", cancel)
      RemoteApprovals.show(other, "https://second.example/", () => {})
      RemoteApprovals.show(owner, "https://first.example/", cancel)
    })
    expect(ui.element.querySelectorAll("a")).toHaveLength(2)
    act(() => RemoteApprovals.clear(owner))
    expect(ui.element.querySelectorAll("a")).toHaveLength(1)
    expect(ui.element.querySelector("a")?.host).toBe("second.example")
  } finally {
    act(() => {
      RemoteApprovals.clear(owner)
      RemoteApprovals.clear(other)
    })
    ui.close()
  }
})
