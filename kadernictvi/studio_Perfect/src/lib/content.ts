export const SALON = {
  name: "Kadeřnické studio Perfekt",
  shortName: "Perfekt studio",
  city: "Trutnov",
  address: "Krakonošovo nám. 127, 541 01 Trutnov 1",
  phone: "731 160 074",
  phoneHref: "tel:+420731160074",
  rating: 5.0,
  reviewCount: 27,
} as const;

export type Service = {
  id: string;
  name: string;
  desc: string;
  duration: string;
  price: string;
  featured?: boolean;
};

export const WOMEN_SERVICES: Service[] = [
  {
    id: "w1",
    name: "Střih dámský",
    desc: "Konzultace, mytí, střih a styling na míru vašemu typu vlasů.",
    duration: "60 min",
    price: "od 550 Kč",
    featured: true,
  },
  {
    id: "w2",
    name: "Barvení kořínků",
    desc: "Precizní barvení odrostů s jemnou regenerací vlasů.",
    duration: "90 min",
    price: "od 890 Kč",
  },
  {
    id: "w3",
    name: "Melír / balayage",
    desc: "Přirozené prosvětlení vlasů s důrazem na zdravý lesk.",
    duration: "120 min",
    price: "od 1 490 Kč",
    featured: true,
  },
  {
    id: "w4",
    name: "Hloubková výživa",
    desc: "Regenerační kúra pro unavené a poškozené vlasy.",
    duration: "45 min",
    price: "od 450 Kč",
  },
  {
    id: "w5",
    name: "Svatební účes",
    desc: "Zkouška i finální styling — klidně i s doprovodem.",
    duration: "90 min",
    price: "od 1 200 Kč",
  },
  {
    id: "w6",
    name: "Foukaná & styling",
    desc: "Mytí, foukaná a úprava pro všední den i speciální příležitost.",
    duration: "45 min",
    price: "od 400 Kč",
  },
];

export const MEN_SERVICES: Service[] = [
  {
    id: "m1",
    name: "Pánský střih",
    desc: "Klasický i moderní střih, mytí a závěrečný styling.",
    duration: "30 min",
    price: "od 350 Kč",
    featured: true,
  },
  {
    id: "m2",
    name: "Střih strojkem + nůžkami",
    desc: "Precizní fade, kontury a úprava vousů podle přání.",
    duration: "40 min",
    price: "od 420 Kč",
  },
  {
    id: "m3",
    name: "Úprava vousů",
    desc: "Konturování a zastřižení vousů pro uhlazený vzhled.",
    duration: "20 min",
    price: "od 200 Kč",
  },
  {
    id: "m4",
    name: "Mytí & styling",
    desc: "Relaxační mytí hlavy a rychlá úprava vlasů.",
    duration: "25 min",
    price: "od 250 Kč",
  },
];

export type Product = {
  id: string;
  brand: string;
  name: string;
  desc: string;
  image: string;
  tag?: string;
};

export const PRODUCTS: Product[] = [
  {
    id: "p1",
    brand: "L'Oréal Professionnel",
    name: "Série Expert Absolut Repair",
    desc: "Regenerační šampon a maska pro suché a poškozené vlasy.",
    image: "https://images.unsplash.com/photo-1556228720-195a672e8a03?w=600&q=80",
    tag: "Nejprodávanější",
  },
  {
    id: "p2",
    brand: "Wella Professionals",
    name: "Oil Reflections",
    desc: "Lehký olej pro lesk a hebkost bez zatížení.",
    image: "https://images.unsplash.com/photo-1596462502278-27bfdd403348?w=600&q=80",
  },
  {
    id: "p3",
    brand: "Schwarzkopf",
    name: "BC Bonacure Repair Rescue",
    desc: "Hloubková péče pro vlasy namáhané barvením a stylingem.",
    image: "https://images.unsplash.com/photo-1571781926291-c477ebfd024b?w=600&q=80",
  },
  {
    id: "p4",
    brand: "TIGI Bed Head",
    name: "Small Talk",
    desc: "Krémový gel pro objem a definici kudrnatých vlasů.",
    image: "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=600&q=80",
  },
];

export type BeforeAfterItem = {
  id: string;
  before: string;
  after: string;
  title: string;
  note: string;
};

export const BEFORE_AFTER: BeforeAfterItem[] = [
  {
    id: "ba1",
    before: "/images/pred1.jpg",
    after: "/images/po1.jpg",
    title: "Proměna 1",
    note: "Před a po — výsledek práce ve studiu",
  },
  {
    id: "ba2",
    before: "/images/pred2.jpg",
    after: "/images/po2.jpg",
    title: "Proměna 2",
    note: "Před a po — výsledek práce ve studiu",
  },
];

export const IMAGES = {
  hero: "/images/uvod.jpg",
  about: "/images/onas.jpg",
} as const;

export type Review = {
  id: string;
  author: string;
  text: string;
  when: string;
};

export const REVIEWS: Review[] = [
  {
    id: "r1",
    author: "Barbora N.",
    when: "před 2 lety",
    text: "Jsem neskutečně spokojená s mojí proměnou. Přišla jsem jen na zkrácení konečků a paní Kateřina z mých vlasů vykouzlila něco nádherného, pouze s hloubkovou výživou vlasů. Mockrát děkuji.",
  },
  {
    id: "r2",
    author: "Eva B.",
    when: "před rokem",
    text: "Velmi spokojená, paní kadeřnice strašně hodná a dokáže vykouzlit krásné vlásky. Byla jsem u ní dvakrát a vždy jsem odcházela s naprostou spokojeností. Vždy poradí to nejlepší a je 100% upřímná.",
  },
  {
    id: "r3",
    author: "Sangie L.",
    when: "před 2 lety",
    text: "Skrze mou léta živenou nedůvěru v kadeřnice jsem se překonala a na doporučení navštívila Studio Perfekt — a musím s radostí říci, že rozhodně ne naposledy! Příjemné prostředí a odcházela jsem nadšená.",
  },
];
