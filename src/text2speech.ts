import { useEffect, useMemo, useState } from "react"
import { useLocation } from "react-router"

function useQuery() {
  const { search } = useLocation()
  return useMemo(() => new URLSearchParams(search), [search])
}

interface TextToSpeechConfig {
  voiceURI: string | null
  minSats: number
  volume: number
}

function numberParam(q: URLSearchParams, key: string, fallback: number) {
  const raw = q.get(key)
  if (raw === null || raw.trim() === "") return fallback
  const n = Number(raw)
  return Number.isFinite(n) ? n : fallback
}

export function parseTextToSpeechParams(q: URLSearchParams): TextToSpeechConfig {
  return {
    voiceURI: q.get("voiceURI"),
    minSats: numberParam(q, "minSats", 21),
    volume: numberParam(q, "volume", 1),
  }
}

export function useTextToSpeechParams(): TextToSpeechConfig {
  const q = useQuery()
  return useMemo(() => parseTextToSpeechParams(q), [q])
}

interface TextToSpeechConfigParams {
  voiceURI: string | null
  minSats: number | null
  volume: number | null
}

export function toTextToSpeechParams(config: TextToSpeechConfigParams): URLSearchParams {
  const params = new URLSearchParams()
  if (config.voiceURI) {
    params.set("voiceURI", config.voiceURI)
  }
  if (config.minSats) {
    params.set("minSats", String(config.minSats))
  }
  if (config.volume) {
    params.set("volume", String(config.volume))
  }
  return params
}

export function getVoices() {
  if ("speechSynthesis" in window) {
    return speechSynthesis.getVoices()
  }
  return []
}

export function speak(voice: SpeechSynthesisVoice, text: string, volume: number) {
  try {
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.voice = voice
    utterance.volume = volume
    utterance.rate = 0.8
    speechSynthesis.speak(utterance)
  } catch (e) {
    console.error(e)
  }
}

export function useVoices() {
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>(() => getVoices())
  useEffect(() => {
    if (!("speechSynthesis" in window)) return
    const update = () => setVoices(getVoices())
    update()
    speechSynthesis.addEventListener("voiceschanged", update)
    return () => speechSynthesis.removeEventListener("voiceschanged", update)
  }, [])
  return voices
}
