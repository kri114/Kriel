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

- `next.config.ts` zbulon **automatikisht** nëse build-i po ndodh në Render
  (Render vendos vetë variablin `RENDER=true` në çdo build — pa nevojë ta
  konfiguroni ju: https://render.com/docs/environment-variables) dhe në atë
  rast aktivizon `output: "export"` → `npm run build` prodhon direkt dosjen
  `out/` me HTML/CSS/JS të pastër, **pa asnjë variabël shtesë mjedisi të
  nevojshëm nga ana juaj**. **Asnjë rrugë server-side, asnjë server action,
  asnjë query DB nuk ekzekutohet gjatë shërbyesit.**
- Jashtë Render (p.sh. zhvillim lokal me `npm run dev`/`npm run build`), i
  njëjti kod ndërtohet si server normal Next.js — e përshtatshme për
  zhvillim — por asnjë faqe nuk varet nga kjo; çdo funksion dinamik
  (katalogu, paneli, porositë) punon tërësisht në shfletues kundrejt
  Supabase-it, kështu që të dyja mënyrat e build-it prodhojnë të njëjtin
  UI/UX.
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
  `image` (foto kryesore) / `images` (galeri fotosh shtesë — array JSON;
  paneli i ngushton fotot automatikisht në max 1280px JPEG).
- Opsionet e produktit (ngjyra/përmasa): tabela `product_variants` — një
  rresht për çdo kombinim ngjyrë+përmasë, secili me çmim dhe/ose foto të
  vetën opsionale (shih § 8 më poshtë).
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
   > **Keni tashmë një projekt Supabase nga më parë (bazë e dhënash ekzistuese)?**
   > Thjesht ekzekutoni sërish të **gjithë** skedarin e përditësuar
   > `supabase/setup.sql` — është i sigurt të rirendet (idempotent):
   > `create table if not exists`, `add column if not exists` dhe
   > `drop policy if exists` para çdo `create policy` bëjnë që të shtohet
   > vetëm ç'mungon (kolona `images`, tabela `product_variants`, RLS
   > përkatëse), pa prekur produktet/kategoritë/porositë ekzistuese.
3. **Authentication → Users → Add user → Create new user**: vendosni emailin
   dhe fjalëkalimin e adminit (këto përdoren për t'u kyçur te `/admin`).
4. **Project Settings → Data API**: koponi
   - `Project URL` → vlera e `NEXT_PUBLIC_SUPABASE_URL`
   - `anon` / `public` key → vlera e `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## 4. Cilësimet e sakta në Render

Krijoni **New → Static Site** dhe lidheni me repo-n:

| Fusha | Vlera |
|---|---|
| **Root Directory** | (varet nga struktura e repos suaj, p.sh. `kriel-bronze-product-website` nëse Next.js-i është në një nëndosje) |
| **Build Command** | `npm install && npm run build` |
| **Publish Directory** | `out` |

> **Pse `out` dhe jo `dist`?** Next.js me `output: "export"` gjeneron
> gjithmonë një dosje me emrin fiks **`out`** (jo të konfigurueshme si
> `dist`). Ky është emri i saktë dhe i vetëm i mundshëm për këtë projekt —
> nuk ka nevojë të hamendësoni.

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

## 5. (Opsionale) Email për porositë e reja — email-i final: `infokrielshpk@gmail.com`

**"Email jo i konfiguruar" te paneli NUK do të thotë se porosia dështoi** —
porosia ruhet gjithmonë me sukses në bazën e të dhënave (tab-i "Porositë").
Ai mesazh thjesht tregon që njoftimi automatik me email s'është aktivizuar
akoma — hap **plotësisht opsional**. Nëse nuk e aktivizoni, thjesht
kontrolloni tab-in "Porositë" në panel herë pas here.

**Adresa ku dërgohen njoftimet e porosive tani është `infokrielshpk@gmail.com`**
— e vendosur si vlerë fikse te `supabase/functions/send-order-email/index.ts`
(konstantja `ORDER_EMAIL_TO`) dhe te `src/lib/constants.ts` (`CONTACT_EMAIL`
/ `ORDER_EMAIL_TO`, të shfaqura edhe në faqen publike te "Kontakt").

**Pse Resend dhe jo SMTP direkt (Gmail):** Supabase Edge Functions
(runtime Deno) **bllokojnë përgjithmonë lidhjet SMTP të papërpunuara** në
portat 25/465/587 — kufizim i vetë platformës, jo diçka që rregullohet me
cilësime SMTP (dokumentuar nga vetë Supabase:
https://github.com/supabase/supabase/issues/6255). Prandaj funksioni dërgon
email-in nëpërmjet **Resend** (shërbimi që rekomandon vetë Supabase), me
një kërkesë të thjeshtë HTTPS — jo socket SMTP.

### Hapat përfundimtarë (rekomanduar, sepse `ORDER_EMAIL_TO` është Gmail, jo domain juaji)

Meqë `infokrielshpk@gmail.com` është adresë Gmail (jo domain që e zotëroni
DNS-in e tij), rruga më e thjeshtë dhe përfundimtare — **pa asnjë
konfigurim DNS** — është të regjistroni llogarinë Resend duke përdorur
saktësisht këtë adresë:

1. Shkoni te [resend.com/signup](https://resend.com/signup) dhe krijoni
   llogari duke përdorur **`infokrielshpk@gmail.com`** si email të
   llogarisë (konfirmojeni nëse kërkohet).
2. **API Keys → Create API Key** → kopjoni vlerën (fillon me `re_...`).
3. Supabase Dashboard → **Edge Functions → send-order-email → Code** →
   fshini gjithçka në editor dhe ngjitni **të gjithë** përmbajtjen e
   skedarit `supabase/functions/send-order-email/index.ts` nga ky
   repository → **Deploy**.
4. **Edge Functions → send-order-email → Secrets**, shtoni vetëm:
   - `RESEND_API_KEY` = `re_...` (nga hapi 2)
   - (mos vendosni `RESEND_FROM` — lëreni bosh; kodi përdor automatikisht
     dërguesin test `onboarding@resend.dev`, i cili tani mund t'i dërgojë
     `infokrielshpk@gmail.com` pa kufizim, sepse është adresa e vetë
     llogarisë Resend).
5. **Edge Functions → send-order-email → Settings** → sigurohuni që
   **"Enforce JWT Verification" është OFF**.
6. **Database → Webhooks**: nëse ekziston tashmë, lëreni siç është. Nëse
   jo, krijoni: Table: `orders` · Events: `Insert` · Type:
   `Supabase Edge Functions` → `send-order-email`.
7. Bëni një **porosi reale** nga faqja publike (jo buton "Test event").
   Brenda sekondave duhet të shfaqet "Email u dërgua" në panel, dhe email-i
   të arrijë te `infokrielshpk@gmail.com` (kontrolloni edhe folderin Spam
   herën e parë).

> **Nëse më vonë doni të dërgoni email nga adresa juaj e biznesit** (p.sh.
> `porosi@kriel.com`) në vend të `onboarding@resend.dev` si dërgues, ose të
> hiqni kufizimet e planit falas të Resend, verifikoni një domain që
> zotëroni te Resend → **Domains → Add Domain**, pastaj vendosni
> `RESEND_FROM` = `KRIEL <porosi@kriel.com>` te Secrets. Kjo është
> plotësisht opsionale — hapat 1-7 më sipër janë të mjaftueshëm.

### Çështje historike tashmë të zgjidhura në kodin aktual (për referencë)

Këto ishin shkaqe të mëparshme problemesh gjatë zhvillimit të kësaj
veçorie — **nuk kërkojnë veprim nga ju** nëse ndiqni hapat e sipërm me
kodin aktual, por mbahen këtu në rast se shihni ndonjë prej këtyre
simptomave:

- **`TypeError: Deno.writeAll is not a function` / gabime `smtp`,
  `nodemailer`, portat 465/587:** funksioni i deploy-uar ende ka kod SMTP
  të vjetëruar. Ribëni hapin 3 më sipër (fshini gjithçka te editori i
  Supabase dhe ngjitni nga e para skedarin aktual).
- **`{"reason": "missing_order_id"}` ose `{"reason": "unrecognized_payload"}`:**
  keni testuar me butonin "Send test event" te Webhooks (dërgon payload
  fiks, jo porosi reale) — bëni një porosi reale, ose përdorni butonin
  **"Test Email"** te tab-i "Porositë" në panel me një ID porosie që
  ekziston vërtet aty.
- **`{"reason": "order_not_found"}`** (nga butoni "Test Email"): ID-ja e
  porosisë s'ekziston në bazën e të dhënave — përdorni ID-në e saktë të
  shfaqur si "Porosia #X" te tab-i "Porositë".
- **"Funksioni nuk u thirr (Failed to send a request to the Edge Function)"**
  te butoni "Test Email": zakonisht CORS (kodi aktual e trajton këtë) ose
  "Enforce JWT Verification" ende ON — kontrolloni hapin 5 më sipër.
- **Gabim 403 Resend "You can only send testing emails to your own email
  address":** llogaria Resend nuk u krijua me `infokrielshpk@gmail.com` —
  ribëni hapin 1.

**Konfirmim i sigurt i versionit të kodit:** çdo thirrje e vlefshme e
funksionit regjistron te Logs rreshtin `[send-order-email vRESEND-3]
invoked`. Nëse pas një testimi **nuk e shihni fare** këtë rresht te
**Edge Functions → send-order-email → Logs**, funksioni i deploy-uar
ende nuk është kodi i këtij repository-t.

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
npm run dev              # server normal Next.js për zhvillim
npm run build            # server-mode build lokal (.next/) — i njëjti kod runtime

# Për të testuar EKSAKT atë që gjeneron Render, simuloni variablin e tij:
RENDER=true npm run build   # prodhon out/ — identik me atë që bën Render
npx serve out                # shërbe lokalisht eksportin statik për kontroll
```

## 8. Foto shtesë, ngjyra dhe përmasa për produktet

Paneli i adminit (Produktet → Shto/Ndrysho produkt) tani mbështet:

- **Disa foto për produkt** — "Foto kryesore" mbetet foto e parë/kryesore
  (siç ishte gjithmonë); më poshtë saj, "Foto shtesë (galeri)" ju lejon të
  ngarkoni ose lidhni **sa foto të doni**, t'i rirenditni (shigjetat majtas/
  djathtas) dhe t'i hiqni. Të gjitha shfaqen si karusel te faqja publike, në
  fletën e produktit.
- **Klikim për zmadhim (lightbox)** — çdo vizitor mund të klikojë foton
  kryesore të produktit te fleta e detajeve për ta parë në ekran të plotë,
  me shigjeta majtas/djathtas për të kaluar nëpër të gjitha fotot dhe Esc
  për ta mbyllur.
- **Ngjyra & Përmasa (opsionale)** — një seksion i ri nën kutinë
  "Personalizohet me shkrim", saktësisht në të njëjtin frymë: shtoni një
  rresht për çdo kombinim (p.sh. "E artë" + "M", "E artë" + "L", "Argjend"
  + "M"...). Secili rresht mund të ketë:
  - **Çmim të vetin** (lihet bosh = përdor çmimin bazë të produktit) —
    kështu çdo ngjyrë/përmasë mund të kushtojë ndryshe.
  - **Foto të vetën** (opsionale) — kur klienti zgjedh atë ngjyrë/përmasë,
    faqja publike i shfaq automatikisht atë foto specifike.
  - Nëse lini "Ngjyra" bosh te disa rreshta, produkti do të shfaqë vetëm
    zgjedhësin e "Përmasës" (dhe anasjelltas). Nëse s'shtoni asnjë rresht,
    produkti sillet plotësisht si më parë — pa asnjë zgjedhës, çmim i
    vetëm, foto e vetme.
- Klienti i zgjedh ngjyrën/përmasën te fleta e produktit para se ta shtojë
  në shportë; çmimi përditësohet automatikisht sipas zgjedhjes, dhe
  zgjedhja (ngjyra/përmasa) ruhet bashkë me artikullin — në shportë, në
  mesazhin e WhatsApp-it, dhe në porosinë e ruajtur në panel.

> **E rëndësishme për bazat e të dhënave ekzistuese:** nëse projekti juaj
> Supabase u krijua përpara kësaj veçorie, ekzekutoni sërish skedarin e
> plotë `supabase/setup.sql` (§3, hapi 2) — shton vetëm kolonën `images`,
> kolonën `discount_percent` dhe tabelën `product_variants` që mungojnë,
> pa fshirë asgjë ekzistuese.

## 9. Ulje ("Oferta"), rritje/zbritje çmimesh me përqindje

**Ulje (%) — reklamoni produkte në ofertë:**
- Panel → Produktet → Ndrysho një produkt → fusha e re **"Ulje (%)"**.
  Vendosni një përqindje (p.sh. `15`) dhe Ruaj — produkti shfaqet
  menjëherë te ndarja publike **"Oferta"** (mbi "Kategoritë" në faqen
  kryesore) me çmimin origjinal të kryqëzuar dhe çmimin e ri të kuq.
- Fshini/zbrazni fushën "Ulje (%)" (ose përdorni "Hiq uljen" te tabi i ri
  **"Oferta"** në panel) — produkti largohet menjëherë nga ndarja e
  ofertave dhe kthehet te çmimi normal, kudo që shfaqet (katalogu, fleta e
  produktit, shporta).
- **Ndarja publike "Oferta" fshihet automatikisht** (nuk shfaqet fare, jo
  as si seksion bosh) kur asnjë produkt aktiv nuk ka ulje të vendosur.
- Tabi i ri **"Oferta"** në panel (majtas "Të preferuarat") ju jep një
  vështrim të shpejtë të të gjitha produkteve aktualisht në ofertë, me
  çmimin e vjetër/të ri dhe buton "Hiq uljen".

**Rrit/zbrit çmimet e një produkti me përqindje:**
- Panel → Produktet → çdo kartë produkti tani ka një kontroll **"Rrit/zbrit
  me: [__]% [Apliko]"**. Shkruani një numër pozitiv (p.sh. `10`) për të
  rritur, ose negativ (p.sh. `-10`) për të zbritur.
- **Efekti:** ndryshon përgjithmonë (jo përkohësisht si "Ulje") çmimin bazë
  të atij produkti **dhe** çmimin e çdo opsioni ngjyrë/përmasë që ka çmim
  të vetin. Opsionet pa çmim të vetin (që trashëgojnë çmimin bazë) shkallëzohen
  automatikisht bashkë me bazën — nuk kanë nevojë përditësim të veçantë.
- **Prek VETËM produktin në fjalë** — asnjë produkt tjetër në katalog nuk
  ndryshon. Kërkohet konfirmim para se të aplikohet ndryshimi.

## 10. Ngjyra blu në fushat e kërkimit/renditjes/formularëve — rregulluar përfundimisht

**Shkaku i vërtetë:** faqja publike (dizajn i errët, ivory-mbi-ink) i
stilizonte QËLLIMISHT fushat e hyrjes (Kërko produkt, Renditja, checkout,
formulari i kontaktit, teksti i personalizuar) me sfond të errët
gjysmë-transparent. Në disa kombinime shfletues+OS kjo shfaqej si nuancë
blu (autofill i shfletuesit ose "dark mode" i OS-it e mbivendosin sfondin
tuaj). Meqë kërkuat qartë sfond **të bardhë** dhe jo thjesht "jo blu",
tani i kemi ndryshuar **të gjitha zonat e futjes së të dhënave** — si në
faqen publike ashtu edhe në panel — që të kenë sfond të bardhë me tekst
të errët të dallueshëm:

- **Faqja publike:** kutia e kërkimit "Kërko produkt", dropdown-i
  "Renditja", formulari i checkout-it (emri/telefoni/adresa/shënimet),
  formulari i kontaktit "Kërkesë e shpejtë", dhe fusha e tekstit të
  personalizuar (gërma) te fleta e produktit dhe te shporta.
- **Paneli i adminit:** çdo input/select/textarea (produktet, kategoritë,
  porositë, variantet, "Rrit/zbrit %") — të gjitha me `bg-white` shprehimisht.
- **Mbrojtje shtesë në `src/app/globals.css`:**
  - `color-scheme: light` në `<html>` — parandalon që OS në "dark mode" të
    detyrojë elementë nativë (dropdown, checkbox) drejt paletës së errët/blu.
  - Override i plotë i `-webkit-autofill` — çdo fushë e mbushur automatikisht
    nga shfletuesi mbetet e bardhë me tekst të errët, jo blu.
  - `accent-color` bronz për checkbox/radio — jo më blu si parazgjedhje e OS.
  - Stilizim i `<option>` brenda `<select>` (sfond i bardhë, tekst i errët).

> **Shënim:** vetë menyja "popup" e një `<select>`-i (lista që hapet kur
> klikoni) renderohet nga vetë sistemi operativ, jo nga faqja — disa
> shfletues/OS mund të vendosin ende një nuancë të lehtë mbi rreshtin e
> zgjedhur brenda asaj liste popup; kjo është kufizim i vetë platformës së
> përdoruesit, jo diçka që CSS mund ta kontrollojë plotësisht.

## 10.5. "Katalogu live nuk u ngarkua — po shfaqet versioni bazë"

**Shkaku:** çdo herë që shtojmë kolona/tabela të reja (p.sh. `images`,
`discount_percent`, `product_variants` në përditësimet e fundit), kodi i ri
i shfletuesit përpiqet t'i lexojë ato — nëse baza juaj **reale** Supabase
ende nuk i ka (sepse s'keni rirendur `supabase/setup.sql` më të fundit pas
një përditësimi kodi), kërkesa dështon.

**Tani e zgjidhur në kod (rezistencë graduale):** `fetchProducts` dhe
`fetchVariants` (te `src/lib/store.ts`) tani e zbulojnë këtë situatë
specifike (kolonë/tabelë mungon) dhe **rikthehen automatikisht** te një
kërkesë "e vjetër" pa fushat e reja — kështu produktet tuaja **reale**
vazhdojnë të shfaqen normalisht (thjesht pa veçoritë më të reja si galeria
e fotove shtesë, uljet, apo variantet ngjyrë/përmasë), në vend që gjithë
katalogu të rrëzohet te "versioni bazë" i integruar (produktet shembull).

**Çfarë duhet të bëni gjithsesi:** për të përdorur veçoritë e reja (foto
shtesë, ulje, ngjyra/përmasa), duhet ende ta rirendni **një herë** skedarin
e plotë `supabase/setup.sql` (§3, hapi 2) — është i sigurt, shton vetëm
ç'mungon, pa fshirë asnjë produkt/kategori/porosi ekzistuese.

**Nëse ende shihni mesazhin** pas rirendjes së `setup.sql`: kontrolloni
konsolën e shfletuesit (F12 → Console) për detajet e gabimit — zakonisht
tregon nëse problemi është diçka tjetër (p.sh. `NEXT_PUBLIC_SUPABASE_URL`
i pasaktë, ose RLS që bllokon leximin).

## 11. Cenueshmëritë e sigurisë (`npm audit`) — zgjidhur, 0 mbetur

Raportimi "X vulnerabilities" gjatë deploy-it në Render vjen nga
`npm install`, jo nga të dhënat tuaja (produktet/kategoritë/porositë jetojnë
në Supabase, krejtësisht të pandikuara). I zgjidhëm të gjitha pa asnjë
ndryshim që thyen funksionalitetin:

- `npm audit fix` (pa `--force`) — përditësoi automatikisht varësi indirekte
  (`js-yaml`, `nanoid`) me përditësime jo-thyese.
- `next` u ngrit nga `16.2.6` në `16.3.4` — përditësim i vogël brenda së
  njëjtës version madhor (16.x), sjell rregullime sigurie te Next.js dhe
  paketat e tij të brendshme (`postcss`, `sharp`).
- `postcss` (varësi zhvillimi për Tailwind) u ngrit nga `8.5.8` në `8.5.28`.
- `drizzle-kit` **u hoq plotësisht** — ishte varësi zhvillimi e papërdorur
  (projekti tashmë përdor `supabase/setup.sql` për skemën, jo më Drizzle
  Kit) dhe ishte shkaku i vetëm i cenueshmërisë së fundit (`esbuild`, mjet i
  brendshëm i tij). `drizzle-orm` mbetet i instaluar, sepse `src/db/schema.ts`
  e përdor vetëm si referencë tipesh — asnjë funksionalitet runtime nuk
  ndryshoi. `drizzle.config.json` (konfigurim i papërdorur i `drizzle-kit`)
  gjithashtu u fshi.

Rezultati: **`npm audit` → 0 vulnerabilities**, i verifikuar edhe pas build-it
të plotë (typegen, tsc, build, build_and_start).
