import { ArrowRight, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MEN_SERVICES, WOMEN_SERVICES, type ServiceItem } from "@/lib/home-content";
import { cn } from "@/lib/utils";

type Props = {
  onReserveService: (serviceName: string) => void;
};

function ServiceGrid({
  items,
  onReserve,
}: {
  items: ServiceItem[];
  onReserve: (name: string) => void;
}) {
  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 mt-8">
      {items.map((s) => (
        <article
          key={s.id}
          className={cn(
            "group relative rounded-2xl border bg-card p-7 transition-all duration-300 hover:shadow-[0_20px_50px_-24px_rgba(0,0,0,0.15)] hover:-translate-y-0.5",
            s.featured ? "border-gold/60 ring-1 ring-gold/20" : "border-border",
          )}
        >
          {s.featured && (
            <span className="absolute -top-3 left-7 bg-gold text-primary text-[10px] tracking-widest uppercase px-3 py-1 rounded-full">
              Oblíbené
            </span>
          )}
          <h3 className="font-display text-2xl mb-2 pr-4">{s.name}</h3>
          <p className="text-sm text-muted-foreground mb-5 min-h-[3rem] leading-relaxed">{s.desc}</p>
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-5">
            <Clock className="h-3.5 w-3.5 text-gold" />
            {s.duration}
          </div>
          <div className="flex items-end justify-between border-t border-border pt-4 gap-3">
            <span className="text-gold font-medium text-lg whitespace-nowrap">{s.price}</span>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => onReserve(s.name)}
              className="text-foreground hover:text-gold group-hover:translate-x-0.5 transition-transform"
            >
              Rezervovat
              <ArrowRight className="ml-1 h-4 w-4" />
            </Button>
          </div>
        </article>
      ))}
    </div>
  );
}

export function ServicesPricing({ onReserveService }: Props) {
  return (
    <section id="sluzby" className="py-24 md:py-32 bg-background">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <p className="text-gold tracking-[0.3em] text-xs uppercase mb-4">Ceník</p>
          <h2 className="font-display text-4xl md:text-5xl mb-4">Služby & ceník</h2>
          <div className="hairline w-24 mx-auto mb-6" />
          <p className="text-muted-foreground">
            Každá návštěva začíná konzultací. Ceny jsou orientační — finální částka závisí na délce a
            struktuře vlasů.
          </p>
        </div>

        <Tabs defaultValue="damske" className="max-w-5xl mx-auto">
          <TabsList className="grid w-full max-w-md mx-auto grid-cols-2 h-12 p-1 bg-muted/80">
            <TabsTrigger value="damske" className="text-sm tracking-wide data-[state=active]:shadow-md">
              Dámské
            </TabsTrigger>
            <TabsTrigger value="panske" className="text-sm tracking-wide data-[state=active]:shadow-md">
              Pánské
            </TabsTrigger>
          </TabsList>
          <TabsContent value="damske">
            <ServiceGrid items={WOMEN_SERVICES} onReserve={onReserveService} />
          </TabsContent>
          <TabsContent value="panske">
            <ServiceGrid items={MEN_SERVICES} onReserve={onReserveService} />
          </TabsContent>
        </Tabs>
      </div>
    </section>
  );
}
