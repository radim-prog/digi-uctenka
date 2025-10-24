# 🤖 AI Assistant Instructions - Digi-Účtenka

**⚠️ DŮLEŽITÉ: Přečti si tyto instrukce PŘED začátkem práce na projektu!**

---

## 📂 Struktura projektu

```
~/Projects/
├── digi-uctenka-prod/     # ✅ PRODUKČNÍ verze (v2.0+) - NEŠAHAT!
│   ├── Branch: main
│   ├── Tags: v2.0, v2.1, ...
│   └── Port: 4000
└── digi-uctenka-dev/      # 🚧 DEVELOPMENT verze - pro vývoj
    ├── Branch: development
    └── Port: 4001
```

---

## 🚨 KRITICKÁ PRAVIDLA

### ❌ NIKDY NEMĚNIT:
1. **Soubory v `digi-uctenka-prod/`** - toto je PRODUKČNÍ verze!
2. **Branch `main`** - pouze pro hotové, otestované funkce
3. **Tagy `v2.0`, `v2.1`, ...** - nepřepisovat, nesmazat!
4. **Hlavní soubory**:
   - `lib/pohoda-export.ts` - 100% funkční Pohoda XML export
   - `lib/gemini-ocr.ts` - fungující OCR
   - `lib/types.ts` - validované typy

### ✅ VŠE DĚLEJ V DEV:
- Pracuj POUZE v `~/Projects/digi-uctenka-dev/`
- Branch: `development`
- Všechny experimenty, nové funkce, změny → DEV verze

---

## 🔄 Workflow

### 1. Začátek práce
```bash
cd ~/Projects/digi-uctenka-dev
git checkout development
git pull origin development
PORT=4001 npm run dev
```

### 2. Vývoj nové funkce
```bash
# Pracuj v digi-uctenka-dev/
# Commituj průběžně:
git add .
git commit -m "🔨 Popis změny"
git push origin development
```

### 3. Testování
```bash
# Spusť DEV server na portu 4001
cd ~/Projects/digi-uctenka-dev
PORT=4001 npm run dev

# Otevři: http://localhost:4001
# Otestuj důkladně!
```

### 4. Merge do PROD (pouze když je funkce 100% hotová)
```bash
# 1. Přepni se do PROD
cd ~/Projects/digi-uctenka-prod
git checkout main
git pull origin main

# 2. Merge z development
git merge development -m "✨ Popis nové funkce"

# 3. Testuj na PROD serveru
PORT=4000 npm run dev
# → http://localhost:4000
# → Otestuj VŠECHNO znovu!

# 4. Pokud vše funguje → push a nový tag
git push origin main
git tag v2.X
git push origin v2.X
```

---

## 📝 Commit Pravidla

### Formát:
```
<emoji> <typ>: <popis>

<detailní vysvětlení>
```

### Emoji:
- `🔨` - Nová funkce (development)
- `✨` - Merge do PROD
- `🐛` - Bugfix
- `📝` - Dokumentace
- `🔧` - Konfigurace
- `🎨` - UI/UX změny
- `⚡` - Optimalizace výkonu

### Příklady:
```bash
git commit -m "🔨 Nová funkce: AI generování předkontace"
git commit -m "🐛 Oprava: Pohoda XML export - datum splatnosti"
git commit -m "📝 Aktualizace dokumentace"
```

---

## 🎯 Kontext projektu

### Co funguje (v2.0):
- ✅ **Pohoda XML Export** - 100% funkční, 27 faktur testováno
  - Error 108 (symVar) - vyřešeno
  - Error 603 (accounting) - vyřešeno
  - Error 103 (uzavřené DPH) - vyřešeno
  - Retroaktivní zápis až 3 roky zpětně
- ✅ **Gemini OCR** - Google Gemini 2.5 Flash
- ✅ **Multi-file upload** - až 10 souborů paralelně
- ✅ **Firebase Storage** - 5 GB zdarma
- ✅ **Multi-firma** - více firem/IČO
- ✅ **Dashboard** - fronta + archiv

### Co čeká na implementaci:
- 🔨 AI generování předkontace (UI připraveno)
- 🔨 Hromadná úprava dokladů
- 🔨 Export do jiných formátů (CSV, Excel)
- 🔨 Statistiky a grafy

---

## 📚 Důležité soubory

### Core Logic
```
lib/
├── pohoda-export.ts      # ⚠️ KRITICKÝ - Pohoda XML (v2.0 fungující!)
├── gemini-ocr.ts         # ⚠️ KRITICKÝ - OCR logika
├── types.ts              # TypeScript typy (Doklad, Firma, atd.)
├── validation.ts         # Validace IČO, DIČ, částek
└── firebase.ts           # Firebase config
```

### UI Components
```
app/(dashboard)/
├── page.tsx              # Dashboard (fronta + archiv)
├── nahrat/page.tsx       # Multi-file upload
├── overit/[id]/page.tsx  # Ověřovací formulář
└── firmy/page.tsx        # Správa firem
```

### Documentation
```
.claude-context/          # Kontext z předchozích sessions
├── 2025-10-23-pohoda-xml-complete-fix.md
└── 2025-10-23-dateVATClaim-uzavrene-dph.md

RELEASE_NOTES_v2.0.md     # Changelog v2.0
README-DEV.md             # Development návod (jen v DEV)
PROJEKT_DOKUMENTACE.md    # Kompletní dokumentace
```

---

## ⚠️ Co NESMÍŠ udělat

### 1. Přímé změny v PROD
```bash
# ❌ ŠPATNĚ:
cd ~/Projects/digi-uctenka-prod
# ... měním soubory ...
git add .
git commit -m "změna"
```

### 2. Force push do main
```bash
# ❌ ŠPATNĚ:
git push -f origin main
```

### 3. Mazání/přepisování tagů
```bash
# ❌ ŠPATNĚ:
git tag -d v2.0
git push origin :refs/tags/v2.0
```

### 4. Merge nedokončených funkcí do PROD
```bash
# ❌ ŠPATNĚ:
# Funkce ještě není hotová, ale merguju do PROD
git merge development
```

---

## ✅ Co MÁTE udělat

### 1. Vždy pracuj v DEV
```bash
# ✅ SPRÁVNĚ:
cd ~/Projects/digi-uctenka-dev
git checkout development
# ... změny ...
git commit -m "🔨 Nová funkce"
git push origin development
```

### 2. Testuj před merge
```bash
# ✅ SPRÁVNĚ:
# 1. Testuj v DEV
cd ~/Projects/digi-uctenka-dev
PORT=4001 npm run dev
# ... důkladné testování ...

# 2. Merge do PROD
cd ~/Projects/digi-uctenka-prod
git merge development

# 3. Testuj znovu v PROD
PORT=4000 npm run dev
# ... testuj VŠECHNO znovu ...

# 4. Vytvoř nový tag
git tag v2.X
git push origin v2.X
```

### 3. Commituj často s popisnými zprávami
```bash
# ✅ SPRÁVNĚ:
git commit -m "🔨 Add AI predkontace: initial implementation"
git commit -m "🔨 Add AI predkontace: connect to Gemini API"
git commit -m "🔨 Add AI predkontace: UI integration"
git commit -m "✅ Test AI predkontace: all tests pass"
```

---

## 🆘 Když něco pokazím

### Rozbil jsem DEV
```bash
# Smaž a zkopíruj znovu z PROD
cd ~/Projects
rm -rf digi-uctenka-dev
cp -R digi-uctenka-prod digi-uctenka-dev
cd digi-uctenka-dev
git checkout development
git pull origin development
```

### Potřebuji vrátit commit v DEV
```bash
cd ~/Projects/digi-uctenka-dev
git log --oneline  # najdi commit
git reset --hard <commit-hash>
git push -f origin development  # OK v DEV!
```

### Omylem změnil v PROD
```bash
cd ~/Projects/digi-uctenka-prod
git reset --hard origin/main
# POZOR: Ztratíš všechny lokální změny!
```

---

## 📊 Verze a tagy

### Současný stav:
- **v2.0** - PLNĚ FUNKČNÍ Pohoda XML export (24.10.2025)
- **v1.17** - Oprava dateDue konzistence
- **v1.16** - Sjednocení terminologie (datum_duzp)
- **v1.15** - Retroaktivní zápis faktur (Error 103 fix)

### Další verze:
- **v2.1** - Čeká na první novou funkci z development
- **v2.2** - ...
- **v3.0** - Major update s breaking changes

---

## 🔍 Quick Reference

### Spuštění serverů:
```bash
# PROD (port 4000)
cd ~/Projects/digi-uctenka-prod && PORT=4000 npm run dev

# DEV (port 4001)
cd ~/Projects/digi-uctenka-dev && PORT=4001 npm run dev
```

### Git status:
```bash
# Zjisti na jaké branch jsem
git branch

# Zjisti jestli jsou změny
git status

# Zjisti historii
git log --oneline -10
```

### Vercel deployment:
- URL: https://digi-uctenka.vercel.app
- Auto-deploy z branch: `main`
- Push do `main` → automaticky deployne

---

## 📞 Kontakt

**Správce projektu:** Radim (radim@wikiporadce.cz)
**GitHub:** https://github.com/radim-prog/digi-uctenka
**Vercel:** https://digi-uctenka.vercel.app

---

## ⚡ TL;DR

1. ✅ **Vždy pracuj v `digi-uctenka-dev/`**
2. ✅ **Branch: `development`**
3. ✅ **Port 4001 pro DEV**
4. ❌ **NIKDY neměnit PROD (`digi-uctenka-prod/`)**
5. ❌ **NIKDY force push do `main`**
6. ❌ **NIKDY smazat tagy**
7. ✅ **Testuj PŘED merge do PROD**
8. ✅ **Nový tag při každém merge do PROD**

---

**Poslední aktualizace:** 24. října 2025
**Verze dokumentu:** 1.0
**Pro AI asistenty:** Claude Code, ChatGPT, Copilot, atd.
