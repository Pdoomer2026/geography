"""
Day82: electron/main.js から preset 関連コードを削除する
"""
import re
import pathlib

p = pathlib.Path('/Users/shinbigan/geography/electron/main.js')
src = p.read_text('utf-8')

original_len = len(src)

# 1. LAYER_PRESETS_DIR / SCENE_PRESETS_DIR 変数を削除
src = re.sub(r"const LAYER_PRESETS_DIR = join\(PRESETS_DIR, 'layer'\)\n", '', src)
src = re.sub(r"const SCENE_PRESETS_DIR = join\(PRESETS_DIR, 'scene'\)\n", '', src)

# 2. ensureDirectories のリストを簡素化
src = src.replace(
    "for (const dir of [GEO_DIR, PROJECTS_DIR, PRESETS_DIR, LAYER_PRESETS_DIR, SCENE_PRESETS_DIR, RECORDINGS_DIR]) {",
    "for (const dir of [GEO_DIR, PROJECTS_DIR, PRESETS_DIR, RECORDINGS_DIR]) {"
)

# 3. preset IPC ブロック全体を削除（preset:save / preset:list / preset:delete）
#    セクションヘッダーから preset:delete ハンドラー末尾まで
src = re.sub(
    r"// \u2500+ Preset.*?\n\n.*?ipcMain\.handle\('preset:delete'.*?\}\)\n\n",
    '\n',
    src,
    flags=re.DOTALL
)

# 4. 不要な import を削除（readdir, unlink）
src = src.replace(
    "const { readFile, writeFile, mkdir, readdir, unlink } = require('fs/promises')",
    "const { readFile, writeFile, mkdir } = require('fs/promises')"
)

p.write_text(src, 'utf-8')

new_len = len(src)
removed = original_len - new_len
print(f'Done: main.js cleaned ({removed} chars removed)')

# 検証: preset: という文字列が残っていないか確認
remaining = [line.strip() for line in src.splitlines() if "preset:" in line]
if remaining:
    print(f'WARNING: preset: still found in {len(remaining)} lines:')
    for line in remaining:
        print(f'  {line}')
else:
    print('OK: No preset: references remaining')
