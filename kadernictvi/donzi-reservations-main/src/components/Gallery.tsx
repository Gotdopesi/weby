import { useCallback, useEffect, useRef, useState } from "react";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import galerie1 from "@/assets/galerie_1.webp";
import galerie2 from "@/assets/galeri_2.webp";
import galerie3 from "@/assets/galerie_3.webp";
import galerie4 from "@/assets/galerie_4.webp";

type Item = { src: string; alt: string };

const ITEMS: Item[] = [
  { src: galerie1, alt: "Střih a styling" },
  { src: galerie2, alt: "Úprava vousů" },
  { src: galerie3, alt: "Interiér barbershopu" },
  { src: galerie4, alt: "Barber řemeslo" },
];

const SWIPE_MIN_PX = 48;

export function Gallery() {
  const [lightbox, setLightbox] = useState<number | null>(null);
  const touchStartX = useRef<number | null>(null);

  const goPrev = useCallback(() => {
    setLightbox((n) => (n === null ? 0 : (n - 1 + ITEMS.length) % ITEMS.length));
  }, []);

  const goNext = useCallback(() => {
    setLightbox((n) => (n === null ? 0 : (n + 1) % ITEMS.length));
  }, []);

  useEffect(() => {
    if (lightbox === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setLightbox(null);
      if (e.key === "ArrowRight") goNext();
      if (e.key === "ArrowLeft") goPrev();
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [lightbox, goNext, goPrev]);

  const onLightboxTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.changedTouches[0]?.clientX ?? null;
  };

  const onLightboxTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const endX = e.changedTouches[0]?.clientX ?? touchStartX.current;
    const delta = endX - touchStartX.current;
    touchStartX.current = null;
    if (Math.abs(delta) < SWIPE_MIN_PX) return;
    if (delta < 0) goNext();
    else goPrev();
  };

  return (
    <section id="galerie" className="py-28 relative">
      <div className="container mx-auto px-6">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <div className="flex items-center justify-center gap-3 mb-5">
            <span className="h-px w-10 bg-gold" />
            <span className="text-xs uppercase tracking-[0.4em] text-gold">Lookbook</span>
            <span className="h-px w-10 bg-gold" />
          </div>
          <h2 className="font-display text-4xl md:text-5xl text-foreground">
            <span className="gold-text-gradient">Galerie</span> řemesla
          </h2>
          <p className="mt-5 text-muted-foreground">
            Pohled do našeho světa — od precizních střihů po atmosféru, kterou u nás zažijete.
          </p>
        </div>

        <div className="flex flex-wrap justify-center gap-8 md:gap-12">
          {ITEMS.map((item, i) => (
            <button
              key={item.src}
              type="button"
              onClick={() => setLightbox(i)}
              className="group flex flex-col items-center gap-4 focus:outline-none"
            >
              <div className="relative w-40 h-40 sm:w-48 sm:h-48 md:w-56 md:h-56 rounded-full overflow-hidden border-4 border-border group-hover:border-gold transition-all duration-500 group-hover:scale-105 shadow-luxe">
                <img
                  src={item.src}
                  alt={item.alt}
                  loading="lazy"
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gold/0 group-hover:bg-gold/10 transition-colors" />
              </div>
              <span className="text-[10px] uppercase tracking-widest text-muted-foreground group-hover:text-gold transition-colors">
                {item.alt}
              </span>
            </button>
          ))}
        </div>
      </div>

      {lightbox !== null && (
        <div
          className="fixed inset-0 z-[110] bg-background/95 backdrop-blur-xl flex items-center justify-center p-4 md:p-10 animate-fade-in touch-pan-y"
          onClick={() => setLightbox(null)}
          onTouchStart={onLightboxTouchStart}
          onTouchEnd={onLightboxTouchEnd}
          role="dialog"
          aria-modal="true"
          aria-label="Galerie — detail fotky"
        >
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setLightbox(null);
            }}
            className="absolute top-5 right-5 w-11 h-11 rounded-full border border-border hover:border-gold flex items-center justify-center text-foreground transition-colors z-10"
            aria-label="Zavřít"
          >
            <X className="w-5 h-5" />
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              goPrev();
            }}
            className="absolute left-3 md:left-8 w-11 h-11 rounded-full border border-border hover:border-gold flex items-center justify-center text-foreground z-10"
            aria-label="Předchozí"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              goNext();
            }}
            className="absolute right-3 md:right-8 w-11 h-11 rounded-full border border-border hover:border-gold flex items-center justify-center text-foreground z-10"
            aria-label="Další"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
          <img
            src={ITEMS[lightbox].src}
            alt={ITEMS[lightbox].alt}
            onClick={(e) => e.stopPropagation()}
            className="max-w-full max-h-[85vh] object-contain rounded-full border-4 border-gold/30 shadow-luxe animate-scale-in pointer-events-none select-none"
            draggable={false}
          />
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-xs uppercase tracking-widest text-muted-foreground pointer-events-none">
            {ITEMS[lightbox].alt} · {lightbox + 1} / {ITEMS.length}
          </div>
        </div>
      )}
    </section>
  );
}
