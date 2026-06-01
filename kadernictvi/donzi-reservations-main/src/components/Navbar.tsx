import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";
import logo from "@/assets/logo.webp";

interface NavbarProps {
  onReserve: () => void;
}

const links = [
  { href: "#uvod", label: "Úvod" },
  { href: "#o-nas", label: "O nás" },
  { href: "#tym", label: "Tým" },
  { href: "#sluzby", label: "Ceník" },
  { href: "#galerie", label: "Galerie" },
  { href: "#poukaz", label: "Poukaz" },
  { href: "#kontakt", label: "Kontakt" },
];

export function Navbar({ onReserve }: NavbarProps) {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 30);
    onScroll();
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled
          ? "glass border-b border-border/40 py-3"
          : "bg-transparent py-5"
      }`}
    >
      <div className="container mx-auto px-6 flex items-center justify-between">
        <a href="#uvod" className="flex items-center gap-3 group">
          <img
            src={logo}
            alt="Barbershop Donzi"
            className="h-10 w-10 rounded-full object-cover border border-gold/40 group-hover:border-gold transition-colors"
            width={40}
            height={40}
          />
          <span className="font-display text-2xl tracking-[0.3em] text-foreground hidden sm:inline">
            DON<span className="text-gold">Z</span>I
          </span>
        </a>

        <nav className="hidden xl:flex items-center gap-8 2xl:gap-10 shrink-0">
          {links.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="text-sm uppercase tracking-widest text-muted-foreground hover:text-gold transition-colors relative group"
            >
              {l.label}
              <span className="absolute -bottom-1 left-0 w-0 h-px bg-gold group-hover:w-full transition-all duration-300" />
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <button
            onClick={onReserve}
            className="hidden xl:inline-flex items-center gap-2 gold-gradient text-gold-foreground font-semibold px-6 py-2.5 rounded-sm uppercase tracking-wider text-xs shadow-gold hover:scale-105 transition-transform shrink-0"
          >
            Rezervovat termín
          </button>
          <button
            className="xl:hidden text-foreground p-2"
            onClick={() => setOpen(!open)}
            aria-label="Menu"
          >
            {open ? <X /> : <Menu />}
          </button>
        </div>
      </div>

      {open && (
        <div className="xl:hidden glass border-t border-border/30 mt-3 animate-fade-in">
          <nav className="flex flex-col p-6 gap-5">
            {links.map((l) => (
              <a
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className="text-sm uppercase tracking-widest text-muted-foreground hover:text-gold"
              >
                {l.label}
              </a>
            ))}
            <button
              onClick={() => {
                setOpen(false);
                onReserve();
              }}
              className="gold-gradient text-gold-foreground font-semibold px-6 py-3 rounded-sm uppercase tracking-wider text-xs mt-2"
            >
              Rezervovat termín
            </button>
          </nav>
        </div>
      )}
    </header>
  );
}
