import heroImg from "@/assets/galerie_1.webp";

interface HeroProps {
  onReserve: () => void;
}

export function Hero({ onReserve }: HeroProps) {
  return (
    <section
      id="uvod"
      className="relative min-h-screen flex items-center overflow-hidden"
    >
      <div className="absolute inset-0">
        <img
          src={heroImg}
          alt="Barbershop Donzi"
          className="w-full h-full object-cover object-center"
          width={1920}
          height={1080}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-background via-background/85 to-background/30" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-background/40" />
      </div>

      <div className="container relative z-10 mx-auto px-6 pt-32 pb-20">
        <div className="max-w-3xl">
          <div className="flex items-center gap-3 mb-6 animate-fade-in">
            <span className="h-px w-12 bg-gold" />
            <span className="text-xs uppercase tracking-[0.4em] text-gold">
              Dobruška · Est. od srdce
            </span>
          </div>

          <h1 className="font-display text-5xl md:text-7xl lg:text-8xl leading-[0.95] text-foreground animate-fade-in">
            Prémiová <br />
            <span className="gold-text-gradient">pánská péče</span> <br />
            v centru Dobrušky
          </h1>

          <p className="mt-8 text-lg md:text-xl text-muted-foreground max-w-xl leading-relaxed animate-fade-in">
            Precizní střihy, horké ručníky a chvíle skutečné relaxace.
            Řemeslo, kterému věříte.
          </p>

          <div className="mt-10 flex flex-wrap gap-4 animate-fade-in">
            <button
              onClick={onReserve}
              className="group gold-gradient text-gold-foreground font-bold px-10 py-4 rounded-sm uppercase tracking-[0.2em] text-sm shadow-gold hover:scale-105 transition-all"
            >
              Online rezervace →
            </button>
            <a
              href="#sluzby"
              className="border border-border hover:border-gold text-foreground px-10 py-4 rounded-sm uppercase tracking-[0.2em] text-sm transition-colors"
            >
              Naše služby
            </a>
          </div>

          <div className="mt-16 flex flex-wrap gap-10 text-sm">
            {[
              { k: "300+", v: "Stálých zákazníků" },
              { k: "4.9★", v: "Hodnocení" },
              { k: "1500+", v: "Spokojených zákazníků" },
            ].map((s) => (
              <div key={s.v}>
                <div className="font-display text-3xl text-gold">{s.k}</div>
                <div className="text-muted-foreground uppercase tracking-wider text-xs mt-1">
                  {s.v}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 hidden md:flex flex-col items-center gap-2 text-xs uppercase tracking-widest text-muted-foreground">
        Scroll
        <div className="w-px h-12 bg-gradient-to-b from-gold to-transparent" />
      </div>
    </section>
  );
}
