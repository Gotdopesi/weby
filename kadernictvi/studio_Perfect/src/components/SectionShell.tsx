import type { ReactNode } from "react";

type Bg = "white" | "paper" | "cream" | "ink";

const BG: Record<Bg, string> = {
  white: "bg-white",
  paper: "bg-paper",
  cream: "bg-cream",
  ink: "bg-ink",
};

type Props = {
  id?: string;
  className?: string;
  bg: Bg;
  children: ReactNode;
};

export function SectionShell({ id, className = "", bg, children }: Props) {
  return (
    <section id={id} className={`relative ${className}`}>
      <div className={`absolute inset-0 z-0 ${BG[bg]}`} aria-hidden />
      <div className="relative z-[1]">{children}</div>
    </section>
  );
}

export function SectionContent({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={`relative z-[1] ${className}`}>{children}</div>;
}
