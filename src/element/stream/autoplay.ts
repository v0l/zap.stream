export async function playWithMutedFallback(el: { muted: boolean; play(): Promise<void> }) {
  try {
    await el.play()
  } catch (e) {
    if (!(e instanceof DOMException) || e.name !== "NotAllowedError" || el.muted) return
    el.muted = true
    await el.play().catch(() => {})
  }
}
