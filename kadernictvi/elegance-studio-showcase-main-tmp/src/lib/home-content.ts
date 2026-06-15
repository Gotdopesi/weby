export type ServiceItem = {
  id: string;
  name: string;
  desc: string;
  price: string;
  duration: string;
  featured?: boolean;
};

export type GalleryItem = {
  id: string;
  src: string;
  alt: string;
  category: "strih" | "barveni" | "styling" | "interier";
  span?: "wide" | "tall";
};

export type BeforeAfterItem = {
  id: string;
  before: string;
  after: string;
  title: string;
  category: GalleryItem["category"];
  samePerson?: boolean;
  beforePosition?: string;
  afterPosition?: string;
};

export type ProductItem = {
  id: string;
  brand: string;
  name: string;
  desc: string;
  image: string;
  tag?: string;
};

export const HERO_VIDEO =
  "https://videos.pexels.com/video-files/3998908/3998908-uhd_2560_1440_25fps.mp4";
export const HERO_POSTER =
  "https://images.unsplash.com/photo-1560066984-138dadb4c035?w=1920&q=85";

export const WOMEN_SERVICES: ServiceItem[] = [
  {
    id: "damske-strihani",
    name: "Dámský střih & foukání",
    desc: "Konzultace, mytí, precizní střih a styling na míru vašemu typu vlasů.",
    price: "890 Kč",
    duration: "60 min",
  },
  {
    id: "barveni",
    name: "Barvení vlasů",
    desc: "Profesionální barvy Kérastase s ošetřující péčí a závěrečnou regenerací.",
    price: "od 1 490 Kč",
    duration: "120 min",
  },
  {
    id: "balayage",
    name: "Balayage",
    desc: "Ručně malované přechody pro přirozený, sluncem políbený efekt.",
    price: "od 2 890 Kč",
    duration: "180 min",
    featured: true,
  },
  {
    id: "melir",
    name: "Melír",
    desc: "Jemné nebo výrazné melíry pro rozjasnění a hloubku barvy.",
    price: "od 1 790 Kč",
    duration: "150 min",
  },
  {
    id: "spolecensky",
    name: "Společenský účes",
    desc: "Slavnostní styling pro svatbu, ples nebo výjimečný večer.",
    price: "1 290 Kč",
    duration: "90 min",
  },
  {
    id: "regenerace",
    name: "Regenerační rituál",
    desc: "Hloubková maska Olaplex + masáž pokožky hlavy a luxusní foukaná.",
    price: "1 090 Kč",
    duration: "75 min",
  },
];

export const MEN_SERVICES: ServiceItem[] = [
  {
    id: "panske-strihani",
    name: "Pánský střih",
    desc: "Klasický nebo moderní střih včetně konzultace a finálního stylingu.",
    price: "590 Kč",
    duration: "45 min",
  },
  {
    id: "vousy",
    name: "Úprava vousů",
    desc: "Konturování strojkem i břitvou, horký ručník a pečující olej.",
    price: "390 Kč",
    duration: "30 min",
  },
  {
    id: "strih-vousy",
    name: "Střih + vousy",
    desc: "Kompletní pánská péče — střih, vousy a závěrečný styling.",
    price: "890 Kč",
    duration: "75 min",
    featured: true,
  },
  {
    id: "pansky-styling",
    name: "Pánský styling",
    desc: "Úprava pro focení, event nebo každodenní business vzhled.",
    price: "490 Kč",
    duration: "30 min",
  },
];

/** Stejná fotografie = stejný člověk; „před“ je vizuálně méně upravené. */
export const BEFORE_AFTER: BeforeAfterItem[] = [
  {
    id: "ba1",
    before: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=900&q=85",
    after: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=900&q=85",
    title: "Dámský střih a objem",
    category: "strih",
    samePerson: true,
    beforePosition: "center 18%",
    afterPosition: "center 22%",
  },
  {
    id: "ba2",
    before: "https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?w=900&q=85",
    after: "https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?w=900&q=85",
    title: "Balayage — přirozené tóny",
    category: "barveni",
    samePerson: true,
    beforePosition: "center 12%",
    afterPosition: "center 20%",
  },
  {
    id: "ba3",
    before: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=900&q=85",
    after: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=900&q=85",
    title: "Pánský střih a styling",
    category: "strih",
    samePerson: true,
    beforePosition: "center 15%",
    afterPosition: "center 20%",
  },
];

export const GALLERY_ITEMS: GalleryItem[] = [
  {
    id: "g1",
    src: "https://images.unsplash.com/photo-1519825291-8880b43e4083?w=800&q=85",
    alt: "Finální styling — pohled zezadu",
    category: "styling",
    span: "tall",
  },
  {
    id: "g2",
    src: "https://images.unsplash.com/photo-1595476108010-b4d1f102b1b1?w=800&q=85",
    alt: "Barvení vlasů v salónu",
    category: "barveni",
  },
  {
    id: "g3",
    src: "https://images.unsplash.com/photo-1633681926022-84c23e8cb04d?w=800&q=85",
    alt: "Pánský střih",
    category: "strih",
  },
  {
    id: "g4",
    src: "https://images.unsplash.com/photo-1560066984-138dadb4c035?w=800&q=85",
    alt: "Interiér Studio Elegance",
    category: "interier",
    span: "wide",
  },
  {
    id: "g5",
    src: "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=800&q=85",
    alt: "Práce stylisty",
    category: "styling",
  },
  {
    id: "g6",
    src: "https://images.unsplash.com/photo-1516975080664-ed2fc6a32983?w=800&q=85",
    alt: "Mytí a péče o vlasy",
    category: "barveni",
  },
  {
    id: "g7",
    src: "https://images.unsplash.com/photo-1620336246-8527a1a2d051?w=800&q=85",
    alt: "Zrcadlo v salónu",
    category: "interier",
  },
  {
    id: "g8",
    src: "https://images.unsplash.com/photo-1559599101-fb0924de0d9d?w=800&q=85",
    alt: "Precizní střih",
    category: "strih",
    span: "tall",
  },
];

export const GALLERY_FILTERS = [
  { id: "vse", label: "Vše" },
  { id: "strih", label: "Střih" },
  { id: "barveni", label: "Barvení" },
  { id: "styling", label: "Styling" },
  { id: "interier", label: "Interiér" },
] as const;

export type GalleryFilterId = (typeof GALLERY_FILTERS)[number]["id"];

export const PRODUCTS: ProductItem[] = [
  {
    id: "p1",
    brand: "Kérastase",
    name: "Chronologiste",
    desc: "Luxusní anti-age linie pro oživení vlasů i pokožky hlavy — náš bestseller po barvení.",
    image: "https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=600&q=85",
    tag: "Bestseller",
  },
  {
    id: "p2",
    brand: "Olaplex",
    name: "Hair Perfector No.3",
    desc: "Domácí péče, která obnovuje vazby ve vlasech po chemickém ošetření v salónu.",
    image: "https://images.unsplash.com/photo-1571875257727-256c39da42af?w=600&q=85",
    tag: "Ochrana vlasů",
  },
  {
    id: "p3",
    brand: "Kérastase",
    name: "Elixir Ultime",
    desc: "Lehký olej pro lesk, hebkost a ochranu před vlhkostí i žehlením.",
    image: "https://images.unsplash.com/photo-1571875257727-256c39da42af?w=600&q=85",
  },
  {
    id: "p4",
    brand: "Kérastase",
    name: "Blond Absolu",
    desc: "Speciální péče pro blond a melírované vlasy — neutralizace žlutých tónů.",
    image: "https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=600&q=85&fit=crop&crop=top",
    tag: "Pro blondýnky",
  },
  {
    id: "p5",
    brand: "Olaplex",
    name: "No.8 Bond Intense Moisture",
    desc: "Hloubková hydratace a objem bez zatížení — ideální po službě v salónu.",
    image: "https://images.unsplash.com/photo-1571875257727-256c39da42af?w=600&q=85&fit=crop&crop=center",
  },
  {
    id: "p6",
    brand: "Kérastase",
    name: "Genesis",
    desc: "Posilující péče proti vypadávání vlasů a křehkosti — doporučujeme jako domácí rituál.",
    image: "https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=600&q=85&fit=crop&crop=entropy",
  },
];
