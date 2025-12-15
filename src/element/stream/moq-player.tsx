import * as Hang from "@kixelated/hang";

import { useEffect, useRef, useState } from "react";

interface MoqState {
    conn: Hang.Moq.Connection.Reload,
    broadcast: Hang.Watch.Broadcast,
    video: Hang.Watch.Video.Renderer,
    audio: Hang.Watch.Audio.Emitter,
}

export default function MoqPlayer({ stream, id }: { stream: string, id?: string }) {
    const [_moq, setMoq] = useState<MoqState>();
    const canvasRef = useRef<HTMLCanvasElement | null>(null);

    useEffect(() => {
        console.debug(stream, id, canvasRef.current);
        if (!stream || !id || !canvasRef.current) return;

        const conn = new Hang.Moq.Connection.Reload({
            enabled: true,
            url: new URL(stream.replace("moq://", "https://"))
        });

        const broadcast = new Hang.Watch.Broadcast({
            connection: conn.established,
            path: Hang.Moq.Path.from(`/${id}`),
            enabled: true
        });

        const video = new Hang.Watch.Video.Renderer(broadcast.video, { canvas: canvasRef.current });
        const audio = new Hang.Watch.Audio.Emitter(broadcast.audio, {});

        const state = {
            conn, broadcast, video, audio
        };
        console.debug(state)
        setMoq(state)

    }, [stream, id, canvasRef]);

    return <canvas ref={canvasRef}></canvas>
}