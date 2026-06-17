import { useEffect, useState } from "react";
import { Mail, Menu, Phone, Scissors, X } from "lucide-react";
import { Button } from "@/components/ui/button";

import { AppLink } from "@/lib/router";

const NAV_LINKS = [
  { href: "/", label: "Domů", route: true },
  { href: "/portfolio", label: "Portfolio", route: true },
  { href: "#tym", label: "Tým", route: false },
  { href: "#sluzby", label: "Služby", route: false },
  { href: "#produkty", label: "Produkty", route: false },
  { href: "#o-nas", label: "O nás", route: false },
  { href: "#kontakt", label: "Kontakt", route: false },
] as const;

type Props = {
  onReserve: () => void;
};

export function SiteNav({ onReserve }: Props) {
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
          <AppLink
            to="/"
            className={`flex items-center gap-2 transition-colors ${scrolled ? "text-foreground" : "text-primary-foreground"}`}
          >
            <Scissors className="h-5 w-5 text-gold" />
            <span className="font-display text-xl tracking-wide">Studio Elegance</span>
          </AppLink>

          <nav className="hidden xl:flex items-center gap-7 absolute left-1/2 -translate-x-1/2">
            {NAV_LINKS.map((l) =>
              l.route ? (
                <AppLink key={l.href} to={l.href} className={`${linkBase} ${linkColor}`}>
                  {l.label}
                </AppLink>
              ) : (
                <a key={l.href} href={l.href} className={`${linkBase} ${linkColor}`}>
                  {l.label}
                </a>
              ),
            )}
          </nav>

          <div className="hidden xl:block">
            <Button
              size="sm"
              onClick={onReserve}
              className="bg-gold text-primary hover:bg-gold/90 px-5 h-10"
            >
              Rezervovat termín
            </Button>
          </div>

          <button
            type="button"
            onClick={() => setOpen(true)}
            aria-label="Otevřít menu"
            className={`xl:hidden inline-flex items-center justify-center h-10 w-10 rounded-md transition-colors ${
              scrolled ? "text-foreground hover:bg-muted" : "text-primary-foreground hover:bg-white/10"
            }`}
          >
            <Menu className="h-6 w-6" />
          </button>
        </div>
      </header>

      <div
        className={`xl:hidden fixed inset-0 z-50 transition-opacity duration-300 ${
          open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
      >
        <div className="absolute inset-0 bg-black/50" onClick={() => setOpen(false)} />
        <div
          className={`absolute top-0 right-0 h-full w-[min(100%,320px)] bg-primary text-primary-foreground shadow-2xl transition-transform duration-300 ${
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
          <nav className="flex flex-col px-6 py-6 gap-0.5 overflow-y-auto h-[calc(100%-73px)]">
            {NAV_LINKS.map((l) =>
              l.route ? (
                <AppLink
                  key={l.href}
                  to={l.href}
                  onClick={() => setOpen(false)}
                  className="font-display text-xl py-3 border-b border-primary-foreground/10 hover:text-gold transition-colors block"
                >
                  {l.label}
                </AppLink>
              ) : (
                <a
                  key={l.href}
                  href={l.href}
                  onClick={() => setOpen(false)}
                  className="font-display text-xl py-3 border-b border-primary-foreground/10 hover:text-gold transition-colors"
                >
                  {l.label}
                </a>
              ),
            )}
            <div className="mt-6">
              <Button
                size="lg"
                onClick={() => {
                  setOpen(false);
                  onReserve();
                }}
                className="w-full bg-gold text-primary hover:bg-gold/90 h-12 text-base"
              >
                Rezervovat termín
              </Button>
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
