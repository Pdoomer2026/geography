#!/bin/bash
set -e
cd /Users/shinbigan/geography

python3 -c "
import unicodedata, pathlib
for p in [
  'src/types/index.ts',
  'src/core/engine.ts',
  'src/core/projectManager.ts',
  'src/core/presetStore.ts',
  'src/ui/panels/preferences/PreferencesPanel.tsx',
]:
  path = pathlib.Path(p)
  path.write_text(unicodedata.normalize('NFC', path.read_text('utf-8')), 'utf-8')
print('NFC done')
"

pnpm tsc --noEmit
pnpm test --run

git add -A
git commit -m "fix: setup.fx をレイヤー別対応 + restoreProject sceneState 完全反映（Day60追加）

- types: GeoGraphyProject.setup.fx を Record<string, string[]> に変更
- engine: buildProject() でレイヤー別 FX を保存
- engine: restoreProject() で sceneState を完全反映（applySceneState 新設）
  - Geometry params / Camera params / FX params+enabled / opacity / blendMode
  - 旧形式（string[]）との後方互換性あり
- projectManager: newProject() の fx をレイヤー別に更新
- presetStore: DEFAULT_PRESETS の fx をレイヤー別に更新
- PreferencesPanel: handleSaveAs/handleLoad の fx をレイヤー別に対応"

git push origin main
