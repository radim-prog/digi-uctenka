# 🪟 Návod pro spuštění na Windows serveru (Google Cloud)

## Krok 1: Připojte se k serveru

1. V Google Cloud Console najděte váš virtuální počítač
2. Klikněte na tlačítko **"RDP"** (Remote Desktop Protocol)
3. Stáhne se soubor `.rdp` - otevřete ho
4. Přihlaste se heslem

---

## Krok 2: Nainstalujte Node.js

1. **Na Windows serveru** otevřete prohlížeč (Edge/Chrome)
2. Jděte na: **https://nodejs.org/**
3. Klikněte na **"18 LTS"** (zelené tlačítko)
4. Stáhne se instalátor `.msi`
5. **Dvojklik** na stažený soubor
6. Klikejte **"Next"** až do konce
7. Restartujte server (důležité!)

---

## Krok 3: Zkopírujte aplikaci na server

### Možnost A: Přes Google Drive
1. Na serveru se přihlaste do Google Drive (drive.google.com)
2. Najděte složku `claude code/Aplikace skenování účtenek`
3. Klikněte pravým tlačítkem → **"Stáhnout"**
4. Rozbalte ZIP soubor na Plochu

### Možnost B: Přes Remote Desktop
1. Na vašem Mac: zkopírujte složku
2. V Remote Desktop připojení: vložte (Ctrl+V)

**DŮLEŽITÉ:** Ověřte, že tam je soubor `.env.local` (API klíče)!

---

## Krok 4: Vytvořte spouštěcí skripty

### 4.1 Vytvořte soubor `INSTALL.bat`

1. Na serveru otevřete **Poznámkový blok** (Notepad)
2. Zkopírujte tam tento text:

```batch
@echo off
echo Instaluji aplikaci...
cd /d "%~dp0"
call npm install
echo.
echo Hotovo! Nyní spustte START.bat
pause
```

3. Uložte jako: `INSTALL.bat`
   - Uložit do složky s aplikací
   - Typ souboru: **"Všechny soubory (*.*)"**

### 4.2 Vytvořte soubor `START.bat`

1. Opět Poznámkový blok
2. Zkopírujte tam:

```batch
@echo off
echo Spoustim aplikaci...
cd /d "%~dp0"

echo Builduji aplikaci (prvni spusteni muze trvat par minut)...
call npm run build

echo.
echo Spoustim server...
call npm start

pause
```

3. Uložte jako: `START.bat`
   - Uložit do složky s aplikací
   - Typ souboru: **"Všechny soubory (*.*)"**

---

## Krok 5: Spusťte aplikaci

### První spuštění:

1. **Dvojklik** na `INSTALL.bat`
   - Počkejte, až doběhne (může trvat 2-5 minut)

2. **Dvojklik** na `START.bat`
   - Objeví se černé okno s textem
   - Počkejte na zprávu "ready started server on..."
   - **NENECHÁVEJTE okno zavřené!**

3. Otevřete prohlížeč na: **http://localhost:3000**

✅ Aplikace běží!

---

## Krok 6: Aby aplikace běžela pořád (volitelné)

Pokud chcete, aby aplikace běžela i po zavření okna:

### 6.1 Vytvořte `INSTALL-PM2.bat`

```batch
@echo off
echo Instaluji PM2...
npm install -g pm2
echo Hotovo!
pause
```

### 6.2 Vytvořte `START-BACKGROUND.bat`

```batch
@echo off
echo Spoustim aplikaci na pozadi...
cd /d "%~dp0"
call npm run build
pm2 start npm --name "digi-uctenka" -- start
pm2 save
echo.
echo Aplikace bezi na pozadi!
echo Pro zastaveni: pm2 stop digi-uctenka
pause
```

### 6.3 Spusťte:
1. `INSTALL-PM2.bat` (jen jednou)
2. `START-BACKGROUND.bat`

Aplikace poběží i po zavření okna a restartuje se automaticky při pádu!

---

## Krok 7: Otevřete port ve firewallu (pro přístup zvenčí)

### V Google Cloud Console:

1. Jděte na **"VPC network"** → **"Firewall"**
2. Klikněte **"Create Firewall Rule"**
3. Vyplňte:
   - **Name:** `allow-digi-uctenka`
   - **Targets:** All instances
   - **Source IP ranges:** `0.0.0.0/0`
   - **Protocols and ports:** `tcp:3000`
4. Klikněte **"Create"**

Pak aplikace poběží na: **http://[IP-serveru]:3000**

IP serveru najdete v Google Cloud Console → Compute Engine → VM instances

---

## 🆘 Řešení problémů

### "npm není rozpoznán jako příkaz"
→ Restartujte server po instalaci Node.js

### Aplikace nefunguje
→ Zkontrolujte, že je tam soubor `.env.local`

### Port 3000 je obsazený
→ Změňte v `START.bat`:
```batch
set PORT=8080
call npm start
```

---

## 📝 Souhrn - Co máte ve složce:

```
📁 Aplikace skenování účtenek/
  ├── 📄 INSTALL.bat           ← Instalace (spustit první)
  ├── 📄 START.bat             ← Spuštění aplikace
  ├── 📄 INSTALL-PM2.bat       ← (volitelné) pro běh na pozadí
  ├── 📄 START-BACKGROUND.bat  ← (volitelné) spuštění na pozadí
  ├── 📄 .env.local            ← API klíče (DŮLEŽITÉ!)
  └── ... ostatní soubory aplikace
```

---

## ✅ Hotovo!

Teraz můžete aplikaci spustit **jedním dvojklikem** na `START.bat` - žádný terminál, žádné příkazy!
