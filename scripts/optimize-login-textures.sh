#!/usr/bin/env bash
# Genera texturas livianas para la copa del login (~160KB total).
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SRC="$ROOT/public/models/copa-mundial-cup-world/textures"
OUT="$ROOT/public/models/copa-mundial-cup-world/textures-lq"
mkdir -p "$OUT"
for name in Copa Base_1 Base_2 Letras; do
  sips -Z 512 -s format jpeg -s formatOptions 82 \
    "$SRC/${name}_BaseColor.png" \
    --out "$OUT/${name}_BaseColor.jpg" >/dev/null
done
echo "OK: $(du -sh "$OUT" | cut -f1) en $OUT"
