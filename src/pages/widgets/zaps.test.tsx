import "@/test/dom"
import { expect, mock, test } from "bun:test"
import { Fragment, type ReactNode, act } from "react"
import { createRoot } from "react-dom/client"

function FormattedMessage({ defaultMessage, values }: { defaultMessage: string; values?: Record<string, ReactNode> }) {
  return defaultMessage
    .split(/(\{\w+\})/)
    .map(part => <Fragment key={part}>{part.startsWith("{") ? values?.[part.slice(1, -1)] : part}</Fragment>)
}

mock.module("react-intl", () => ({ FormattedMessage }))

const { ZapAlertItem } = await import("./zaps")
import type { ParsedZap, SystemInterface } from "@snort/system"
import { SnortContext } from "@snort/system-react"

;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true

const noProfiles = {
  profileLoader: {
    cache: { subscribe: () => () => {}, getFromCache: () => undefined },
    TrackKeys: () => {},
    UntrackKeys: () => {},
  },
} as unknown as SystemInterface

function zap(sender?: string): ParsedZap {
  return {
    id: "z1",
    valid: true,
    content: "gm stream",
    zapService: "",
    anonZap: sender === undefined,
    errors: [],
    sender,
    amount: 2100,
    targetEvents: [],
    created_at: 0,
  }
}

function render(item: ParsedZap) {
  const el = document.createElement("div")
  const root = createRoot(el)
  act(() =>
    root.render(
      <SnortContext value={noProfiles}>
        <ZapAlertItem item={item} />
      </SnortContext>,
    ),
  )
  const html = el.textContent ?? ""
  act(() => root.unmount())
  return html
}

test("anon zap still shows an alert", () => {
  const text = render(zap())
  expect(text).toContain("Anon")
  expect(text).toContain("gm stream")
})

test("zap from a sender with no profile shows an alert", () => {
  const text = render(zap("f6a25b87f7e7bec9a691e37851b1b57a7b49fa00bb431280303002a3ebca4891"))
  expect(text).toContain("npub17639hpl")
  expect(text).toContain("gm stream")
})
