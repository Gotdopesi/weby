import { useState } from "react";
import { ArrowUpRight, Clock } from "lucide-react";
import { MEN_SERVICES, WOMEN_SERVICES, type Service } from "@/lib/content";
import { Reveal } from "@/components/Reveal";
import { SectionHead } from "@/components/SectionHead";
import { SectionShell } from "@/components/SectionShell";

type Props = {
  onReserve: () => void;
};

function ServiceRow({
  service,
  index,
  onReserve,
}: {
  service: Service;
  index: number;
  onReserve: () => void;
}) {
  return (
    <Reveal as="li" variant="up" delay={index * 60} className="group border-b border-line py-6 md:py-7">
      <div className="grid gap-4 md:grid-cols-[auto_1fr_auto] md:items-center md:gap-8">
        <span className="font-display text-3xl text-accent/35 transition group-hover:text-accent/60">
          {String(index + 1).padStart(2, "0")}
        </span>
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h3 className="font-display text-2xl md:text-[1.65rem]">{service.name}</h3>
            {service.featured && (
              <span className="border border-accent/30 px-2 py-0.5 text-[10px] uppercase tracking-[0.2em] text-accent">
                Oblíbené
              </span>
            )}
          </div>
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted">{service.desc}</p>
          <p className="mt-2 flex items-center gap-1.5 text-xs text-muted">
            <Clock className="h-3.5 w-3.5 text-accent/70" />
            {service.duration}
          </p>
        </div>
        <div className="flex items-center justify-between gap-4 md:flex-col md:items-end">
          <span className="text-lg font-medium">{service.price}</span>
          <button
            type="button"
            onClick={onReserve}
            className="inline-flex items-center gap-1 text-sm text-muted transition hover:text-accent"
          >
            Objednat
            <ArrowUpRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </Reveal>
  );
}

export function ServicesSection({ onReserve }: Props) {
  const [tab, setTab] = useState<"damske" | "panske">("damske");
  const services = tab === "damske" ? WOMEN_SERVICES : MEN_SERVICES;

  return (
    <SectionShell id="sluzby" bg="paper" className="py-24 md:py-32">
      <div className="mx-auto max-w-[1200px] px-5">
        <div className="grid gap-12 lg:grid-cols-[280px_1fr] lg:gap-16">
          <Reveal variant="left" className="lg:sticky lg:top-28 lg:self-start">
            <SectionHead
              index="02"
              label="Ceník"
              title="Služby"
              description="Orientační ceny — finální částka závisí na délce vlasů. Každá návštěva začíná konzultací."
            />
            <div className="mt-6 flex gap-2 lg:flex-col lg:gap-1">
              {(
                [
                  ["damske", "Dámské"],
                  ["panske", "Pánské"],
                ] as const
              ).map(([key, label]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setTab(key)}
                  className={`border px-4 py-3 text-left text-sm transition ${
                    tab === key
                      ? "border-ink bg-ink text-paper"
                      : "border-line bg-white text-muted hover:border-accent/40 hover:text-ink"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </Reveal>

          <ul className="border-t border-line">
            {services.map((s, i) => (
              <ServiceRow key={s.id} service={s} index={i} onReserve={onReserve} />
            ))}
          </ul>
        </div>
      </div>
    </SectionShell>
  );
}
