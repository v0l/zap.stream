import * as Watch from "@moq/watch"
import { useEffect, useRef } from "react"

export default function MoqPlayer({ stream, id }: { stream: string; id?: string }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!stream || !id || !canvas) return

    const connection = new Watch.Net.Connection({
      url: new URL(stream.replace("moq://", "https://")),
      enabled: true,
    })
    const player = new Watch.Player({
      origin: connection.origin,
      probe: connection.probe,
      name: Watch.Net.Path.from(id),
      canvas,
    })

    return () => {
      player.close()
      connection.close()
    }
  }, [stream, id])

  return <canvas ref={canvasRef}></canvas>
}
