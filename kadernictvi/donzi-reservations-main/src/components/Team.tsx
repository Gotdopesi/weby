import { Crown } from "lucide-react";
import agim from "@/assets/team_agim.webp";
import donzi from "@/assets/team_donzi.webp";
import enis from "@/assets/team_enis.webp";
import fixi from "@/assets/team_fixi.webp";

type Member = {
  name: string;
  role: string;
  img: string;
  boss?: boolean;
};

const TEAM: Member[] = [
  { name: "Agim", role: "Vedoucí BOSS", img: agim, boss: true },
  { name: "Donzi", role: "Specialista na zákaznický servis", img: donzi },
  { name: "Enis", role: "Barber", img: enis },
  { name: "Fixi", role: "Barber", img: fixi },
];

export function Team() {
  return (
    <section id="tym" className="py-28 relative bg-card/30">
      <div className="container mx-auto px-6">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <div className="flex items-center justify-center gap-3 mb-5">
            <span className="h-px w-10 bg-gold" />
            <span className="text-xs uppercase tracking-[0.4em] text-gold">
              Tváře Donzi
            </span>
            <span className="h-px w-10 bg-gold" />
          </div>
          <h2 className="font-display text-4xl md:text-5xl text-foreground">
            Náš <span className="gold-text-gradient">tým</span>
          </h2>
          <p className="mt-6 text-muted-foreground leading-relaxed">
            Jsme tým profesionálních kadeřníků a holičů, kteří se specializují
            na pánské účesy a holení. S dlouholetou zkušeností v oboru vám
            zajistíme kvalitní a precizní služby. V našem barbershopu
            v Dobrušce se každý zákazník stane naším cílem a důraz klademe
            na individuální přístup.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-10">
          {TEAM.map((m) => (
            <article key={m.name} className="group flex flex-col items-center text-center">
              <div className="relative mb-5">
                <div
                  className={`relative w-44 h-44 md:w-52 md:h-52 rounded-full overflow-hidden border-4 transition-all duration-500 ${
                    m.boss
                      ? "border-gold shadow-gold group-hover:scale-105"
                      : "border-border group-hover:border-gold/70 group-hover:scale-105"
                  }`}
                >
                  <img
                    src={m.img}
                    alt={`${m.name} — ${m.role}`}
                    loading="lazy"
                    width={512}
                    height={512}
                    className="w-full h-full object-cover grayscale-[20%] group-hover:grayscale-0 transition-all duration-700"
                  />
                </div>
                {m.boss && (
                  <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 flex items-center gap-1.5 glass-gold px-3 py-1 rounded-full border border-gold/40">
                    <Crown className="w-3 h-3 text-gold" />
                    <span className="text-[10px] uppercase tracking-widest text-gold font-semibold">
                      Boss
                    </span>
                  </div>
                )}
              </div>
              <h3 className="font-display text-2xl md:text-3xl text-foreground tracking-wider">
                {m.name}
              </h3>
              <div className="h-px w-8 bg-gold mt-2 mb-2 group-hover:w-16 transition-all duration-500" />
              <p className="text-xs uppercase tracking-widest text-muted-foreground group-hover:text-gold transition-colors max-w-[200px]">
                {m.role}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
