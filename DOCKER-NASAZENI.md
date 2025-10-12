# 🐳 Docker Nasazení - Digi-Uctenka

## Co je Docker?
Docker je jako "krabička", do které zabalíme celou aplikaci včetně všeho, co potřebuje k běhu. Tuto krabičku pak můžete vzít a spustit na jakémkoli počítači - vždy bude fungovat stejně.

## 📦 Co je potřeba

### Na VAŠEM počítači (kde připravujete aplikaci):
✅ Nic! Už je to hotové.

### Na CÍLOVÉM počítači (kde chcete aplikaci spustit):
1. **Docker Desktop** - stáhněte a nainstalujte z https://www.docker.com/get-started
2. To je vše!

## 🚀 Jak nasadit aplikaci na nový počítač

### Krok 1: Zkopírujte celou složku
Zkopírujte celou složku `Aplikace skenování účtenek` na cílový počítač.

**DŮLEŽITÉ:** Ujistěte se, že je tam soubor `.env.local` s vašimi API klíči!

### Krok 2: Spusťte aplikaci
Na cílovém počítači otevřete terminál ve složce aplikace a spusťte:

```bash
./start.sh
```

Nebo pokud to nefunguje, použijte přímo Docker Compose:

```bash
docker-compose up -d
```

### Krok 3: Otevřete aplikaci
Otevřete prohlížeč a jděte na: **http://localhost:3000**

🎉 **Hotovo!** Aplikace běží!

## 📝 Užitečné příkazy

```bash
# Zobrazit logy aplikace
docker-compose logs -f

# Zastavit aplikaci
docker-compose stop

# Spustit znovu
docker-compose start

# Restartovat aplikaci
docker-compose restart

# Smazat kontejner (před novou verzí)
docker-compose down
```

## 🔄 Aktualizace na novou verzi

Když budete chtít nasadit novou verzi aplikace:

1. Zkopírujte nové soubory na cílový počítač
2. Spusťte:
```bash
docker-compose down
docker-compose up -d --build
```

## ⚙️ Konfigurace

### Změna portu
Pokud chcete aplikaci na jiném portu než 3000, upravte v souboru `docker-compose.yml`:

```yaml
ports:
  - "8080:3000"  # Aplikace poběží na portu 8080
```

### Environment proměnné
Všechny API klíče a nastavení jsou v souboru `.env.local`.
Tento soubor MUSÍ být na cílovém počítači!

## 🆘 Řešení problémů

### Aplikace nefunguje
```bash
# Zkontrolujte logy
docker-compose logs

# Restartujte kontejner
docker-compose restart
```

### Port 3000 je obsazený
```bash
# Zjistěte, co běží na portu 3000
lsof -i :3000

# Nebo změňte port v docker-compose.yml
```

### Docker daemon není spuštěný
- Spusťte Docker Desktop aplikaci
- Počkejte, až se Docker nastartuje (ikona v menu baru)

## 💰 Náklady

Docker je **zdarma** pro běžné použití.

Aplikace běží na vašem počítači nebo serveru, takže platíte jen za:
- Server/VPS (pokud ho používáte) - cca 5-10 EUR/měsíc
- Firebase/Gemini API - podle použití (viz README.md)

## 🎯 Výhody Docker řešení

✅ Funguje všude stejně (Mac, Windows, Linux)
✅ Jedna příkazová řádka pro spuštění
✅ Žádné instalace Node.js, npm, atd.
✅ Snadná aktualizace
✅ Izolované prostředí
✅ Automatický restart při pádu

## 📚 Další informace

- [Docker dokumentace](https://docs.docker.com/)
- [Docker Compose dokumentace](https://docs.docker.com/compose/)
