import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import {
  GALLERY_FILTERS,
  GALLERY_ITEMS,
  type GalleryFilterId,
} from "@/lib/home-content";
import { cn } from "@/lib/utils";
const SWIPE_MIN = 48;

export function GalleryGrid() {
  const [filter, setFilter] = useState<GalleryFilterId>("vse");
  const [lightbox, setLightbox] = useState<number | null>(null);
  const touchX = useRef<number | null>(null);

  const filtered = useMemo(() => {
    if (filter === "vse") return GALLERY_ITEMS;
    return GALLERY_ITEMS.filter((g) => g.category === filter);
  }, [filter]);

  const goLb = useCallback(
    (dir: -1 | 1) => {
      setLightbox((n) => {
        if (n === null) return 0;
        return (n + dir + filtered.length) % filtered.length;
      });
    },
    [filtered.length],
  );

  useEffect(() => {
    if (lightbox === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setLightbox(null);
      if (e.key === "ArrowRight") goLb(1);
      if (e.key === "ArrowLeft") goLb(-1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [lightbox, goLb]);

  return (
    <>
      <div className="flex flex-wrap justify-center gap-2 mb-10">
        {GALLERY_FILTERS.map((f) => (
          <button
            key={f.id}
            type="button"
            onClick={() => setFilter(f.id)}
            className={cn(
              "px-4 py-2 rounded-full text-sm tracking-wide transition-all border",
              filter === f.id
                ? "bg-primary text-primary-foreground border-primary shadow-sm"
                : "bg-background/80 border-border text-muted-foreground hover:border-gold/50 hover:text-foreground",
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="columns-2 md:columns-3 lg:columns-4 gap-4 space-y-4">
        {filtered.map((item, i) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setLightbox(i)}
            className="group relative w-full break-inside-avoid rounded-xl overflow-hidden border border-border/80 shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-gold"
          >
            <img
              src={item.src}
              alt={item.alt}
              loading="lazy"
              className={cn(
                "w-full object-cover transition-transform duration-700 group-hover:scale-[1.03]",
                item.span === "tall" ? "aspect-[3/4]" : "aspect-square",
              )}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <span className="absolute bottom-3 left-3 right-3 text-left text-xs text-white font-medium opacity-0 group-hover:opacity-100 transition-opacity">
              {item.alt}
            </span>
          </button>
        ))}
      </div>

      {lightbox !== null && filtered[lightbox] && (
        <div
          className="fixed inset-0 z-[110] bg-black/95 backdrop-blur-md flex items-center justify-center p-4"
          onClick={() => setLightbox(null)}
          onTouchStart={(e) => {
            touchX.current = e.changedTouches[0]?.clientX ?? null;
          }}
          onTouchEnd={(e) => {
            const start = touchX.current;
            const end = e.changedTouches[0]?.clientX;
            touchX.current = null;
            if (start == null || end == null) return;
            const dx = end - start;
            if (dx > SWIPE_MIN) goLb(-1);
            else if (dx < -SWIPE_MIN) goLb(1);
          }}
          role="dialog"
          aria-modal="true"
          aria-label="Galerie — detail"
        >
          <button
            type="button"
            onClick={() => setLightbox(null)}
            className="absolute top-5 right-5 h-11 w-11 rounded-full border border-white/20 text-white hover:border-gold flex items-center justify-center z-10"
            aria-label="Zavřít"
          >
            <X className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              goLb(-1);
            }}
            className="absolute left-3 md:left-8 top-1/2 -translate-y-1/2 h-11 w-11 rounded-full border border-white/20 text-white hover:border-gold hidden sm:flex items-center justify-center"
            aria-label="Předchozí"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              goLb(1);
            }}
            className="absolute right-3 md:right-8 top-1/2 -translate-y-1/2 h-11 w-11 rounded-full border border-white/20 text-white hover:border-gold hidden sm:flex items-center justify-center"
            aria-label="Další"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
          <img
            src={filtered[lightbox].src}
            alt={filtered[lightbox].alt}
            className="max-h-[85vh] max-w-[min(1100px,92vw)] object-contain rounded-lg"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </>
  );
}
