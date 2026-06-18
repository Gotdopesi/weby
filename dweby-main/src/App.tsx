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
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <img
              src={LOGO_DB_SRC}
              alt=""
              width={120}
              height={36}
              className="h-9 w-auto shrink-0 object-contain md:h-10"
              decoding="async"
            />
            <span className="truncate text-base font-semibold tracking-tight text-slate-900">
              Dominik Bašek
            </span>
          </div>
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
        <section className="border-b border-slate-100 bg-slate-50/40 py-20 md:py-28 lg:py-36">
          <p className="mb-8 text-xs font-medium uppercase tracking-[0.2em] text-slate-500">
            Dostupný pro nové projekty
          </p>
          <h1 className="max-w-3xl text-4xl font-semibold leading-[1.08] tracking-tight text-slate-900 md:text-5xl lg:text-[3.25rem]">
            Tvořím moderní weby, které vám vydělávají.
          </h1>
          <p className="mt-10 max-w-xl text-lg leading-relaxed tracking-tight text-slate-600">
            Pomáhám menším firmám růst díky přehledným a rychlým webům. Žádný
            zbytečný chaos — čistý design, srozumitelná struktura a důraz na
            výsledek.
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
        </section>

        <section className="grid gap-16 border-b border-slate-100 py-20 md:grid-cols-2 md:gap-24 md:py-28">
          <div>
            <p className="mb-6 text-xs font-medium uppercase tracking-[0.2em] text-slate-500">
              O mně
            </p>
            <div className="space-y-6 text-base leading-relaxed tracking-tight text-slate-600">
              <p>
                V IT a web developmentu se pohybuji více než šest let. Stavím
                weby tak, aby byly rychlé, snadno použitelné a aby podporovaly
                váš byznys — ne jen „nějaký web na internetu“.
              </p>
              <p>
                Od návrhu přes realizaci až po nasazení držím jednu linku. Po
                spuštění pomůžu s údržbou a úpravami, když se váš podnik změní.
              </p>
            </div>
          </div>
          <div>
            <p className="mb-6 text-xs font-medium uppercase tracking-[0.2em] text-slate-500">
              Co nabízím
            </p>
            <ul className="space-y-5 text-base leading-relaxed tracking-tight text-slate-800">
              {[
                'Moderní firemní weby zaměřené na konverze',
                'Rezervační systémy a jednoduché webové aplikace',
                'Úpravy, podpora a dlouhodobá spolupráce',
                'Srozumitelná komunikace a férové podmínky',
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
          </div>
        </section>

        <section id="projekty" className="border-b border-slate-100 py-20 md:py-28">
          <div className="mb-14 md:mb-16">
            <p className="mb-4 text-xs font-medium uppercase tracking-[0.2em] text-slate-500">
              Reference
            </p>
            <h2 className="text-3xl font-semibold tracking-tight text-slate-900 md:text-4xl">
              Vybrané projekty
            </h2>
          </div>
          <div className="grid gap-12 md:grid-cols-2 md:gap-10 lg:gap-12">
            {(projects as Project[]).map((project) => (
              <a
                key={project.id}
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
                    className="h-full w-full object-cover"
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
            ))}
          </div>
        </section>

        <section id="cenik" className="border-b border-slate-100 py-20 md:py-28">
          <div className="mb-14 md:mb-16">
            <p className="mb-4 text-xs font-medium uppercase tracking-[0.2em] text-slate-500">
              Ceník
            </p>
            <h2 className="text-3xl font-semibold tracking-tight text-slate-900 md:text-4xl">
              Jednoduché balíčky
            </h2>
            <p className="mt-6 max-w-xl text-base leading-relaxed tracking-tight text-slate-600">
              Jednorázová cena za realizaci. Hosting neúčtuji —{' '}
              <strong className="font-semibold text-blue-600">
                0&nbsp;Kč měsíční poplatky za hosting.
              </strong>{' '}
              Správu a doménu řešíme samostatně podle potřeby.
            </p>
          </div>
          <div className="grid gap-8 md:grid-cols-2 md:gap-10">
            <article className="flex flex-col rounded-xl border border-slate-200 bg-slate-50/80 p-9 md:p-11">
              <p className="text-xs font-medium uppercase tracking-[0.2em] text-slate-500">
                Balíček START
              </p>
              <p className="mt-5 text-4xl font-semibold tracking-tight text-slate-900 md:text-[2.75rem]">
                2&nbsp;900&nbsp;Kč
              </p>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">
                Měsíčně od 100&nbsp;Kč (správa a doména)
              </p>
              <ul className="mt-8 flex flex-col gap-3 text-base leading-relaxed text-slate-600">
                <li className="flex gap-3">
                  <Check className="mt-0.5 h-5 w-5 shrink-0 text-blue-600" strokeWidth={1.75} />
                  Moderní webová vizitka
                </li>
                <li className="flex gap-3">
                  <Check className="mt-0.5 h-5 w-5 shrink-0 text-blue-600" strokeWidth={1.75} />
                  Blesková rychlost
                </li>
                <li className="flex gap-3 border-t border-slate-200 pt-4 text-slate-800">
                  <Check className="mt-0.5 h-5 w-5 shrink-0 text-blue-600" strokeWidth={1.75} />
                  <span>
                    <strong className="font-semibold text-blue-600">
                      0&nbsp;Kč měsíční poplatky za hosting
                    </strong>
                  </span>
                </li>
              </ul>
              <a
                href="#kontakt"
                className="mt-10 inline-flex w-fit text-sm font-semibold text-blue-600 underline decoration-blue-600/30 underline-offset-4 transition hover:decoration-blue-600"
              >
                Vybrat START
              </a>
            </article>

            <article className="flex flex-col rounded-xl border border-slate-200 bg-slate-50/80 p-9 md:p-11">
              <p className="text-xs font-medium uppercase tracking-[0.2em] text-slate-500">
                Balíček PROFI
              </p>
              <p className="mt-5 text-4xl font-semibold tracking-tight text-slate-900 md:text-[2.75rem]">
                4&nbsp;900&nbsp;Kč
              </p>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">
                Měsíčně od 100&nbsp;Kč (správa a doména)
              </p>
              <ul className="mt-8 flex flex-col gap-3 text-base leading-relaxed text-slate-600">
                <li className="flex gap-3">
                  <Check className="mt-0.5 h-5 w-5 shrink-0 text-blue-600" strokeWidth={1.75} />
                  Rezervační systém na míru
                </li>
                <li className="flex gap-3">
                  <Check className="mt-0.5 h-5 w-5 shrink-0 text-blue-600" strokeWidth={1.75} />
                  Správa termínů, databáze
                </li>
                <li className="flex gap-3 border-t border-slate-200 pt-4 text-slate-800">
                  <Check className="mt-0.5 h-5 w-5 shrink-0 text-blue-600" strokeWidth={1.75} />
                  <span>
                    <strong className="font-semibold text-blue-600">
                      0&nbsp;Kč měsíční poplatky za hosting
                    </strong>
                  </span>
                </li>
              </ul>
              <a
                href="#kontakt"
                className="mt-10 inline-flex w-fit text-sm font-semibold text-blue-600 underline decoration-blue-600/30 underline-offset-4 transition hover:decoration-blue-600"
              >
                Vybrat PROFI
              </a>
            </article>
          </div>
        </section>

        <section id="kontakt" className="py-20 pb-28 md:py-28 md:pb-36">
          <div className="grid gap-16 lg:grid-cols-2 lg:gap-20">
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
                      Vyberte typ projektu a ceny
                    </option>
                    <option value="start">
                      Start — 2&nbsp;900&nbsp;Kč jednorázově · měsíčně od 0&nbsp;Kč
                    </option>
                    <option value="profi">
                      Profi — 4&nbsp;900&nbsp;Kč jednorázově · měsíčně od 0&nbsp;Kč
                    </option>
                    <option value="jine">
                      Jiné — cena na míru · měsíčně od 0&nbsp;Kč
                    </option>
                  </select>
                  <p className="mt-2 text-xs leading-relaxed text-slate-500">
                    „Měsíčně od 0&nbsp;Kč“ je orientační start — finální částku
                    (správa, doména, provoz) vždy doplním v nabídce; nemusí to být
                    zadarmo.
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
          </div>
        </section>
      </main>

      <footer className="border-t border-slate-100 bg-slate-50/50 py-10">
        <p className="text-center text-xs tracking-[0.15em] text-slate-500">
          © {year} Dominik Bašek · Dweby.cz
        </p>
      </footer>
      <Toaster theme="light" position="top-right" richColors />
    </div>
  );
}
