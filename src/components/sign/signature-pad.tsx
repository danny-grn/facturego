"use client";

import * as React from "react";

export interface SignaturePadHandle {
  clear: () => void;
  isEmpty: () => boolean;
  toDataURL: () => string | null;
}

export const SignaturePad = React.forwardRef<
  SignaturePadHandle,
  { onChange?: (hasSignature: boolean) => void; height?: number }
>(({ onChange, height = 180 }, ref) => {
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const drawingRef = React.useRef(false);
  const hasInkRef = React.useRef(false);
  const lastPointRef = React.useRef<{ x: number; y: number } | null>(null);

  const resize = React.useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ratio = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    if (rect.width === 0) return;
    canvas.width = rect.width * ratio;
    canvas.height = rect.height * ratio;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.scale(ratio, ratio);
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.lineWidth = 2.4;
      ctx.strokeStyle = "#1b1b18";
    }
  }, []);

  React.useEffect(() => {
    resize();
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, [resize]);

  function getPoint(e: React.PointerEvent<HTMLCanvasElement>) {
    const rect = canvasRef.current!.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  }

  function handlePointerDown(e: React.PointerEvent<HTMLCanvasElement>) {
    e.currentTarget.setPointerCapture(e.pointerId);
    drawingRef.current = true;
    lastPointRef.current = getPoint(e);
  }

  function handlePointerMove(e: React.PointerEvent<HTMLCanvasElement>) {
    if (!drawingRef.current) return;
    const ctx = canvasRef.current?.getContext("2d");
    const point = getPoint(e);
    if (ctx && lastPointRef.current) {
      ctx.beginPath();
      ctx.moveTo(lastPointRef.current.x, lastPointRef.current.y);
      ctx.lineTo(point.x, point.y);
      ctx.stroke();
    }
    lastPointRef.current = point;
    if (!hasInkRef.current) {
      hasInkRef.current = true;
      onChange?.(true);
    }
  }

  function handlePointerUp() {
    drawingRef.current = false;
    lastPointRef.current = null;
  }

  React.useImperativeHandle(ref, () => ({
    clear() {
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext("2d");
      if (canvas && ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
      hasInkRef.current = false;
      onChange?.(false);
    },
    isEmpty() {
      return !hasInkRef.current;
    },
    toDataURL() {
      if (!hasInkRef.current) return null;
      return canvasRef.current?.toDataURL("image/png") ?? null;
    },
  }));

  return (
    <div className="relative">
      <canvas
        ref={canvasRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
        style={{ height, touchAction: "none" }}
        className="w-full cursor-crosshair rounded-lg border border-line-strong bg-surface"
      />
      <div
        className="pointer-events-none absolute inset-x-6 border-b border-dashed border-line-strong"
        style={{ bottom: height * 0.28 }}
      />
      <p className="pointer-events-none absolute bottom-2 left-6 text-[11px] text-ink-300">Signez ici</p>
    </div>
  );
});
SignaturePad.displayName = "SignaturePad";
