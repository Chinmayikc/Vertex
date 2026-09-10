import { useEffect, useRef } from "react";
import "./DotGrid.css";

export function DotGrid({
  dotSize = 3,
  gap = 24,
  baseColor = "#7f866e",
  activeColor = "#9b7b32",
  proximity = 120,
  shockRadius = 250,
  shockStrength = 5,
  resistance = 750,
  returnDuration = 1.5,
}: {
  dotSize?: number;
  gap?: number;
  baseColor?: string;
  activeColor?: string;
  proximity?: number;
  shockRadius?: number;
  shockStrength?: number;
  resistance?: number;
  returnDuration?: number;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const wrapper = canvas.parentElement;
    if (!wrapper) return;
    let dots: { x: number; y: number; bx: number; by: number; vx: number; vy: number }[] = [];
    let width = 0;
    let height = 0;
    let raf = 0;
    const pointer = { x: -9999, y: -9999 };

    const hex = (color: string) => {
      const raw = color.replace("#", "");
      const value =
        raw.length === 3
          ? raw
              .split("")
              .map((x) => x + x)
              .join("")
          : raw;
      return [
        parseInt(value.slice(0, 2), 16),
        parseInt(value.slice(2, 4), 16),
        parseInt(value.slice(4, 6), 16),
      ];
    };
    const base = hex(baseColor);
    const active = hex(activeColor);

    const resize = () => {
      const rect = wrapper.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      width = rect.width;
      height = rect.height;
      canvas.width = Math.max(1, Math.round(width * dpr));
      canvas.height = Math.max(1, Math.round(height * dpr));
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      dots = [];
      for (let y = gap / 2; y < height; y += gap) {
        for (let x = gap / 2; x < width; x += gap) dots.push({ x, y, bx: x, by: y, vx: 0, vy: 0 });
      }
    };
    const onPointer = (event: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      pointer.x = event.clientX - rect.left;
      pointer.y = event.clientY - rect.top;
    };
    const draw = () => {
      ctx.clearRect(0, 0, width, height);
      for (const dot of dots) {
        const dx = pointer.x - dot.x;
        const dy = pointer.y - dot.y;
        const distance = Math.hypot(dx, dy);
        if (distance < proximity && distance > 0) {
          const force = (1 - distance / proximity) * 0.45;
          dot.vx += (dx / distance) * force;
          dot.vy += (dy / distance) * force;
        }
        dot.vx += (dot.bx - dot.x) * 0.018;
        dot.vy += (dot.by - dot.y) * 0.018;
        dot.vx *= 0.88;
        dot.vy *= 0.88;
        dot.x += dot.vx;
        dot.y += dot.vy;
        const near = Math.max(0, 1 - distance / proximity);
        const color = base.map((channel, i) => Math.round(channel + (active[i] - channel) * near));
        ctx.fillStyle = `rgba(${color.join(",")},${0.22 + near * 0.56})`;
        ctx.beginPath();
        ctx.arc(dot.x, dot.y, dotSize / 2 + near * 1.2, 0, Math.PI * 2);
        ctx.fill();
      }
      raf = requestAnimationFrame(draw);
    };
    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(wrapper);
    window.addEventListener("pointermove", onPointer, { passive: true });
    window.addEventListener("pointerleave", () => {
      pointer.x = -9999;
      pointer.y = -9999;
    });
    raf = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(raf);
      observer.disconnect();
      window.removeEventListener("pointermove", onPointer);
    };
  }, [
    activeColor,
    baseColor,
    dotSize,
    gap,
    proximity,
    resistance,
    returnDuration,
    shockRadius,
    shockStrength,
  ]);

  return <canvas ref={canvasRef} className="dot-grid-canvas" aria-hidden="true" />;
}
