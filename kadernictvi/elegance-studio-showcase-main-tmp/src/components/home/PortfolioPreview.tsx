import { useState } from "react";
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import { BeforeAfterSlider } from "@/components/home/BeforeAfterSlider";
import { BEFORE_AFTER } from "@/lib/home-content";
import { AppLink } from "@/lib/router";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export function PortfolioPreview() {
  const [baIndex, setBaIndex] = useState(0);

  const goBa = (dir: -1 | 1) => {
    setBaIndex((i) => (i + dir + BEFORE_AFTER.length) % BEFORE_AFTER.length);
  };

  const current = BEFORE_AFTER[baIndex];

  return (
    <section id="portfolio" className="py-24 md:py-32 bg-secondary/30">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <p className="text-gold tracking-[0.3em] text-xs uppercase mb-4">Portfolio</p>
          <h2 className="font-display text-4xl md:text-5xl mb-4">Naše práce mluví za nás</h2>
          <div className="hairline w-24 mx-auto mb-6" />
          <p className="text-muted-foreground leading-relaxed">
            Přetáhněte posuvník a porovnejte proměnu u stejné klientky nebo klienta. Více fotek
            najdete v našem portfoliu.
          </p>
        </div>

        <div className="relative max-w-sm md:max-w-md mx-auto px-2 sm:px-0">
          <BeforeAfterSlider
            before={current.before}
            after={current.after}
            title={current.title}
            samePerson={current.samePerson}
            beforePosition={current.beforePosition}
            afterPosition={current.afterPosition}
          />

          <div className="flex items-center justify-center gap-3 sm:gap-4 mt-4 sm:mt-6">
            <Button type="button" variant="outline" size="icon" className="h-9 w-9 sm:h-10 sm:w-10" onClick={() => goBa(-1)} aria-label="Předchozí">
              <ChevronLeft className="h-4 w-4 sm:h-5 sm:w-5" />
            </Button>
            <div className="flex gap-2">
              {BEFORE_AFTER.map((b, i) => (
                <button
                  key={b.id}
                  type="button"
                  onClick={() => setBaIndex(i)}
                  className={cn(
                    "h-2 rounded-full transition-all",
                    i === baIndex ? "w-8 bg-gold" : "w-2 bg-border hover:bg-gold/50",
                  )}
                  aria-label={b.title}
                />
              ))}
            </div>
            <Button type="button" variant="outline" size="icon" className="h-9 w-9 sm:h-10 sm:w-10" onClick={() => goBa(1)} aria-label="Další">
              <ChevronRight className="h-4 w-4 sm:h-5 sm:w-5" />
            </Button>
          </div>

          <div className="text-center mt-8 sm:mt-10">
            <AppLink
              to="/portfolio"
              className="inline-flex items-center justify-center gap-2 bg-primary text-primary-foreground hover:bg-primary/90 px-6 sm:px-8 h-11 sm:h-12 rounded-md text-sm sm:text-base font-medium transition-colors"
            >
              Zobrazit více
              <ArrowRight className="h-4 w-4" />
            </AppLink>
          </div>
        </div>
      </div>
    </section>
  );
}
