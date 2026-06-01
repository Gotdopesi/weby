export const DEFAULT_BARBERSHOP_ID = Number(
  (import.meta.env.VITE_BARBERSHOP_ID as string | undefined) ?? "1",
);

export type BarbershopRow = {
  id: number;
  name: string;
  slug: string;
  email: string | null;
  sms_price: number;
  credit_balance: number;
};
