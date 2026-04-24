# Day60 作業指示（最終版）

## Claude Desktop が実施済みの変更

1. `engine.ts` — setLayerPlugin() に Registry 更新（案Aバグ修正）
2. `src/core/projectManager.ts` — 新規作成
3. `src/core/presetStore.ts` — 新規作成・GeoPreset を GeoGraphyProject の alias に変更
4. `App.tsx` — 薄い鏡に整理
5. `PreferencesPanel.tsx` — UI state + 描画のみ・FX に L1/L2/L3 タブ追加
6. `docs/spec/cc-mapping.md` — 番号体系を5桁に全面刷新（v0.4）
7. `src/types/index.ts` — GeoGraphyProject.setup に camera フィールド追加
8. `engine.ts` — buildProject() でカメラ保存・restoreProject() でカメラ復元
9. `projectManager.ts` — newProject() の空プロジェクトに camera を追加

---

## 作業内容

### 1. NFC 正規化
```
python3 -c "
import unicodedata, pathlib
for p in [
  '/Users/shinbigan/geography/src/core/presetStore.ts',
  '/Users/shinbigan/geography/src/core/projectManager.ts',
  '/Users/shinbigan/geography/src/core/engine.ts',
  '/Users/shinbigan/geography/src/ui/panels/preferences/PreferencesPanel.tsx',
  '/Users/shinbigan/geography/src/ui/App.tsx',
  '/Users/shinbigan/geography/src/types/index.ts',
  '/Users/shinbigan/geography/docs/spec/cc-mapping.md',
]:
  path = pathlib.Path(p)
  path.write_text(unicodedata.normalize('NFC', path.read_text('utf-8')), 'utf-8')
print('NFC done')
"
```

### 2. cc-map.json 再生成
```
pnpm gen:cc-map
```

### 3. tsc + テスト確認
```
pnpm tsc --noEmit 2>&1
pnpm test --run 2>&1
```

エラーがあれば内容を報告してください。

### 4. 動作確認
```
open http://localhost:5173
```
確認項目:
- Preference → FX に L1/L2/L3 タブが表示される
- Preference → APPLY → カメラが正しく反映される
- Geometry Window に新CC番号（CC11101等）が表示される

### 5. コミット
```
cat > /Users/shinbigan/geography/.claude/day60-commit.txt << 'EOF'
refactor: App薄い鏡化 + cc-mapping 5桁体系刷新 + Save/Load camera対応（Day60）

- fix(engine): setLayerPlugin() で Registry を自動更新
- feat(core): projectManager.ts 新設
- feat(core): presetStore.ts 新設・GeoPreset を GeoGraphyProject alias に整理
- refactor(ui): App.tsx を薄い鏡に整理
- fix(types): GeoGraphyProject.setup に camera フィールドを追加
- fix(engine): buildProject() でカメラ保存・restoreProject() でカメラ復元
- fix(ui): PreferencesPanel FX セクションに L1/L2/L3 タブ追加
- fix(spec): cc-mapping.md を5桁番号体系に全面刷新（v0.4）
EOF

git add -A
git commit -F /Users/shinbigan/geography/.claude/day60-commit.txt
git tag day60
git push origin main --tags
```

### 6. 完了報告
tsc エラー数・テスト結果（N tests passed）を報告してください。
