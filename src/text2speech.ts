import { useMemo } from "react";
import { useLocation } from "react-router-dom";

function useQuery() {
  const { search } = useLocation();
  return useMemo(() => new URLSearchParams(search), [search]);
}

interface TextToSpeechConfig {
  voiceURI: string | null;
  minSats: number;
  volume: number;
}

export function useTextToSpeechParams(): TextToSpeechConfig {
  const q = useQuery();
  const voiceURI = q.get("voiceURI");
  const minSats = Number(q.get("minSats")) ?? 21;
  const volume = Number(q.get("volume")) ?? 1;
  return { voiceURI, minSats, volume };
}

interface TextToSpeechConfigParams {
  voiceURI: string | null;
  minSats: number | null;
  volume: number | null;
}

export function toTextToSpeechParams(config: TextToSpeechConfigParams): URLSearchParams {
  const params = new URLSearchParams();
  if (config.voiceURI) {
    params.set("voiceURI", config.voiceURI);
  }
  if (config.minSats) {
    params.set("minSats", String(config.minSats));
  }
  if (config.volume) {
    params.set("volume", String(config.volume));
  }
  return params;
}

export function getVoices() {
  if ("speechSynthesis" in window) {
    return speechSynthesis.getVoices();
  }
  return [];
}

export function speak(voice: SpeechSynthesisVoice, text: string, volume: number) {
  try {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.voice = voice;
    utterance.volume = volume;
    utterance.rate = 0.8;
    speechSynthesis.speak(utterance);
  } catch (e) {
    console.error(e);
  }
}
