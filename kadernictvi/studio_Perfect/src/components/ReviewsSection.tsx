import { Star } from "lucide-react";
import { REVIEWS, SALON } from "@/lib/content";
import { Reveal } from "@/components/Reveal";
import { SectionHead } from "@/components/SectionHead";
import { SectionShell } from "@/components/SectionShell";

export function ReviewsSection() {
  return (
    <SectionShell id="recenze" bg="ink" className="py-24 text-paper md:py-32">
      <div className="mx-auto max-w-[1200px] px-5">
        <Reveal variant="fade">
          <SectionHead
            index="04"
            label="Recenze"
            title="Slova našich klientek"
            dark
            description="Všechny recenze pocházejí z Google — 5,0 hvězdiček z 27 hodnocení."
          >
            <div className="flex items-center gap-3 border border-paper/15 px-5 py-4">
              <div className="flex text-accent-soft">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-4 w-4 fill-current" />
                ))}
              </div>
              <div>
                <p className="font-display text-2xl">{SALON.rating.toFixed(1)}</p>
                <p className="text-xs text-paper/55">{SALON.reviewCount} recenzí</p>
              </div>
            </div>
          </SectionHead>
        </Reveal>

        <div className="grid gap-5 md:grid-cols-3 md:gap-6">
          {REVIEWS.map((r, i) => (
            <Reveal
              key={r.id}
              as="blockquote"
              variant="up"
              delay={i * 120}
              className={`flex flex-col border border-paper/10 bg-paper/[0.04] p-6 md:p-7 ${
                i === 1 ? "md:translate-y-8" : ""
              }`}
            >
              <p className="font-display text-5xl leading-none text-accent-soft/50">&ldquo;</p>
              <p className="mt-3 flex-1 text-sm leading-relaxed text-paper/85">{r.text}</p>
              <footer className="mt-6 border-t border-paper/10 pt-4">
                <p className="font-medium">{r.author}</p>
                <p className="text-xs text-paper/45">{r.when}</p>
              </footer>
            </Reveal>
          ))}
        </div>
      </div>
    </SectionShell>
  );
}
