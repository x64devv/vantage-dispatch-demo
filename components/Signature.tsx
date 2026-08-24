'use client';

/* The signature pad, on the tablet.
 *
 * ⚠ Used twice and it is the same pad both times: the driver signing for a load
 * at the goods-out desk, and a customer signing at the counter. Wyne's call,
 * 24 Aug — everything is signed on this device, because the driver app has no
 * accept-custody screen to sign on.
 *
 * ⚠⚠ THE TRAP, and it cost the driver app an afternoon: the canvas backing store
 * is a fixed pixel size and the element is displayed at whatever width the layout
 * gives it. Pointer coordinates are in CSS pixels. Scale them by
 * canvas.width / rect.width on BOTH axes or the ink lands away from the finger —
 * further away the wider the element gets, which is exactly the bug that looks
 * fine on a laptop and is unusable on the tablet.
 *
 * ⚠ touch-action: none, or the page scrolls instead of drawing.
 * ⚠ A single tap must leave a dot, not just a drag.
 */

import { useEffect, useRef, type PointerEvent } from 'react';

const W = 640;
const H = 200;

export default function Signature({
  onInk,
  inked,
  height = 200,
}: {
  onInk: () => void;
  inked: boolean;
  height?: number;
}) {
  const ref = useRef<HTMLCanvasElement | null>(null);
  const drawing = useRef(false);
  const last = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    const c = ref.current;
    if (!c) return;
    const ctx = c.getContext('2d');
    if (!ctx) return;
    if (!inked) ctx.clearRect(0, 0, W, H);
  }, [inked]);

  const pt = (e: PointerEvent<HTMLCanvasElement>) => {
    const c = ref.current!;
    const r = c.getBoundingClientRect();
    return { x: (e.clientX - r.left) * (c.width / r.width), y: (e.clientY - r.top) * (c.height / r.height) };
  };

  const stroke = (from: { x: number; y: number } | null, to: { x: number; y: number }) => {
    const ctx = ref.current!.getContext('2d')!;
    ctx.strokeStyle = '#201e1d';
    ctx.fillStyle = '#201e1d';
    ctx.lineWidth = 2.8;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    if (!from) {
      // A single tap leaves a dot.
      ctx.beginPath();
      ctx.arc(to.x, to.y, 1.4, 0, Math.PI * 2);
      ctx.fill();
      return;
    }
    ctx.beginPath();
    ctx.moveTo(from.x, from.y);
    ctx.lineTo(to.x, to.y);
    ctx.stroke();
  };

  return (
    <canvas
      ref={ref}
      width={W}
      height={H}
      data-testid="signature"
      style={{
        width: '100%',
        height,
        display: 'block',
        border: '1px solid var(--color-divider)',
        background: 'var(--color-bg)',
        touchAction: 'none',
        cursor: 'crosshair',
      }}
      onPointerDown={(e) => {
        e.currentTarget.setPointerCapture(e.pointerId);
        drawing.current = true;
        const p = pt(e);
        stroke(null, p);
        last.current = p;
        onInk();
      }}
      onPointerMove={(e) => {
        if (!drawing.current) return;
        const p = pt(e);
        stroke(last.current, p);
        last.current = p;
      }}
      onPointerUp={() => {
        drawing.current = false;
        last.current = null;
      }}
      onPointerLeave={() => {
        drawing.current = false;
        last.current = null;
      }}
    />
  );
}
