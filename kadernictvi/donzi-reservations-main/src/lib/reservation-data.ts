export type ServiceCategory = "package" | "hair" | "beard" | "extras";

export type Service = {
  id: string;
  name: string;
  description: string;
  price: number;
  priceFrom?: boolean;
  duration: number;
  category: ServiceCategory;
  vip?: boolean;
  featured?: boolean;
  bookable?: boolean;
};

export const CATEGORY_LABELS: Record<ServiceCategory, string> = {
  package: "Balíčky",
  hair: "Střih & vlasy",
  beard: "Vousy",
  extras: "Doplňkové",
};

export const SERVICES: Service[] = [
  {
    id: "gentleman",
    name: "Gentleman (střih, vousy, úprava obočí + styling)",
    description: "Kompletní pánská úprava — střih, vousy, obočí a finální styling.",
    price: 600,
    duration: 60,
    category: "package",
    featured: true,
  },
  {
    id: "vip",
    name: "VIP péče",
    description:
      "Dopřejte si skutečně prémiový zážitek, který jde daleko za běžné stříhání. VIP péče zahrnuje kompletní střih, úpravu vousů, relaxační horký ručník nebo páru, precizní úpravu obočí, chloupků kolem uší a v nose, hloubkově čistící obličejovou masku a příjemnou masáž hlavy a krku. Na závěr profesionální styling a šálek kvalitní kávy k tomu. Perfektní volba pro muže, kteří si chtějí dopřát čas jen pro sebe.",
    price: 1000,
    duration: 80,
    category: "package",
    vip: true,
    featured: true,
  },
  {
    id: "klasicky-pansky",
    name: "Klasický pánský střih",
    description: "Precizní pánský střih dle vašeho přání.",
    price: 400,
    duration: 30,
    category: "hair",
  },
  {
    id: "detsky",
    name: "Dětský střih (od 6 do 10 let)",
    description: "Trpělivý přístup k dětem od 6 do 10 let.",
    price: 300,
    duration: 25,
    category: "hair",
  },
  {
    id: "detsky-moderni",
    name: "Moderní dětský střih (od 6 do 10 let)",
    description: "Moderní dětský střih pro věk 6–10 let.",
    price: 350,
    duration: 30,
    category: "hair",
  },
  {
    id: "senior",
    name: "Senior střih (nad 65 let)",
    description: "Klasický střih s respektem a pozorností.",
    price: 300,
    duration: 30,
    category: "hair",
  },
  {
    id: "full-head",
    name: "Full Head Shave (holení hlavy břitvou)",
    description: "Holení hlavy tradiční břitvou.",
    price: 350,
    duration: 30,
    category: "hair",
  },
  {
    id: "full-head-beard",
    name: "Full Head & Beard Shave",
    description: "Holení hlavy i vousů břitvou.",
    price: 500,
    duration: 40,
    category: "hair",
  },
  {
    id: "umyti",
    name: "Umytí vlasů + Styling",
    description: "Mytí vlasů a finální styling.",
    price: 100,
    duration: 10,
    category: "hair",
  },
  {
    id: "kontury",
    name: "Úprava kontur + styling",
    description: "Vyčištění kontur a styling.",
    price: 100,
    duration: 15,
    category: "hair",
  },
  {
    id: "modelace-vousu",
    name: "Modelace vousů + olejová péče",
    description: "Tvarování vousů s prémiovými oleji.",
    price: 300,
    duration: 30,
    category: "beard",
  },
  {
    id: "holeni-vousy",
    name: "Holení vousů břitvou",
    description: "Tradiční holení vousů břitvou.",
    price: 350,
    duration: 20,
    category: "beard",
  },
  {
    id: "vousy-strojek",
    name: "Úprava vousů strojkem",
    description: "Rychlá a precizní úprava strojkem.",
    price: 250,
    duration: 25,
    category: "beard",
  },
  {
    id: "chloupky",
    name: "Odstranění chloupků (nos, obočí nebo uši)",
    description: "Detailní úprava nosu, obočí nebo uší.",
    price: 100,
    duration: 10,
    category: "extras",
  },
  {
    id: "masaz",
    name: "Masáž hlavy, rukou a šíje",
    description: "Relaxační masáž hlavy, rukou a šíje.",
    price: 150,
    duration: 10,
    category: "extras",
  },
];

/** Služby pro BookingDialog fallback (shodné názvy s DB). */
export const FALLBACK_BOOKING_SERVICES = SERVICES.filter((s) => s.bookable !== false).map(
  (s, i) => ({
    id: -(i + 1),
    name: s.name,
    price: s.price,
    duration_minutes: s.duration,
  }),
);

export function getServiceNameById(id: string): string | undefined {
  return SERVICES.find((s) => s.id === id)?.name;
}
