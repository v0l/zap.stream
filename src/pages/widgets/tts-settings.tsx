import { useMemo, useState } from "react"
import { FormattedMessage, useIntl } from "react-intl"

import { DefaultButton } from "@/element/buttons"
import { speak, useVoices } from "@/text2speech"
import { groupBy } from "@/utils"

export interface TtsSettings {
  voice: string | null
  minSats: string
  volume: number
}

export function TtsSettingsForm({
  value,
  onChange,
  testText,
  setTestText,
}: {
  value: TtsSettings
  onChange: (v: TtsSettings) => void
  testText: string
  setTestText: (s: string) => void
}) {
  const { formatMessage, formatDisplayName } = useIntl()
  const [enabled, setEnabled] = useState(value.voice !== null)
  const allVoices = useVoices()
  const voices = useMemo(() => allVoices.filter(v => !v.name.includes("Google")), [allVoices])
  const groupedVoices = useMemo(() => groupBy(voices, v => v.lang), [voices])
  const languages = useMemo(() => Object.keys(groupedVoices).sort(), [groupedVoices])
  const selectedVoice = voices.find(v => v.voiceURI === value.voice)

  if (voices.length === 0) {
    return (
      <p className="text-sm text-layer-4">
        <FormattedMessage defaultMessage="Text to speech is not available in this browser." />
      </p>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      <label className="flex items-center gap-3 cursor-pointer select-none">
        <input
          type="checkbox"
          className="accent-primary w-4 h-4"
          checked={enabled}
          onChange={ev => {
            setEnabled(ev.target.checked)
            if (!ev.target.checked) onChange({ ...value, voice: null })
          }}
        />
        <FormattedMessage defaultMessage="Read zap messages aloud" />
      </label>
      {enabled && (
        <>
          <label className="flex flex-col gap-1.5">
            <span className="text-sm text-layer-4">
              <FormattedMessage defaultMessage="Voice" />
            </span>
            <select value={value.voice ?? ""} onChange={ev => onChange({ ...value, voice: ev.target.value || null })}>
              <option value="">{formatMessage({ defaultMessage: "Select voice..." })}</option>
              {languages.map(l => (
                <optgroup key={l} label={formatDisplayName(l, { type: "language" })}>
                  {groupedVoices[l].map(v => (
                    <option key={v.voiceURI} value={v.voiceURI}>
                      {v.name}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col gap-1.5">
              <span className="text-sm text-layer-4">
                <FormattedMessage defaultMessage="Minimum sats" />
              </span>
              <input
                type="number"
                min="1"
                value={value.minSats}
                onChange={ev => onChange({ ...value, minSats: ev.target.value })}
              />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-sm text-layer-4">
                <FormattedMessage defaultMessage="Volume" />
              </span>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                className="accent-primary h-10"
                value={value.volume}
                onChange={ev => onChange({ ...value, volume: Number(ev.target.value) })}
              />
            </label>
          </div>
          {selectedVoice && (
            <div className="flex gap-2">
              <input
                type="text"
                placeholder={formatMessage({ defaultMessage: "Type a message to test" })}
                value={testText}
                onChange={ev => setTestText(ev.target.value)}
              />
              <DefaultButton
                className="shrink-0"
                disabled={testText.length === 0}
                onClick={() => speak(selectedVoice, testText, value.volume)}
              >
                <FormattedMessage defaultMessage="Test voice" />
              </DefaultButton>
            </div>
          )}
        </>
      )}
    </div>
  )
}
