import { useState } from "react";
import { Crown, Scissors, Sparkles, Gift } from "lucide-react";
import {
  SERVICES,
  CATEGORY_LABELS,
  type ServiceCategory,
  type Service,
} from "@/lib/reservation-data";

interface ServicesProps {
  onReserve: (preselectId?: string) => void;
}

const TABS: { key: ServiceCategory; label: string; icon: typeof Scissors }[] = [
  { key: "package", label: "Balíčky", icon: Crown },
  { key: "hair", label: "Střih & vlasy", icon: Scissors },
  { key: "beard", label: "Vousy", icon: Sparkles },
  { key: "extras", label: "Doplňkové", icon: Gift },
];

export function Services({ onReserve }: ServicesProps) {
  const [tab, setTab] = useState<ServiceCategory>("package");

  const packages = SERVICES.filter((s) => s.category === "package");
  const items = SERVICES.filter((s) => s.category === tab);

  return (
    <section id="sluzby" className="py-28 bg-card/30 relative">
      <div className="container mx-auto px-6">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <div className="flex items-center justify-center gap-3 mb-5">
            <span className="h-px w-10 bg-gold" />
            <span className="text-xs uppercase tracking-[0.4em] text-gold">
              Nabídka služeb & ceník
            </span>
            <span className="h-px w-10 bg-gold" />
          </div>
          <h2 className="font-display text-4xl md:text-5xl text-foreground">
            Vyberte si <span className="gold-text-gradient">svůj zážitek</span>
          </h2>
          <p className="mt-5 text-muted-foreground">
            Klikněte na službu a rovnou ji přidáme do rezervace.
          </p>
        </div>

        {tab === "package" && (
          <div className="grid md:grid-cols-2 gap-6 mb-16 max-w-5xl mx-auto">
            {packages.map((p) => (
              <PackageCard key={p.id} svc={p} onReserve={() => onReserve(p.id)} />
            ))}
          </div>
        )}

        <div className="flex flex-wrap justify-center gap-2 mb-10">
          {TABS.map((t) => {
            const Icon = t.icon;
            const active = tab === t.key;
            return (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`flex items-center gap-2 px-5 py-3 rounded-sm text-xs uppercase tracking-widest transition-all border ${
                  active
                    ? "bg-gold text-gold-foreground border-gold shadow-gold"
                    : "border-border text-muted-foreground hover:text-gold hover:border-gold/60"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {t.label}
              </button>
            );
          })}
        </div>

        {tab !== "package" && (
          <>
            <div className="text-center mb-8">
              <h3 className="font-display text-2xl text-foreground">
                {CATEGORY_LABELS[tab]}
              </h3>
            </div>
            <div className="max-w-4xl mx-auto grid md:grid-cols-2 gap-4 animate-fade-in">
              {items.map((s) => (
                <ServiceRow key={s.id} svc={s} onReserve={() => onReserve(s.id)} />
              ))}
            </div>
          </>
        )}
      </div>
    </section>
  );
}

function PackageCard({
  svc,
  onReserve,
}: {
  svc: Service;
  onReserve: () => void;
}) {
  const isVip = svc.vip;
  return (
    <div
      className={`relative rounded-sm overflow-hidden p-8 md:p-10 transition-all hover:-translate-y-1 duration-300 ${
        isVip
          ? "glass-gold border-2 border-gold shadow-gold"
          : "glass border border-border hover:border-gold/60"
      }`}
    >
      {isVip && (
        <div className="absolute top-0 right-0">
          <div className="gold-gradient text-gold-foreground text-[10px] uppercase tracking-widest font-bold px-4 py-1.5 rounded-bl-sm">
            VIP péče 🌟
          </div>
        </div>
      )}

      <div className="flex items-center gap-2 text-gold mb-4">
        <Crown className="w-5 h-5" />
        <span className="text-xs uppercase tracking-[0.3em] font-semibold">Balíček</span>
      </div>

      <h3 className="font-display text-3xl md:text-4xl text-foreground mb-3">{svc.name}</h3>
      <p className="text-muted-foreground mb-6 leading-relaxed text-sm">{svc.description}</p>

      <div className="flex items-end justify-between gap-4 flex-wrap pt-4 border-t border-border/50">
        <div>
          <div className="font-display text-4xl text-gold leading-none">
            {svc.price.toLocaleString("cs-CZ")} Kč
          </div>
          <div className="text-[10px] text-muted-foreground uppercase tracking-widest mt-2">
            {svc.duration} min
          </div>
        </div>
        <button
          onClick={onReserve}
          className={`font-bold px-7 py-3 rounded-sm uppercase tracking-widest text-xs transition-all ${
            isVip
              ? "gold-gradient text-gold-foreground shadow-gold hover:scale-105"
              : "border border-gold text-gold hover:bg-gold hover:text-gold-foreground"
          }`}
        >
          Vybrat
        </button>
      </div>
    </div>
  );
}

function ServiceRow({
  svc,
  onReserve,
}: {
  svc: Service;
  onReserve: () => void;
}) {
  return (
    <button
      onClick={onReserve}
      className="group text-left p-5 rounded-sm bg-secondary/40 border border-border transition-all hover:border-gold hover:bg-gold/5 hover:-translate-y-0.5 cursor-pointer w-full"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <h4 className="font-display text-xl text-foreground group-hover:text-gold transition-colors">
            {svc.name}
          </h4>
        </div>
        <div className="text-right shrink-0">
          <div className="font-display text-2xl text-gold leading-none whitespace-nowrap">
            {svc.price} Kč
          </div>
          <div className="text-[10px] text-muted-foreground uppercase tracking-widest mt-1.5">
            {svc.duration} min
          </div>
        </div>
      </div>
      <div className="text-[10px] uppercase tracking-widest text-muted-foreground group-hover:text-gold mt-3 transition-colors">
        Vybrat →
      </div>
    </button>
  );
}
