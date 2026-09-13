-- ============================================================================
-- KRIEL — Supabase setup
-- Schema (identical to the old Drizzle/PostgreSQL schema) + RLS policies
-- + seed data (identical to scripts/seed.cjs).
--
-- Run this ONCE in the Supabase dashboard:  SQL Editor > New query > paste > Run
-- ============================================================================

-- ------------------------------- TABLES ------------------------------------

create table if not exists categories (
  id          serial primary key,
  slug        varchar(120) not null unique,
  name        varchar(200) not null,
  description text         not null default '',
  image       text         not null default '',
  sort_order  integer      not null default 0,
  created_at  timestamp    not null default now()
);

create table if not exists products (
  id             serial primary key,
  category_id    integer references categories (id) on delete set null,
  name           varchar(200)     not null,
  code           varchar(100)     not null default '',
  price          numeric(10, 2)   not null default 0,
  dims           varchar(120)     not null default '',
  material       varchar(200)     not null default '',
  description    text             not null default '',
  image          text             not null default '',
  images         jsonb            not null default '[]'::jsonb,
  sizes          jsonb            not null default '[]'::jsonb,
  colors         jsonb            not null default '[]'::jsonb,
  variants       jsonb            not null default '[]'::jsonb,
  sale_pct       integer          not null default 0,
  sort_order     integer          not null default 0,
  featured       boolean          not null default false,
  featured_order integer          not null default 0,
  customizable   boolean          not null default false,
  active         boolean          not null default true,
  set_name       varchar(200),
  color_codes    jsonb            not null default '{}'::jsonb,
  set_names      jsonb            not null default '[]'::jsonb,
  created_at     timestamp        not null default now()
);

-- For EXISTING installations (table already created): these no-op when the
-- columns already exist, so the whole file can simply be re-run safely.
alter table products add column if not exists images      jsonb not null default '[]'::jsonb;
alter table products add column if not exists sizes       jsonb not null default '[]'::jsonb;
alter table products add column if not exists colors      jsonb not null default '[]'::jsonb;
alter table products add column if not exists variants    jsonb not null default '[]'::jsonb;
alter table products add column if not exists sale_pct    integer not null default 0;
alter table products add column if not exists set_name    varchar(200);
alter table products add column if not exists color_codes jsonb not null default '{}'::jsonb;
alter table products add column if not exists set_names   jsonb not null default '[]'::jsonb;

create table if not exists orders (
  id            serial primary key,
  customer_name varchar(200)   not null,
  phone         varchar(60)    not null,
  address       text           not null,
  notes         text           not null default '',
  items         jsonb          not null,
  total         numeric(10, 2) not null default 0,
  status        varchar(40)    not null default 'e_re',
  email_sent    boolean        not null default false,
  created_at    timestamp      not null default now()
);

-- --------------------------- ROW LEVEL SECURITY -----------------------------
-- The anon key shipped with the static site can ONLY:
--   * read categories
--   * read ACTIVE products
--   * create orders (with non-empty customer fields + items)
-- Everything else requires the logged-in admin (Supabase Auth user).

alter table categories enable row level security;
alter table products   enable row level security;
alter table orders     enable row level security;

drop policy if exists "public read categories"   on categories;
drop policy if exists "admin full categories"    on categories;
drop policy if exists "public read active products" on products;
drop policy if exists "admin full products"      on products;
drop policy if exists "public create orders"     on orders;
drop policy if exists "admin read orders"        on orders;
drop policy if exists "admin update orders"      on orders;
drop policy if exists "admin delete orders"      on orders;

create policy "public read categories"
  on categories for select to anon using (true);

create policy "admin full categories"
  on categories for all to authenticated using (true) with check (true);

create policy "public read active products"
  on products for select to anon using (active = true);

create policy "admin full products"
  on products for all to authenticated using (true) with check (true);

create policy "public create orders"
  on orders for insert to anon with check (
    char_length(btrim(customer_name)) > 0
    and char_length(btrim(phone)) > 0
    and char_length(btrim(address)) > 0
    and jsonb_typeof(items) = 'array'
    and jsonb_array_length(items) > 0
    and status = 'e_re'
    and email_sent = false
  );

create policy "admin read orders"
  on orders for select to authenticated using (true);

create policy "admin update orders"
  on orders for update to authenticated using (true) with check (true);

create policy "admin delete orders"
  on orders for delete to authenticated using (true);

-- --------------------------------- SEED -------------------------------------
-- Same content as scripts/seed.cjs. Skipped automatically if categories exist.

do $$
declare
  cat_id integer;
  cat_img text;
begin
  if (select count(*) from categories) > 0 then
    raise notice 'Categories already exist — skipping seed.';
    return;
  end if;

  insert into categories (slug, name, description, image, sort_order) values
    ('germa',    'Gërma',           'Gërma bronzi për emra dhe fjali të personalizuara mbi përkujtimore.', '/images/categories/germa.jpg',    0),
    ('korniza',  'Korniza Bronzi',  'Korniza elegante bronzi për fotografi përkujtimore.',                 '/images/categories/korniza.jpg',  1),
    ('kryqe',    'Kryqe Bronzi',    'Kryqe të punuara në bronz, me finitim të artë ose të errët.',         '/images/categories/kryqe.jpg',    2),
    ('lule',     'Lule Bronzi',     'Kompozime lulesh në bronz, të qëndrueshme ndaj kohës.',               '/images/categories/lule.jpg',     3),
    ('mbajtese', 'Mbajtëse Qirinjsh','Llampa dhe mbajtëse qirinjsh në bronz për varreza dhe altare.',      '/images/categories/mbajtese.jpg', 4),
    ('vazo',     'Vazo Lulesh',     'Vazo bronzi me gdhendje delikate për lule të freskëta.',              '/images/categories/vazo.jpg',     5),
    ('statuja',  'Statuja Bronzi',  'Statuja monumentale dhe të vogla, punuar me dorë.',                   '/images/categories/statuja.jpg',  6),
    ('targa',    'Targa Bronzi',    'Targa përkujtimore me gdhendje teksti dhe motive dekorative.',        '/images/categories/targa.jpg',    7);

  -- helper macro: insert products per category slug
  -- gërma
  select id, image into cat_id, cat_img from categories where slug = 'germa';
  insert into products (category_id, name, code, price, dims, material, description, image, sort_order, featured, featured_order, customizable, active) values
    (cat_id, 'Gërma kursive e artë',                '', 12.90, 'Lartësia 6 cm',        'Bronz i artë',         '', cat_img, 0, true,  0, true,  true),
    (cat_id, 'Gërma klasike bronzi',                '', 10.90, 'Lartësia 5 cm',        'Bronz 87',             '', cat_img, 1, false, 0, true,  true),
    (cat_id, 'Fjali e personalizuar në bronz',      '', 39.90, 'Gjatësia deri 40 cm',  'Bronz i punuar dorë',  '', cat_img, 2, false, 0, true,  true);

  -- korniza
  select id, image into cat_id, cat_img from categories where slug = 'korniza';
  insert into products (category_id, name, code, price, dims, material, description, image, sort_order, featured, featured_order, customizable, active) values
    (cat_id, 'Kornizë ovale me lule',               '', 58.90, '18 x 24 cm',           'Bronz i artë',         '', cat_img, 0, false, 0, false, true),
    (cat_id, 'Kornizë klasike rrethore',            '', 46.90, 'Diametri 16 cm',       'Bronz 87',             '', cat_img, 1, false, 0, false, true),
    (cat_id, 'Kornizë moderne minimaliste',         '', 41.90, '13 x 18 cm',           'Bronz i errët',        '', cat_img, 2, false, 0, false, true);

  -- kryqe
  select id, image into cat_id, cat_img from categories where slug = 'kryqe';
  insert into products (category_id, name, code, price, dims, material, description, image, sort_order, featured, featured_order, customizable, active) values
    (cat_id, 'Kryq modern i errët',                 '', 47.90, 'Lartësia 16 cm',       'Bronz 87 — patinë e errët',    '', cat_img, 0, false, 0, false, true),
    (cat_id, 'Kryq i artë trekëndor',               '', 73.90, 'Lartësia 35 cm',       'Bronz 87 — finish i artë',     '', cat_img, 1, false, 0, false, true),
    (cat_id, 'Kryqëzim klasik me Krishtin',         '', 46.90, 'Lartësia 15 cm',       'Bronz 87 — patinë artistike',  '', cat_img, 2, false, 0, false, true),
    (cat_id, 'Kryq me kristal dielli',              '', 53.90, 'Lartësia 20 cm',       'Bronz 87 — finish i artë',     '', cat_img, 3, false, 0, false, true);

  -- lule
  select id, image into cat_id, cat_img from categories where slug = 'lule';
  insert into products (category_id, name, code, price, dims, material, description, image, sort_order, featured, featured_order, customizable, active) values
    (cat_id, 'Trëndafil me kërcell të gjatë',       '', 78.90, 'Lartësia 51 cm',       'Bronz i punuar dorë',  '', cat_img, 0, true,  1, false, true),
    (cat_id, 'Luledielli Bronzi',                   '', 80.90, 'Lartësia 53 cm',       'Bronz i punuar dorë',  '', cat_img, 1, false, 0, false, true),
    (cat_id, 'Zambak (Giglio)',                     '', 46.90, 'Lartësia 23 cm',       'Bronz i punuar dorë',  '', cat_img, 2, false, 0, false, true);

  -- mbajtese
  select id, image into cat_id, cat_img from categories where slug = 'mbajtese';
  insert into products (category_id, name, code, price, dims, material, description, image, sort_order, featured, featured_order, customizable, active) values
    (cat_id, 'Llampë qiriri klasike',               '', 64.90, 'Lartësia 22 cm',       'Bronz me xham mbrojtës','', cat_img, 0, false, 0, false, true),
    (cat_id, 'Mbajtëse qiriri moderne',             '', 52.90, 'Lartësia 18 cm',       'Bronz 87',             '', cat_img, 1, false, 0, false, true);

  -- vazo
  select id, image into cat_id, cat_img from categories where slug = 'vazo';
  insert into products (category_id, name, code, price, dims, material, description, image, sort_order, featured, featured_order, customizable, active) values
    (cat_id, 'Vazo me gdhendje floreale',           '', 69.90, 'Lartësia 24 cm',       'Bronz i artë',         '', cat_img, 0, false, 0, false, true),
    (cat_id, 'Vazo klasike cilindrike',             '', 57.90, 'Lartësia 20 cm',       'Bronz 87',             '', cat_img, 1, false, 0, false, true);

  -- statuja
  select id, image into cat_id, cat_img from categories where slug = 'statuja';
  insert into products (category_id, name, code, price, dims, material, description, image, sort_order, featured, featured_order, customizable, active) values
    (cat_id, 'Madonna me duar të bashkuara',        '', 402.90, 'Lartësia 63 cm',      'Bronz 87 — patinë artistike',  '', cat_img, 0, true,  2, false, true),
    (cat_id, 'Madonna në lutje',                    '', 210.90, 'Lartësia 26 cm',      'Bronz 87 — patinë artistike',  '', cat_img, 1, false, 0, false, true),
    (cat_id, 'Engjëll mbrojtës',                    '', 288.90, 'Lartësia 41 cm',      'Bronz 87 — patinë artistike',  '', cat_img, 2, false, 0, false, true);

  -- targa
  select id, image into cat_id, cat_img from categories where slug = 'targa';
  insert into products (category_id, name, code, price, dims, material, description, image, sort_order, featured, featured_order, customizable, active) values
    (cat_id, 'Targë përkujtimore klasike',          '', 89.90, '20 x 30 cm',           'Bronz i artë',         '', cat_img, 0, false, 0, false, true),
    (cat_id, 'Targë me kornizë dekorative',         '', 96.90, '25 x 35 cm',           'Bronz 87',             '', cat_img, 1, false, 0, false, true);

  raise notice 'Seed completed.';
end $$;

-- --------------------------- PUBLIC ORDER FUNCTION ---------------------------
-- The public checkout must learn the new order's id, but the anon role has
-- no SELECT permission on orders (they contain customer PII), so
-- `insert().select()` is impossible. This SECURITY DEFINER function validates
-- the payload, inserts the order and returns only the new id — the same
-- thing the old POST /api/orders route did.

create or replace function public.create_order(
  customer_name text,
  phone         text,
  address       text,
  notes         text,
  items         jsonb,
  total         numeric
) returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  new_id integer;
begin
  if btrim(customer_name) = '' or btrim(phone) = '' or btrim(address) = '' then
    raise exception 'Emri, telefoni dhe adresa janë të domosdoshme.';
  end if;
  if jsonb_typeof(items) is distinct from 'array' or jsonb_array_length(items) = 0 then
    raise exception 'Shporta është bosh.';
  end if;

  insert into orders (customer_name, phone, address, notes, items, total, status, email_sent)
  values (btrim(customer_name), btrim(phone), btrim(address), coalesce(notes, ''), items,
          greatest(coalesce(total, 0), 0), 'e_re', false)
  returning id into new_id;

  return new_id;
end;
$$;

revoke all on function public.create_order(text, text, text, text, jsonb, numeric) from public;
grant execute on function public.create_order(text, text, text, text, jsonb, numeric) to anon;
