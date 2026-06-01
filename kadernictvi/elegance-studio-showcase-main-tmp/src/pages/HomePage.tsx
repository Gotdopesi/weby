import { useEffect, useState } from "react";
import { z } from "zod";
import { Scissors, MapPin, Phone, Mail, Clock, Instagram, Facebook, Star, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { BookingDialog } from "@/components/BookingDialog";
import { toast } from "sonner";
import { isSupabaseConfigured, supabase } from "@/integrations/supabase/client";
import { DEFAULT_BARBERSHOP_ID } from "@/lib/barbershop";
import { SHOWCASE_TABLES } from "@/lib/showcase-tables";

const SERVICES = [
  { name: "Dámský střih & foukání", desc: "Konzultace, mytí, střih a styling.", price: "890 Kč", featured: false },
  { name: "Pánský střih", desc: "Klasický nebo moderní střih včetně úpravy vousů.", price: "590 Kč", featured: false },
  { name: "Barvení vlasů", desc: "Profesionální barvy s ošetřující péčí.", price: "od 1 490 Kč", featured: false },
  { name: "Balayage", desc: "Ručně malované přechody pro přirozený efekt.", price: "od 2 890 Kč", featured: true },
  { name: "Melír", desc: "Klasický melír pro rozjasnění vlasů.", price: "od 1 790 Kč", featured: false },
  { name: "Společenský účes", desc: "Slavnostní účesy pro výjimečné okamžiky.", price: "1 290 Kč", featured: false },
];

const TEAM = [
  { name: "Klára Černá", role: "Zakladatelka & Master Stylist", img: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=600&q=80" },
  { name: "Tomáš Veselý", role: "Senior Stylist & Barber", img: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&q=80" },
  { name: "Eliška Mráčková", role: "Color Specialist", img: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=600&q=80" },
];

const NAV_LINKS = [
  { href: "#top", label: "Domů" },
  { href: "#o-nas", label: "O nás" },
  { href: "#sluzby", label: "Služby" },
  { href: "#tym", label: "Náš tým" },
  { href: "#kontakt", label: "Kontakt" },
];

function Nav() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const linkBase =
    "relative text-sm tracking-wide transition-colors after:content-[''] after:absolute after:left-0 after:-bottom-1 after:h-px after:w-full after:origin-left after:scale-x-0 after:bg-gold after:transition-transform after:duration-300 hover:after:scale-x-100";
  const linkColor = scrolled ? "text-foreground hover:text-gold" : "text-primary-foreground hover:text-gold";

  return (
    <>
      <header
        className={`fixed top-0 inset-x-0 z-40 transition-all duration-300 ${
          scrolled
            ? "bg-background/90 backdrop-blur-md shadow-[0_2px_20px_-8px_rgba(0,0,0,0.15)] border-b border-border/60"
            : "bg-transparent"
        }`}
      >
        <div
          className={`max-w-7xl mx-auto px-6 flex items-center justify-between transition-all duration-300 ${scrolled ? "py-3" : "py-5"}`}
        >
          <a
            href="#top"
            className={`flex items-center gap-2 transition-colors ${scrolled ? "text-foreground" : "text-primary-foreground"}`}
          >
            <Scissors className="h-5 w-5 text-gold" />
            <span className="font-display text-xl tracking-wide">Studio Elegance</span>
          </a>

          <nav className="hidden lg:flex items-center gap-9 absolute left-1/2 -translate-x-1/2">
            {NAV_LINKS.map((l) => (
              <a key={l.href} href={l.href} className={`${linkBase} ${linkColor}`}>
                {l.label}
              </a>
            ))}
          </nav>

          <div className="hidden lg:block">
            <BookingDialog
              trigger={
                <Button size="sm" className="bg-gold text-primary hover:bg-gold/90 px-5 h-10">
                  Rezervovat termín
                </Button>
              }
            />
          </div>

          <button
            type="button"
            onClick={() => setOpen(true)}
            aria-label="Otevřít menu"
            className={`lg:hidden inline-flex items-center justify-center h-10 w-10 rounded-md transition-colors ${
              scrolled ? "text-foreground hover:bg-muted" : "text-primary-foreground hover:bg-white/10"
            }`}
          >
            <Menu className="h-6 w-6" />
          </button>
        </div>
      </header>

      <div
        className={`lg:hidden fixed inset-0 z-50 transition-opacity duration-300 ${
          open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
      >
        <div className="absolute inset-0 bg-black/50" onClick={() => setOpen(false)} />
        <div
          className={`absolute top-0 right-0 h-full w-1/2 min-w-[280px] bg-primary text-primary-foreground shadow-2xl transition-transform duration-300 ${
            open ? "translate-x-0" : "translate-x-full"
          }`}
        >
          <div className="flex items-center justify-between px-6 py-5 border-b border-primary-foreground/10">
            <div className="flex items-center gap-2">
              <Scissors className="h-5 w-5 text-gold" />
              <span className="font-display text-lg">Menu</span>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Zavřít menu"
              className="inline-flex items-center justify-center h-10 w-10 rounded-md hover:bg-white/10"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
          <nav className="flex flex-col px-6 py-8 gap-1 overflow-y-auto h-[calc(100%-73px)]">
            {NAV_LINKS.map((l, i) => (
              <a
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className="font-display text-2xl py-3 border-b border-primary-foreground/10 hover:text-gold transition-colors"
                style={{ animation: open ? `fade-in 0.4s ease-out ${i * 60}ms both` : undefined }}
              >
                {l.label}
              </a>
            ))}
            <div className="mt-6">
              <BookingDialog
                trigger={
                  <Button size="lg" className="w-full bg-gold text-primary hover:bg-gold/90 h-12 text-base">
                    Rezervovat termín
                  </Button>
                }
              />
            </div>
            <div className="mt-8 space-y-3 text-primary-foreground/70 text-sm">
              <a href="tel:+420222333444" className="flex items-center gap-3 hover:text-gold">
                <Phone className="h-4 w-4 text-gold" />
                +420 222 333 444
              </a>
              <a href="mailto:info@studio-elegance.cz" className="flex items-center gap-3 hover:text-gold break-all">
                <Mail className="h-4 w-4 text-gold shrink-0" />
                info@studio-elegance.cz
              </a>
            </div>
          </nav>
        </div>
      </div>
    </>
  );
}

function Hero() {
  return (
    <section id="top" className="relative min-h-[100svh] flex items-center overflow-hidden">
      <div className="absolute inset-0">
        <img
          src="https://images.unsplash.com/photo-1560066984-138dadb4c035?w=1920&q=80"
          alt="Interiér salónu Studio Elegance"
          className="h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/55 to-black/30" />
      </div>
      <div className="relative max-w-7xl mx-auto px-6 pt-32 pb-20 text-primary-foreground">
        <p className="text-gold tracking-[0.3em] text-xs uppercase mb-6">Kadeřnický salón · Praha</p>
        <h1 className="font-display text-5xl sm:text-6xl md:text-7xl lg:text-8xl leading-[1.05] max-w-4xl">
          Krása, která <em className="text-gold not-italic">zůstává</em> v paměti.
        </h1>
        <p className="mt-8 max-w-xl text-lg text-primary-foreground/85 leading-relaxed">
          Vítejte ve Studio Elegance — místo, kde se setkává řemeslo, péče a tichý luxus. Vytvoříme účes, ve kterém se budete cítit dokonale.
        </p>
        <div className="mt-10 flex flex-wrap items-center gap-4">
          <BookingDialog
            trigger={
              <Button size="lg" className="bg-gold text-primary hover:bg-gold/90 px-8 h-12 text-base">
                Rezervovat termín
              </Button>
            }
          />
          <a href="#sluzby">
            <Button
              size="lg"
              variant="outline"
              className="border-primary-foreground/40 bg-transparent text-primary-foreground hover:bg-primary-foreground hover:text-primary h-12 px-8"
            >
              Naše služby
            </Button>
          </a>
        </div>
        <div className="mt-16 flex items-center gap-3 text-sm text-primary-foreground/70">
          <div className="flex text-gold">
            {[...Array(5)].map((_, i) => (
              <Star key={i} className="h-4 w-4 fill-current" />
            ))}
          </div>
          <span>4.9 / 5 · více než 800 spokojených klientek a klientů</span>
        </div>
      </div>
    </section>
  );
}

function Services() {
  return (
    <section id="sluzby" className="py-24 md:py-32 bg-background">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <p className="text-gold tracking-[0.3em] text-xs uppercase mb-4">Ceník</p>
          <h2 className="font-display text-4xl md:text-5xl mb-4">Naše služby</h2>
          <div className="hairline w-24 mx-auto mb-6" />
          <p className="text-muted-foreground">
            Každá návštěva začíná konzultací. Ceny jsou orientační a odvíjí se od délky a struktury vlasů.
          </p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {SERVICES.map((s) => (
            <div
              key={s.name}
              className={`group relative rounded-xl border bg-card p-8 transition-all hover:shadow-xl hover:-translate-y-1 ${
                s.featured ? "border-gold" : "border-border"
              }`}
            >
              {s.featured && (
                <span className="absolute -top-3 left-8 bg-gold text-primary text-[10px] tracking-widest uppercase px-3 py-1 rounded-full">
                  Doporučujeme
                </span>
              )}
              <h3 className="font-display text-2xl mb-2">{s.name}</h3>
              <p className="text-sm text-muted-foreground mb-6 min-h-[3rem]">{s.desc}</p>
              <div className="flex items-end justify-between border-t border-border pt-4">
                <span className="text-gold font-medium text-lg">{s.price}</span>
                <BookingDialog
                  trigger={
                    <Button variant="ghost" size="sm" className="text-foreground hover:text-gold">
                      Rezervovat →
                    </Button>
                  }
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function About() {
  return (
    <section id="o-nas" className="py-24 md:py-32 bg-secondary/40">
      <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-2 gap-16 items-center">
        <div className="relative">
          <img
            src="https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=900&q=80"
            alt="Detail úpravy vlasů"
            className="rounded-xl object-cover w-full aspect-[4/5]"
          />
          <div className="absolute -bottom-6 -right-6 bg-card border border-gold rounded-lg p-6 shadow-xl hidden sm:block">
            <p className="font-display text-4xl text-gold">15</p>
            <p className="text-xs uppercase tracking-widest text-muted-foreground">let zkušeností</p>
          </div>
        </div>
        <div>
          <p className="text-gold tracking-[0.3em] text-xs uppercase mb-4">O nás</p>
          <h2 className="font-display text-4xl md:text-5xl mb-6 leading-tight">Salón, který staví na řemesle a důvěře.</h2>
          <div className="hairline w-24 mb-6" />
          <p className="text-muted-foreground leading-relaxed mb-4">
            Studio Elegance vzniklo s jedinou myšlenkou — vrátit kadeřnictví jeho původní význam. Místo, kde má každý klient čas, kde se nespěchá a kde se každý detail počítá.
          </p>
          <p className="text-muted-foreground leading-relaxed mb-8">
            Pracujeme výhradně s prémiovou kosmetikou Kérastase a Olaplex. Naši stylisté se pravidelně školí na mezinárodních akademiích v Paříži a Londýně.
          </p>
          <div className="grid grid-cols-3 gap-6">
            <div>
              <p className="font-display text-3xl text-gold">800+</p>
              <p className="text-xs text-muted-foreground uppercase tracking-wider mt-1">Klientů</p>
            </div>
            <div>
              <p className="font-display text-3xl text-gold">3</p>
              <p className="text-xs text-muted-foreground uppercase tracking-wider mt-1">Stylistů</p>
            </div>
            <div>
              <p className="font-display text-3xl text-gold">4.9</p>
              <p className="text-xs text-muted-foreground uppercase tracking-wider mt-1">Hodnocení</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Team() {
  return (
    <section id="tym" className="py-24 md:py-32 bg-background">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <p className="text-gold tracking-[0.3em] text-xs uppercase mb-4">Lidé</p>
          <h2 className="font-display text-4xl md:text-5xl mb-4">Náš tým</h2>
          <div className="hairline w-24 mx-auto" />
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {TEAM.map((m) => (
            <div key={m.name} className="group">
              <div className="overflow-hidden rounded-xl mb-5 aspect-[4/5]">
                <img
                  src={m.img}
                  alt={m.name}
                  className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
              </div>
              <h3 className="font-display text-2xl">{m.name}</h3>
              <p className="text-sm text-gold tracking-wider uppercase mt-1">{m.role}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

const contactSchema = z.object({
  name: z.string().trim().min(2, "Zadejte jméno").max(100),
  email: z.string().trim().email("Neplatný e-mail").max(255),
  message: z.string().trim().min(5, "Napište prosím zprávu").max(1000),
});

function ContactFooter() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    const r = contactSchema.safeParse({ name, email, message });
    if (!r.success) {
      toast.error(r.error.issues[0].message);
      return;
    }
    if (isSupabaseConfigured()) {
      const { error } = await supabase.from(SHOWCASE_TABLES.portfolioPoptavky).insert({
        barbershop_id: DEFAULT_BARBERSHOP_ID,
        name: r.data.name,
        email: r.data.email,
        message: r.data.message,
      });
      if (error) {
        toast.error("Zprávu se nepodařilo uložit.", { description: error.message });
        return;
      }
    }
    toast.success("Děkujeme! Brzy se vám ozveme.");
    setName("");
    setEmail("");
    setMessage("");
  };

  return (
    <footer id="kontakt" className="bg-primary text-primary-foreground pt-24 pb-10">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid lg:grid-cols-2 gap-16 mb-20">
          <div>
            <p className="text-gold tracking-[0.3em] text-xs uppercase mb-4">Kontakt</p>
            <h2 className="font-display text-4xl md:text-5xl mb-6 leading-tight">Domluvme si schůzku.</h2>
            <div className="hairline w-24 mb-8" />
            <ul className="space-y-5 text-primary-foreground/85">
              <li className="flex items-start gap-4">
                <MapPin className="h-5 w-5 text-gold mt-0.5 shrink-0" />
                <span>
                  Pařížská 12
                  <br />
                  110 00 Praha 1
                </span>
              </li>
              <li className="flex items-center gap-4">
                <Phone className="h-5 w-5 text-gold shrink-0" />
                <a href="tel:+420222333444" className="hover:text-gold">
                  +420 222 333 444
                </a>
              </li>
              <li className="flex items-center gap-4">
                <Mail className="h-5 w-5 text-gold shrink-0" />
                <a href="mailto:info@studio-elegance.cz" className="hover:text-gold">
                  info@studio-elegance.cz
                </a>
              </li>
              <li className="flex items-start gap-4">
                <Clock className="h-5 w-5 text-gold mt-0.5 shrink-0" />
                <span>
                  Po–Pá 9:00 — 19:00
                  <br />
                  So 9:00 — 14:00
                </span>
              </li>
            </ul>
            <div className="mt-8 rounded-xl overflow-hidden border border-primary-foreground/10 aspect-[16/9]">
              <iframe
                title="Mapa salónu"
                src="https://www.openstreetmap.org/export/embed.html?bbox=14.4180%2C50.0871%2C14.4250%2C50.0911&layer=mapnik&marker=50.0891%2C14.4215"
                className="w-full h-full border-0"
                loading="lazy"
              />
            </div>
          </div>

          <form
            onSubmit={send}
            className="bg-primary-foreground/5 backdrop-blur rounded-xl border border-primary-foreground/10 p-8 space-y-4 self-start"
          >
            <h3 className="font-display text-2xl mb-2">Napište nám</h3>
            <div className="space-y-1.5">
              <Label htmlFor="cname" className="text-primary-foreground/80">
                Jméno
              </Label>
              <Input
                id="cname"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="bg-primary-foreground/10 border-primary-foreground/20 text-primary-foreground placeholder:text-primary-foreground/50"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="cemail" className="text-primary-foreground/80">
                E-mail
              </Label>
              <Input
                id="cemail"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-primary-foreground/10 border-primary-foreground/20 text-primary-foreground placeholder:text-primary-foreground/50"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="cmsg" className="text-primary-foreground/80">
                Zpráva
              </Label>
              <Textarea
                id="cmsg"
                rows={5}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="bg-primary-foreground/10 border-primary-foreground/20 text-primary-foreground placeholder:text-primary-foreground/50"
              />
            </div>
            <Button type="submit" className="w-full bg-gold text-primary hover:bg-gold/90">
              Odeslat zprávu
            </Button>
          </form>
        </div>

        <div className="border-t border-primary-foreground/10 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-primary-foreground/60">
          <div className="flex items-center gap-2">
            <Scissors className="h-4 w-4 text-gold" />
            <span className="font-display text-lg text-primary-foreground">Studio Elegance</span>
          </div>
          <p>© {new Date().getFullYear()} Studio Elegance. Všechna práva vyhrazena.</p>
          <div className="flex gap-3">
            <a href="#" aria-label="Instagram" className="hover:text-gold">
              <Instagram className="h-5 w-5" />
            </a>
            <a href="#" aria-label="Facebook" className="hover:text-gold">
              <Facebook className="h-5 w-5" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default function HomePage() {
  return (
    <main>
      <Nav />
      <Hero />
      <Services />
      <About />
      <Team />
      <ContactFooter />
    </main>
  );
}
