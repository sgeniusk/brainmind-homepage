#!/bin/bash
# Merge all agent STATUS.json files into src/data/systems.json
# Run before `npm run build` to pick up latest agent statuses

BASE="$(cd "$(dirname "$0")/../../.." && pwd)"
OUT="$(cd "$(dirname "$0")/.." && pwd)/src/data/systems.json"

mkdir -p "$(dirname "$OUT")"

echo "[" > "$OUT"
first=true
for dir in cortex leo nova axon qualitas pulse; do
  FILE="$BASE/$dir/STATUS.json"
  if [ -f "$FILE" ]; then
    if [ "$first" = true ]; then first=false; else echo "," >> "$OUT"; fi
    cat "$FILE" >> "$OUT"
  fi
done
echo "]" >> "$OUT"

echo "✓ systems.json synced ($(date +%Y-%m-%d))"
