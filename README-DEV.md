# 🚧 Development Verze - Digi-Účtenka

**⚠️ TOTO JE DEVELOPMENT VERZE - NEPOUŽÍVAT V PRODUKCI!**

---

## 📂 Struktura projektu

```
~/Projects/
├── digi-uctenka-prod/    # ✅ PRODUKČNÍ verze (v2.0) - NEŠAHAT!
└── digi-uctenka-dev/     # 🚧 DEVELOPMENT verze - pro vývoj nových funkcí
```

---

## 🎯 Účel této složky

Tato složka slouží pro vývoj nových funkcí a testování změn **BEZ RIZIKA** ovlivnění produkční verze.

### Co je v PROD verzí (nešahat):
- ✅ v2.0 - Plně funkční Pohoda XML export
- ✅ 100% funkční OCR (Gemini)
- ✅ Všechny testy prošly
- ✅ Branch: `v1.3-working`
- ✅ Tag: `v2.0`

### Co budeme vyvíjet v DEV verzi:
- 🔨 AI generování předkontace
- 🔨 Nové funkce podle požadavků
- 🔨 Experimenty a testy
- 🔨 Branch: `development`

---

## 🔀 Git Workflow

### Development branch
```bash
cd ~/Projects/digi-uctenka-dev
git checkout development
git pull origin development

# ... práce na nových funkcích ...

git add .
git commit -m "🔨 Nová funkce: XYZ"
git push origin development
```

### Když je funkce hotová → merge do PROD
```bash
# 1. V DEV složce - pull latest changes
cd ~/Projects/digi-uctenka-dev
git checkout development
git pull origin development

# 2. V PROD složce - merge z development
cd ~/Projects/digi-uctenka-prod
git checkout v1.3-working
git pull origin v1.3-working
git merge development -m "✨ Nová funkce z development"

# 3. Testuj v PROD složce
npm run dev
# ... testování ...

# 4. Pokud OK → push a vytvoř nový tag
git push origin v1.3-working
git tag v2.1
git push origin v2.1
```

---

## 🚀 Spuštění DEV verze

```bash
cd ~/Projects/digi-uctenka-dev

# Pokud nemáš node_modules
npm install

# Spuštění na jiném portu než PROD
PORT=4001 npm run dev
```

**DEV běží na:** http://localhost:4001
**PROD běží na:** http://localhost:4000

---

## ⚙️ Environment Variables

DEV verze používá **STEJNÉ** `.env.local` jako PROD (sdílené Firebase, Gemini API, atd.).

Pokud chceš oddělit data:
1. Vytvoř nový Firebase projekt pro DEV
2. Zkopíruj `.env.local` z PROD do `.env.local.dev`
3. Nastav: `NODE_ENV=development npm run dev`

---

## 📝 Pravidla

### ✅ DO:
- Experimentuj v DEV verzi jak chceš
- Commituj často
- Testuj nové funkce důkladně před merge do PROD
- Popisuj změny v commit messages

### ❌ DON'T:
- NIKDY neměnit soubory v `digi-uctenka-prod/` přímo
- NIKDY nepushnout nefunkční kód do `v1.3-working` branch
- NIKDY nemazat nebo nepřepisovat tagy (v2.0)
- NIKDY nemigrovat data mezi DEV a PROD databázemi bez zálohy

---

## 🆘 Co dělat když...

### Chci novou funkci vyvíjet:
1. `cd ~/Projects/digi-uctenka-dev`
2. `git checkout development`
3. `git pull origin development`
4. Začni programovat!

### Udělal jsem chybu v DEV a chci se vrátit:
```bash
cd ~/Projects/digi-uctenka-dev
git log --oneline  # najdi commit před chybou
git reset --hard <commit-hash>
```

### Potřebuji změny z PROD v DEV:
```bash
cd ~/Projects/digi-uctenka-dev
git checkout development
git merge v1.3-working
```

### Rozbil jsem DEV úplně:
```bash
# Smaž a zkopíruj znovu z PROD
cd ~/Projects
rm -rf digi-uctenka-dev
cp -R digi-uctenka-prod digi-uctenka-dev
cd digi-uctenka-dev
git checkout development
```

---

## 📊 Status

**Poslední sync z PROD:** 24. října 2025
**Verze PROD:** v2.0
**Verze DEV:** v2.0 + development branch

---

**Vytvořeno:** 24. října 2025
**Autor:** Radim (radim@wikiporadce.cz)
**Powered by:** Claude Code
