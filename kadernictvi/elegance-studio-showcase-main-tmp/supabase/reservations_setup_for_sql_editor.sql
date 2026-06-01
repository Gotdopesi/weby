-- Schéma tabulky public.rezervace (shodné s aplikací).
-- Spusť v Supabase → SQL Editor. RLS detaily viz soubor policies_rezervace_rls.sql.

create extension if not exists "pgcrypto";

create table if not exists public.rezervace (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  first_name text not null,
  last_name text not null,
  email text not null,
  phone text not null,
  service text not null,
  booking_date date not null,
  booking_time text not null,
  status text not null default 'pending'
);

alter table public.rezervace enable row level security;
