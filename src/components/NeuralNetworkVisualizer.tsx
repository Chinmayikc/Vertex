import { RefreshCw } from "lucide-react";
import { type CSSProperties, useMemo, useState } from "react";

const IMAGE_SIZE = 28;
const HIDDEN_SIZE = 16;
const INPUT_SIZE = IMAGE_SIZE * IMAGE_SIZE;

const GLYPHS = {
  "0": ["01110", "10001", "10011", "10101", "11001", "10001", "01110"],
  "1": ["00100", "01100", "00100", "00100", "00100", "00100", "01110"],
  "2": ["01110", "10001", "00001", "00010", "00100", "01000", "11111"],
  "3": ["11110", "00001", "00001", "01110", "00001", "00001", "11110"],
  "4": ["00010", "00110", "01010", "10010", "11111", "00010", "00010"],
  "5": ["11111", "10000", "10000", "11110", "00001", "00001", "11110"],
  "6": ["01110", "10000", "10000", "11110", "10001", "10001", "01110"],
  "7": ["11111", "00001", "00010", "00100", "01000", "01000", "01000"],
  "8": ["01110", "10001", "10001", "01110", "10001", "10001", "01110"],
  "9": ["01110", "10001", "10001", "01111", "00001", "00001", "01110"],
} as const;

type Digit = keyof typeof GLYPHS;
type Point = { x: number; y: number };
type ForwardPass = {
  input: number[];
  hiddenOne: number[];
  hiddenTwo: number[];
  output: number[];
};

const DIGITS = Object.keys(GLYPHS) as Digit[];
const FEATURE_MASKS = Array.from({ length: HIDDEN_SIZE }, (_, featureIndex) =>
  Array.from({ length: INPUT_SIZE }, (_, pixelIndex) => {
    const x = pixelIndex % IMAGE_SIZE;
    const y = Math.floor(pixelIndex / IMAGE_SIZE);
    return featureWeight(featureIndex, x, y);
  }),
);
const HIDDEN_WEIGHTS = Array.from({ length: HIDDEN_SIZE }, (_, target) =>
  Array.from({ length: HIDDEN_SIZE }, (_, source) =>
    target === source ? 4 : (target + source) % 5 === 0 ? 0.65 : -0.15,
  ),
);
const DIGIT_PIXELS = Object.fromEntries(
  DIGITS.map((digit) => [digit, rasterizeGlyph(GLYPHS[digit])]),
) as Record<Digit, number[]>;
const PROTOTYPES = Object.fromEntries(
  DIGITS.map((digit) => [
    digit,
    hiddenLayer(hiddenLayer(DIGIT_PIXELS[digit], FEATURE_MASKS), HIDDEN_WEIGHTS),
  ]),
) as Record<Digit, number[]>;
const OUTPUT_WEIGHTS = DIGITS.map((digit) => PROTOTYPES[digit].map((value) => value * 36));
const OUTPUT_BIASES = DIGITS.map(
  (digit) => -18 * PROTOTYPES[digit].reduce((sum, value) => sum + value * value, 0),
);

export function NeuralNetworkVisualizer() {
  const [digit, setDigit] = useState<Digit>("3");
  const [replay, setReplay] = useState(0);
  const pass = useMemo(() => forwardPass(DIGIT_PIXELS[digit]), [digit]);
  const prediction = String(pass.output.indexOf(Math.max(...pass.output))) as Digit;
  const referenceStyle = {
    "--nn-theme": "oklch(55% 0.15 240)",
    "--nn-secondary": "oklch(55% 0.15 60)",
    fontFamily: '"Source Serif 4 Variable", var(--font-display)',
  } as CSSProperties;

  return (
    <section
      className="relative isolate mx-auto flex max-w-6xl flex-col gap-4 px-6 py-8 pb-16 md:pb-24"
      style={referenceStyle}
      aria-labelledby="visual-intuition-title"
    >
      <div className="flex flex-wrap items-end justify-between gap-5">
        <div>
          <div className="flex items-center gap-3 font-mono text-[11px] uppercase tracking-[0.25em] text-[var(--nn-theme)]">
            <span className="inline-block h-px w-8 bg-[var(--nn-theme)]" />A visual intuition
          </div>
          <h2
            id="visual-intuition-title"
            className="mt-4 max-w-3xl text-4xl font-normal leading-[1.05] tracking-tight text-foreground md:text-6xl"
          >
            Watch an idea become a prediction.
          </h2>
        </div>
        <div className="font-mono text-sm text-muted-foreground">784 inputs · 10 outputs</div>
      </div>

      <div className="grid gap-8 border-y border-hairline py-8 lg:grid-cols-[0.72fr_1.28fr] lg:gap-12">
        <div className="flex flex-col">
          <div className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
            Input image
          </div>
          <p className="mt-2 max-w-sm text-2xl leading-tight text-foreground">
            A tiny sketch becomes numbers.
          </p>

          <div
            className="mx-auto mt-8 grid aspect-square w-full max-w-[290px] grid-cols-[repeat(28,minmax(0,1fr))] gap-px border border-[color-mix(in_oklab,var(--nn-theme)_30%,transparent)] bg-[color-mix(in_oklab,var(--nn-theme)_5%,transparent)] p-3"
            role="img"
            aria-label={"28 by 28 pixel input image of the digit " + digit}
          >
            {pass.input.map((value, index) => (
              <span
                key={index}
                className="aspect-square"
                style={{
                  backgroundColor: "var(--nn-theme)",
                  opacity: 0.04 + value * 0.96,
                }}
              />
            ))}
          </div>

          <div className="mt-7 flex flex-wrap items-center gap-2" aria-label="Choose a digit">
            {DIGITS.map((option) => (
              <button
                key={option}
                type="button"
                aria-pressed={digit === option}
                onClick={() => setDigit(option)}
                className="flex h-10 w-10 items-center justify-center border border-hairline font-mono text-sm transition-colors hover:border-[var(--nn-theme)] aria-pressed:border-[var(--nn-theme)] aria-pressed:bg-[var(--nn-theme)] aria-pressed:text-white"
              >
                {option}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={() => setReplay((value) => value + 1)}
            className="mt-5 inline-flex w-fit items-center gap-2 font-mono text-xs uppercase tracking-wider text-muted-foreground transition-colors hover:text-[var(--nn-theme)]"
          >
            <RefreshCw size={14} aria-hidden="true" /> Replay signal
          </button>
        </div>

        <div className="min-w-0">
          <div className="flex flex-wrap items-baseline justify-between gap-3">
            <div>
              <div className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
                Forward pass
              </div>
              <p className="mt-2 text-2xl leading-tight text-foreground">
                Activations move left to right.
              </p>
            </div>
            <div className="font-mono text-xs uppercase tracking-wider text-[var(--nn-secondary)]">
              live
            </div>
          </div>

          <div className="mt-8 overflow-hidden border-y border-hairline py-4">
            <NetworkDiagram digit={digit} pass={pass} prediction={prediction} replay={replay} />
          </div>

          <div className="mt-7">
            <div className="flex items-center justify-between font-mono text-xs uppercase tracking-wider text-muted-foreground">
              <span>Output layer · 10 classes</span>
              <span>confidence</span>
            </div>
            <div className="mt-4 grid gap-2.5" aria-live="polite">
              {pass.output.map((score, index) => {
                const label = String(index) as Digit;
                const isPrediction = label === prediction;
                return (
                  <div
                    key={label}
                    className="grid grid-cols-[1.5rem_1fr_3.5rem] items-center gap-3"
                  >
                    <span className={isPrediction ? "text-lg text-[var(--nn-theme)]" : "text-lg"}>
                      {label}
                    </span>
                    <div className="h-2 bg-[color-mix(in_oklab,var(--foreground)_10%,transparent)]">
                      <div
                        className="h-full transition-[width] duration-700"
                        style={{
                          width: score * 100 + "%",
                          backgroundColor: isPrediction
                            ? "var(--nn-theme)"
                            : "color-mix(in oklab, var(--nn-theme) 28%, transparent)",
                        }}
                      />
                    </div>
                    <span className="text-right font-mono text-xs tabular-nums text-muted-foreground">
                      {Math.round(score * 100)}%
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-x-8 gap-y-5 border-b border-hairline pb-6 sm:grid-cols-4">
        <Metric label="Input" value="784 pixels" />
        <Metric label="Hidden layers" value="16 + 16" />
        <Metric label="Parameters" value="13,002" />
        <Metric label="Prediction" value={prediction} />
      </div>
      <p className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
        Self-contained teaching model · deterministic weights · real 784 → 16 → 16 → 10 forward pass
      </p>
    </section>
  );
}

function NetworkDiagram({
  digit,
  pass,
  prediction,
  replay,
}: {
  digit: Digit;
  pass: ForwardPass;
  prediction: Digit;
  replay: number;
}) {
  const inputRect = { x: 8, y: 18, width: 48, height: 145 };
  const hiddenOne = layerPoints(126, HIDDEN_SIZE, 16, 145);
  const hiddenTwo = layerPoints(232, HIDDEN_SIZE, 16, 145);
  const output = layerPoints(340, 10, 10, 150);
  const edges = [
    ...hiddenOne.flatMap((source, sourceIndex) =>
      hiddenTwo.map((target, targetIndex) => ({
        source,
        target,
        strength: pass.hiddenOne[sourceIndex]! * pass.hiddenTwo[targetIndex]!,
        key: "one-two-" + sourceIndex + "-" + targetIndex,
      })),
    ),
    ...hiddenTwo.flatMap((source, sourceIndex) =>
      output.map((target, targetIndex) => ({
        source,
        target,
        strength: pass.hiddenTwo[sourceIndex]! * pass.output[targetIndex]!,
        key: "two-output-" + sourceIndex + "-" + targetIndex,
      })),
    ),
  ];
  const signalEdges = [...edges].sort((a, b) => b.strength - a.strength).slice(0, 12);

  return (
    <svg
      key={digit + "-" + replay}
      viewBox="0 0 372 190"
      className="h-auto w-full"
      role="img"
      aria-label={
        "Neural network forward pass for digit " + digit + ", predicting digit " + prediction
      }
    >
      <title>784 pixel input through two hidden layers to ten output classes</title>
      <defs>
        <linearGradient id="nn-signal-line" x1="0" x2="1">
          <stop offset="0" stopColor="var(--nn-theme)" stopOpacity="0.05" />
          <stop offset="0.5" stopColor="var(--nn-theme)" stopOpacity="0.7" />
          <stop offset="1" stopColor="var(--nn-theme)" stopOpacity="0.05" />
        </linearGradient>
      </defs>

      <rect
        x={inputRect.x}
        y={inputRect.y}
        width={inputRect.width}
        height={inputRect.height}
        rx="2"
        fill="color-mix(in oklab, var(--nn-theme) 5%, transparent)"
        stroke="var(--nn-theme)"
        strokeOpacity="0.25"
      />
      {pass.input.map((value, index) => {
        const x = index % IMAGE_SIZE;
        const y = Math.floor(index / IMAGE_SIZE);
        const width = inputRect.width / IMAGE_SIZE;
        const height = inputRect.height / IMAGE_SIZE;
        return (
          <rect
            key={index}
            x={inputRect.x + x * width}
            y={inputRect.y + y * height}
            width={width + 0.15}
            height={height + 0.15}
            fill="var(--nn-theme)"
            opacity={0.04 + value * 0.9}
          />
        );
      })}

      {hiddenOne.map((target, index) => (
        <line
          key={"input-edge-" + index}
          x1={inputRect.x + inputRect.width}
          y1={inputRect.y + inputRect.height / 2}
          x2={target.x}
          y2={target.y}
          stroke="var(--foreground)"
          strokeOpacity={0.12 + pass.hiddenOne[index]! * 0.2}
          strokeWidth="0.55"
        />
      ))}
      {edges.map((edge) => (
        <line
          key={edge.key}
          x1={edge.source.x}
          y1={edge.source.y}
          x2={edge.target.x}
          y2={edge.target.y}
          stroke={edge.strength > 0.42 ? "url(#nn-signal-line)" : "var(--foreground)"}
          strokeOpacity={0.05 + edge.strength * 0.32}
          strokeWidth={0.3 + edge.strength * 0.75}
        />
      ))}
      {signalEdges.map((edge, index) => (
        <circle key={"signal-" + edge.key} r="1.7" fill="var(--nn-secondary)">
          <animateMotion
            dur="1.8s"
            begin={index * 120 + "ms"}
            repeatCount="1"
            path={
              "M " +
              edge.source.x +
              " " +
              edge.source.y +
              " L " +
              edge.target.x +
              " " +
              edge.target.y
            }
          />
        </circle>
      ))}

      {hiddenOne.map((point, index) => (
        <Neuron key={"hidden-one-" + index} point={point} value={pass.hiddenOne[index]!} />
      ))}
      {hiddenTwo.map((point, index) => (
        <Neuron key={"hidden-two-" + index} point={point} value={pass.hiddenTwo[index]!} />
      ))}
      {output.map((point, index) => (
        <Neuron
          key={"output-" + index}
          point={point}
          value={pass.output[index]!}
          highlighted={index === Number(prediction)}
        />
      ))}

      <DiagramLabel x={32} label="784 PIXELS" />
      <DiagramLabel x={126} label="16 FEATURES" />
      <DiagramLabel x={232} label="16 PATTERNS" />
      <DiagramLabel x={340} label="10 CLASSES" />
    </svg>
  );
}

function Neuron({
  point,
  value,
  highlighted = false,
}: {
  point: Point;
  value: number;
  highlighted?: boolean;
}) {
  return (
    <g>
      <circle
        cx={point.x}
        cy={point.y}
        r={2.7 + value * 3.1}
        fill="var(--background)"
        stroke={highlighted ? "var(--nn-secondary)" : "var(--nn-theme)"}
        strokeOpacity={0.35 + value * 0.65}
        strokeWidth="1.2"
      />
      <circle
        cx={point.x}
        cy={point.y}
        r={0.9 + value * 1.3}
        fill="var(--nn-theme)"
        opacity={0.25 + value * 0.75}
      />
    </g>
  );
}

function DiagramLabel({ x, label }: { x: number; label: string }) {
  return (
    <text
      x={x}
      y="181"
      textAnchor="middle"
      fill="var(--muted-foreground)"
      fontFamily="var(--font-mono)"
      fontSize="6.2"
      letterSpacing="0.9"
    >
      {label}
    </text>
  );
}

function forwardPass(input: number[]): ForwardPass {
  const hiddenOne = hiddenLayer(input, FEATURE_MASKS);
  const hiddenTwo = hiddenLayer(hiddenOne, HIDDEN_WEIGHTS);
  const logits = DIGITS.map((_, index) =>
    OUTPUT_WEIGHTS[index]!.reduce(
      (sum, weight, sourceIndex) => sum + weight * hiddenTwo[sourceIndex]!,
      OUTPUT_BIASES[index]!,
    ),
  );
  const maxLogit = Math.max(...logits);
  const exponentials = logits.map((logit) => Math.exp(logit - maxLogit));
  const total = exponentials.reduce((sum, value) => sum + value, 0);
  return {
    input,
    hiddenOne,
    hiddenTwo,
    output: exponentials.map((value) => value / total),
  };
}

function hiddenLayer(input: number[], weights: number[][]) {
  return weights.map((unitWeights) => {
    const weightedSum = unitWeights.reduce(
      (sum, weight, index) => sum + weight * (input[index] ?? 0),
      0,
    );
    const scale = unitWeights.reduce((sum, weight) => sum + Math.abs(weight), 0) || 1;
    return sigmoid((weightedSum / scale - 0.28) * 10);
  });
}

function rasterizeGlyph(rows: readonly string[]) {
  return Array.from({ length: INPUT_SIZE }, (_, index) => {
    const x = index % IMAGE_SIZE;
    const y = Math.floor(index / IMAGE_SIZE);
    const glyphX = Math.min(rows[0]!.length - 1, Math.floor((x / IMAGE_SIZE) * rows[0]!.length));
    const glyphY = Math.min(rows.length - 1, Math.floor((y / IMAGE_SIZE) * rows.length));
    return rows[glyphY]![glyphX] === "1" ? 1 : 0;
  });
}

function featureWeight(featureIndex: number, x: number, y: number) {
  if (featureIndex < 5) {
    const bandY = [3, 8, 13, 18, 23][featureIndex]!;
    return Math.abs(y - bandY) <= 1 ? 1 : 0;
  }
  if (featureIndex < 9) {
    const bandX = [3, 9, 15, 21][featureIndex - 5]!;
    return Math.abs(x - bandX) <= 1 ? 1 : 0;
  }
  if (featureIndex === 9) return Math.abs(x - y) <= 1 ? 1 : 0;
  if (featureIndex === 10) return Math.abs(x + y - (IMAGE_SIZE - 1)) <= 1 ? 1 : 0;
  if (featureIndex === 11) return x < IMAGE_SIZE / 2 && y < IMAGE_SIZE / 2 ? 1 : 0;
  if (featureIndex === 12) return x >= IMAGE_SIZE / 2 && y < IMAGE_SIZE / 2 ? 1 : 0;
  if (featureIndex === 13) return x < IMAGE_SIZE / 2 && y >= IMAGE_SIZE / 2 ? 1 : 0;
  if (featureIndex === 14) return x >= IMAGE_SIZE / 2 && y >= IMAGE_SIZE / 2 ? 1 : 0;
  return Math.abs(x - IMAGE_SIZE / 2) < 5 && Math.abs(y - IMAGE_SIZE / 2) < 5 ? 1 : 0;
}

function sigmoid(value: number) {
  return 1 / (1 + Math.exp(-value));
}

function layerPoints(x: number, count: number, padding: number, height: number): Point[] {
  return Array.from({ length: count }, (_, index) => ({
    x,
    y: padding / 2 + (index + 1) * (height / (count + 1)),
  }));
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-2xl leading-none text-foreground">{value}</div>
      <div className="mt-2 font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
        {label}
      </div>
    </div>
  );
}
