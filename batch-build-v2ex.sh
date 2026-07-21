#!/bin/bash
# Usage: ./batch-build-v2ex.sh 2026-05-01 2026-05-20

start="$1"
end="$2"

if [ -z "$start" ] || [ -z "$end" ]; then
  echo "Usage: $0 START_DATE END_DATE (YYYY-MM-DD)"
  exit 1
fi

cur="$start"
while [[ "$cur" < "$end" || "$cur" == "$end" ]]; do
  echo "$cur"
  cur=$(date -d "$cur + 1 day" "+%Y-%m-%d" 2>/dev/null || date -j -v+1d -f "%Y-%m-%d" "$cur" "+%Y-%m-%d")
done | xargs -P4 -I{} bash -c 'node scripts/build-v2ex-site.js --day {} >> /tmp/v2ex-site-build.log 2>&1'
