# OFICIÁLNÍ ČESKÁ ÚČETNÍ PRAVIDLA

> **Právní rámec:** Vyhláška č. 500/2002 Sb. a Zákon o účetnictví č. 563/1991 Sb.
>
> **Zdroje:**
> - [Portál POHODA - Směrná účtová osnova](https://portal.pohoda.cz/dane-ucetnictvi-mzdy/ucetnictvi/smerna-uctova-osnova-pro-podnikatele/)
> - [Uctovani.net - Účtová osnova 2025](https://www.uctovani.net/ucetni-osnova.php)
> - [Stormware - Účtová osnova](https://www.stormware.cz/ke-stazeni/soubory/uctova-osnova/)

---

## STRUKTURA ÚČTOVÉ OSNOVY

Česká účtová osnova se dělí na **10 účtových tříd (0-9)**, každá třída má specifické zaměření:

### Účtové třídy

| Třída | Název | Typ | Použití |
|-------|-------|-----|---------|
| **0** | Dlouhodobý majetek | Aktivní | Hmotný a nehmotný majetek, odpisy |
| **1** | Zásoby | Aktivní | Materiál, zboží, výrobky |
| **2** | Finanční majetek | Aktivní | Pokladna, banka, peníze na cestě |
| **3** | Zúčtovací vztahy | Aktivní/Pasivní | Pohledávky, závazky, zaměstnanci |
| **4** | Kapitálové účty | Pasivní | Základní kapitál, fondy, výsledek hospodaření |
| **5** | Náklady | Nákladové | Spotřeba materiálu, služby, mzdy |
| **6** | Výnosy | Výnosové | Tržby, úroky, ostatní výnosy |
| **7** | Závěrkové účty | Speciální | Účty pro sestavení účetní závěrky |

---

## TŘÍDA 0 - DLOUHODOBÝ MAJETEK

### Podskupiny

| Účty | Název | Popis |
|------|-------|-------|
| **01x** | Dlouhodobý nehmotný majetek | Software, licence, ocenitelná práva |
| **02x** | Dlouhodobý hmotný majetek (odpisovaný) | Budovy, stroje, auta, zařízení |
| **03x** | Dlouhodobý hmotný majetek (neodpisovaný) | Pozemky, umělecká díla |
| **04x** | Nedokončený dlouhodobý majetek | Majetek ve výstavbě |
| **05x** | Zálohy na dlouhodobý majetek | Zálohy na nákup DHM/DNM |
| **06x** | Dlouhodobý finanční majetek | Akcie, dluhopisy, půjčky |
| **07x-08x** | Oprávky k majetku | Kumulované odpisy DHM/DNM |
| **09x** | Opravné položky k DM | Snížení hodnoty majetku |

### Nejpoužívanější účty

- **022** - Budovy a stavby
- **028** - Drobný hmotný majetek (DHM do 40 000 Kč)
- **042** - Pořízení dlouhodobého hmotného majetku
- **051** - Poskytnuté zálohy na DHM

---

## TŘÍDA 1 - ZÁSOBY

### Podskupiny

| Účty | Název | Popis |
|------|-------|-------|
| **11x** | Materiál | Suroviny, pomocné látky |
| **12x** | Zásoby vlastní výroby | Nedokončená výroba, polotovary |
| **13x** | Zboží | Nakoupené zboží určené k prodeji |
| **15x** | Zálohy na zásoby | Zálohy dodavatelům na materiál |
| **19x** | Opravné položky k zásobám | Snížení hodnoty zásob |

### Nejpoužívanější účty

- **131** - Materiál na skladě
- **132** - Materiál na cestě
- **504** - Prodané zboží (náklad)

---

## TŘÍDA 2 - FINANČNÍ MAJETEK A PENĚŽNÍ PROSTŘEDKY

### Podskupiny

| Účty | Název | Popis | MD (přírůstek) | D (úbytek) |
|------|-------|-------|----------------|------------|
| **21x** | Pokladna | Hotovost v pokladně | Příjem hotovosti | Výdej hotovosti |
| **22x** | Bankovní účty | Peníze na účtech | Příchozí platba | Odchozí platba |
| **23x** | Krátkodobé úvěry | Úvěry do 1 roku | - | - |
| **24x** | Krátkodobá finanční výpomoc | Půjčky do 1 roku | - | - |
| **25x** | Krátkodobý finanční majetek | Cenné papíry, akcje | - | - |
| **26x** | Převody mezi finančními účty | Peníze na cestě | Platba kartou | Připsání na účet |
| **29x** | Opravné položky k fin. majetku | Snížení hodnoty | - | - |

### Detailní rozpis účtů 2xx

#### 211 - Pokladna (Cash)
- **Typ:** Aktivní
- **MD:** Příjem hotovosti (prodej za hotové, výběr z banky)
- **D:** Výdej hotovosti (nákup za hotové, vklad na banku)
- **Použití:**
  - Účtenky zaplacené hotově
  - Okamžitá úhrada v hotovosti
  - Drobné výdaje firmy

**Příklad:**
```
Nákup kancelářských potřeb za hotové 500 Kč:
MD 501 (Spotřeba materiálu) / D 211 (Pokladna)
```

---

#### 221 - Bankovní účty (Bank accounts)
- **Typ:** Aktivní
- **MD:** Příchozí platby na účet (tržby, úhrady faktur)
- **D:** Odchozí platby z účtu (úhrady dodavatelům, výběry)
- **Použití:**
  - Běžný provozní účet
  - Přímé bankovní převody
  - Trvalé příkazy, inkasa

**Příklad:**
```
Úhrada faktury dodavateli bankovním převodem 10 000 Kč:
MD 321 (Dodavatelé) / D 221 (Bankovní účet)
```

---

#### 261 - Peníze na cestě (Money in transit)
- **Typ:** Aktivní
- **MD:** Platba kartou (ještě není na účtu, ale už opustila pokladnu)
- **D:** Připsání na bankovní účet (za 1-2 dny)
- **Použití:**
  - **VÝHRADNĚ pro platby platební kartou!**
  - Platba kartou v e-shopu
  - Platba kartou u dodavatele
  - Platba kartou na benzínce

**KRITICKÉ PRAVIDLO:**
- ❌ **NEPOUŽÍVAT pro hotovost!**
- ❌ **NEPOUŽÍVAT pro okamžité bankovní převody!**
- ✅ **POUZE pro platby kartou (bankovní den +1)**

**Příklad:**
```
Den 1 (21.10.2025) - Nákup pohonných hmot kartou 2 000 Kč:
MD 501 (Spotřeba materiálu) / D 261 (Peníze na cestě)

Den 2 (22.10.2025) - Připsání na bankovní účet:
MD 221 (Bankovní účet) / D 261 (Peníze na cestě)
```

---

## TŘÍDA 3 - ZÚČTOVACÍ VZTAHY

### Podskupiny

| Účty | Název | Popis | Typ |
|------|-------|-------|-----|
| **31x** | Pohledávky | Kdo nám dluží | Aktivní |
| **32x** | Závazky | Komu dlužíme | Pasivní |
| **33x** | Zúčtování se zaměstnanci | Mzdy, náhrady | Pasivní |
| **34x** | Zúčtování daní a dotací | DPH, daň z příjmu | Aktivní/Pasivní |
| **35x** | Pohledávky za společníky | Vklady, půjčky | Aktivní |
| **36x** | Závazky ke společníkům | Podíly na zisku | Pasivní |
| **37x** | Jiné pohledávky a závazky | Ostatní | Aktivní/Pasivní |
| **38x** | Přechodné účty | Dohadné položky | Aktivní/Pasivní |
| **39x** | Opravné položky | Snížení pohledávek | Pasivní |

### Detailní rozpis účtů 3xx

#### 311 - Odběratelé (Customers / Accounts Receivable)
- **Typ:** Aktivní (pohledávka)
- **MD:** Vystavení faktury odběrateli (vzniká pohledávka)
- **D:** Úhrada faktury odběratelem (pohledávka klesá)
- **Použití:**
  - Vydané faktury (má nám někdo zaplatit)
  - Evidujeme KDO nám dluží a KOLIK

**Příklad:**
```
Vystavení faktury odběrateli 50 000 Kč:
MD 311 (Odběratelé) / D 602 (Tržby za služby)

Úhrada faktury odběratelem:
MD 221 (Bankovní účet) / D 311 (Odběratelé)
```

---

#### 321 - Dodavatelé (Suppliers / Accounts Payable)
- **Typ:** Pasivní (závazek)
- **MD:** Úhrada faktury dodavateli (závazek klesá)
- **D:** Přijetí faktury od dodavatele (vzniká závazek)
- **Použití:**
  - **Přijaté faktury S DATEM SPLATNOSTI**
  - Evidujeme KOMU dlužíme a KOLIK
  - ❌ **NEPOUŽÍVAT pro účtenky (okamžitá úhrada)!**

**KRITICKÉ PRAVIDLO:**
- **Má-li doklad datum splatnosti → D: 321**
- **Nemá-li datum splatnosti (účtenka) → D: 211/221/261**

**Příklad:**
```
Přijetí faktury od dodavatele za služby 20 000 Kč, splatnost 14 dní:
MD 518 (Ostatní služby) / D 321 (Dodavatelé)

Úhrada faktury za 14 dní bankovním převodem:
MD 321 (Dodavatelé) / D 221 (Bankovní účet)
```

---

#### 331 - Zaměstnanci (Employees)
- **Typ:** Pasivní
- **MD:** Výplata mezd
- **D:** Zaúčtování mezd (závazek vůči zaměstnancům)

---

#### 342 - Daň z příjmů (Income tax)
- **Typ:** Pasivní
- **MD:** Úhrada daně
- **D:** Vyměření daně

---

#### 343 - Daň z přidané hodnoty (VAT)
- **Typ:** Aktivní/Pasivní
- **MD:** DPH na vstupu (odpočet)
- **D:** DPH na výstupu (povinnost)

---

## TŘÍDA 5 - NÁKLADY

### Podskupiny

| Účty | Název | Popis |
|------|-------|-------|
| **50x** | Spotřebované nákupy | Materiál, energie, zboží |
| **51x** | Služby | Opravy, cestovné, reprezentace |
| **52x** | Osobní náklady | Mzdy, sociální a zdravotní pojištění |
| **53x** | Daně a poplatky | Daň z nemovitosti, silniční daň |
| **54x** | Jiné provozní náklady | Odpisy, rezervy, dary |
| **55x** | Odpisy, prodaný majetek | Odpisy DHM/DNM |
| **56x** | Finanční náklady | Úroky, poplatky, kurzové ztráty |
| **57x** | Rezervy, opravné položky | Tvorba rezerv |
| **58x** | Mimořádné náklady | Škody, manka |
| **59x** | Daň z příjmů | Splatná a odložená daň |

### Detailní rozpis účtů 5xx

#### 501 - Spotřeba materiálu (Material consumption)
- **Použití:**
  - Suroviny, pomocné látky
  - **Pohonné hmoty** (benzín, nafta, oleje)
  - **Kancelářské potřeby** (papíry, tonery, psací potřeby)
  - **Drobný hmotný majetek** (DHM do 40 000 Kč)
  - Obaly, čisticí prostředky
  - Náhradní díly

**Příklad:**
```
Nákup pohonných hmot kartou 3 000 Kč:
MD 501 (Spotřeba materiálu) / D 261 (Peníze na cestě)
```

---

#### 502 - Spotřeba energie (Energy consumption)
- **Použití:**
  - **Elektřina**
  - **Plyn**
  - **Voda a odpadní voda**
  - Topení (teplo)
  - Klimatizace

**Příklad:**
```
Faktura za elektřinu 5 000 Kč, splatnost 14 dní:
MD 502 (Spotřeba energie) / D 321 (Dodavatelé)
```

---

#### 504 - Prodané zboží (Cost of goods sold)
- **Použití:**
  - Pořizovací cena prodaného zboží
  - Pouze pro obchodní činnost (nákup → prodej)
  - Páruje se s účtem 604 (Tržby za zboží)

**Příklad:**
```
Prodej zboží zákazníkovi 10 000 Kč (pořizovací cena 6 000 Kč):
1) MD 311 (Odběratelé) / D 604 (Tržby za zboží) ... 10 000 Kč
2) MD 504 (Prodané zboží) / D 132 (Zboží na skladě) ... 6 000 Kč
```

---

#### 511 - Opravy a udržování (Repairs and maintenance)
- **Použití:**
  - **Opravy strojů a zařízení**
  - Opravy budov a staveb
  - Opravy vozidel (autoservis)
  - Údržba počítačů
  - ❌ **Ne náhradní díly** (to je 501)

**Příklad:**
```
Faktura za opravu auta 8 000 Kč, splatnost 7 dní:
MD 511 (Opravy a udržování) / D 321 (Dodavatelé)
```

---

#### 512 - Cestovné (Travel expenses)
- **Použití:**
  - **Jízdenky** (vlak, autobus, letadlo)
  - **Dálniční známky**
  - **Parkování**
  - **Ubytování** při pracovních cestách
  - **Stravné** (při pracovních cestách zaměstnanců)
  - Taxi, MHD

**DŮLEŽITÉ:**
- ✅ Jídlo zaměstnance na služební cestě = 512
- ❌ Občerstvení klientů = 513 (reprezentace)

**Příklad:**
```
Nákup jízdenky na vlak hotově 300 Kč:
MD 512 (Cestovné) / D 211 (Pokladna)
```

---

#### 513 - Reprezentace (Entertainment / Representation)
- **Použití:**
  - **Občerstvení klientů** (restaurace, catering)
  - **Dárky pro obchodní partnery**
  - Květiny pro klienty
  - Reklamní předměty s logem

**KRITICKÉ PRAVIDLO:**
- ✅ Oběd s klientem = 513 (reprezentace)
- ❌ Oběd zaměstnance na cestě = 512 (cestovné)

**Daňové hledisko:**
- Reprezentace je **daňově neuznatelný náklad** (nelze odečíst z daní)

**Příklad:**
```
Oběd s klientem v restauraci kartou 1 500 Kč:
MD 513 (Reprezentace) / D 261 (Peníze na cestě)
```

---

#### 518 - Ostatní služby (Other services)
- **Použití:**
  - **Nájemné** (kancelář, sklad, stroje)
  - **Telekomunikace** (telefon, internet, mobilní tarify)
  - **Poradenství** (účetní, právní, daňové)
  - **Marketing a reklama** (PPC, billboardy, tisk)
  - **Software a licence** (SaaS, Office 365, Adobe)
  - **Školení a vzdělávání**
  - **IT služby** (hosting, doména, cloud)
  - Úklid, ostraha, pojištění

**Příklad:**
```
Faktura za právní služby 15 000 Kč, splatnost 30 dní:
MD 518 (Ostatní služby) / D 321 (Dodavatelé)
```

---

#### 521 - Mzdové náklady (Wages and salaries)
- **Použití:**
  - Hrubé mzdy zaměstnanců
  - Prémie, bonusy

---

#### 524 - Sociální pojištění (Social security)
- **Použití:**
  - Odvody zaměstnavatele na sociální pojištění (24,8 %)

---

#### 525 - Zdravotní pojištění (Health insurance)
- **Použití:**
  - Odvody zaměstnavatele na zdravotní pojištění (9 %)

---

#### 538 - Ostatní daně a poplatky (Other taxes and fees)
- **Použití:**
  - Silniční daň
  - Daň z nemovitosti
  - Kolky, poplatky úřadům

---

#### 551 - Odpisy dlouhodobého majetku (Depreciation)
- **Použití:**
  - Měsíční/roční odpisy DHM a DNM
  - Stanoveno účetní metodou (lineární, zrychlené)

---

## TŘÍDA 6 - VÝNOSY

### Podskupiny

| Účty | Název | Popis |
|------|-------|-------|
| **60x** | Tržby za vlastní výkony | Tržby z prodeje služeb, výrobků, zboží |
| **61x** | Změny stavů zásob | Aktivace, přírůstky |
| **62x** | Aktivace | Vlastní výroba dlouhodobého majetku |
| **64x** | Jiné provozní výnosy | Prodej majetku, přebytky |
| **66x** | Finanční výnosy | Úroky, dividendy, kurzové zisky |
| **68x** | Mimořádné výnosy | Pojistná plnění, odpis závazků |

### Detailní rozpis účtů 6xx

#### 601 - Tržby za vlastní výrobky (Sales of own products)
- **Použití:**
  - Tržby z prodeje vlastních výrobků (výrobní firmy)

---

#### 602 - Tržby za služby (Sales of services)
- **Použití:**
  - **Tržby z poskytnutých služeb**
  - IT služby, poradenství, marketing
  - Opravy, údržba
  - Pronájem majetku

**Příklad:**
```
Vystavení faktury za IT služby 30 000 Kč:
MD 311 (Odběratelé) / D 602 (Tržby za služby)
```

---

#### 604 - Tržby za zboží (Sales of goods)
- **Použití:**
  - **Tržby z prodeje nakoupeného zboží** (obchodní činnost)
  - Páruje se s účtem 504 (Prodané zboží - náklad)

**Příklad:**
```
Prodej zboží 20 000 Kč (pořizovací cena 12 000 Kč):
1) MD 311 (Odběratelé) / D 604 (Tržby za zboží) ... 20 000 Kč
2) MD 504 (Prodané zboží) / D 132 (Zboží) ... 12 000 Kč
```

---

## PRAVIDLA PODVOJNÉHO ÚČETNICTVÍ

### 1. Základní princip

**Každá účetní operace se zaúčtuje na 2 účty:**
- **MD (MÁ DÁTI)** = DEBET = Co nabývá hodnoty / jaký náklad vzniká
- **D (DAL)** = KREDIT = Co ztrácí hodnoty / odkud se to hradí

**Zlaté pravidlo:** MD = D (částky se musí rovnat!)

---

### 2. Pravidla pro AKTIVNÍ účty (majetek)

- **MD = +** (přírůstek majetku)
- **D = -** (úbytek majetku)

**Příklad:**
```
Příjem 100 000 Kč na bankovní účet:
MD 221 (Bankovní účet) +100 000 / D 311 (Odběratelé) -100 000
```

---

### 3. Pravidla pro PASIVNÍ účty (zdroje)

- **MD = -** (snížení závazku)
- **D = +** (zvýšení závazku)

**Příklad:**
```
Přijetí faktury od dodavatele 50 000 Kč:
MD 518 (Služby) +50 000 / D 321 (Dodavatelé) +50 000
```

---

### 4. Pravidla pro NÁKLADOVÉ účty (třída 5)

- **MD = náklad** (vždy na MD)
- Náklady **snižují zisk**

**Příklad:**
```
Nákup materiálu 10 000 Kč:
MD 501 (Materiál) +10 000 / D 221 (Banka) -10 000
```

---

### 5. Pravidla pro VÝNOSOVÉ účty (třída 6)

- **D = výnos** (vždy na D)
- Výnosy **zvyšují zisk**

**Příklad:**
```
Tržba za služby 20 000 Kč:
MD 311 (Odběratelé) +20 000 / D 602 (Tržby) +20 000
```

---

## TYPICKÉ ÚČETNÍ PŘÍPADY

### 1. PŘIJATÁ FAKTURA s datem splatnosti

**Zásada:**
- **MD:** Nákladový účet podle obsahu (501, 502, 511, 512, 518, atd.)
- **D: 321 (Dodavatelé)** - vzniká závazek
- ❌ **NEPOUŽÍVAT 211/221/261** pokud má datum splatnosti!

**Příklady:**

#### a) Faktura za nájemné
```
Faktura: Nájemné 25 000 Kč, splatnost 14 dní
MD 518 (Ostatní služby) / D 321 (Dodavatelé)

Pozdější úhrada:
MD 321 (Dodavatelé) / D 221 (Bankovní účet)
```

#### b) Faktura za pohonné hmoty
```
Faktura: Benzín 8 000 Kč, splatnost 30 dní
MD 501 (Spotřeba materiálu) / D 321 (Dodavatelé)

Pozdější úhrada kartou:
MD 321 (Dodavatelé) / D 261 (Peníze na cestě)
```

---

### 2. ÚČTENKA nebo OKAMŽITÁ ÚHRADA (bez data splatnosti)

**Zásada:**
- **MD:** Nákladový účet podle obsahu
- **D:** Podle formy úhrady:
  - **Hotově → 211 (Pokladna)**
  - **Kartou → 261 (Peníze na cestě)**
  - **Bankovním převodem → 221 (Bankovní účet)**

**Příklady:**

#### a) Účtenka za pohonné hmoty (kartou)
```
Účtenka: Benzín 2 500 Kč, zaplaceno kartou
MD 501 (Spotřeba materiálu) / D 261 (Peníze na cestě)
```

#### b) Účtenka za kancelářské potřeby (hotově)
```
Účtenka: Papíry 800 Kč, zaplaceno v hotovosti
MD 501 (Spotřeba materiálu) / D 211 (Pokladna)
```

#### c) Účtenka za oběd s klientem (kartou)
```
Účtenka: Restaurace 1 200 Kč, zaplaceno kartou
MD 513 (Reprezentace) / D 261 (Peníze na cestě)
```

---

### 3. VYDANÁ FAKTURA (prodej služeb/zboží)

**Zásada:**
- **MD: 311 (Odběratelé)** - vzniká pohledávka
- **D:** Výnosový účet:
  - Služby → 602
  - Zboží → 604
  - Výrobky → 601

**Příklad:**

#### a) Faktura za IT služby
```
Faktura: IT služby 40 000 Kč, splatnost 14 dní
MD 311 (Odběratelé) / D 602 (Tržby za služby)

Pozdější úhrada od klienta:
MD 221 (Bankovní účet) / D 311 (Odběratelé)
```

---

### 4. PLATBA KARTOU (peníze na cestě)

**Zásada:**
- **Den 1:** Platba kartou → D: 261
- **Den 2 (nebo později):** Připsání na účet → MD: 221 / D: 261

**Příklad:**

#### a) Nákup software licence kartou
```
Den 1 (21.10.2025) - Platba kartou 5 000 Kč:
MD 518 (Ostatní služby) / D 261 (Peníze na cestě)

Den 3 (23.10.2025) - Připsání na bankovní účet:
MD 221 (Bankovní účet) / D 261 (Peníze na cestě)
```

---

### 5. DOBROPIS (oprava chybné faktury)

**Zásada:**
- Stornuje původní účetní případ
- Účtuje se opačně než původní faktura

**Příklad:**

#### a) Dobropis k přijaté faktuře za služby
```
Původní faktura:
MD 518 (Služby) 10 000 / D 321 (Dodavatelé) 10 000

Dobropis (storno):
MD 321 (Dodavatelé) 10 000 / D 518 (Služby) 10 000
```

---

## PŘEDKONTACE V POHODĚ

### Co je předkontace?

**Předkontace** = Číselná řada + Účtování MD/D přednastavené pro daný typ dokladu.

V systému Pohoda se používají tyto **zkratky pro číselné řady**:

| Zkratka | Typ dokladu |
|---------|-------------|
| **3Fv** | Přijatá faktura |
| **1Fv** | Vydaná faktura |
| **UD** | Účtenka / Pokladní doklad |
| **DD** | Daňový doklad |
| **ODD** | Opravný daňový doklad |
| **3ZF** | Zálohová faktura přijatá |
| **1ZF** | Zálohová faktura vydaná |
| **DB** | Dobropis |

---

### Určení předkontace podle typu dokladu

#### 1. PŘIJATÁ FAKTURA
```json
{
  "predkontace": "3Fv",
  "predkontace_md": "501/502/504/511/512/513/518 (podle obsahu)",
  "predkontace_d": "321"
}
```

**Pravidlo MD podle obsahu:**
- Pohonné hmoty → 501
- Elektřina, plyn → 502
- Prodané zboží → 504
- Oprava auta → 511
- Jízdenky, parkování → 512
- Oběd s klientem → 513
- Nájemné, telefon, software → 518

---

#### 2. VYDANÁ FAKTURA
```json
{
  "predkontace": "1Fv",
  "predkontace_md": "311",
  "predkontace_d": "601/602/604"
}
```

**Pravidlo D podle typu tržby:**
- Vlastní výrobky → 601
- Služby → 602
- Zboží → 604

---

#### 3. ÚČTENKA (okamžitá úhrada)
```json
{
  "predkontace": "UD",
  "predkontace_md": "501/502/512/513/518 (podle obsahu)",
  "predkontace_d": "211/221/261 (podle formy úhrady)"
}
```

**Pravidlo D podle formy úhrady:**
- Hotově → 211
- Kartou → 261
- Bankovním převodem → 221

---

#### 4. DOBROPIS
```json
{
  "predkontace": "DB",
  "predkontace_md": "321 (přijatá) / 311 (vydaná)",
  "predkontace_d": "nákladový/výnosový účet"
}
```

---

## KRITICKÁ PRAVIDLA (ČASTO CHYBUJÍ!)

### ❌ CHYBA #1: Peníze na cestě (261) používány špatně

**❌ ŠPATNĚ:**
```
Nákup materiálu hotově → MD 501 / D 261
```

**✅ SPRÁVNĚ:**
```
Nákup materiálu hotově → MD 501 / D 211 (Pokladna)
```

**PRAVIDLO:** 261 POUZE pro platby kartou!

---

### ❌ CHYBA #2: Přijatá faktura účtována jako okamžitá úhrada

**❌ ŠPATNĚ:**
```
Faktura za služby 10 000 Kč, splatnost 14 dní
MD 518 / D 221 (Banka)
```

**✅ SPRÁVNĚ:**
```
Faktura za služby 10 000 Kč, splatnost 14 dní
MD 518 / D 321 (Dodavatelé)

Pozdější úhrada (za 14 dní):
MD 321 / D 221
```

**PRAVIDLO:** Má-li doklad datum splatnosti → D: 321, ne 211/221/261!

---

### ❌ CHYBA #3: Reprezentace vs Cestovné

**❌ ŠPATNĚ:**
```
Jídlo zaměstnance na služební cestě → MD 513 (Reprezentace)
```

**✅ SPRÁVNĚ:**
```
Jídlo zaměstnance na služební cestě → MD 512 (Cestovné)
```

**PRAVIDLO:**
- Jídlo zaměstnance na cestě = 512
- Jídlo s klientem = 513

---

### ❌ CHYBA #4: Pohonné hmoty jako služba

**❌ ŠPATNĚ:**
```
Nákup benzínu → MD 518 (Služby)
```

**✅ SPRÁVNĚ:**
```
Nákup benzínu → MD 501 (Spotřeba materiálu)
```

**PRAVIDLO:** Pohonné hmoty = materiál (501), ne služba!

---

## ROZHODOVACÍ STROM PRO URČENÍ PŘEDKONTACE

```
START
│
├─ Jsme DODAVATEL (prodáváme)?
│  ├─ ANO → predkontace: 1Fv
│  │        MD: 311 (Odběratelé)
│  │        D: 601/602/604 (podle typu tržby)
│  │
│  └─ NE → pokračuj dál
│
├─ Má doklad DATUM SPLATNOSTI?
│  ├─ ANO → predkontace: 3Fv
│  │        MD: 501/502/504/511/512/513/518 (podle obsahu)
│  │        D: 321 (Dodavatelé)
│  │
│  └─ NE → pokračuj dál (okamžitá úhrada)
│
├─ Okamžitá úhrada - Jaká FORMA ÚHRADY?
│  ├─ HOTOVĚ → predkontace: UD
│  │           MD: 501/502/512/513/518 (podle obsahu)
│  │           D: 211 (Pokladna)
│  │
│  ├─ KARTOU → predkontace: UD
│  │           MD: 501/502/512/513/518 (podle obsahu)
│  │           D: 261 (Peníze na cestě)
│  │
│  └─ PŘEVODEM → predkontace: UD
│              MD: 501/502/512/513/518 (podle obsahu)
│              D: 221 (Bankovní účet)
│
└─ Je to DOBROPIS?
   └─ ANO → predkontace: DB
            MD/D: Opačně než původní doklad
```

---

## PŘÍKLADY PODLE OBSAHU NÁKUPU

| Obsah nákupu | MD účet | Název účtu |
|--------------|---------|------------|
| Pohonné hmoty (benzín, nafta) | 501 | Spotřeba materiálu |
| Kancelářské potřeby (papír, toner) | 501 | Spotřeba materiálu |
| Drobný majetek (kalkulačka, židle < 40k) | 501 | Spotřeba materiálu |
| Elektřina, plyn, voda | 502 | Spotřeba energie |
| Prodané zboží (obchod) | 504 | Prodané zboží |
| Oprava auta, stroje | 511 | Opravy a udržování |
| Jízdenky, dálnice, parkování | 512 | Cestovné |
| Oběd s klientem, dárky partnerům | 513 | Reprezentace |
| Nájemné | 518 | Ostatní služby |
| Telefon, internet | 518 | Ostatní služby |
| Software, licence | 518 | Ostatní služby |
| Právní služby, účetnictví | 518 | Ostatní služby |
| Marketing, reklama | 518 | Ostatní služby |
| Auto, stroj (> 40 000 Kč) | 042 | Pořízení DHM |

---

## ZÁVĚR

Tato knowledge base obsahuje **oficiální pravidla českého účetnictví** podle vyhlášky č. 500/2002 Sb.

**Klíčové zásady:**
1. Vždy rozlišuj **fakturu s datem splatnosti** vs **okamžitou úhradu**
2. Účet 321 POUZE pro faktury s datem splatnosti
3. Účet 261 POUZE pro platby kartou
4. MD účet podle **obsahu** nákupu (co je předmětem transakce)
5. D účet podle **formy** úhrady (jak se platí)

---

## AUTOMATICKÉ PÁROVÁNÍ ÚČTŮ

### Peníze na cestě (261) → Bankovní účet (221)

Aplikace **automaticky** vytváří oba účetní záznamy pro platby kartou:

**Scénář:** Nákup pohonných hmot kartou 2 000 Kč dne 21.10.2025

**Den 1 (21.10.2025) - Platba kartou:**
```
MD 501 (Spotřeba materiálu) 2 000 Kč
D  261 (Peníze na cestě)     2 000 Kč
```

**Den 3 (23.10.2025) - Připsání na bankovní účet (+2 dny):**
```
MD 221 (Bankovní účet)  2 000 Kč
D  261 (Peníze na cestě) 2 000 Kč
```

### Výhody automatického párování:

1. ✅ **Nemusíš ručně párovat** - aplikace to udělá za tebe
2. ✅ **Účet 261 se automaticky uzavře** - žádné neuzavřené transakce
3. ✅ **Správné datum připsání** - automaticky +2 dny (standardní bankovní den)
4. ✅ **Pohoda XML export obsahuje oba záznamy** - import jedním kliknutím

### Jak to funguje v praxi:

1. Nahraješ účtenku: "Benzín 2 000 Kč, zaplaceno kartou"
2. AI rozpozná: `forma_uhrady: "karta"` → `predkontace_d: "261"`
3. Export do Pohody vytvoří **2 záznamy**:
   - Záznam 1: Nákup (MD 501 / D 261)
   - Záznam 2: Připsání (MD 221 / D 261) s datem +2 dny
4. Import do Pohody - hotovo!

---

**Aktualizace:** 2025-10-21
