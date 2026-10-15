import { RefreshCw } from "lucide-react";
import { useState } from "react";

const DIGITS = {
  "0": ["01110", "10001", "10011", "10101", "11001", "10001", "01110"],
  "3": ["11110", "00001", "00001", "01110", "00001", "00001", "11110"],
  "8": ["01110", "10001", "10001", "01110", "10001", "10001", "01110"],
} as const;

type Digit = keyof typeof DIGITS;

const OUTPUTS: Record<Digit, { label: string; score: number }[]> = {
  "0": [
    { label: "0", score: 0.93 },
    { label: "3", score: 0.03 },
    { label: "8", score: 0.04 },
  ],
  "3": [
    { label: "0", score: 0.06 },
    { label: "3", score: 0.91 },
    { label: "8", score: 0.03 },
  ],
  "8": [
    { label: "0", score: 0.08 },
    { label: "3", score: 0.04 },
    { label: "8", score: 0.88 },
  ],
};

const LAYERS = [3, 6, 5, 3];
const LAYER_X = [58, 170, 282, 394];

export function NeuralNetworkVisualizer() {
  const [digit, setDigit] = useState<Digit>("3");
  const [replay, setReplay] = useState(0);

  return (
    <section
      className="mx-auto max-w-6xl px-6 pb-16 md:pb-24"
      aria-labelledby="visual-intuition-title"
    >
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 font-mono text-[11px] uppercase tracking-[0.25em] text-muted-foreground">
            <span className="inline-block h-px w-8 bg-silver" />A visual intuition
          </div>
          <h2
            id="visual-intuition-title"
            className="mt-4 font-display text-3xl font-semibold tracking-tight md:text-5xl"
          >
            Watch an idea become a prediction.
          </h2>
        </div>
        <span className="chip rounded-full px-3 py-1 font-mono text-[10px] uppercase tracking-[0.2em] text-silver">
          784 inputs · 10 outputs
        </span>
      </div>

      <div className="grid gap-px border border-hairline bg-hairline lg:grid-cols-[0.7fr_1.3fr]">
        <div className="grid-backdrop bg-background p-5 sm:p-7">
          <div className="flex items-center justify-between gap-4">
            <div>
              <div className="font-mono text-[10px] uppercase tracking-widest text-silver">
                Input image
              </div>
              <p className="mt-1 text-sm text-muted-foreground">A tiny sketch becomes numbers.</p>
            </div>
            <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
              5 × 7 preview
            </div>
          </div>

          <div
            className="mx-auto mt-8 grid aspect-square w-full max-w-[248px] grid-cols-5 gap-1.5 border border-hairline bg-card/60 p-3 sm:gap-2 sm:p-4"
            role="img"
            aria-label={`Pixel sketch of the digit ${digit}`}
          >
            {DIGITS[digit].flatMap((row, rowIndex) =>
              [...row].map((cell, columnIndex) => (
                <span
                  key={`${rowIndex}-${columnIndex}`}
                  className="aspect-square rounded-[2px] transition-all duration-500"
                  style={{
                    backgroundColor: cell === "1" ? "var(--accent)" : "var(--surface-3)",
                    opacity: cell === "1" ? 0.9 : 0.3,
                    boxShadow:
                      cell === "1"
                        ? "0 0 16px color-mix(in oklab, var(--accent) 35%, transparent)"
                        : "none",
                  }}
                />
              )),
            )}
          </div>

          <div className="mt-7 flex flex-wrap items-center justify-between gap-3">
            <div className="flex gap-2" aria-label="Choose a digit to send through the network">
              {(Object.keys(DIGITS) as Digit[]).map((option) => (
                <button
                  key={option}
                  type="button"
                  aria-pressed={digit === option}
                  onClick={() => setDigit(option)}
                  className={`flex h-10 w-10 items-center justify-center rounded-lg border font-display text-xl transition-colors ${
                    digit === option
                      ? "border-silver bg-foreground text-background"
                      : "border-hairline text-muted-foreground hover:border-silver"
                  }`}
                >
                  {option}
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={() => setReplay((value) => value + 1)}
              className="btn-ghost rounded-lg px-3 py-2 font-mono text-[10px] uppercase tracking-widest"
            >
              <RefreshCw size={13} /> Replay signal
            </button>
          </div>
        </div>

        <div className="bg-card/40 p-5 sm:p-7">
          <div className="flex items-center justify-between gap-4">
            <div>
              <div className="font-mono text-[10px] uppercase tracking-widest text-silver">
                Forward pass
              </div>
              <p className="mt-1 text-sm text-muted-foreground">Activations move left to right.</p>
            </div>
            <span className="inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-accent" /> Live
            </span>
          </div>

          <div className="mt-6 overflow-hidden rounded-xl border border-hairline bg-background/70 p-3 sm:p-5">
            <NetworkDiagram digit={digit} replay={replay} />
          </div>

          <div className="mt-5 grid gap-3">
            <div className="flex items-center justify-between font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
              <span>Output layer</span>
              <span>confidence</span>
            </div>
            {OUTPUTS[digit].map((output) => (
              <div
                key={output.label}
                className="grid grid-cols-[1.5rem_1fr_3rem] items-center gap-3"
              >
                <span
                  className={`font-display text-lg ${output.label === digit ? "text-silver" : "text-muted-foreground"}`}
                >
                  {output.label}
                </span>
                <div className="h-2 overflow-hidden rounded-full bg-surface-3">
                  <div
                    className="h-full rounded-full bg-accent transition-all duration-700"
                    style={{
                      width: `${output.score * 100}%`,
                      opacity: output.label === digit ? 1 : 0.35,
                    }}
                  />
                </div>
                <span className="text-right font-mono text-[10px] text-muted-foreground">
                  {Math.round(output.score * 100)}%
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-px border-x border-b border-hairline bg-hairline sm:grid-cols-4">
        <Metric label="Input" value="784 pixels" />
        <Metric label="Hidden layers" value="16 + 16" />
        <Metric label="Learned values" value="13,002" />
        <Metric label="Prediction" value={digit} />
      </div>
    </section>
  );
}

function NetworkDiagram({ digit, replay }: { digit: Digit; replay: number }) {
  const points = LAYERS.flatMap((count, layerIndex) =>
    Array.from({ length: count }, (_, nodeIndex) => ({
      layerIndex,
      nodeIndex,
      x: LAYER_X[layerIndex]!,
      y: 40 + (nodeIndex + 1) * (128 / (count + 1)),
    })),
  );

  return (
    <svg
      key={`${digit}-${replay}`}
      viewBox="0 0 452 190"
      className="h-auto w-full"
      role="img"
      aria-label={`Neural network predicting digit ${digit}`}
    >
      <defs>
        <linearGradient id="signal-line" x1="0" x2="1">
          <stop offset="0" stopColor="var(--accent)" stopOpacity="0.12" />
          <stop offset="0.5" stopColor="var(--accent)" stopOpacity="0.8" />
          <stop offset="1" stopColor="var(--accent)" stopOpacity="0.12" />
        </linearGradient>
      </defs>

      {LAYERS.slice(0, -1).flatMap((count, layerIndex) => {
        const current = points.filter((point) => point.layerIndex === layerIndex);
        const next = points.filter((point) => point.layerIndex === layerIndex + 1);
        return current.flatMap((source) =>
          next.map((target) => {
            const strength =
              activation(digit, source.layerIndex, source.nodeIndex) *
              activation(digit, target.layerIndex, target.nodeIndex);
            return (
              <line
                key={`${layerIndex}-${source.nodeIndex}-${target.nodeIndex}`}
                x1={source.x}
                y1={source.y}
                x2={target.x}
                y2={target.y}
                stroke={strength > 0.45 ? "url(#signal-line)" : "var(--hairline)"}
                strokeOpacity={0.16 + strength * 0.55}
                strokeWidth={0.5 + strength * 1.15}
              />
            );
          }),
        );
      })}

      {points.map((point) => {
        const value = activation(digit, point.layerIndex, point.nodeIndex);
        return (
          <g key={`${point.layerIndex}-${point.nodeIndex}`}>
            <circle
              cx={point.x}
              cy={point.y}
              r={3.5 + value * 3.3}
              fill="var(--surface-1)"
              stroke="var(--accent)"
              strokeOpacity={0.35 + value * 0.65}
              strokeWidth="1.4"
            />
            <circle
              cx={point.x}
              cy={point.y}
              r={1.2 + value * 1.5}
              fill="var(--accent)"
              opacity={0.3 + value * 0.7}
              className="animate-pulse"
              style={{ animationDelay: `${(point.nodeIndex + point.layerIndex) * 80}ms` }}
            />
          </g>
        );
      })}

      {["pixels", "hidden", "hidden", "guess"].map((label, index) => (
        <text
          key={label + index}
          x={LAYER_X[index]}
          y="181"
          textAnchor="middle"
          fill="var(--muted-foreground)"
          fontFamily="var(--font-mono)"
          fontSize="7"
          letterSpacing="1.4"
        >
          {label.toUpperCase()}
        </text>
      ))}
    </svg>
  );
}

function activation(digit: Digit, layerIndex: number, nodeIndex: number) {
  const selected = Number(digit);
  const wave = Math.sin((selected + 1) * (nodeIndex + 2) * (layerIndex + 1)) * 0.16;
  const base =
    layerIndex === 0
      ? 0.42 + ((selected + nodeIndex) % 3) * 0.13
      : 0.46 + ((selected * 2 + nodeIndex * 3 + layerIndex) % 4) * 0.1;
  return Math.max(0.2, Math.min(1, base + wave));
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-background p-4 sm:p-5">
      <div className="font-display text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
        {value}
      </div>
      <div className="mt-1 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
        {label}
      </div>
    </div>
  );
}
