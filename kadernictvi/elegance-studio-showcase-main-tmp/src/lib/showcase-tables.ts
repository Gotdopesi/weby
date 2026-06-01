/** Názvy tabulek v Supabase (prefix showcase_ + portfolio). */
export const SHOWCASE_TABLES = {
  barbershops: "showcase_barbershops",
  barbershopAdmins: "showcase_barbershop_admins",
  services: "showcase_services",
  rezervace: "showcase_rezervace",
  booking_slots: "showcase_booking_slots",
  trzby: "showcase_trzby",
  vydelky: "showcase_vydelky",
  vydelkySluzby: "showcase_vydelky_sluzby",
  portfolioPoptavky: "portfolio_poptavky",
  zakaznici: "showcase_zakaznici",
} as const;

export type ShowcaseTableName = (typeof SHOWCASE_TABLES)[keyof typeof SHOWCASE_TABLES];
