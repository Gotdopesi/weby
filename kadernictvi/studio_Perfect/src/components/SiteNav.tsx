import { useEffect, useState } from "react";
import { Menu, Phone, X } from "lucide-react";
import { SALON } from "@/lib/content";

const LINKS = [
  { href: "#pred-po", label: "Proměny" },
  { href: "#sluzby", label: "Ceník" },
  { href: "#produkty", label: "Produkty" },
  { href: "#recenze", label: "Recenze" },
  { href: "#o-nas", label: "Studio" },
  { href: "#kontakt", label: "Kontakt" },
] as const;

type Props = {
  onReserve: () => void;
};

export function SiteNav({ onReserve }: Props) {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 48);
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

  return (
    <>
      <header
        className={`fixed inset-x-0 top-0 z-40 transition-all duration-500 ${
          scrolled
            ? "py-3"
            : "py-5"
        }`}
      >
        <div
          className={`mx-auto flex max-w-[1200px] items-center justify-between px-5 transition-all duration-500 ${
            scrolled
              ? "rounded-none border-b border-line/80 bg-paper/92 py-3 backdrop-blur-lg shadow-[0_8px_30px_-20px_rgba(0,0,0,0.25)]"
              : ""
          }`}
        >
          <a href="#top" className="flex items-baseline gap-2">
            <span
              className={`font-display text-2xl italic transition-colors md:text-[1.65rem] ${
                scrolled ? "text-ink" : "text-paper"
              }`}
            >
              Perfekt studio
            </span>
            <span
              className={`hidden text-[10px] uppercase tracking-[0.28em] sm:inline ${
                scrolled ? "text-muted" : "text-paper/55"
              }`}
            >
              Trutnov
            </span>
          </a>

          <nav className="hidden items-center gap-7 xl:flex">
            {LINKS.map((l) => (
              <a
                key={l.href}
                href={l.href}
                className={`group relative text-[13px] tracking-wide transition-colors ${
                  scrolled ? "text-ink/75 hover:text-accent" : "text-paper/80 hover:text-paper"
                }`}
              >
                {l.label}
                <span className="absolute -bottom-1 left-0 h-px w-0 bg-accent transition-all duration-300 group-hover:w-full" />
              </a>
            ))}
          </nav>

          <div className="hidden xl:block">
            <button
              type="button"
              onClick={onReserve}
              className={`border px-5 py-2 text-[13px] tracking-wide transition-all duration-300 ${
                scrolled
                  ? "border-ink bg-ink text-paper hover:bg-accent hover:border-accent"
                  : "border-paper/50 text-paper hover:bg-paper hover:text-ink"
              }`}
            >
              Objednat
            </button>
          </div>

          <button
            type="button"
            aria-label="Menu"
            onClick={() => setOpen(true)}
            className={`inline-flex h-10 w-10 items-center justify-center xl:hidden ${
              scrolled ? "text-ink" : "text-paper"
            }`}
          >
            <Menu className="h-5 w-5" />
          </button>
        </div>
      </header>

      <div className={`fixed inset-0 z-50 xl:hidden ${open ? "pointer-events-auto" : "pointer-events-none"}`}>
        <div
          className={`absolute inset-0 bg-ink/70 transition-opacity duration-300 ${open ? "opacity-100" : "opacity-0"}`}
          onClick={() => setOpen(false)}
        />
        <aside
          className={`absolute right-0 top-0 flex h-full w-[min(100%,340px)] flex-col bg-paper transition-transform duration-500 ease-out ${open ? "translate-x-0" : "translate-x-full"}`}
        >
          <div className="flex items-center justify-between border-b border-line px-6 py-5">
            <span className="font-display text-2xl italic">Menu</span>
            <button type="button" aria-label="Zavřít" onClick={() => setOpen(false)}>
              <X className="h-5 w-5" />
            </button>
          </div>
          <nav className="flex flex-1 flex-col px-6 py-4">
            {LINKS.map((l, i) => (
              <a
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className="group flex items-center gap-4 border-b border-line py-4"
              >
                <span className="text-xs text-accent/60">0{i + 1}</span>
                <span className="font-display text-2xl transition-colors group-hover:text-accent">{l.label}</span>
              </a>
            ))}
          </nav>
          <div className="space-y-4 border-t border-line px-6 py-6">
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                onReserve();
              }}
              className="w-full bg-ink py-3.5 text-sm text-paper"
            >
              Objednat termín
            </button>
            <a href={SALON.phoneHref} className="flex items-center gap-2 text-sm text-muted">
              <Phone className="h-4 w-4 text-accent" />
              {SALON.phone}
            </a>
          </div>
        </aside>
      </div>
    </>
  );
}
