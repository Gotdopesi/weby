import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { BEFORE_AFTER } from "@/lib/content";
import { BeforeAfterSlider } from "@/components/BeforeAfterSlider";
import { Reveal } from "@/components/Reveal";
import { SectionShell } from "@/components/SectionShell";

export function BeforeAfterSection() {
  const [index, setIndex] = useState(0);

  const go = (dir: -1 | 1) => {
    setIndex((i) => (i + dir + BEFORE_AFTER.length) % BEFORE_AFTER.length);
  };

  const current = BEFORE_AFTER[index];

  return (
    <SectionShell id="pred-po" bg="white" className="py-24 md:py-32">
      <div className="mx-auto max-w-[1200px] px-5">
        <Reveal variant="fade">
          <div className="mx-auto mb-14 max-w-2xl text-center">
            <p className="mb-4 text-[11px] uppercase tracking-[0.35em] text-accent">Proměny</p>
            <h2 className="font-display text-4xl md:text-5xl">Před & po</h2>
            <div className="mx-auto mt-5 h-px w-16 bg-accent/50" />
            <p className="mt-6 leading-relaxed text-muted">
              Přetáhněte posuvník a porovnejte proměnu. Vlevo je stav před, vpravo po úpravě ve
              studiu.
            </p>
          </div>
        </Reveal>

        <Reveal variant="scale" delay={100}>
          <div className="relative mx-auto max-w-md px-2 sm:px-0">
            <BeforeAfterSlider
              key={current.id}
              before={current.before}
              after={current.after}
              title={current.title}
              note={current.note}
              initialPosition={75}
            />

            <div className="mt-6 flex items-center justify-center gap-4">
              <button
                type="button"
                aria-label="Předchozí"
                onClick={() => go(-1)}
                className="inline-flex h-10 w-10 items-center justify-center border border-line bg-white transition hover:border-accent hover:text-accent"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <div className="flex gap-2">
                {BEFORE_AFTER.map((b, i) => (
                  <button
                    key={b.id}
                    type="button"
                    onClick={() => setIndex(i)}
                    aria-label={b.title}
                    className={`h-2 rounded-full transition-all ${
                      i === index ? "w-8 bg-accent" : "w-2 bg-line hover:bg-accent/50"
                    }`}
                  />
                ))}
              </div>
              <button
                type="button"
                aria-label="Další"
                onClick={() => go(1)}
                className="inline-flex h-10 w-10 items-center justify-center border border-line bg-white transition hover:border-accent hover:text-accent"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
          </div>
        </Reveal>
      </div>
    </SectionShell>
  );
}
