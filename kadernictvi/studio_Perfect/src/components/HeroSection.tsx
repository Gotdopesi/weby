import { useEffect, useState } from "react";
import { ArrowRight, Star } from "lucide-react";
import { Reveal, useParallax } from "@/components/Reveal";
import { SectionContent } from "@/components/SectionShell";
import { IMAGES, SALON } from "@/lib/content";

type Props = {
  onReserve: () => void;
};

export function HeroSection({ onReserve }: Props) {
  const parallax = useParallax(0.4);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const t = window.setTimeout(() => setLoaded(true), 80);
    return () => window.clearTimeout(t);
  }, []);

  return (
    <section id="top" className="relative isolate min-h-[100svh] overflow-hidden">
      {/* Fotka */}
      <div className="absolute inset-0 z-0" style={{ transform: `translateY(${parallax}px)` }}>
        <img src={IMAGES.hero} alt="" className="h-[115%] w-full object-cover" aria-hidden />
      </div>

      {/* Barevné překryvy */}
      <div className="absolute inset-0 z-[1] bg-ink/20" aria-hidden />
      <div className="absolute inset-0 z-[1] bg-gradient-to-t from-ink via-ink/50 to-ink/25" aria-hidden />
      <div
        className="absolute inset-0 z-[1] bg-[radial-gradient(circle_at_80%_20%,rgba(158,79,79,0.15),transparent_45%)]"
        aria-hidden
      />

      <SectionContent className="mx-auto flex min-h-[100svh] max-w-[1200px] flex-col justify-end px-5 pb-16 pt-32 md:pb-20">
        <div className="grid gap-10 lg:grid-cols-[1.2fr_0.8fr] lg:items-end">
          <div>
            <p
              className={`mb-5 text-[11px] uppercase tracking-[0.45em] text-accent-soft transition-all duration-700 ${
                loaded ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
              }`}
            >
              {SALON.shortName} · {SALON.city}
            </p>
            <h1
              className={`font-display max-w-[14ch] text-[clamp(2.75rem,8vw,5.75rem)] leading-[0.98] text-paper transition-all duration-1000 delay-100 ${
                loaded ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"
              }`}
            >
              Péče o vlasy
              <span className="block italic text-accent-soft">bez kompromisů.</span>
            </h1>
            <p
              className={`mt-6 max-w-md text-base leading-relaxed text-paper/75 md:text-lg transition-all duration-1000 delay-200 ${
                loaded ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0"
              }`}
            >
              {SALON.name} — místo, kde se setkává preciznost, klid a radost z proměny.
            </p>
            <div
              className={`mt-8 flex flex-wrap gap-3 transition-all duration-1000 delay-300 ${
                loaded ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0"
              }`}
            >
              <button
                type="button"
                onClick={onReserve}
                className="group inline-flex items-center gap-2 bg-paper px-6 py-3.5 text-sm font-medium text-ink transition hover:bg-accent hover:text-paper"
              >
                Objednat termín
                <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
              </button>
              <a
                href="#pred-po"
                className="inline-flex items-center border border-paper/35 px-6 py-3.5 text-sm text-paper/90 transition hover:border-paper hover:bg-paper/10"
              >
                Proměny před & po
              </a>
            </div>
          </div>

          <Reveal variant="left" delay={400} className="lg:justify-self-end">
            <div className="border border-paper/15 bg-ink/55 p-6 backdrop-blur-md md:p-7">
              <div className="flex items-center gap-2 text-accent-soft">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-4 w-4 fill-current" />
                ))}
              </div>
              <p className="mt-3 font-display text-4xl text-paper">{SALON.rating.toFixed(1)}</p>
              <p className="mt-1 text-sm text-paper/60">{SALON.reviewCount} recenzí na Google</p>
              <div className="mt-5 h-px bg-paper/15" />
              <p className="mt-4 text-sm leading-relaxed text-paper/70">{SALON.address}</p>
            </div>
          </Reveal>
        </div>
      </SectionContent>
    </section>
  );
}
