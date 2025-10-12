#!/bin/bash

# Skript pro spuštění Digi-Uctenka aplikace

echo "🚀 Spouštím Digi-Uctenka aplikaci..."
echo ""

# Kontrola Dockeru
if ! command -v docker &> /dev/null; then
    echo "❌ Docker není nainstalován!"
    echo "Nainstalujte Docker z: https://www.docker.com/get-started"
    exit 1
fi

# Kontrola .env.local souboru
if [ ! -f .env.local ]; then
    echo "❌ Chybí soubor .env.local!"
    echo "Zkopírujte .env.local.example na .env.local a vyplňte API klíče"
    exit 1
fi

echo "✅ Docker je nainstalován"
echo "✅ Soubor .env.local existuje"
echo ""
echo "📦 Spouštím Docker kontejner..."
echo ""

# Spuštění Docker Compose
docker-compose up -d

echo ""
echo "✅ Aplikace běží!"
echo "🌐 Otevřete prohlížeč na: http://localhost:3000"
echo ""
echo "📝 Užitečné příkazy:"
echo "   docker-compose logs -f    # Zobrazit logy"
echo "   docker-compose stop       # Zastavit aplikaci"
echo "   docker-compose restart    # Restartovat aplikaci"
echo ""
