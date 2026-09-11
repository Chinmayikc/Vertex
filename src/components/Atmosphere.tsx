import { motion, useReducedMotion } from "motion/react";
import { DotGrid, Iridescence } from "@/components/AmbientBackground";

/** Decorative layer shared by every public page. It deliberately never captures input. */
export function Atmosphere({
  className = "",
  mesh = false,
}: {
  className?: string;
  /** Hero variant: larger morphing gradient-mesh blobs. */
  mesh?: boolean;
}) {
  const reduceMotion = useReducedMotion();
  const shape = mesh ? "morph-blob" : "rounded-full";

  return (
    <div
      aria-hidden="true"
      className={"pointer-events-none absolute inset-0 isolate overflow-hidden " + className}
    >
      <div className="noise-overlay absolute inset-0" />
      <div className="grid-backdrop absolute inset-0 opacity-35 [mask-image:linear-gradient(to_bottom,black,transparent_78%)]" />

      <div
        className="absolute inset-0 mix-blend-multiply"
        style={{ opacity: mesh ? 0.14 : 0.08 }}
      >
        <Iridescence
          color={[0.42, 0.58, 0.48]}
          mouseReact={false}
          amplitude={mesh ? 0.14 : 0.08}
          speed={mesh ? 0.38 : 0.22}
        />
      </div>

      <div
        className="absolute inset-0 mix-blend-multiply"
        style={{ opacity: mesh ? 0.42 : 0.28 }}
      >
        <DotGrid
          dotSize={3}
          gap={24}
          baseColor="#9baa9c"
          activeColor="#3e5b49"
          proximity={110}
          speedTrigger={85}
          shockRadius={210}
          shockStrength={2.5}
          resistance={900}
          returnDuration={1.2}
        />
      </div>

      <motion.div
        className={"absolute -left-40 -top-56 " + (mesh ? "h-[44rem] w-[44rem]" : "h-[38rem] w-[38rem]") + " " + shape + " bg-[oklch(0.82_0.06_150)]/30 blur-3xl"}
        animate={
          reduceMotion
            ? undefined
            : { x: [0, 70, 0], y: [0, 40, 0], scale: [1, 1.12, 1], rotate: [0, 12, 0] }
        }
        transition={{ duration: mesh ? 21 : 18, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className={"absolute -right-48 top-40 " + (mesh ? "h-[36rem] w-[36rem]" : "h-[30rem] w-[30rem]") + " " + shape + " bg-[oklch(0.88_0.04_130)]/30 blur-3xl"}
        animate={
          reduceMotion
            ? undefined
            : { x: [0, -75, 0], y: [0, -35, 0], scale: [1, 1.08, 1], rotate: [0, -10, 0] }
        }
        transition={{ duration: mesh ? 26 : 22, repeat: Infinity, ease: "easeInOut" }}
      />
      {mesh && (
        <motion.div
          className="morph-blob absolute left-1/3 top-1/2 h-[26rem] w-[26rem] bg-[oklch(0.72_0.09_150)]/25 blur-3xl"
          animate={
            reduceMotion
              ? undefined
              : { x: [0, -60, 40, 0], y: [0, 50, -30, 0], scale: [1, 1.15, 0.95, 1] }
          }
          transition={{ duration: 31, repeat: Infinity, ease: "easeInOut" }}
        />
      )}
      <div className="vignette absolute inset-0" />
    </div>
  );
}
