import { FormattedMessage } from "react-intl"

export function AcceptTos({
  provider,
  tosLink,
  tos,
  setTos,
}: {
  provider?: string
  tosLink?: string
  tos: boolean
  setTos: (f: (r: boolean) => boolean) => void
}) {
  return (
    <div>
      <label className="flex gap-2 cursor-pointer select-none">
        <input type="checkbox" checked={tos} onChange={e => setTos(() => e.target.checked)} />
        <p>
          <FormattedMessage
            defaultMessage="I have read and agree with {provider}'s {terms}."
            values={{
              provider,
              terms: (
                <button
                  type="button"
                  className="text-primary"
                  onClick={e => {
                    e.stopPropagation()
                    window.open(tosLink, "popup", "width=400,height=800")
                  }}
                >
                  <FormattedMessage defaultMessage="terms and conditions" />
                </button>
              ),
            }}
          />
        </p>
      </label>
    </div>
  )
}
