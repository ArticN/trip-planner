#!/usr/bin/env bash
# Gera web/src/admin1/<PAÍS>.json: estados/províncias de cada país (Natural Earth 1:10m, domínio público),
# simplificados, um TopoJSON por país para o "Meu mapa" carregar só o país de quem usa.
# Uso: scripts/admin1.sh  (precisa de rede; usa mapshaper via npx)
set -euo pipefail
OUT="$(cd "$(dirname "$0")/.." && pwd)/web/src/admin1"
TMP="$(mktemp -d)"
curl -sSL -o "$TMP/a.geojson" https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_10m_admin_1_states_provinces.geojson
npx -y mapshaper@0.6.102 -i "$TMP/a.geojson" -filter 'iso_a2 && iso_a2.length==2' \
  -each 'n = name_pt || name || name_en; s = postal || ""' -filter-fields iso_a2,n,s -split iso_a2 -o "$TMP/split/" format=geojson
mkdir -p "$OUT"
for f in "$TMP"/split/*.json; do
  c=$(basename "$f" .json | sed 's/.*-//')
  [[ $c =~ ^[A-Z]{2}$ ]] || continue
  npx -y mapshaper@0.6.102 -i "$f" -simplify 7% keep-shapes -filter-fields n,s -rename-layers states -o "$OUT/$c.json" format=topojson quantization=20000
done
rm -rf "$TMP"
