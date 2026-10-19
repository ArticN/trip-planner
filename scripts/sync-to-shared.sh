#!/usr/bin/env bash
# Copia o código editado no workspace local de volta para a pasta compartilhada do projeto.
# Uso: bash scripts/sync-to-shared.sh [destino]   (padrão: /mnt/project-files/trip-planner)
set -euo pipefail
SRC="$(cd "$(dirname "$0")/.." && pwd)"
DEST="${1:-/mnt/project-files/trip-planner}"
[ "$SRC" = "$DEST" ] && { echo "Origem e destino são a mesma pasta."; exit 0; }
( cd "$SRC" && tar --exclude=node_modules --exclude=dist --exclude=data --exclude=.git -cf - . ) | ( cd "$DEST" && tar -xf - )
echo "Código sincronizado em $DEST"
