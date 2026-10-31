import { StreamState } from "@/const"
import { DefaultButton, PrimaryButton, WarningButton } from "@/element/buttons"
import { CopyField } from "@/element/copy-field"
import { Icon } from "@/element/icon"
import { useCopy } from "@/hooks/copy"
import { DashboardCard } from "@/pages/dashboard/card"
import classNames from "classnames"
import { StatePill } from "@/element/state-pill"
import { useLogin } from "@/hooks/login"
import { useWallet } from "@/hooks/wallet"
import { Login } from "@/login"
import { formatSats } from "@/number"
import { hexToBech32 } from "@snort/shared"
import { NostrConnectWallet, WalletKind } from "@snort/wallet"
import { useEffect, useState } from "react"
import { FormattedMessage } from "react-intl"

const ThemeColors = ["#ffb000", "#7F006A", "#E206BF", "#7406E2", "#3F06E2", "#393939", "#ff563f", "#ff8d2b", "#34d2fe"]

export default function AccountSettingsTab() {
  const login = useLogin()
  const [wallet, setWallet] = useState("")
  const [error, setError] = useState("")
  const nsec = useCopy()
  const current = login?.color ?? ThemeColors[0]

  return (
    <div className="flex flex-col gap-5">
      {login?.pubkey && (
        <DashboardCard title={<FormattedMessage defaultMessage="Account" id="TwyMau" />}>
          <CopyField
            label={<FormattedMessage defaultMessage="Public key" />}
            value={hexToBech32("npub", login.pubkey)}
          />
          {login.privateKey && (
            <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-layer-3">
              <div className="flex flex-col">
                <span className="font-semibold">
                  <FormattedMessage defaultMessage="Private key" />
                </span>
                <span className="text-sm text-layer-4">
                  <FormattedMessage defaultMessage="Anyone with this key can post as you. Keep it in a password manager." />
                </span>
              </div>
              <DefaultButton onClick={() => nsec.copy(hexToBech32("nsec", login.privateKey ?? ""))}>
                <Icon name={nsec.copied ? "check" : "copy"} size={14} />
                {nsec.copied ? (
                  <FormattedMessage defaultMessage="Copied" />
                ) : (
                  <FormattedMessage defaultMessage="Copy" />
                )}
              </DefaultButton>
            </div>
          )}
        </DashboardCard>
      )}
      <DashboardCard
        title={<FormattedMessage defaultMessage="Theme" />}
        headerAction={<StatePill state={StreamState.Live} />}
      >
        <p className="text-sm text-layer-5">
          <FormattedMessage defaultMessage="Accent colour for buttons, live badges and highlights." />
        </p>
        <div className="flex flex-wrap gap-3">
          {ThemeColors.map(a => (
            <button
              type="button"
              key={a}
              aria-label={a}
              aria-pressed={current.toLowerCase() === a.toLowerCase()}
              className={classNames(
                "w-8 h-8 rounded-full cursor-pointer ring-offset-2 ring-offset-layer-1",
                current.toLowerCase() === a.toLowerCase() ? "ring-2 ring-text" : "hover:ring-2 hover:ring-layer-4",
              )}
              title={a}
              style={{ backgroundColor: a }}
              onClick={() => Login.setColor(a)}
            ></button>
          ))}
        </div>
      </DashboardCard>
      <DashboardCard title={<FormattedMessage defaultMessage="Wallet" />}>
        {login?.wallet ? (
          <div className="flex items-center justify-between gap-3">
            <span className="font-display text-2xl font-extrabold tabular-nums">
              <WalletBalance />
            </span>
            <WarningButton
              onClick={() => {
                login.update(s => (s.wallet = undefined))
              }}
            >
              <FormattedMessage defaultMessage="Remove" />
            </WarningButton>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            <p className="text-sm text-layer-5">
              <FormattedMessage defaultMessage="Connect a Nostr Wallet Connect wallet to zap without leaving the stream." />
            </p>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="nostr+walletconnect://"
                value={wallet}
                onChange={e => setWallet(e.target.value)}
              />
              <PrimaryButton
                className="shrink-0"
                disabled={wallet.length === 0}
                onClick={async () => {
                  try {
                    setError("")
                    const w = new NostrConnectWallet(wallet)
                    await w.login()
                    await w.getInfo()
                    login?.update(s => {
                      s.wallet = {
                        type: WalletKind.NWC,
                        data: wallet,
                      }
                    })
                    setWallet("")
                  } catch (e) {
                    if (e instanceof Error) {
                      setError(e.message)
                    }
                  }
                }}
              >
                <FormattedMessage defaultMessage="Connect" />
              </PrimaryButton>
            </div>
            {error && <b className="text-sm text-warning">{error}</b>}
          </div>
        )}
      </DashboardCard>
    </div>
  )
}

function WalletBalance() {
  const wallet = useWallet()
  const [balance, setBalance] = useState(0)

  useEffect(() => {
    setBalance(0)
    if (wallet) {
      wallet.getBalance().then(setBalance)
    }
  }, [wallet])

  return (
    <FormattedMessage
      defaultMessage="{n} sats"
      values={{
        n: formatSats(balance),
      }}
    />
  )
}
