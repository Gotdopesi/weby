import { Coffee } from "lucide-react";

export function AboutSection() {
  return (
    <section id="o-nas" className="py-24 md:py-32 bg-secondary/40">
      <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-2 gap-16 items-center">
        <div className="relative">
          <img
            src="https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=900&q=85"
            alt="Detail úpravy vlasů ve Studio Elegance"
            className="rounded-xl object-cover w-full aspect-[4/5] shadow-lg"
            loading="lazy"
          />
          <div className="absolute -bottom-6 -right-6 bg-card border border-gold rounded-lg p-6 shadow-xl hidden sm:block">
            <p className="font-display text-4xl text-gold">15</p>
            <p className="text-xs uppercase tracking-widest text-muted-foreground">let zkušeností</p>
          </div>
        </div>

        <div>
          <p className="text-gold tracking-[0.3em] text-xs uppercase mb-4">O nás</p>
          <h2 className="font-display text-4xl md:text-5xl mb-6 leading-tight">
            Salón, který staví na řemesle a důvěře.
          </h2>
          <div className="hairline w-24 mb-6" />
          <p className="text-muted-foreground leading-relaxed mb-4">
            Studio Elegance vzniklo s jedinou myšlenkou — vrátit kadeřnictví jeho původní význam.
            Místo, kde má každý klient čas, kde se nespěchá a kde se každý detail počítá.
          </p>
          <p className="text-muted-foreground leading-relaxed mb-6">
            Pracujeme výhradně s prémiovou kosmetikou Kérastase a Olaplex. Naši stylisté se
            pravidelně školí na mezinárodních akademiích v Paříži a Londýně.
          </p>
          <p className="text-muted-foreground leading-relaxed mb-8 flex items-start gap-3">
            <Coffee className="h-5 w-5 text-gold shrink-0 mt-0.5" />
            <span>
              Mezi střihem a foukanou vám připravíme výběrovou kávu — protože krása začíná
              pohodlím a klidem, ne jen výsledkem v zrcadle.
            </span>
          </p>

          <div className="grid grid-cols-3 gap-6">
            <div>
              <p className="font-display text-3xl text-gold">800+</p>
              <p className="text-xs text-muted-foreground uppercase tracking-wider mt-1">Klientů</p>
            </div>
            <div>
              <p className="font-display text-3xl text-gold">4</p>
              <p className="text-xs text-muted-foreground uppercase tracking-wider mt-1">Stylisté</p>
            </div>
            <div>
              <p className="font-display text-3xl text-gold">4.9</p>
              <p className="text-xs text-muted-foreground uppercase tracking-wider mt-1">Hodnocení</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
