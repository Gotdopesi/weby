export type Package = {
  id: string;
  name: string;
  tagline: string;
  priceAmount: number;
  partnerDiscount: number;
  priceNote: string;
  monthly: string;
  monthlyNote: string;
  featured?: boolean;
  features: string[];
  cta: string;
};

/** Doména je u všech balíčků volitelný doplněk. */
export const DOMAIN_MONTHLY = "50 Kč / měsíc";

export const PARTNER_DISCOUNT_URL = "https://dweby.cz";
export const PARTNER_DISCOUNT_LABEL = "Web: dweby.cz";

export const PARTNER_DISCOUNT_NOTE =
  "Do patičky (nebo jiné viditelné části) webu vložíte odkaz na nás. Stačí jednoduchý text — sleva se pak odečte z jednorázové ceny.";

export function formatPrice(amount: number): string {
  return `${amount.toLocaleString("cs-CZ")} Kč`;
}

export function getPartnerPrice(pkg: Package): number {
  return pkg.priceAmount - pkg.partnerDiscount;
}

export const PACKAGES: Package[] = [
  {
    id: "web",
    name: "Základní",
    tagline: "Profesionální prezentace firmy",
    priceAmount: 9900,
    partnerDiscount: 2000,
    priceNote: "jednorázově za vytvoření",
    monthly: "200 Kč / měsíc",
    monthlyNote: "hosting, zálohy, technická správa",
    features: [
      "Web na míru — design podle vašeho oboru",
      "Responzivní zobrazení na mobilu i počítači",
      "SEO základ: rychlost, meta tagy, struktura pro Google",
      "Kontaktní formulář, mapa a přehled služeb",
      "Galerie, reference nebo ceník",
    ],
    cta: "Chci základní web",
  },
  {
    id: "web-admin",
    name: "Web + Správa",
    tagline: "Méně telefonátů, více času na práci",
    priceAmount: 19900,
    partnerDiscount: 4000,
    priceNote: "jednorázově za vytvoření",
    monthly: "500 Kč / měsíc",
    monthlyNote: "hosting, zálohy, podpora, údržba systému",
    featured: true,
    features: [
      "Vše z balíčku Základní",
      "Vlastní admin — texty a ceník měníte sami",
      "Online rezervace — klienti si objednají sami",
      "Méně zmeškaných hovorů a opakovaných dotazů",
      "Přehled termínů a objednávek na jednom místě",
    ],
    cta: "Chci web se správou",
  },
  {
    id: "komplet",
    name: "Komplet",
    tagline: "Vy podnikáte, my web i viditelnost",
    priceAmount: 34900,
    partnerDiscount: 6000,
    priceNote: "jednorázově za vytvoření",
    monthly: "1 500 Kč / měsíc",
    monthlyNote: "kompletní SEO, Google Mapy, správa, priority",
    features: [
      "Vše z balíčku Web + Správa",
      "Kompletní SEO a lokální viditelnost",
      "Správa profilu na Google Mapách",
      "Průběžné úpravy obsahu v ceně",
      "Prioritní podpora — web řešíme za vás",
    ],
    cta: "Chci kompletní řešení",
  },
];
