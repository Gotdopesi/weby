import { Clock, Mail, MapPin, Phone } from "lucide-react";
import { SALON } from "@/lib/content";
import { Reveal } from "@/components/Reveal";
import { SectionHead } from "@/components/SectionHead";
import { SectionShell } from "@/components/SectionShell";

type Props = {
  onReserve: () => void;
};

export function ContactSection({ onReserve }: Props) {
  return (
    <SectionShell id="kontakt" bg="paper" className="py-24 md:py-32">
      <div className="mx-auto max-w-[1200px] px-5">
        <Reveal>
          <SectionHead
            index="05"
            label="Kontakt"
            title="Těšíme se na vás"
            description="Zavolejte nebo napište — rádi domluvíme termín. Online rezervace připravujeme."
          />
        </Reveal>

        <div className="grid gap-8 lg:grid-cols-[1fr_1.1fr]">
          <Reveal variant="up" className="space-y-0 border border-line bg-white">
            {[
              {
                icon: Phone,
                label: "Telefon",
                value: SALON.phone,
                href: SALON.phoneHref,
              },
              {
                icon: MapPin,
                label: "Adresa",
                value: SALON.address,
              },
              {
                icon: Clock,
                label: "Otevírací doba",
                value: "Po–Pá 9:00–17:00 · So dle domluvy",
                note: "Orientační — upřesníme",
              },
              {
                icon: Mail,
                label: "E-mail",
                value: "brzy doplníme",
              },
            ].map((item, i) => (
              <div
                key={item.label}
                className={`flex gap-4 p-5 md:p-6 ${i > 0 ? "border-t border-line" : ""}`}
              >
                <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center border border-line bg-cream">
                  <item.icon className="h-4 w-4 text-accent" />
                </span>
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-muted">{item.label}</p>
                  {item.href ? (
                    <a href={item.href} className="mt-1 block text-lg font-medium hover:text-accent">
                      {item.value}
                    </a>
                  ) : (
                    <p className="mt-1 text-base font-medium">{item.value}</p>
                  )}
                  {item.note && <p className="mt-1 text-xs text-muted">{item.note}</p>}
                </div>
              </div>
            ))}
          </Reveal>

          <Reveal variant="left" delay={120} className="flex flex-col border border-line bg-ink p-8 text-paper md:p-10">
            <h3 className="font-display text-3xl">Rezervace</h3>
            <p className="mt-4 flex-1 text-sm leading-relaxed text-paper/70">
              Online objednávání zatím ladíme. Pro termín nás zatím kontaktujte telefonicky — brzy
              bude k dispozici i rezervace přímo z webu.
            </p>
            <div className="mt-8 space-y-3">
              <button
                type="button"
                onClick={onReserve}
                className="w-full bg-paper py-3.5 text-sm font-medium text-ink transition hover:bg-accent hover:text-paper"
              >
                Objednat termín
              </button>
              <a
                href={SALON.phoneHref}
                className="block w-full border border-paper/25 py-3.5 text-center text-sm transition hover:border-accent-soft hover:text-accent-soft"
              >
                Zavolat {SALON.phone}
              </a>
            </div>
          </Reveal>
        </div>

        <Reveal variant="scale" delay={200} className="mt-10 overflow-hidden border border-line">
          <iframe
            title="Mapa — Kadeřnické studio Perfekt, Trutnov"
            src="https://maps.google.com/maps?q=Krakono%C5%A1ovo+n%C3%A1m.+127,+541+01+Trutnov+1&output=embed"
            className="h-[340px] w-full grayscale-[40%] contrast-[1.05] transition hover:grayscale-0"
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
        </Reveal>
      </div>
    </SectionShell>
  );
}

export function SiteFooter() {
  const year = new Date().getFullYear();
  return (
    <footer className="relative border-t border-line bg-ink py-8 text-paper/55">
      <div className="mx-auto flex max-w-[1200px] flex-col items-start justify-between gap-3 px-5 text-sm md:flex-row md:items-center">
          <p className="font-display text-lg italic text-paper/80">{SALON.shortName}</p>
          <p>© {year} {SALON.name}</p>
          <p className="text-paper/35">Web ve výstavbě</p>
      </div>
    </footer>
  );
}
