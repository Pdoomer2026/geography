#!/bin/bash
set -e
cd /Users/shinbigan/geography

echo "=== NFC normalize ==="
python3 -c "
import unicodedata, pathlib
for p in [
  'src/core/presetStore.ts',
  'src/core/projectManager.ts',
  'src/core/engine.ts',
  'src/ui/panels/preferences/PreferencesPanel.tsx',
  'src/ui/App.tsx',
  'src/types/index.ts',
  'docs/spec/cc-mapping.md',
]:
  path = pathlib.Path(p)
  path.write_text(unicodedata.normalize('NFC', path.read_text('utf-8')), 'utf-8')
print('NFC done')
"

echo "=== pnpm gen:cc-map ==="
pnpm gen:cc-map

echo "=== tsc ==="
pnpm tsc --noEmit

echo "=== test ==="
pnpm test --run

echo "=== git commit ==="
git add -A
git commit -F .claude/day60-commit.txt
git tag day60
git push origin main --tags

echo "=== Done ==="
