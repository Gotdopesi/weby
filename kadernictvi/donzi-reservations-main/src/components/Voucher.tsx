import { MapPin } from "lucide-react";
import poukazImg from "@/assets/poukaz.webp";

export function Voucher() {
  return (
    <section id="poukaz" className="py-24 relative bg-card/20">
      <div className="container mx-auto px-6">
        <div className="grid md:grid-cols-2 gap-12 items-center max-w-5xl mx-auto">
          <div className="relative flex justify-center">
            <div className="absolute inset-0 bg-gold/10 blur-3xl rounded-full scale-75" />
            <img
              src={poukazImg}
              alt="Dárkový poukaz Barbershop Donzi"
              loading="lazy"
              width={640}
              height={640}
              className="relative w-full max-w-md rounded-sm shadow-luxe border border-gold/30 object-cover"
            />
          </div>
          <div>
            <div className="flex items-center gap-3 mb-5">
              <span className="h-px w-10 bg-gold" />
              <span className="text-xs uppercase tracking-[0.4em] text-gold">
                Dárkový poukaz
              </span>
            </div>
            <h2 className="font-display text-4xl md:text-5xl text-foreground leading-tight">
              Darujte <span className="gold-text-gradient">zážitek</span>
            </h2>
            <p className="mt-6 text-muted-foreground leading-relaxed">
              Překvapte blízkého pánskou péčí v Barbershop Donzi. Dárkový poukaz
              v hodnotě dle vašeho výběru — ideální k narozeninám, svátkům nebo
              jen tak pro radost.
            </p>
            <p className="mt-6 p-4 rounded-sm border border-gold/30 bg-gold/5 text-foreground text-sm leading-relaxed">
              <strong className="text-gold font-normal">Poukaz nejde zakoupit online.</strong>{" "}
              Stačí přijít přímo do naší prodejny v Dobrušce — na recepci vám ho připravíme
              na místě v libovolné hodnotě.
            </p>
            <a
              href="#kontakt"
              className="inline-flex items-center gap-2 mt-8 text-gold hover:text-gold/80 transition-colors text-sm uppercase tracking-widest"
            >
              <MapPin className="w-4 h-4" />
              Kde nás najdete →
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
