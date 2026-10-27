type HackathonThemeCardProps = {
  number: string;
  title: string;
  description: string;
};

export function HackathonThemeCard({ number, title, description }: HackathonThemeCardProps) {
  return (
    <article className="surface-card edge-highlight group rounded-2xl p-6 sm:p-7">
      <div className="flex items-center justify-between font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
        <span>Problem space</span>
        <span className="text-silver">{number}</span>
      </div>
      <h3 className="mt-14 font-display text-2xl font-semibold leading-tight transition-colors group-hover:text-silver">
        {title}
      </h3>
      <p className="mt-3 text-sm leading-6 text-muted-foreground">{description}</p>
    </article>
  );
}
