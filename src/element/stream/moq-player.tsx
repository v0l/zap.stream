import * as Hang from "@kixelated/hang"

import { useEffect, useRef } from "react"

export default function MoqPlayer({ stream, id }: { stream: string; id?: string }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)

  useEffect(() => {
    if (!stream || !id || !canvasRef.current) return

    const conn = new Hang.Moq.Connection.Reload({
      enabled: true,
      url: new URL(stream.replace("moq://", "https://")),
    })
    const broadcast = new Hang.Watch.Broadcast({
      connection: conn.established,
      path: Hang.Moq.Path.from(`/${id}`),
      enabled: true,
    })
    const video = new Hang.Watch.Video.Renderer(broadcast.video, { canvas: canvasRef.current })
    const audio = new Hang.Watch.Audio.Emitter(broadcast.audio, {})

    return () => {
      audio.close()
      video.close()
      broadcast.close()
      conn.close()
    }
  }, [stream, id])

  return <canvas ref={canvasRef}></canvas>
}
