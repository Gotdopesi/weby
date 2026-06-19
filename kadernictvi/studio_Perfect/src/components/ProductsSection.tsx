import { PRODUCTS } from "@/lib/content";
import { Reveal } from "@/components/Reveal";
import { SectionHead } from "@/components/SectionHead";
import { SectionShell } from "@/components/SectionShell";

export function ProductsSection() {
  return (
    <SectionShell id="produkty" bg="white" className="py-24 md:py-32">
      <div className="mx-auto max-w-[1200px] px-5">
        <Reveal>
          <SectionHead
            index="03"
            label="Péče domů"
            title="Produkty z našeho salónu"
            description="Profesionální kosmetiku doporučíme na míru — dostupnou přímo ve studiu."
          />
        </Reveal>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {PRODUCTS.map((p, i) => (
            <Reveal key={p.id} as="article" variant="up" delay={i * 80} className="border border-line bg-paper">
              <div className="relative aspect-square overflow-hidden bg-cream">
                <img
                  src={p.image}
                  alt={`${p.brand} ${p.name}`}
                  loading="lazy"
                  className="h-full w-full object-cover"
                />
                {p.tag && (
                  <span className="absolute left-3 top-3 bg-ink/80 px-2.5 py-1 text-[10px] uppercase tracking-[0.2em] text-paper">
                    {p.tag}
                  </span>
                )}
              </div>
              <div className="p-5">
                <p className="text-[10px] uppercase tracking-[0.28em] text-accent">{p.brand}</p>
                <h3 className="mt-2 font-display text-xl leading-snug">{p.name}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">{p.desc}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </SectionShell>
  );
}
