# Day86 旧 Window 廃止 — Claude Code タスク

## 背景
Claude Desktop 側で以下の変更を実施済み：
- `src/ui/components/common/RangeSlider.tsx` 新規作成（standard-window から昇格）
- GeometryPanel / CameraPanel / FxPanel の RangeSlider import パスを `common/` に修正
- `docs/examples/window-plugin-patterns/` にアーカイブ作成（README 付き）
- App.tsx から旧 Window の import・render を削除
- `GeoWindowMode` 型を `'none'` のみに変更
- PreferencesPanel の `GEO_WINDOW_OPTIONS` を `'none'` のみに変更

## やること

### Step 1: 旧 Window ディレクトリを src から削除

```bash
cd /Users/shinbigan/geography
rm -rf src/ui/components/window/simple-window
rm -rf src/ui/components/window/standard-window
rm -rf src/ui/components/window/simple-dnd-window
rm -rf src/ui/components/window/standard-dnd-window
```

### Step 2: tsc チェック（2回実行）

```bash
cd /Users/shinbigan/geography
pnpm tsc --noEmit
pnpm tsc --noEmit
```

エラーがあれば修正してから次へ。

### Step 3: テスト実行

```bash
cd /Users/shinbigan/geography
pnpm test --run 2>&1 | tee .claude/test-latest.txt
```

### Step 4: NFC 正規化

```bash
python3 /Users/shinbigan/nfc_normalize.py
```

### Step 5: git commit

```bash
cd /Users/shinbigan/geography
git add -A
```

コミットメッセージファイルを作成してから commit：

`.claude/day86-commit.md` に以下を書いて `git commit -F .claude/day86-commit.md`

```
refactor: 旧 Window 廃止 → docs/examples にアーカイブ

- simple/standard/simple-dnd/standard-dnd の4カテゴリを src から削除
- docs/examples/window-plugin-patterns/ にアーカイブ（README 付き）
- RangeSlider を common/ に昇格（Inspector から共通利用）
- GeoWindowMode 型を 'none' のみに簡素化
- App.tsx から旧 Window import・render を完全除去
- PreferencesPanel の Window 選択肢を 'none' のみに整理
```

## 注意事項
- tsc エラーが出た場合はエラー内容を教えてください
- テストが落ちた場合もエラー内容を教えてください
