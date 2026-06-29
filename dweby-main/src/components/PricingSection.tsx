import { Check, Sparkles } from 'lucide-react';
import {
  DOMAIN_MONTHLY,
  formatPrice,
  getPartnerPrice,
  PACKAGES,
  PARTNER_DISCOUNT_LABEL,
  PARTNER_DISCOUNT_URL,
} from '../data/packages';
import { RevealOnScroll } from './RevealOnScroll';

export function PricingSection() {
  return (
    <section id="cenik" className="border-b border-slate-100 py-20 md:py-28">
      <RevealOnScroll>
        <div className="mb-10 md:mb-12">
          <p className="mb-4 text-xs font-medium uppercase tracking-[0.2em] text-slate-500">
            Ceník
          </p>
          <h2 className="text-3xl font-semibold tracking-tight text-slate-900 md:text-4xl">
            Tři balíčky — jednorázově i měsíčně
          </h2>
          <p className="mt-6 max-w-2xl text-base leading-relaxed tracking-tight text-slate-600">
            U každého balíčku platíte jednorázově za vytvoření webu a měsíčně za provoz
            a péči. Cíl je jednoduchý:{' '}
            <strong className="font-semibold text-slate-800">
              přivést vám nové zákazníky a ušetřit čas
            </strong>
            , ne jen „mít nějaký web“.
          </p>
        </div>
      </RevealOnScroll>

      <RevealOnScroll delay={80}>
        <div className="mb-10 flex items-start gap-4 rounded-xl border border-emerald-200/80 bg-gradient-to-r from-emerald-50/90 to-blue-50/40 px-5 py-4 md:items-center md:gap-5 md:px-6">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700">
            <Sparkles className="h-4 w-4" strokeWidth={1.75} />
          </div>
          <div className="min-w-0 text-sm leading-snug text-slate-700">
            <p>
              <strong className="font-semibold text-emerald-800">Sleva je už v ceně</strong>{' '}
              — v patičce webu odkaz{' '}
              <a
                href={PARTNER_DISCOUNT_URL}
                className="font-semibold text-blue-600 underline decoration-blue-600/30 underline-offset-2"
              >
                {PARTNER_DISCOUNT_LABEL}
              </a>
              .
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Podmínka: na webu, který pro vás uděláme, necháte viditelný odkaz na Dweby v patičce.
            </p>
          </div>
        </div>
      </RevealOnScroll>

      <div className="grid gap-8 lg:grid-cols-3 lg:gap-6">
        {PACKAGES.map((pkg, index) => {
          const partnerPrice = getPartnerPrice(pkg);

          return (
            <RevealOnScroll key={pkg.id} delay={index * 120} direction="up">
              <article
                className={`flex h-full flex-col rounded-xl border p-8 md:p-9 ${
                  pkg.featured
                    ? 'border-blue-600 bg-blue-50/40 shadow-md shadow-blue-100/50 ring-1 ring-blue-600/15'
                    : 'border-slate-200 bg-slate-50/80'
                }`}
              >
                {pkg.featured ? (
                  <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-blue-600">
                    Nejoblíbenější
                  </p>
                ) : null}
                <p className="text-xs font-medium uppercase tracking-[0.2em] text-slate-500">
                  {pkg.name}
                </p>
                <p className="mt-2 text-sm text-slate-600">{pkg.tagline}</p>

                <div className="mt-5">
                  <span className="inline-flex items-center rounded-full bg-emerald-100 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-emerald-800">
                    −{formatPrice(pkg.partnerDiscount)} s odkazem
                  </span>
                  <p className="mt-3 text-3xl font-semibold tracking-tight text-slate-900 md:text-4xl">
                    {formatPrice(partnerPrice)}
                  </p>
                  <p className="mt-1 text-sm text-slate-500">
                    <span className="line-through">{formatPrice(pkg.priceAmount)}</span>
                    <span className="mx-1.5">·</span>
                    {pkg.priceNote}
                  </p>
                </div>

                <div className="mt-4 rounded-lg border border-blue-100 bg-white/80 px-4 py-3">
                  <p className="text-lg font-semibold text-blue-600">{pkg.monthly}</p>
                  <p className="mt-0.5 text-xs text-slate-500">{pkg.monthlyNote}</p>
                </div>

                <ul className="mt-8 flex flex-1 flex-col gap-3 text-sm leading-relaxed text-slate-600">
                  {pkg.features.map((f) => (
                    <li key={f} className="flex gap-3">
                      <Check
                        className="mt-0.5 h-4 w-4 shrink-0 text-blue-600"
                        strokeWidth={1.75}
                      />
                      {f}
                    </li>
                  ))}
                </ul>
                <a
                  href="#kontakt"
                  className="mt-8 inline-flex w-fit text-sm font-semibold text-blue-600 underline decoration-blue-600/30 underline-offset-4 transition hover:decoration-blue-600"
                >
                  {pkg.cta}
                </a>
              </article>
            </RevealOnScroll>
          );
        })}
      </div>

      <RevealOnScroll delay={100}>
        <p className="mt-10 max-w-2xl text-sm leading-relaxed text-slate-500">
          Vlastní doména (např. vasefirma.cz):{' '}
          <strong className="font-medium text-slate-700">+ {DOMAIN_MONTHLY}</strong> ke
          kterémukoli balíčku. Finální cenu vždy upřesním v nabídce podle rozsahu
          projektu.
        </p>
        <p className="mt-3 max-w-2xl text-[11px] leading-relaxed text-slate-400">
          Rozesílání e-mailů nebo SMS přímo z webu řešíme individuálně.
        </p>
      </RevealOnScroll>
    </section>
  );
}
