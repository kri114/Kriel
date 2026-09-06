# KRIEL — Arti i Bronzit

Faqja e katalogut KRIEL / Caggiati me panel administrimi të plotë.

## Nisja lokale

```bash
npm install
cp .env.example .env      # plotësoni DATABASE_URL dhe kredencialet e adminit
npx drizzle-kit push       # krijon tabelat në bazën e të dhënave
npm run dev                # http://localhost:3000
```

- Nëse `DATABASE_URL` mungon, aplikacioni përdor parazgjedhjen lokale
  `postgresql://postgres:postgres@127.0.0.1:5432/app_db` me një paralajmërim në konsollë.
- Të dhënat e katalogut (10 kategori, 150 produkte) futen automatikisht në
  hapjen e parë të faqes, nëse tabelat janë bosh.

## Paneli i administrimit

Hyni te **/admin** (ose 5 prekje të shpejta mbi rreshtin e copyright-it në fund të faqes).

Kredencialet vendosen me variablat e mjedisit:

```
ADMIN_USERNAME=...
ADMIN_PASSWORD=...
```

Nga paneli mund të:
- zgjidhni dhe rirenditni produktet **“Më të pëlqyerat”** që shfaqen në krye të faqes,
- ndryshoni **fotot e produkteve** dhe **fotot e kategorive** (ngarkim ose URL),
- shtoni / fshini / riemërtoni / rirenditni **kategoritë**,
- shtoni, editoni dhe fshini **produkte** (emër, çmim, kod, përmasa, material).
