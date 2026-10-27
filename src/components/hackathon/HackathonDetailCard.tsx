import type { LucideIcon } from "lucide-react";

type HackathonDetailCardProps = {
  icon: LucideIcon;
  label: string;
  value: string;
};

export function HackathonDetailCard({ icon: Icon, label, value }: HackathonDetailCardProps) {
  return (
    <div className="surface-card edge-highlight rounded-2xl p-5">
      <Icon aria-hidden="true" className="text-silver" size={18} strokeWidth={1.7} />
      <div className="mt-8 font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
        {label}
      </div>
      <div className="mt-2 font-display text-2xl font-semibold leading-tight">{value}</div>
    </div>
  );
}
