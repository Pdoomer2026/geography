# GeoGraphy 引き継ぎメモ｜Day25完了｜2026-03-24

## プロジェクト概要
- **アプリ名**: GeoGraphy（Geometry×地形×Graph のダブルミーニング）
- **目的**: No-Texture・Plugin駆動・マルチライブラリ対応のブラウザベース映像制作プラットフォーム
- **スタック**: Vite / React 18 / TypeScript / Three.js r160+ / pnpm v10.32+ / Electron 41
- **開発スタイル**: SDD × CDD（仕様駆動 × コンパイラ駆動）
- **GitHub**: https://github.com/Pdoomer2026/geography
- **開発サーバー（ブラウザ）**: `pnpm dev`（ポート5173）
- **開発サーバー（Electron）**: `pnpm dev:electron`
- **プロジェクトルート**: `/Users/shinbigan/geography`

## 重要ファイルパス

| ファイル | パス |
|---|---|
| CLAUDE.md（全体方針） | `CLAUDE.md` |
| 引き継ぎメモ（最新） | `HANDOVER.md` |
| 型定義 | `src/types/index.ts` |
| geoAPI 型定義 | `src/types/geoAPI.d.ts` |
| エンジン本体 | `src/core/engine.ts` |
| App.tsx | `src/ui/App.tsx` |
| useAutosave hook | `src/ui/useAutosave.ts` |
| Preferences パネル | `src/ui/PreferencesPanel.tsx` |
| Electron メインプロセス | `electron/main.js` |
| Electron preload | `electron/preload.js` |
| Electron spec | `docs/spec/electron.spec.md` |
| Project File spec | `docs/spec/project-file.spec.md` |
| Day25進捗ログ（プロジェクトファイル） | `docs/progress/day25-project-file.log.md` |
| Day25進捗ログ（Geometry反映） | `docs/progress/day25-setup-geometry.log.md` |
| Day25進捗ログ（自動保存） | `docs/progress/day25-autosave.log.md` |

## 今回のセッション（Day25）で完了したこと

### Electron Phase 2: プロジェクトファイルの実装

#### A. `GeoGraphyProject` 型の実装（spec: project-file.spec.md §3）
- `src/types/index.ts` に `GeoGraphyProject` インターフェースと `PROJECT_FILE_VERSION = '1.0.0'` を追加
- `engine.getSceneState()` / `loadSceneState()` / `buildProject()` / `restoreProject()` を追加
- `PreferencesPanel.tsx` の ProjectTab を `GeoGraphyProject` で実際の SceneState を保存・読み込みするよう書き替え
- テスト追加: `tests/core/projectFile.test.ts`（7件）

#### B. Setup タブ: Geometry 選択の反映
- `engine.applyGeometrySetup(selectedIds: string[])` を追加
  - selectedIds[0] → layer-1、[1] → layer-2、[2] → layer-3
  - 超過分レイヤーは `plugin=null` + `mute=true`
- `handleApply()` で `applyGeometrySetup()` + `applyFxSetup()` を両方呼ぶように更新
- `buildProject()` を改善: アクティブレイヤーのみ `setup.geometry` に含める
- `restoreProject()` を改善: `applyGeometrySetup()` → `loadSceneState()` の順で復元
- テスト追加: `tests/core/applyGeometrySetup.test.ts`（7件）

#### C. 自動保存（アプリ終了時 → `autosave.geography`）
- `electron/preload.js`: `autosave` / `getAutosave` / `onRequestAutosave` / `removeAutosaveListener` を追加
- `electron/main.js`: `autosave` / `get-autosave` IPC ハンドラー追加 + `before-quit` フロー実装
  - 3秒タイムアウト付き安全弁
- `src/types/geoAPI.d.ts`: 上記 API の型定義を追加
- `src/ui/useAutosave.ts`: 新規作成（起動時復元 + 終了時保存）
- `src/ui/App.tsx`: `useAutosave()` を追加（1行）

#### 自動保存フロー
```
終了時:
  app.before-quit → event.preventDefault()
  → renderer に 'request-autosave-data' 送信
  → useAutosave: engine.buildProject('autosave') → geoAPI.autosave(json)
  → main.js: fs.writeFile → 'autosave-complete' emit → app.quit()
  ※ 3秒タイムアウトで強制終了（安全弁）

起動時:
  useAutosave mount → geoAPI.getAutosave()
  → autosave.geography が存在すれば engine.restoreProject()
```

## 現在の状態

- **ブランチ**: `main`
- **コミット**: 未コミット（Day25作業分）
- **テスト**: 104 tests グリーン（+14件）
- **tsc**: PASS（型エラーゼロ）

## GeoGraphy アーキテクチャ（Day25時点）

```
pnpm dev:electron
  └─ [0] Vite dev server（http://localhost:5173）
  └─ [1] Electron（wait-on で Vite 起動待ち → ウィンドウ生成）
          ├─ main.js（メインプロセス・IPC・ファイル操作・before-quit自動保存）
          ├─ preload.js（contextBridge → window.geoAPI）
          └─ renderer（React / Three.js・geoAPI 経由でファイル操作）
                └─ useAutosave（起動時復元・終了時保存）
```

## geoAPI（IPC 経由のファイル操作 API）

```typescript
window.geoAPI?.saveFile(path, data)           // ファイル保存
window.geoAPI?.loadFile(path)                 // ファイル読み込み
window.geoAPI?.showSaveDialog()               // 名前を付けて保存ダイアログ
window.geoAPI?.showOpenDialog()               // ファイルを開くダイアログ
window.geoAPI?.getDataDir()                   // ~/Documents/GeoGraphy/ のパス取得
window.geoAPI?.autosave(data)                 // 自動保存（autosave.geography）
window.geoAPI?.getAutosave()                  // 自動保存を読み込む（null if not found）
window.geoAPI?.onRequestAutosave(callback)    // 終了時リクエストの受信
window.geoAPI?.removeAutosaveListener()       // リスナー解除
```

## 自動保存の動作確認手順（未実施）

```bash
# 1. Electron 起動
pnpm dev:electron

# 2. Setup タブで Geometry を変更して APPLY

# 3. ウィンドウを閉じる（Cmd+Q）

# 4. ファイルが生成されたか確認
cat ~/Documents/GeoGraphy/autosave.geography

# 5. 再起動して前回の状態が復元されることを確認
pnpm dev:electron
```

## 次回やること（Day26候補）

1. **自動保存の動作確認**（最優先・手動テスト）
   - `pnpm dev:electron` → Geometry 変更 → Cmd+Q → autosave.geography 確認 → 再起動して復元確認

2. **`pnpm build:electron` で .dmg ビルド確認**
   - ビルドが通るか確認
   - 問題があれば `package.json` の electron-builder 設定を修正

3. **SimpleMixer の Preview バス実装**
   - 現状: Preview バスは SceneState（JSON）のみ保持
   - 今後: 小キャンバス（320×180）にサムネイルを描画
   - spec: `docs/spec/program-preview-bus.spec.md`

4. **GeoGraphy v2 ブレインストーミング**
   - 慎太郎さんが関心を示していた方向性

## 次回セッション開始時の確認コマンド

```bash
cd /Users/shinbigan/geography && pnpm tsc --noEmit && pnpm test --run
```

## 次回チャット用スタートプロンプト

```
GeoGraphy Day26を開始します。
まずHANDOVER.mdとCLAUDE.mdを読んで現状を把握してください。
その後、以下の手順で進めてください：
1. 下記コマンドの結果を貼り付けます（104 tests グリーン確認）
   cd /Users/shinbigan/geography && pnpm tsc --noEmit && pnpm test --run
2. HANDOVER.md の「次回やること」セクションを読んでDay26実装を開始してください
開発スタイル：SDD × CDD
- 実装前に必ず対応する docs/spec/ ファイルを読むこと
- 完了条件は pnpm tsc --noEmit（型エラーゼロ）+ pnpm test --run（全テストグリーン）両方通過
- any は使わない・型エラーは自律修正
- 各ステップ完了ごとに docs/progress/day26-[機能名].log.md に追記すること
- プランを提示してから実装を開始すること
```
