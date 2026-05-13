#!/usr/bin/env bash
# exit on error
set -o errexit

echo "--- Instalando dependencias de la raíz ---"
npm install

echo "--- Instalando dependencias del BACKEND ---"
cd BACKEND
npm install

echo "--- Instalando Chrome para WhatsApp (Puppeteer) ---"
# Esto descarga el navegador necesario para que whatsapp-web.js funcione en Render
npx puppeteer browsers install chrome

echo "--- Construcción finalizada ---"
