import type { ReactNode } from "react";

type Props = {
  index: string;
  label: string;
  title: string;
  description?: string;
  dark?: boolean;
  children?: ReactNode;
};

export function SectionHead({ index, label, title, description, dark, children }: Props) {
  return (
    <div className={`relative mb-14 md:mb-16 ${children ? "grid gap-8 lg:grid-cols-[1fr_auto] lg:items-end" : ""}`}>
      <div>
        <div className={`mb-4 flex items-center gap-3 ${dark ? "text-paper/60" : "text-muted"}`}>
          <span className={`font-display text-4xl leading-none ${dark ? "text-accent-soft/40" : "text-accent/30"}`}>
            {index}
          </span>
          <span className="h-px flex-1 max-w-[48px] bg-accent/50" />
          <span className="text-[10px] uppercase tracking-[0.35em]">{label}</span>
        </div>
        <h2
          className={`font-display max-w-xl text-[clamp(2rem,5vw,3.25rem)] leading-[1.08] ${
            dark ? "text-paper" : "text-ink"
          }`}
        >
          {title}
        </h2>
        {description && (
          <p className={`mt-4 max-w-lg text-sm leading-relaxed md:text-base ${dark ? "text-paper/65" : "text-muted"}`}>
            {description}
          </p>
        )}
      </div>
      {children}
    </div>
  );
}
