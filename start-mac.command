#!/bin/bash

echo "========================================"
echo "  SPOUSTIM DIGI-UCTENKA"
echo "========================================"
echo ""

# Přejdi do složky se skriptem
cd "$(dirname "$0")"

echo "Spouštím development server..."
echo ""
echo "========================================"
echo "  SERVER BEZI NA http://localhost:3000"
echo "========================================"
echo ""

npm run dev
