import { useEffect, useRef, useState } from "react"

export const useCopy = (timeout = 2000) => {
  const [error, setError] = useState(false)
  const [copied, setCopied] = useState(false)

  const timer = useRef<ReturnType<typeof setTimeout>>(undefined)

  useEffect(() => () => clearTimeout(timer.current), [])

  const copy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setError(false)
    } catch (_error) {
      setError(true)
    }

    clearTimeout(timer.current)
    timer.current = setTimeout(() => setCopied(false), timeout)
  }

  return { error, copied, copy }
}
