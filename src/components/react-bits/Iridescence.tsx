import { useEffect, useRef } from "react";
import { Renderer, Program, Mesh, Triangle } from "ogl";
import "./Iridescence.css";

export function Iridescence({
  color = [0.28, 0.36, 0.22],
  speed = 0.35,
  amplitude = 0.08,
  mouseReact = false,
}: {
  color?: [number, number, number];
  speed?: number;
  amplitude?: number;
  mouseReact?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const container = ref.current;
    if (!container) return;
    let renderer: Renderer;
    try {
      renderer = new Renderer({ alpha: true, dpr: Math.min(window.devicePixelRatio, 2) });
    } catch {
      return;
    }
    const gl = renderer.gl;
    gl.clearColor(0, 0, 0, 0);
    container.appendChild(gl.canvas);
    const geometry = new Triangle(gl);
    const program = new Program(gl, {
      vertex: `attribute vec2 uv; attribute vec2 position; varying vec2 vUv; void main(){vUv=uv;gl_Position=vec4(position,0.,1.);}`,
      fragment: `precision highp float; uniform float uTime; uniform vec3 uColor; uniform float uAmplitude; uniform vec2 uMouse; varying vec2 vUv; void main(){vec2 p=vUv-.5; float wave=sin((p.x+p.y)*9.+uTime)*uAmplitude; float glow=.5+.5*sin(uTime*.7+p.x*5.-p.y*3.); vec3 c=uColor*(.72+wave+glow*.18); float alpha=.20+glow*.10; gl_FragColor=vec4(c,alpha);}`,
      uniforms: {
        uTime: { value: 0 },
        uColor: { value: color },
        uAmplitude: { value: amplitude },
        uMouse: { value: [0.5, 0.5] },
      },
      transparent: true,
    });
    const mesh = new Mesh(gl, { geometry, program });
    const mouse = (event: PointerEvent) => {
      const rect = container.getBoundingClientRect();
      program.uniforms.uMouse.value = [
        (event.clientX - rect.left) / rect.width,
        1 - (event.clientY - rect.top) / rect.height,
      ];
    };
    const resize = () => renderer!.setSize(container.clientWidth, container.clientHeight);
    const start = performance.now();
    let raf = 0;
    const frame = (now: number) => {
      program.uniforms.uTime.value = ((now - start) / 1000) * speed;
      renderer!.render({ scene: mesh });
      raf = requestAnimationFrame(frame);
    };
    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(container);
    if (mouseReact) window.addEventListener("pointermove", mouse, { passive: true });
    raf = requestAnimationFrame(frame);
    return () => {
      cancelAnimationFrame(raf);
      observer.disconnect();
      if (mouseReact) window.removeEventListener("pointermove", mouse);
      gl.canvas.remove();
    };
  }, [amplitude, color, mouseReact, speed]);
  return <div ref={ref} className="iridescence" aria-hidden="true" />;
}
