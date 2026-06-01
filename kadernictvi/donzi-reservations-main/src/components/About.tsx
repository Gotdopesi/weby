import interior from "@/assets/galerie_3.webp";
import tools from "@/assets/galeri_2.webp";

export function About() {
  return (
    <section id="o-nas" className="py-28 relative">
      <div className="container mx-auto px-6">
        <div className="grid md:grid-cols-2 gap-16 items-center">
          <div className="relative">
            <div className="grid grid-cols-2 gap-6 items-center justify-items-center">
              <img
                src={interior}
                alt="Interiér Barbershop Donzi"
                loading="lazy"
                width={1280}
                height={896}
                className="w-52 h-52 md:w-64 md:h-64 rounded-full object-cover border-4 border-border shadow-luxe"
              />
              <img
                src={tools}
                alt="Barber nástroje"
                loading="lazy"
                width={1280}
                height={896}
                className="w-52 h-52 md:w-64 md:h-64 rounded-full object-cover border-4 border-gold/40 shadow-gold mt-10 md:mt-20"
              />
            </div>
            <div className="absolute -bottom-6 -left-6 glass-gold px-6 py-5 rounded-sm hidden md:block">
              <div className="font-display text-4xl text-gold leading-none">300+</div>
              <div className="text-xs uppercase tracking-widest text-muted-foreground mt-1">
                Stálých zákazníků
              </div>
            </div>
          </div>

          <div>
            <div className="flex items-center gap-3 mb-5">
              <span className="h-px w-10 bg-gold" />
              <span className="text-xs uppercase tracking-[0.4em] text-gold">
                O nás
              </span>
            </div>
            <h2 className="font-display text-4xl md:text-5xl text-foreground leading-tight">
              Místo, kde se <span className="gold-text-gradient">řemeslo</span> potkává s pohodlím.
            </h2>
            <p className="mt-6 text-muted-foreground leading-relaxed">
              V Donzi věříme, že návštěva barbera má být zážitek. Pohodlná
              kožená křesla, individuální přístup a přátelská atmosféra — to
              vše doplňujeme precizností, kterou každý detail zaslouží.
            </p>
            <p className="mt-4 text-muted-foreground leading-relaxed">
              Ať už si přijdete jen pro klasický střih nebo si dopřejete naši
              VIP péči, postaráme se, abyste odešli vypadat — a hlavně se cítit
              — výjimečně.
            </p>

            <div className="mt-10 grid grid-cols-2 gap-6">
              {[
                "Precizní řemeslo",
                "Prémiové produkty",
                "Individuální přístup",
                "Diskrétní atmosféra",
              ].map((f) => (
                <div key={f} className="flex items-center gap-3">
                  <span className="w-1.5 h-1.5 rounded-full bg-gold" />
                  <span className="text-sm text-foreground">{f}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
