# KRIEL — Deployim si Static Site në Render

Kjo udhëzim shpjegon arkitekturën e re, ku ruhen të dhënat dhe si ta
publikoni faqen si **Render Static Site** me panelin e administratorit
plotësisht funksional.

---

## 1. Arkitektura e re (çfarë ndryshoi dhe pse)

| Pjesë | Më parë | Tani |
|---|---|---|
| Faqja publike | Next.js server + PostgreSQL (Drizzle) | **Static HTML** (`out/`), e shërbyer nga CDN — pa server |
| Katalogu (kategori/produkte) | Query DB në çdo request | **Supabase Postgres**, lexuar nga shfletuesi në kohë reale |
| Paneli i adminit | Cookie-HMAC + API routes | Aplikacion klient-side; kyçje me **Supabase Auth** (email + fjalëkalim) |
| CRUD produktesh/kategorish | Route handlers + Drizzle | `supabase-js` + **Row Level Security** |
| Porositë | `POST /api/orders` + nodemailer | Funksion Postgres `create_order` + webhook/edge function për email |
| Fotot | Base64 në kolonën `image` | **E njëjta** — asgjë nuk ndryshoi |
| Dizajni/komponentët | — | **100% të pandryshuara** |

Pikat e rëndësishme:

- Build-i me `STATIC_EXPORT=1` aktivizon `output: "export"` në
  `next.config.ts` → prodhon dosjen `out/` me HTML/CSS/JS të pastër.
  **Asnjë rrugë server-side, asnjë server action, asnjë query DB nuk
  ekzekutohet gjatë shërbyesit.** (Build-i pa këtë variabël, p.sh. për
  preview lokal, prodhon të njëjtat faqe të prerenderuara — kodi në
  shfletues është identik.)
- Një rrugë e vetme e mbetur, `/api/health`, është statike
  (`force-static`) dhe prerenderohet në skedar — nuk kërkon serverë.
- Fjala "live" për katalogun: faqja statike lexon të dhënat nga Supabase në
  shfletues, kështu çdo ndryshim nga paneli **shfaqet menjëherë pa rebuild**.

## 2. Ku ruhen të dhënat tani

**Supabase** (Postgres i menaxhuar, falas për këtë madhësi):

- `categories`, `products`, `orders` — skema identike me skemën e vjetër
  Drizzle (`supabase/setup.sql` e krijon 1:1, me të njëjtat kolona snake_case).
- Fotot: si më parë — ose URL (p.sh. `/images/categories/germa.jpg` që
  shërbehet nga vetë faqja statike) ose **Base64 data-URL** brenda kolonës
  `image` (paneli i ngushton fotot automatikisht në max 1280px JPEG).
- Porositë: tek tabela `orders`; paneli i lexon me llogarinë e adminit.
- Autentikimi i adminit: **Supabase Auth** — asnjë fjalëkalim në kod.

### Si pasqyrohet një ndryshim i adminit në faqen publike

1. Admini klikon "Ruaj" te `/admin` → `supabase-js` përditëson rreshtin në
   Supabase (RLS lejon vetëm përdoruesit e kyçur).
2. Vizitori hap faqen → HTML statik ngarkohet menjëherë nga CDN → JS lexon
   katalogun e fundit nga Supabase → ndryshimi duket **në çast**, pa
   ripublikim.

## 3. Hapat një-herësh në Supabase

1. Krijoni llogari falas te [supabase.com](https://supabase.com) → **New
   project** (zgjidhni rajonin më afër, p.sh. `Frankfurt`).
2. Tek **SQL Editor → New query**, ngjitni **gjithë** përmbajtjen e
   `supabase/setup.sql` dhe klikoni **Run**. Kjo krijon tabelat, rregullat
   RLS, funksionin `create_order` dhe hedh katalogun fillestar (të njëjtin
   me `scripts/seed.cjs`).
3. **Authentication → Users → Add user → Create new user**: vendosni emailin
   dhe fjalëkalimin e adminit (këto përdoren për t'u kyçur te `/admin`).
4. **Project Settings → Data API**: koponi
   - `Project URL` → vlera e `NEXT_PUBLIC_SUPABASE_URL`
   - `anon` / `public` key → vlera e `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## 4. Cilësimet e sakta në Render

Krijoni **New → Static Site** dhe lidheni me repo-n:

| Fusha | Vlera |
|---|---|
| **Build Command** | `npm install && STATIC_EXPORT=1 npm run build` |
| **Publish Directory** | `out` |

**Environment Variables** (Environment → Add Environment Variable):

| Key | Value |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://xxxx.supabase.co` (nga hap 3.4) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJhbGciOi...` (anon/public key) |

> Këto dy vlera **janë publike për dizajn** — ato sigurohen nga rregullat
> RLS në bazën e të dhënave, jo nga fshehja e tyre. Asnjë sekret (service
> role, SMTP, fjalëkalim DB) nuk vendoset kurrë në kod ose në Render.

Shtypni **Deploy**. Render publikon `out/` në CDN. Rrugët `/`, `/admin`,
`/api/health` dhe `/404.html` funksionojnë pa asnjë cilësim shtesë.

> Nëse variablat mungojnë: faqja publike punon ende me katalogun bazë të
> integruar, por paneli tregon udhëzimet e konfigurimit në vend të hyrjes.

## 5. (Opsionale) Email për porositë e reja

Pa këtë hap porositë ruhen ende dhe duken te paneli — saktësisht si
më parë pa SMTP të konfiguruar. Për të aktivizuar email-et:

1. `npm i -g supabase` → `supabase login` → `supabase link --project-ref <id>`
2. `supabase functions deploy send-order-email`
3. `supabase secrets set SMTP_HOST=... SMTP_PORT=587 SMTP_USER=... SMTP_PASS=... SMTP_FROM=...`
4. Në Supabase Dashboard → **Database → Webhooks → Create webhook**:
   - Table: `orders`, Events: `Insert`
   - Type: `Supabase Edge Function` → `send-order-email`

Funksioni dërgon të njëjtin email (tekst + HTML) si `nodemailer`-i i vjetër
dhe e shënon porosinë `email_sent = true` (duke përdorur service-role key-në
që mbetet vetëm në Supabase — kurrë në repo).

## 6. Kontrolli i pajtueshmërisë me static export (i verifikuar)

- [x] `/` — faqe statike; katalogu lexohet në shfletues (fallback i integruar nëse backend-i mungon)
- [x] `/admin` — shell statik; hyrje/CRUD/porosi nga shfletuesi drejt në Supabase
- [x] Shporta (localStorage), porosia me WhatsApp — 100% klient-side (si më parë)
- [x] Asnjë `fetch` në `/api/*` të brendshme; asnjë `next/headers`; asnjë `pg`/`drizzle`/`nodemailer` në bundle
- [x] `/api/health` — statik (`out/api/health`)
- [x] `output: "export"` kalon `next build`; `out/` shërbehet me çdo static host

## 7. Zhvillim lokal

```bash
npm install
npm run dev                     # me .env bosh → katalogu bazë; plotësoni variablat për backend live
STATIC_EXPORT=1 npm run build   # prodhon out/ gati për Render Static Site
npx serve out                   # shërbe lokalisht eksportin statik për kontroll
```
