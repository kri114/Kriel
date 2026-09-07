-- ============================================================================
-- KRIEL — Supabase schema
-- Run this once in Supabase Dashboard → SQL Editor (it is idempotent).
-- Tables are identical to the previous Drizzle schema (src/db/schema.ts).
-- ============================================================================

-- ---------- Tables ----------------------------------------------------------
create table if not exists public.categories (
  id          serial primary key,
  slug        varchar(120) not null unique,
  name        varchar(200) not null,
  description text not null default '',
  image       text not null default '',
  sort_order  integer not null default 0,
  created_at  timestamp not null default now()
);

create table if not exists public.products (
  id             serial primary key,
  category_id    integer references public.categories(id) on delete set null,
  name           varchar(200) not null,
  code           varchar(100) not null default '',
  price          numeric(10,2) not null default 0,
  dims           varchar(120) not null default '',
  material       varchar(200) not null default '',
  description    text not null default '',
  image          text not null default '',
  sort_order     integer not null default 0,
  featured       boolean not null default false,
  featured_order integer not null default 0,
  customizable   boolean not null default false,
  active         boolean not null default true,
  created_at     timestamp not null default now()
);

create table if not exists public.orders (
  id            serial primary key,
  customer_name varchar(200) not null,
  phone         varchar(60) not null,
  address       text not null,
  notes         text not null default '',
  items         jsonb not null,
  total         numeric(10,2) not null default 0,
  status        varchar(40) not null default 'e_re',
  email_sent    boolean not null default false,
  created_at    timestamp not null default now()
);

-- ---------- Row Level Security ---------------------------------------------
alter table public.categories enable row level security;
alter table public.products   enable row level security;
alter table public.orders     enable row level security;

-- Catalogue: everyone can read, only logged-in admins can write.
drop policy if exists "categories public read"  on public.categories;
drop policy if exists "categories admin write"  on public.categories;
create policy "categories public read" on public.categories for select using (true);
create policy "categories admin write" on public.categories for all
  to authenticated using (true) with check (true);

drop policy if exists "products public read"  on public.products;
drop policy if exists "products admin write"  on public.products;
create policy "products public read" on public.products for select using (true);
create policy "products admin write" on public.products for all
  to authenticated using (true) with check (true);

-- Orders: nobody anonymous can read; admins can read/update/delete.
-- Inserts happen only through the create_order() function below.
drop policy if exists "orders admin all" on public.orders;
create policy "orders admin all" on public.orders for all
  to authenticated using (true) with check (true);

-- ---------- Public checkout function ---------------------------------------
-- Validates the payload and computes the total server-side (like the old
-- POST /api/orders route). SECURITY DEFINER lets anonymous visitors insert
-- without granting them any read access to the orders table.
create or replace function public.create_order(
  p_customer_name text,
  p_phone         text,
  p_address       text,
  p_notes         text,
  p_items         jsonb
) returns public.orders
language plpgsql
security definer
set search_path = public
as $$
declare
  v_total numeric(10,2) := 0;
  v_item  jsonb;
  v_row   public.orders;
begin
  if coalesce(trim(p_customer_name), '') = '' or coalesce(trim(p_phone), '') = '' or coalesce(trim(p_address), '') = '' then
    raise exception 'Emri, telefoni dhe adresa janë të domosdoshme.';
  end if;
  if p_items is null or jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then
    raise exception 'Shporta është bosh.';
  end if;

  for v_item in select * from jsonb_array_elements(p_items) loop
    v_total := v_total
      + coalesce((v_item->>'price')::numeric, 0)
      * greatest(1, coalesce((v_item->>'qty')::int, 1));
  end loop;

  insert into public.orders (customer_name, phone, address, notes, items, total, status, email_sent)
  values (trim(p_customer_name), trim(p_phone), trim(p_address), coalesce(trim(p_notes), ''), p_items, v_total, 'e_re', false)
  returning * into v_row;

  return v_row;
end;
$$;

revoke all on function public.create_order(text, text, text, text, jsonb) from public;
grant execute on function public.create_order(text, text, text, text, jsonb) to anon, authenticated;

-- ---------- Storage bucket for product / category photos -------------------
insert into storage.buckets (id, name, public)
values ('kriel-media', 'kriel-media', true)
on conflict (id) do update set public = true;

drop policy if exists "kriel media public read"   on storage.objects;
drop policy if exists "kriel media admin insert"  on storage.objects;
drop policy if exists "kriel media admin update"  on storage.objects;
drop policy if exists "kriel media admin delete"  on storage.objects;
create policy "kriel media public read"  on storage.objects for select using (bucket_id = 'kriel-media');
create policy "kriel media admin insert" on storage.objects for insert to authenticated with check (bucket_id = 'kriel-media');
create policy "kriel media admin update" on storage.objects for update to authenticated using (bucket_id = 'kriel-media');
create policy "kriel media admin delete" on storage.objects for delete to authenticated using (bucket_id = 'kriel-media');

-- ---------- Seed (only when the catalogue is empty) -------------------------
do $$
declare
  c_germa int; c_korniza int; c_kryqe int; c_lule int; c_mbajtese int; c_vazo int; c_statuja int; c_targa int;
begin
  if (select count(*) from public.categories) > 0 then
    return;
  end if;

  insert into public.categories (slug, name, description, image, sort_order) values
    ('germa',    'Gërma',              'Gërma bronzi për emra dhe fjali të personalizuara mbi përkujtimore.', '/images/categories/germa.jpg',    0) returning id into c_germa;
  insert into public.categories (slug, name, description, image, sort_order) values
    ('korniza',  'Korniza Bronzi',     'Korniza elegante bronzi për fotografi përkujtimore.',                  '/images/categories/korniza.jpg',  1) returning id into c_korniza;
  insert into public.categories (slug, name, description, image, sort_order) values
    ('kryqe',    'Kryqe Bronzi',       'Kryqe të punuara në bronz, me finitim të artë ose të errët.',          '/images/categories/kryqe.jpg',    2) returning id into c_kryqe;
  insert into public.categories (slug, name, description, image, sort_order) values
    ('lule',     'Lule Bronzi',        'Kompozime lulesh në bronz, të qëndrueshme ndaj kohës.',                '/images/categories/lule.jpg',     3) returning id into c_lule;
  insert into public.categories (slug, name, description, image, sort_order) values
    ('mbajtese', 'Llampa & Mbajtëse',  'Llampa dhe mbajtëse qiriri në bronz për përkujtimore.',                '/images/categories/mbajtese.jpg', 4) returning id into c_mbajtese;
  insert into public.categories (slug, name, description, image, sort_order) values
    ('vazo',     'Vazo Bronzi',        'Vazo bronzi klasike dhe moderne.',                                     '/images/categories/vazo.jpg',     5) returning id into c_vazo;
  insert into public.categories (slug, name, description, image, sort_order) values
    ('statuja',  'Statuja Bronzi',     'Statuja fetare dhe artistike të derdhura në bronz.',                   '/images/categories/statuja.jpg',  6) returning id into c_statuja;
  insert into public.categories (slug, name, description, image, sort_order) values
    ('targa',    'Targa Bronzi',       'Targa përkujtimore me gdhendje teksti dhe motive dekorative.',         '/images/categories/targa.jpg',    7) returning id into c_targa;

  insert into public.products (category_id, name, price, dims, material, image, sort_order, featured, featured_order, customizable) values
    (c_germa,   'Gërma kursive e artë',            12.9,  'Lartësia 6 cm',        'Bronz i artë',                  '/images/categories/germa.jpg',    0, true,  0, true),
    (c_germa,   'Gërma klasike bronzi',            10.9,  'Lartësia 5 cm',        'Bronz 87',                      '/images/categories/germa.jpg',    1, false, 0, true),
    (c_germa,   'Fjali e personalizuar në bronz',  39.9,  'Gjatësia deri 40 cm',  'Bronz i punuar dorë',           '/images/categories/germa.jpg',    2, false, 0, true),
    (c_korniza, 'Kornizë ovale me lule',           58.9,  '18 x 24 cm',           'Bronz i artë',                  '/images/categories/korniza.jpg',  0, false, 0, false),
    (c_korniza, 'Kornizë klasike rrethore',        46.9,  'Diametri 16 cm',       'Bronz 87',                      '/images/categories/korniza.jpg',  1, false, 0, false),
    (c_korniza, 'Kornizë moderne minimaliste',     41.9,  '13 x 18 cm',           'Bronz i errët',                 '/images/categories/korniza.jpg',  2, false, 0, false),
    (c_kryqe,   'Kryq modern i errët',             47.9,  'Lartësia 16 cm',       'Bronz 87 — patinë e errët',     '/images/categories/kryqe.jpg',    0, false, 0, false),
    (c_kryqe,   'Kryq i artë trekëndor',           73.9,  'Lartësia 35 cm',       'Bronz 87 — finish i artë',      '/images/categories/kryqe.jpg',    1, false, 0, false),
    (c_kryqe,   'Kryqëzim klasik me Krishtin',     46.9,  'Lartësia 15 cm',       'Bronz 87 — patinë artistike',   '/images/categories/kryqe.jpg',    2, false, 0, false),
    (c_kryqe,   'Kryq me kristal dielli',          53.9,  'Lartësia 20 cm',       'Bronz 87 — finish i artë',      '/images/categories/kryqe.jpg',    3, false, 0, false),
    (c_lule,    'Trëndafil me kërcell të gjatë',   78.9,  'Lartësia 51 cm',       'Bronz i punuar dorë',           '/images/categories/lule.jpg',     0, true,  1, false),
    (c_lule,    'Luledielli Bronzi',               80.9,  'Lartësia 53 cm',       'Bronz i punuar dorë',           '/images/categories/lule.jpg',     1, false, 0, false),
    (c_lule,    'Zambak (Giglio)',                 46.9,  'Lartësia 23 cm',       'Bronz i punuar dorë',           '/images/categories/lule.jpg',     2, false, 0, false),
    (c_mbajtese,'Llampë qiriri klasike',           64.9,  'Lartësia 22 cm',       'Bronz me xham mbrojtës',        '/images/categories/mbajtese.jpg', 0, false, 0, false),
    (c_mbajtese,'Mbajtëse qiriri moderne',         52.9,  'Lartësia 18 cm',       'Bronz 87',                      '/images/categories/mbajtese.jpg', 1, false, 0, false),
    (c_vazo,    'Vazo me gdhendje floreale',       69.9,  'Lartësia 24 cm',       'Bronz i artë',                  '/images/categories/vazo.jpg',     0, false, 0, false),
    (c_vazo,    'Vazo klasike cilindrike',         57.9,  'Lartësia 20 cm',       'Bronz 87',                      '/images/categories/vazo.jpg',     1, false, 0, false),
    (c_statuja, 'Madonna me duar të bashkuara',    402.9, 'Lartësia 63 cm',       'Bronz 87 — patinë artistike',   '/images/categories/statuja.jpg',  0, true,  2, false),
    (c_statuja, 'Madonna në lutje',                210.9, 'Lartësia 26 cm',       'Bronz 87 — patinë artistike',   '/images/categories/statuja.jpg',  1, false, 0, false),
    (c_statuja, 'Engjëll mbrojtës',                288.9, 'Lartësia 41 cm',       'Bronz 87 — patinë artistike',   '/images/categories/statuja.jpg',  2, false, 0, false),
    (c_targa,   'Targë përkujtimore klasike',      89.9,  '20 x 30 cm',           'Bronz i artë',                  '/images/categories/targa.jpg',    0, false, 0, false),
    (c_targa,   'Targë me kornizë dekorative',     96.9,  '25 x 35 cm',           'Bronz 87',                      '/images/categories/targa.jpg',    1, false, 0, false);
end $$;
