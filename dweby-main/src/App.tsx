import {
  FormEvent,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';
import {
  ArrowUpRight,
  Check,
  Menu,
  Phone,
  Send,
  X,
} from 'lucide-react';
import { toast, Toaster } from 'sonner';
import projects from './data/projects.json';
import { PACKAGES, formatPrice, getPartnerPrice } from './data/packages';
import { PricingSection } from './components/PricingSection';
import { RevealOnScroll } from './components/RevealOnScroll';
import { trackEvent } from './lib/analytics';

type Project = {
  id: string;
  title: string;
  description: string;
  href: string;
  image: string;
  imageAlt?: string;
};

/** Odstraní koncové / a případně omylem vložené `/rest/v1` (jinak vznikne 404 Not Found). */
function normalizeSupabaseBaseUrl(raw: string): string {
  let u = raw.trim().replace(/\/+$/, '');
  if (!u) return '';
  u = u.replace(/\/rest\/v1\/?$/i, '');
  return u.replace(/\/+$/, '');
}

const SUPABASE_URL = normalizeSupabaseBaseUrl(
  import.meta.env.VITE_SUPABASE_URL ?? '',
);
const SUPABASE_ANON_KEY = (import.meta.env.VITE_SUPABASE_ANON_KEY ?? '').trim();
/** Tabulka pro krátký kontaktní formulář na tomto webu (viz .env.example) */
const SUPABASE_PORTFOLIO_TABLE = (
  import.meta.env.VITE_SUPABASE_PORTFOLIO_TABLE ?? 'portfolio_poptavky'
).trim();

const isLikelyVercelHost =
  typeof window !== 'undefined' &&
  /\.vercel\.app$/i.test(window.location.hostname);

/** Logo v `public/logo/Logo_DB.png` */
const LOGO_DB_SRC = '/logo/Logo_DB.png';

export default function App() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const year = useMemo(() => new Date().getFullYear(), []);

  const closeMenu = useCallback(() => setMenuOpen(false), []);

  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeMenu();
    };
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [menuOpen, closeMenu]);

  const submitForm = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);

    const payload = {
      name: String(data.get('name') ?? ''),
      phone: String(data.get('phone') ?? ''),
      typProjektu: String(data.get('typProjektu') ?? ''),
      message: String(data.get('message') ?? ''),
      nickname: String(data.get('nickname') ?? ''),
    };

    if (payload.nickname.trim()) {
      toast.success('Děkuji, zpráva byla odeslána.', {
        description: 'Ozvu se vám co nejdříve.',
      });
      form.reset();
      return;
    }

    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
      const vercelHint =
        isLikelyVercelHost || import.meta.env.PROD
          ? ' Na Vercelu jděte do Project → Settings → Environment Variables, přidejte VITE_SUPABASE_URL a VITE_SUPABASE_ANON_KEY (prefix VITE_ je nutný), zaškrtněte Production i Preview a znovu spusťte Deploy. Soubor .env z počítače se na Vercel nenahrává.'
          : ' Lokálně vytvořte v kořeni projektu soubor .env (viz .env.example) a po úpravě .env restartujte příkaz npm run dev.';
      toast.error('Chybí nastavení Supabase', {
        description: `Doplňte proměnné VITE_SUPABASE_URL a VITE_SUPABASE_ANON_KEY.${vercelHint}`,
      });
      return;
    }

    const row = {
      name: payload.name.trim(),
      phone: payload.phone.trim(),
      typ_projektu: payload.typProjektu.trim(),
      message: payload.message.trim(),
    };

    setIsSubmitting(true);
    try {
      const res = await fetch(
        `${SUPABASE_URL}/rest/v1/${SUPABASE_PORTFOLIO_TABLE}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            apikey: SUPABASE_ANON_KEY,
            Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
            Prefer: 'return=minimal',
          },
          body: JSON.stringify(row),
        },
      );
      if (!res.ok) {
        let detail = res.statusText;
        try {
          const body = (await res.json()) as {
            message?: string;
            hint?: string;
            details?: string;
          };
          detail = [body.message, body.hint, body.details]
            .filter(Boolean)
            .join(' — ');
        } catch {
          /* ignore */
        }
        if (res.status === 404) {
          throw new Error(
            `Not found — Supabase nenašel tabulku «${SUPABASE_PORTFOLIO_TABLE}». Vytvořte ji v SQL (viz .env.example), zkontrolujte název proměnné VITE_SUPABASE_PORTFOLIO_TABLE a že v URL není dvakrát /rest/v1 (má být jen https://….supabase.co). ${detail}`.trim(),
          );
        }
        throw new Error(detail || `Chyba ${res.status}`);
      }
      toast.success('Děkuji, zpráva byla odeslána.', {
        description: 'Ozvu se vám co nejdříve.',
      });
      trackEvent('contact_form_submit', {
        typ_projektu: row.typ_projektu || 'neuvedeno',
      });
      form.reset();
    } catch (err) {
      const description =
        err instanceof Error ? err.message : 'Zkuste prosím zavolat.';
      toast.error('Odeslání se nepodařilo', { description });
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const navLinks = (
    <>
      <a
        href="#nabidka"
        className="text-sm font-medium text-slate-600 transition hover:text-slate-900"
        onClick={() => {
          trackEvent('nav_click', { section: 'nabidka' });
          closeMenu();
        }}
      >
        Nabídka
      </a>
      <a
        href="#seo"
        className="text-sm font-medium text-slate-600 transition hover:text-slate-900"
        onClick={() => {
          trackEvent('nav_click', { section: 'seo' });
          closeMenu();
        }}
      >
        SEO
      </a>
      <a
        href="#projekty"
        className="text-sm font-medium text-slate-600 transition hover:text-slate-900"
        onClick={() => {
          trackEvent('nav_click', { section: 'projekty' });
          closeMenu();
        }}
      >
        Projekty
      </a>
      <a
        href="#cenik"
        className="text-sm font-medium text-slate-600 transition hover:text-slate-900"
        onClick={() => {
          trackEvent('nav_click', { section: 'cenik' });
          closeMenu();
        }}
      >
        Ceník
      </a>
      <a
        href="#kontakt"
        className="text-sm font-medium text-slate-600 transition hover:text-slate-900"
        onClick={() => {
          trackEvent('nav_click', { section: 'kontakt' });
          closeMenu();
        }}
      >
        Kontakt
      </a>
    </>
  );

  return (
    <div className="min-h-screen bg-white text-slate-900 antialiased">
      <header className="sticky top-0 z-30 border-b border-slate-100 bg-white/95 backdrop-blur-sm">
        <div className="mx-auto flex max-w-5xl items-center gap-4 px-5 py-5 md:px-8 md:py-6">
          <a href="#top" className="flex min-w-0 flex-1 items-center gap-3">
            <img
              src={LOGO_DB_SRC}
              alt="Dweby"
              width={120}
              height={36}
              className="h-9 w-auto shrink-0 object-contain md:h-10"
              decoding="async"
            />
            <div className="min-w-0 leading-tight">
              <span className="block text-lg font-bold tracking-tight text-slate-900 md:text-xl">
                D<span className="text-blue-600">weby</span>
              </span>
              <span className="hidden text-[11px] font-medium uppercase tracking-[0.22em] text-slate-500 sm:block">
                Weby pro firmy
              </span>
            </div>
          </a>
          <div className="flex shrink-0 items-center justify-end gap-6 md:gap-10">
            <nav className="hidden items-center gap-10 md:flex">{navLinks}</nav>
            <button
              type="button"
              aria-expanded={menuOpen}
              aria-label="Otevřít menu"
              className="rounded-lg p-2 text-slate-700 transition hover:bg-slate-50 md:hidden"
              onClick={() => setMenuOpen(true)}
            >
              <Menu className="h-6 w-6" strokeWidth={1.75} />
            </button>
          </div>
        </div>
      </header>

      {menuOpen ? (
        <>
          <button
            type="button"
            aria-label="Zavřít menu"
            className="fixed inset-0 z-40 bg-slate-900/25 backdrop-blur-[2px] md:hidden"
            onClick={closeMenu}
          />
          <div className="fixed left-0 right-0 top-0 z-50 w-full border-b border-slate-100 bg-white shadow-lg shadow-slate-200/50 md:hidden">
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
              <span className="text-sm font-semibold text-slate-900">Menu</span>
              <button
                type="button"
                aria-label="Zavřít"
                className="rounded-lg p-2 text-slate-600 hover:bg-slate-50"
                onClick={closeMenu}
              >
                <X className="h-5 w-5" strokeWidth={1.75} />
              </button>
            </div>
            <nav className="flex flex-col gap-6 px-5 py-8">{navLinks}</nav>
          </div>
        </>
      ) : null}

      <main className="mx-auto max-w-5xl px-5 md:px-8">
        <section
          id="top"
          className="border-b border-slate-100 bg-slate-50/40 py-20 md:py-28 lg:py-36"
        >
          <RevealOnScroll direction="fade">
            <p className="mb-8 text-xs font-medium uppercase tracking-[0.2em] text-slate-500">
              Weby · SEO · Rezervace
            </p>
            <h1 className="max-w-3xl text-4xl font-semibold leading-[1.08] tracking-tight text-slate-900 md:text-5xl lg:text-[3.25rem]">
              Weby, které vám přivádí nové zákazníky.
            </h1>
            <p className="mt-10 max-w-xl text-lg leading-relaxed tracking-tight text-slate-600">
              Stavím rychlé a přehledné weby pro salony, řemeslníky a menší firmy — s
              důrazem na SEO, aby vás lidé našli na Google a rovnou vás kontaktovali.
            </p>
            <div className="mt-14 flex flex-wrap gap-4">
              <a
                href="#kontakt"
                onClick={() => trackEvent('cta_click', { label: 'nezavazna_poptavka', section: 'hero' })}
                className="inline-flex items-center rounded-lg bg-blue-600 px-6 py-3 text-sm font-semibold tracking-tight text-white shadow-sm transition hover:bg-blue-700"
              >
                Nezávazná poptávka
              </a>
              <a
                href="#projekty"
                onClick={() => trackEvent('cta_click', { label: 'vybrane_prace', section: 'hero' })}
                className="inline-flex items-center gap-1.5 text-sm font-semibold tracking-tight text-slate-600 transition hover:text-blue-600"
              >
                Vybrané práce
                <ArrowUpRight className="h-4 w-4" strokeWidth={1.75} />
              </a>
            </div>
          </RevealOnScroll>
        </section>

        <section
          id="nabidka"
          className="border-b border-slate-100 py-20 md:py-28"
        >
          <RevealOnScroll>
            <div className="mb-12 md:mb-16">
              <p className="mb-4 text-xs font-medium uppercase tracking-[0.2em] text-slate-500">
                Co nabízíme
              </p>
              <h2 className="max-w-2xl text-3xl font-semibold tracking-tight text-slate-900 md:text-4xl">
                Web, který pracuje za vás — ne naopak
              </h2>
              <p className="mt-6 max-w-2xl text-base leading-relaxed text-slate-600">
                Stavíme weby pro salony, řemeslníky a menší firmy. Cíl není jen hezká
                vizitka — chceme, aby vám web přiváděl zákazníky, zkracoval telefonáty a
                šetřil čas, který můžete věnovat podnikání.
              </p>
            </div>
          </RevealOnScroll>
          <div className="grid gap-10 md:grid-cols-2 md:gap-12 lg:grid-cols-3">
            {[
              {
                title: 'Weby na míru',
                text: 'Design podle oboru, rychlé načítání, přehledný ceník a kontakt.',
              },
              {
                title: 'Méně telefonátů',
                text: 'Online rezervace a jasné informace — zákazníci si pomohou sami.',
              },
              {
                title: 'SEO a viditelnost',
                text: 'Aby vás lidé našli na Google dřív, než konkurenci ve vašem městě.',
              },
              {
                title: 'Admin pro majitele',
                text: 'Texty, služby a ceník si upravíte bez programátora.',
              },
              {
                title: 'Správa a hosting',
                text: 'Techniku řešíme my — vy se staráte jen o své klienty.',
              },
              {
                title: 'Google Mapy',
                text: 'U balíčku Komplet spravujeme profil, recenze a lokální SEO.',
              },
            ].map((item, index) => (
              <RevealOnScroll key={item.title} delay={index * 70}>
                <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-6 md:p-7">
                  <h3 className="text-lg font-semibold text-slate-900">{item.title}</h3>
                  <p className="mt-3 text-sm leading-relaxed text-slate-600">{item.text}</p>
                </div>
              </RevealOnScroll>
            ))}
          </div>
        </section>

        <section
          id="o-nas"
          className="grid gap-12 border-b border-slate-100 py-20 md:grid-cols-[minmax(0,280px)_1fr] md:items-start md:gap-16 md:py-28"
        >
          <RevealOnScroll direction="left" className="mx-auto w-full max-w-[280px] md:mx-0">
            <div className="aspect-[4/5] overflow-hidden rounded-2xl border border-slate-200 bg-slate-100 shadow-sm">
              <img
                src="/images/dominik.jpg"
                alt="Dominik Bašek — zakladatel Dweby"
                className="h-full w-full object-cover"
                loading="lazy"
                width={280}
                height={350}
              />
            </div>
          </RevealOnScroll>
          <RevealOnScroll direction="right" delay={100}>
            <div>
              <p className="mb-4 text-xs font-medium uppercase tracking-[0.2em] text-slate-500">
                Kdo stojí za vaším webem
              </p>
              <h2 className="text-3xl font-semibold tracking-tight text-slate-900 md:text-4xl">
                Dominik Bašek
              </h2>
              <p className="mt-2 text-sm font-medium text-blue-600">Zakladatel Dweby</p>
              <div className="mt-8 space-y-5 text-base leading-relaxed text-slate-600">
                <p>
                  V IT a tvorbě webů se pohybuji více než šest let. Mám vystudovanou
                  střední školu zaměřenou na programování a studuji vysokou školu ve
                  stejném oboru — techniku tedy propojuji s praktickým přístupem k byznysu.
                </p>
                <p>
                  U Dweby držím jednu linku od návrhu po spuštění. Web zvládnu dodat během
                  několika dnů a pak ho spravuji tak, aby vám skutečně{' '}
                  <strong className="font-semibold text-slate-800">
                    přinášel poptávky a šetřil čas
                  </strong>
                  , ne aby byl jen „někde na internetu“.
                </p>
                <p>
                  Když potřebujete rezervace, admin pro majitele nebo kompletní péči včetně
                  SEO a Google Map, nastavíme to podle balíčku, který dává smysl pro váš
                  provoz.
                </p>
              </div>
            </div>
          </RevealOnScroll>
        </section>

        <section
          id="seo"
          className="border-b border-slate-100 bg-blue-50/30 py-20 md:py-28"
        >
          <RevealOnScroll>
            <div className="mb-10">
              <p className="mb-4 text-xs font-medium uppercase tracking-[0.2em] text-slate-500">
                SEO & čas
              </p>
              <h2 className="text-3xl font-semibold tracking-tight text-slate-900 md:text-4xl">
                Najdou vás na Google — a vy získáte čas
              </h2>
            </div>
          </RevealOnScroll>
          <div className="grid gap-10 md:grid-cols-2 md:gap-16">
            <RevealOnScroll direction="left" delay={80}>
              <div className="space-y-5 text-base leading-relaxed text-slate-600">
                <p>
                  U každého webu řeším základy, které Google oceňuje: rychlé načítání,
                  mobilní zobrazení, srozumitelné nadpisy, meta popisy a strukturu stránek.
                </p>
                <p>
                  Stejně důležité je, co se děje po návštěvě webu — zákazník má najít
                  odpovědi, ceník a možnost objednat se sám. Méně opakovaných dotazů,
                  méně zmeškaných hovorů, více času na vaši práci.
                </p>
              </div>
            </RevealOnScroll>
            <RevealOnScroll direction="right" delay={160}>
              <ul className="space-y-4 text-base text-slate-700">
                {[
                  'Lokální SEO — město, služby, kontakt',
                  'Online rezervace místo nekonečných telefonátů',
                  'Jasné info na webu = méně stejných otázek',
                  'U balíčku Komplet: správa Google Map a kompletní SEO',
                  'Měření návštěvnosti a doporučení dalších kroků',
                ].map((item) => (
                  <li key={item} className="flex gap-3">
                    <Check
                      className="mt-0.5 h-5 w-5 shrink-0 text-blue-600"
                      strokeWidth={1.75}
                    />
                    {item}
                  </li>
                ))}
              </ul>
            </RevealOnScroll>
          </div>
        </section>

        <section id="projekty" className="border-b border-slate-100 py-20 md:py-28">
          <RevealOnScroll>
            <div className="mb-14 md:mb-16">
              <p className="mb-4 text-xs font-medium uppercase tracking-[0.2em] text-slate-500">
                Reference
              </p>
              <h2 className="text-3xl font-semibold tracking-tight text-slate-900 md:text-4xl">
                Vybrané projekty
              </h2>
            </div>
          </RevealOnScroll>
          <div className="grid gap-12 md:grid-cols-2 md:gap-10 lg:gap-12">
            {(projects as Project[]).map((project, index) => (
              <RevealOnScroll key={project.id} delay={index * 120}>
                <a
                  href={project.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() =>
                    trackEvent('project_click', {
                      project_id: project.id,
                      title: project.title,
                    })
                  }
                  className="group flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition hover:border-slate-300 hover:shadow-md"
                >
                  <div className="aspect-[16/10] overflow-hidden bg-slate-100">
                    <img
                      src={project.image}
                      alt={project.imageAlt ?? project.title}
                      className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
                      loading="lazy"
                    />
                  </div>
                  <div className="flex flex-1 flex-col p-6 md:p-8">
                    <h3 className="text-xl font-semibold tracking-tight text-slate-900">
                      {project.title}
                    </h3>
                    <p className="mt-3 flex-1 text-base leading-relaxed tracking-tight text-slate-600">
                      {project.description}
                    </p>
                    <span className="mt-6 inline-flex w-fit items-center rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition group-hover:bg-blue-700">
                      Zobrazit projekt
                    </span>
                  </div>
                </a>
              </RevealOnScroll>
            ))}
          </div>
        </section>

        <PricingSection />

        <section id="kontakt" className="py-20 pb-28 md:py-28 md:pb-36">
          <div className="grid gap-16 lg:grid-cols-2 lg:gap-20">
            <RevealOnScroll direction="left">
              <div>
                <p className="mb-4 text-xs font-medium uppercase tracking-[0.2em] text-slate-500">
                  Kontakt
                </p>
                <h2 className="text-3xl font-semibold tracking-tight text-slate-900 md:text-4xl">
                  Ozvěte se — rád pomůžu.
                </h2>
                <p className="mt-8 max-w-md text-base leading-relaxed tracking-tight text-slate-600">
                  Vyplňte formulář nebo zavolejte. Projekt probereme nezávazně a
                  navrhnu další krok.
                </p>
                <a
                  href="tel:+420731664168"
                  className="mt-10 flex w-full max-w-md items-center justify-between gap-4 rounded-xl border-2 border-slate-200 bg-white px-8 py-6 text-lg font-semibold tracking-tight text-slate-900 shadow-sm transition hover:border-blue-600 hover:text-blue-600 md:text-xl"
                >
                  <span>Zavolat hned</span>
                  <Phone className="h-7 w-7 shrink-0 text-blue-600" strokeWidth={1.75} />
                </a>
                <p className="mt-4 max-w-md text-center text-sm text-slate-500 md:text-left">
                  731&nbsp;664&nbsp;168
                </p>
              </div>
            </RevealOnScroll>

            <RevealOnScroll direction="right" delay={120}>
            <form onSubmit={submitForm} className="flex flex-col gap-8">
              <div className="sr-only" aria-hidden="true">
                <label htmlFor="form-nickname">Nevyplňovat</label>
                <input
                  id="form-nickname"
                  name="nickname"
                  type="text"
                  tabIndex={-1}
                  autoComplete="off"
                />
              </div>
              <div className="space-y-5">
                <div>
                  <label
                    htmlFor="name"
                    className="mb-2 block text-xs font-medium uppercase tracking-[0.18em] text-slate-500"
                  >
                    Jméno
                  </label>
                  <input
                    id="name"
                    name="name"
                    required
                    autoComplete="name"
                    placeholder="Vaše jméno nebo firma"
                    className="w-full rounded-lg border border-slate-200 bg-white px-4 py-3.5 text-base tracking-tight text-slate-900 placeholder:text-slate-400 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/20"
                  />
                </div>
                <div>
                  <label
                    htmlFor="phone"
                    className="mb-2 block text-xs font-medium uppercase tracking-[0.18em] text-slate-500"
                  >
                    Telefon
                  </label>
                  <input
                    id="phone"
                    name="phone"
                    required
                    type="tel"
                    autoComplete="tel"
                    placeholder="+420 …"
                    className="w-full rounded-lg border border-slate-200 bg-white px-4 py-3.5 text-base tracking-tight text-slate-900 placeholder:text-slate-400 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/20"
                  />
                </div>
                <div>
                  <label
                    htmlFor="typProjektu"
                    className="mb-2 block text-xs font-medium uppercase tracking-[0.18em] text-slate-500"
                  >
                    Typ projektu
                  </label>
                  <select
                    id="typProjektu"
                    name="typProjektu"
                    required
                    defaultValue=""
                    className="w-full rounded-lg border border-slate-200 bg-white px-4 py-3.5 text-sm tracking-tight text-slate-900 sm:text-base focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/20"
                  >
                    <option value="" disabled>
                      Vyberte balíček
                    </option>
                    {PACKAGES.map((pkg) => (
                      <option key={pkg.id} value={pkg.id}>
                        {pkg.name} — {formatPrice(getPartnerPrice(pkg))} s odkazem +{' '}
                        {pkg.monthly}
                      </option>
                    ))}
                    <option value="jine">Jiné — cena na míru</option>
                  </select>
                  <p className="mt-2 text-xs leading-relaxed text-slate-500">
                    Finální cenu vždy upřesním v nabídce podle rozsahu projektu.
                  </p>
                </div>
                <div>
                  <label
                    htmlFor="message"
                    className="mb-2 block text-xs font-medium uppercase tracking-[0.18em] text-slate-500"
                  >
                    Zpráva
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    required
                    rows={5}
                    placeholder="Stručně popište, co potřebujete…"
                    className="w-full resize-y rounded-lg border border-slate-200 bg-white px-4 py-3.5 text-base tracking-tight text-slate-900 placeholder:text-slate-400 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/20"
                  />
                </div>
              </div>
              <button
                disabled={isSubmitting}
                type="submit"
                className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-6 py-4 text-sm font-semibold tracking-tight text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50 md:w-auto md:self-start md:px-8"
              >
                <Send className="h-4 w-4" strokeWidth={1.75} />
                {isSubmitting ? 'Odesílám…' : 'Odeslat zprávu'}
              </button>
            </form>
            </RevealOnScroll>
          </div>
        </section>
      </main>

      <footer className="border-t border-slate-100 bg-slate-50/50 py-10">
        <p className="text-center text-xs tracking-[0.15em] text-slate-500">
          © {year} Dweby.cz · weby, SEO a rezervace pro firmy
        </p>
      </footer>
      <Toaster theme="light" position="top-right" richColors />
    </div>
  );
}
