import { MapPin, Phone, Clock } from "lucide-react";

const hours = [
  { d: "Pondělí – Čtvrtek", h: "10:00 – 19:00" },
  { d: "Pátek – Sobota", h: "10:00 – 21:00" },
  { d: "Neděle", h: "Zavřeno" },
];

export function Contact() {
  return (
    <section id="kontakt" className="py-28 relative">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16">
          <div className="flex items-center justify-center gap-3 mb-5">
            <span className="h-px w-10 bg-gold" />
            <span className="text-xs uppercase tracking-[0.4em] text-gold">
              Kontakt
            </span>
            <span className="h-px w-10 bg-gold" />
          </div>
          <h2 className="font-display text-4xl md:text-5xl text-foreground">
            Najdete nás v <span className="gold-text-gradient">srdci Dobrušky</span>
          </h2>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          <div className="glass p-8 md:p-10 rounded-sm space-y-8">
            <div className="flex gap-5">
              <div className="w-12 h-12 rounded-sm glass-gold flex items-center justify-center shrink-0">
                <MapPin className="w-5 h-5 text-gold" />
              </div>
              <div>
                <div className="text-xs uppercase tracking-widest text-muted-foreground mb-1">
                  Adresa
                </div>
                <div className="text-foreground text-lg">
                  Náměstí F. L. Věka 14
                </div>
                <div className="text-foreground text-lg">518 01 Dobruška</div>
              </div>
            </div>

            <div className="gold-divider" />

            <div className="flex gap-5">
              <div className="w-12 h-12 rounded-sm glass-gold flex items-center justify-center shrink-0">
                <Phone className="w-5 h-5 text-gold" />
              </div>
              <div>
                <div className="text-xs uppercase tracking-widest text-muted-foreground mb-1">
                  Telefon
                </div>
                <a
                  href="tel:+420733363369"
                  className="text-foreground text-lg hover:text-gold transition-colors"
                >
                  +420 733 363 369
                </a>
              </div>
            </div>

            <div className="gold-divider" />

            <div className="flex gap-5">
              <div className="w-12 h-12 rounded-sm glass-gold flex items-center justify-center shrink-0">
                <Clock className="w-5 h-5 text-gold" />
              </div>
              <div className="flex-1">
                <div className="text-xs uppercase tracking-widest text-muted-foreground mb-3">
                  Otevírací doba
                </div>
                <ul className="space-y-2">
                  {hours.map((h) => (
                    <li
                      key={h.d}
                      className="flex justify-between gap-4 text-sm border-b border-border/40 pb-2 last:border-0"
                    >
                      <span className="text-muted-foreground">{h.d}</span>
                      <span className="text-foreground font-medium">{h.h}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          <div className="rounded-sm overflow-hidden glass min-h-[400px] relative">
            <iframe
              title="Mapa Barbershop Donzi"
              src="https://www.google.com/maps?q=Náměstí+F.+L.+Věka+14,+518+01+Dobruška&output=embed"
              className="w-full h-full min-h-[400px] grayscale contrast-125 brightness-75"
              style={{ filter: "invert(0.9) hue-rotate(180deg) brightness(0.95) contrast(1.1)" }}
              loading="lazy"
            />
          </div>
        </div>
      </div>
    </section>
  );
}

export function Footer() {
  return (
    <footer className="border-t border-border/40 py-10 bg-card/40">
      <div className="container mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
        <div className="font-display tracking-[0.3em]">
          DON<span className="text-gold">Z</span>I · BARBERSHOP
        </div>
        <div>© {new Date().getFullYear()} Barbershop Donzi. Vše s péčí.</div>
      </div>
    </footer>
  );
}
