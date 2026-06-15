import { Sparkles } from "lucide-react";
import { PRODUCTS } from "@/lib/home-content";
import { cn } from "@/lib/utils";

export function ProductsSection() {
  return (
    <section id="produkty" className="py-24 md:py-32 bg-primary text-primary-foreground relative overflow-hidden">
      <div
        className="absolute inset-0 opacity-[0.04] pointer-events-none"
        style={{
          backgroundImage: `url("https://images.unsplash.com/photo-1560066984-138dadb4c035?w=1200&q=60")`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
        aria-hidden
      />

      <div className="max-w-7xl mx-auto px-6 relative">
        <div className="grid lg:grid-cols-[1fr_1.2fr] gap-12 lg:gap-16 items-end mb-14">
          <div>
            <p className="text-gold tracking-[0.3em] text-xs uppercase mb-4">Péče domů</p>
            <h2 className="font-display text-4xl md:text-5xl mb-4 leading-tight">
              Prémiová kosmetika, se kterou pracujeme
            </h2>
            <div className="hairline w-24 mb-6 opacity-80" />
            <p className="text-primary-foreground/75 leading-relaxed max-w-lg">
              Ve studiu používáme výhradně profesionální řady Kérastase a Olaplex. Stejné produkty
              vám rádi doporučíme i pro domácí rituál — aby váš účes zářil i týdny po návštěvě.
            </p>
          </div>
          <div className="flex items-center gap-4 text-sm text-primary-foreground/60">
            <Sparkles className="h-5 w-5 text-gold shrink-0" />
            <span>Produkty doporučíme na míru po konzultaci — dostupné přímo v salónu.</span>
          </div>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {PRODUCTS.map((p, i) => (
            <article
              key={p.id}
              className={cn(
                "group rounded-2xl border border-primary-foreground/10 bg-primary-foreground/[0.04] backdrop-blur-sm overflow-hidden transition-all duration-300 hover:border-gold/40 hover:bg-primary-foreground/[0.07]",
                i === 0 && "sm:col-span-2 lg:col-span-1",
              )}
            >
              <div className="aspect-[4/3] overflow-hidden bg-primary-foreground/5">
                <img
                  src={p.image}
                  alt={`${p.brand} ${p.name}`}
                  loading="lazy"
                  className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
              </div>
              <div className="p-6">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <p className="text-[10px] uppercase tracking-[0.25em] text-gold">{p.brand}</p>
                  {p.tag && (
                    <span className="text-[10px] uppercase tracking-wider bg-gold/20 text-gold px-2 py-0.5 rounded-full shrink-0">
                      {p.tag}
                    </span>
                  )}
                </div>
                <h3 className="font-display text-2xl mb-2">{p.name}</h3>
                <p className="text-sm text-primary-foreground/70 leading-relaxed">{p.desc}</p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
