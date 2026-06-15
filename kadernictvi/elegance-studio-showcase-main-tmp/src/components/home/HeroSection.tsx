import { ArrowRight, Play, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { HERO_POSTER, HERO_VIDEO } from "@/lib/home-content";
import { AppLink } from "@/lib/router";

type Props = {
  onReserve: () => void;
};

export function HeroSection({ onReserve }: Props) {
  return (
    <section id="top" className="relative min-h-[100svh] flex items-center overflow-hidden">
      <div className="absolute inset-0">
        <video
          autoPlay
          muted
          loop
          playsInline
          poster={HERO_POSTER}
          className="h-full w-full object-cover scale-105"
          aria-hidden
        >
          <source src={HERO_VIDEO} type="video/mp4" />
        </video>
        <img
          src={HERO_POSTER}
          alt=""
          className="absolute inset-0 h-full w-full object-cover -z-10"
          aria-hidden
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/55 to-black/25" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/30" />
      </div>

      <div className="relative max-w-7xl mx-auto px-6 pt-32 pb-24 w-full">
        <div className="max-w-4xl">
          <div className="flex items-center gap-3 mb-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <span className="h-px w-12 bg-gold" />
            <p className="text-gold tracking-[0.35em] text-[11px] uppercase">
              Kadeřnický salón · Praha 1
            </p>
          </div>

          <h1 className="font-display text-[clamp(2.75rem,8vw,5.5rem)] leading-[1.02] text-primary-foreground animate-in fade-in slide-in-from-bottom-6 duration-700 delay-100">
            Krása, která{" "}
            <em className="text-gold not-italic font-normal">zůstává</em> v paměti.
          </h1>

          <p className="mt-8 max-w-xl text-lg md:text-xl text-primary-foreground/85 leading-relaxed animate-in fade-in slide-in-from-bottom-6 duration-700 delay-200">
            Studio Elegance — místo, kde se setkává řemeslo, péče a tichý luxus. Vytvoříme účes,
            ve kterém se budete cítit dokonale.
          </p>

          <div className="mt-10 flex flex-wrap items-center gap-4 animate-in fade-in slide-in-from-bottom-6 duration-700 delay-300">
            <Button
              size="lg"
              onClick={onReserve}
              className="bg-gold text-primary hover:bg-gold/90 px-8 h-12 text-base shadow-[0_8px_30px_-8px_oklch(0.74_0.11_82_/_0.6)]"
            >
              Rezervovat termín
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
            <AppLink to="/portfolio">
              <Button
                size="lg"
                variant="outline"
                className="border-primary-foreground/35 bg-white/5 text-primary-foreground hover:bg-primary-foreground hover:text-primary h-12 px-8 backdrop-blur-sm"
              >
                <Play className="mr-2 h-4 w-4 fill-current" />
                Portfolio
              </Button>
            </AppLink>
          </div>

          <div className="mt-14 flex flex-wrap items-center gap-8 text-sm text-primary-foreground/75 animate-in fade-in duration-700 delay-500">
            <div className="flex items-center gap-2">
              <div className="flex text-gold">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-4 w-4 fill-current" />
                ))}
              </div>
              <span>4.9 / 5</span>
            </div>
            <span className="hidden sm:inline h-4 w-px bg-primary-foreground/25" />
            <span>800+ spokojených klientek a klientů</span>
            <span className="hidden md:inline h-4 w-px bg-primary-foreground/25" />
            <span className="hidden md:inline">Kérastase · Olaplex</span>
          </div>
        </div>
      </div>

      <a
        href="#portfolio"
        className="absolute bottom-8 left-1/2 -translate-x-1/2 hidden md:flex flex-col items-center gap-2 text-[10px] uppercase tracking-[0.3em] text-primary-foreground/50 hover:text-gold transition-colors"
      >
        Scroll
        <div className="w-px h-14 bg-gradient-to-b from-gold/80 to-transparent animate-pulse" />
      </a>
    </section>
  );
}
