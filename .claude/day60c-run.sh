#!/bin/bash
set -e
cd /Users/shinbigan/geography

python3 -c "
import unicodedata, pathlib
for p in ['src/types/index.ts', 'src/core/engine.ts']:
  path = pathlib.Path(p)
  path.write_text(unicodedata.normalize('NFC', path.read_text('utf-8')), 'utf-8')
print('NFC done')
"

pnpm tsc --noEmit
pnpm test --run

git add -A
git commit -m "fix(sceneState): LayerState にカメラ情報を追加（Day60追加）

- LayerState に cameraId / cameraParams フィールドを追加
- getSceneState() でカメラ種別・パラメータ値を保存
- loadSceneState() でカメラを復元（Registry も更新）
- programBus は camera を知らないため engine で直接処理"

git push origin main
