# GeoGraphy Day88 引き継ぎ｜2026-05-01

## プロジェクト概要
- **アプリ名**: GeoGraphy（No-Texture Plugin 駆動 VJ アプリ）
- **スタック**: Vite / React 18 / TypeScript / Three.js r160+ / pnpm / Electron / Zod
- **GitHub**: https://github.com/Pdoomer2026/geography
- **ブランチ**: `feature/layer-macro-preset`
- **テスト**: 129 tests グリーン・tsc エラーゼロ
- **タグ**: `day88`（終業時に打つこと）

---

## 始業時に必読

```
docs/architecture/ui-event-flow.md
docs/spec/layer-macro-preset.spec.md
docs/adr/ADR-001-macro-panel-engine-polling.md
```

---

## Day88 で完了したこと

### 1. ADR-001 作成
- `MacroPanel.syncLiveVisual` を geoStore に移行しない理由を記録
- 揮発的表示専用データ・実害なし・移行するとリスクが増える

### 2. fileStore.ts 新設（Application 層）
- Electron: `geoAPI.saveFile / loadFile / listFiles / deleteFile`
- ブラウザ: File System Access API（初回のみ `~/Documents/GeoGraphy/` を選択）
- IndexedDB でディレクトリハンドルを永続化

### 3. geoStore に `fileStoreReady` フラグ追加
- ClipGrid タイミング問題の解決
- App.tsx → `initFileStore()` → `setFileStoreReady()`
- ClipGrid → `fileStoreReady` 監視 → true になってから読み込み

### 4. Preset / Clip 保存先を `~/Documents/GeoGraphy/` に統一
- Day82 の localStorage 設計ミスを修正
- localStorage → fileStore 自動移行実装済み

### 5. 1 Preset = 1 `.geopreset` ファイル構造
- `presets/{name}.geopreset`（Finder から個別に削除・移動・共有可能）
- DAW / CG ソフト準拠

### 6. Electron 側 IPC 追加
- `main.js`: `list-files` / `delete-file`
- `preload.js`: `listFiles` / `deleteFile`
- `geoAPI.d.ts`: 型定義追加

---

## 現在の状態（重要）

- **テスト**: 129 passed ✅
- **tsc**: エラーゼロ ✅
- **ブラウザ確認**:
  - フォルダ選択・Clip グリッド読み込み ✅
  - `.geopreset` 個別ファイル表示・Finder 削除連動 ✅
  - `clip-grid.json` 保存 ✅

---

## アーキテクチャ原則（Day88 確立）

```
保存先:
  Preset → ~/Documents/GeoGraphy/presets/{name}.geopreset
  Clip   → ~/Documents/GeoGraphy/clip-grid.json
  geoAPI → プロジェクトファイルのダイアログのみ
  localStorage → 使用しない

fileStoreReady フロー:
  App.tsx → initFileStore() → migrateFromLocalStorage() → setFileStoreReady()
  ClipGrid → fileStoreReady 監視 → true になったら loadGrid() + loadPresetFolders()
```

---

## 既知の技術負債（保留）

### MacroPanel の engine 直接読み問題
→ ADR-001 で「意図的にスキップ」として記録済み。再検討条件は ADR を参照。

---

## 次回やること（Day89）

1. **Clip + Layer Macro の動作確認**（Day88 本来の目標・未達）
   - Layer Macro にアサインをセット → Clip Save → Load → アサイン復元確認
2. **Sequencer Plugin 設計**（`docs/spec/sequencer.spec.md` 作成）

---

## 重要ファイルパス

| ファイル | パス |
|---|---|
| fileStore | `src/application/adapter/storage/fileStore.ts` |
| layerPresetStore | `src/application/adapter/storage/layerPresetStore.ts` |
| ClipGrid | `src/ui/components/inspector/mixer/ClipGrid.tsx` |
| geoStore | `src/ui/store/geoStore.ts` |
| App.tsx | `src/ui/App.tsx` |
| geoAPI 型定義 | `src/application/schema/geoAPI.d.ts` |
| Electron main | `electron/main.js` |
| Electron preload | `electron/preload.js` |
| ADR-001 | `docs/adr/ADR-001-macro-panel-engine-polling.md` |

---

## 環境メモ

- 開発: `pnpm dev` → `open http://localhost:5173`（HMR / hard reload 不可・必ず新規タブ）
- NFC 正規化: `python3 /Users/shinbigan/nfc_normalize.py`（日本語ファイル書き込み後）
- ブラウザ初回: 「📂 GeoGraphy フォルダを選択」ボタン → `~/Documents/GeoGraphy/` を選択
- Preset: `~/Documents/GeoGraphy/presets/*.geopreset`（Finder から直接操作可能）

---

## 次回スタートプロンプト

```
Day89開始
```
