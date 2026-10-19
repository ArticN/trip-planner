#!/usr/bin/env bash
# Prepara um workspace de desenvolvimento a partir desta pasta.
# Uso: bash scripts/setup.sh [destino]   (padrão: ~/japan-planner)
# Copia o código (sem node_modules/dist/data), instala dependências e compila.
set -euo pipefail
SRC="$(cd "$(dirname "$0")/.." && pwd)"
DEST="${1:-$HOME/japan-planner}"

node -e 'const [a,b]=process.versions.node.split(".").map(Number); if (a<22||(a===22&&b<13)) { console.error("Precisa de Node >= 22.13 (node:sqlite). Atual: "+process.version); process.exit(1); }'

if [ "$SRC" != "$DEST" ]; then
  mkdir -p "$DEST"
  ( cd "$SRC" && tar --exclude=node_modules --exclude=dist --exclude=data -cf - . ) | ( cd "$DEST" && tar -xf - )
fi
cd "$DEST"
npm ci
npm run build
echo
echo "Pronto em $DEST"
echo "  npm run dev    → API :3000 + Vite com hot reload em http://localhost:5173"
echo "  npm start      → app compilado em http://localhost:3000"
