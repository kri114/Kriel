# KRIEL — Udhëzues i Panelit Sekret të Administratorit

Ky dokument shpjegon: **si ruhen automatikisht ndryshimet, çfarë skedarësh ekzistojnë,
dhe si përdoret paneli sekret**.

---

## 1. Ruajtja automatike — si funksionon (e re, pa GitHub)

Ndryshimet e çmimeve, kodeve dhe fotove **ruhen vetvetiu në cloud**,
rreth **2 sekonda** pasi i bëni në panel. Nuk keni nevojë të prekni
asnjë file dhe as të ribëni *build/deploy*.

- Çdo vizitor i faqes i merr automatikisht çmimet dhe fotot e reja
  (në hapjen e faqes, plus kontroll çdo ~90 sekonda).
- Funksionon edhe nëse e mbyllni shfletuesin — ndryshimet janë në cloud.
- Nëse nuk ka internet, ndryshimet ruhen **lokalisht** në pajisje dhe
  dërgohen vetvetiu sapo lidhja kthehet (statusi duket në panel).
- Çmimet/kodet/emrat sinkronizohen gjithmonë; fotot sinkronizohen
  automatikisht në shumicën e rasteve (kompresohen vetë). Nëse një foto
  është shumë e madhe për cloud-in, paneli ju lajmëron — çmimi i saj
  sinkronizohet prapë, ndërsa foton e dërgoni me kopjen sigurie (pika 5).

Nevojiten vetëm: **paneli + një llogari (admin)**. Asgjë tjetër.

---

## 2. Si hapet paneli sekret

Paneli **nuk duket askund** në faqe. Ka dy mënyra hyrjeje:

1. **Mënyra kryesore:** shkruani në shfletues adresën e faqes + `#kriel-admin`
   - p.sh. `www.faqja-juaj.com/#kriel-admin`
2. **Mënyra rezervë (nga telefoni):** prekni **5 herë shpejt** rreshtin e copyright-it
   në fund të faqes ("© 2025 Kriel — Të gjitha të drejtat e rezervuara").

### Llogaria e vetme

- **Përdoruesi:** `admin`
- **Fjalëkalimi:** `kriel2025`

Për t'i ndryshuar: hapni `src/admin/credentials.ts`, ndërroni dy rreshtat,
ruani, dhe ribëni *build/deploy* (kjo është e vetmja gjë që kërkon rebuild).

---

## 3. Si redaktohen çmimet, kodet dhe fotot

1. Hyni në panel → tabi **"Produktet"**.
2. Kërkoni produktin (me emër ose kod) ose filtroni sipas kategorisë.
3. Prekni produktin për ta hapur:
   - **Çmimi (€)** — shkruajeni direkt ose përdorni butonat **− / +**.
     Ruhet automatikisht pas ~2 sekondash (shihni statusin te tabi "Skedari").
   - **Kodi — shfaqet nën emër** — p.sh. `COD. 35 264/61`. Shfaqet te çdo produkt,
     nën emër dhe mbi çmim, me shkronja të vogla gri transparente.
     Nëse e lini bosh, rreshti i kodit nuk shfaqet fare.
   - **Foto** — butoni *"Shto foto të re"*: zgjidhni foto nga telefoni/kompjuteri.
     Me *"Kthe foton origjinale"* rikthehet fotoja e katalogut.
   - Mund të ndryshoni edhe **emrin, përmasat, materialin**, ose ta **fshihni**
     produktin nga katalogu (me mundësi rikthimi).
4. Tabi **"Shto"** — shton produkt krejt të ri me foto, çmim, kod dhe kategori.
5. Tabi **"Skedari"** — tregon statusin live të sinkronizimit:
   `Sinkronizuar automatikisht` + koha e sinkronizimit të fundit,
   si dhe butonin **"Sinkronizo tani"** për dërgim të menjëhershëm.

---

## 4. Skedarët e projektit (referencë — zakonisht nuk i prekni)

| Skedari | Ku ndodhet | Për çfarë shërben |
|---|---|---|
| `credentials.ts` | `src/admin/credentials.ts` | Llogaria e vetme e adminit |
| `CatalogAdmin.tsx` | `src/admin/CatalogAdmin.tsx` | Ruan ndryshimet + sinkronizimi automatik |
| `cloud.ts` | `src/admin/cloud.ts` | Lidhja me magazinën cloud (çelësi i dyqanit — mos e prekni) |
| `AdminPanel.tsx` | `src/components/AdminPanel.tsx` | Pamja e panelit sekret |
| `overrides.json` | `public/overrides.json` | Shtresë rezervë (aktualisht bosh; cloud-i ka përparësi) |
| `UDHEZUES-ADMIN.md` | (ky skedar) | Udhëzuesi që po lexoni |

Struktura:

```
projekti-kriel/
├─ src/
│  ├─ admin/
│  │  ├─ credentials.ts      ← përdoruesi + fjalëkalimi
│  │  ├─ CatalogAdmin.tsx    ← logjika + autosave
│  │  └─ cloud.ts            ← çelësi cloud (mos e prekni)
│  ├─ components/
│  │  └─ AdminPanel.tsx      ← pamja e panelit
│  └─ data/
│     └─ catalogue.ts        ← katalogu origjinal (nuk preket kurrë)
├─ public/
│  ├─ images/
│  ├─ products/              ← 150 fotot origjinale
│  └─ overrides.json         ← rezervë (bosh)
└─ UDHEZUES-ADMIN.md         ← ky udhëzues
```

---

## 5. Kopja sigurie (opsionale, por e këshillueshme)

Te tabi **"Skedari"** keni butonat **"Shkarko kopjen"** dhe **"Importo"**:

- **Shkarko kopjen** — shkarkon `overrides.json` me të gjitha ndryshimet.
  Ruajeni diku për siguri (p.sh. një herë në muaj). Nëse ndonjëherë
  cloud-i prishet, ndryshimet rikthehen me **Importo**.
- **Shënim:** ndryshe nga më parë, **nuk është më e nevojshme** ta kopjoni
  këtë skedar në `public/` — shërben vetëm si kopje sigurie.

---

## 6. Pyetje të shpeshta

- **Ndryshova çmimin — kur e shohin vizitorët?**
  Brenda ~2 sekondash ruhet në cloud; vizitorët e shohin në hapjen e
  ardhshme të faqes (ose brenda ~90 sekondash nëse e kanë hapur).

- **Si e di që u ruajt?**
  Te tabi "Skedari": pika jeshile + "Sinkronizuar automatikisht" +
  "Sinkronizimi i fundit: sapo / para X sek".

- **Nuk kam internet — humbas ndryshimet?**
  Jo. Ruhen në pajisje dhe dërgohen vetvetiu kur lidheni. Statusi tregon
  "Pa internet — ruajtur lokalisht".

- **A prishet katalogu origjinal?**
  Jo — `src/data/catalogue.ts` nuk preket kurrë. Cloud-i ruan vetëm
  *ndryshimet*, origjinali mbetet gjithmonë si rezervë.

- **Harrova fjalëkalimin?**
  Hapni `src/admin/credentials.ts` — aty duket qartë.

- **A mund ta gjejë dikush panelin?**
  Adresa sekrete nuk është e lidhur askund në faqe, dhe pa përdoruesin
  + fjalëkalimin nuk hapet. Çelësi cloud është i fshehur në kod —
  mjaftueshëm i sigurt për një katalog çmimesh; mbani kopje sigurie
  mujore me "Shkarko kopjen".
