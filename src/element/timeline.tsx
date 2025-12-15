import { type HTMLProps, useRef, useEffect } from "react";

type TimelineProps = {
  length: number;
  offset: number;
  setLength: (n: number) => void;
  setOffset: (n: number) => void;
} & Omit<HTMLProps<HTMLCanvasElement>, "ref">;

export function TimelineBar({
  length: pLength,
  offset: pOffset,
  setLength: pSetLength,
  setOffset: pSetOffset,
  ...props
}: TimelineProps) {
  const ref = useRef<HTMLCanvasElement | null>(null);

  function setupHandler(canvas: HTMLCanvasElement) {
    const rect = canvas.getBoundingClientRect();
    let draggingOffset = false;
    let draggingLength = false;
    let offset = pOffset;
    let length = pLength;

    function getBodyRect() {
      const x = canvas.width * offset;
      const w = Math.max(10, canvas.width * length);
      return {
        x,
        y: 0,
        w,
        h: canvas.height,
      };
    }

    function getDragHandleRect() {
      const x = canvas.width * (offset + length);
      const w = 5;
      return {
        x,
        y: 0,
        w,
        h: canvas.height,
      };
    }

    function render() {
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      ctx.lineWidth = 1;
      ctx.strokeStyle = "white";
      ctx.strokeRect(0, 0, canvas.width, canvas.height);

      const drawBody = () => {
        const { x, y, w, h } = getBodyRect();
        ctx.fillStyle = "white";
        ctx.fillRect(x, y, w, h);
      };
      const drawHandle = () => {
        const { x, y, w, h } = getDragHandleRect();
        ctx.fillStyle = "#ccc";
        ctx.fillRect(x, y, w, h);
      };

      drawBody();
      drawHandle();

      requestAnimationFrame(render);
    }

    function scaleX(x: number) {
      return (x / rect.width) * canvas.width;
    }

    function getEventLocation(event: MouseEvent | TouchEvent): { x: number } {
      if (event instanceof TouchEvent) {
        return {
          x: scaleX(event.touches[0].clientX - rect.x),
        };
      } else {
        // MouseEvent
        return {
          x: scaleX(event.clientX - rect.x),
        };
      }
    }

    function xOfBody(x: number) {
      const { w } = getBodyRect();
      return Math.min(1 - length, Math.max(0, (x - w / 2) / canvas.width));
    }

    function xOfHandle(x: number) {
      const { w } = getDragHandleRect();
      return Math.min(1, Math.max(0.1, (x - w / 2) / canvas.width - offset));
    }

    function handleStart(event: MouseEvent | TouchEvent) {
      event.preventDefault();
      const { x } = getEventLocation(event);
      const body = getBodyRect();
      if (x >= body.x && x <= body.x + body.w) {
        draggingOffset = true;
        console.debug("dragging offset");
      }
      const handle = getDragHandleRect();
      if (x >= handle.x && x <= handle.x + handle.w) {
        draggingLength = true;
        console.debug("dragging length");
      }
    }

    function handleMove(event: MouseEvent | TouchEvent) {
      event.preventDefault();
      const { x } = getEventLocation(event);
      if (draggingLength) {
        const newVal = xOfHandle(x);
        length = newVal;
      } else if (draggingOffset) {
        const newVal = xOfBody(x);
        offset = newVal;
      }
    }

    function handleEnd(event: MouseEvent | TouchEvent) {
      event.preventDefault();
      const { x } = getEventLocation(event);
      console.debug("drag end");
      if (draggingLength) {
        const newVal = xOfHandle(x);
        pSetLength(newVal);
      } else if (draggingOffset) {
        const newVal = xOfBody(x);
        pSetOffset(newVal);
      }
      draggingLength = false;
      draggingOffset = false;
    }

    // Add mouse event listeners
    canvas.addEventListener("mousedown", handleStart);
    canvas.addEventListener("mousemove", handleMove);
    canvas.addEventListener("mouseup", handleEnd);
    canvas.addEventListener("mouseleave", handleEnd);

    // Add touch event listeners
    canvas.addEventListener("touchstart", handleStart);
    canvas.addEventListener("touchmove", handleMove);
    canvas.addEventListener("touchend", handleEnd);

    requestAnimationFrame(render);
  }

  useEffect(() => {
    if (ref.current) {
      console.debug("Setup render loop");
      setupHandler(ref.current);
    }
  }, [ref.current]);
  return <canvas {...props} ref={ref}></canvas>;
}
