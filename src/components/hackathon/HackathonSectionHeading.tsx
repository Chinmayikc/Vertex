type HackathonSectionHeadingProps = {
  eyebrow: string;
  title: string;
  description?: string;
  align?: "left" | "center";
};

export function HackathonSectionHeading({
  eyebrow,
  title,
  description,
  align = "left",
}: HackathonSectionHeadingProps) {
  const centered = align === "center";

  return (
    <div className={centered ? "mx-auto max-w-2xl text-center" : "max-w-2xl"}>
      <div
        className={`flex items-center gap-3 font-mono text-[10px] uppercase tracking-[0.25em] text-muted-foreground ${centered ? "justify-center" : ""}`}
      >
        <span className="inline-block h-px w-8 bg-silver" />
        {eyebrow}
      </div>
      <h2 className="mt-5 font-display text-4xl font-semibold leading-[0.98] tracking-tight sm:text-5xl">
        {title}
      </h2>
      {description && (
        <p className="mt-5 text-base leading-7 text-muted-foreground">{description}</p>
      )}
    </div>
  );
}
