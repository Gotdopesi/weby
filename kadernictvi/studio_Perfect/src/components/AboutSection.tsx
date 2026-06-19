import { IMAGES, SALON } from "@/lib/content";
import { Reveal } from "@/components/Reveal";
import { SectionShell } from "@/components/SectionShell";

export function AboutSection() {
  return (
    <SectionShell id="o-nas" bg="white" className="overflow-hidden py-24 md:py-32">
      <div className="mx-auto max-w-[1200px] px-5">
        <div className="grid gap-10 lg:grid-cols-12 lg:gap-0">
          <Reveal variant="right" className="relative lg:col-span-7">
            <div className="relative overflow-hidden">
              <img
                src={IMAGES.about}
                alt="Kadeřnické studio Perfekt — o nás"
                className="aspect-[4/5] w-full object-cover md:aspect-[5/6]"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-ink/30 via-transparent to-transparent" />
            </div>
            <div className="absolute -bottom-4 left-4 bg-accent px-4 py-2 text-[10px] uppercase tracking-[0.35em] text-paper md:left-8">
              O studiu
            </div>
          </Reveal>

          <Reveal variant="left" delay={150} className="relative lg:col-span-5 lg:-ml-16 lg:mt-16">
            <div className="border border-line bg-paper p-8 shadow-[0_30px_80px_-40px_rgba(0,0,0,0.35)] md:p-10">
              <p className="font-display text-[clamp(2rem,4vw,2.75rem)] leading-tight">
                Klid, pečlivost a upřímný přístup
              </p>
              <div className="mt-6 space-y-4 text-sm leading-relaxed text-muted md:text-base">
                <p>
                  {SALON.name} najdete na Krakonošově náměstí v Trutnově. Studio je místem, kde se
                  snoubí osobní péče a poctivá práce s vlasy.
                </p>
                <p>
                  Paní Kateřina věří, že každý střih a barvení by mělo vypadat přirozeně. Proto vždy
                  začíná konzultací — upřímně poradí to nejlepší pro vaše vlasy.
                </p>
                <p className="border-l-2 border-accent/50 pl-4 italic text-ink/80">
                  „Chci, abyste odcházeli spokojení a s radostí se na další návštěvu těšili.“
                </p>
              </div>
              <div className="mt-8 grid grid-cols-2 gap-4 border-t border-line pt-6">
                <div>
                  <p className="font-display text-3xl text-accent">5,0</p>
                  <p className="text-xs text-muted">Google hodnocení</p>
                </div>
                <div>
                  <p className="font-display text-3xl text-accent">{SALON.reviewCount}</p>
                  <p className="text-xs text-muted">Spokojených recenzí</p>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </SectionShell>
  );
}
