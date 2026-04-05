# GeoGraphy 引き継ぎメモ｜Day27完了｜2026-03-24

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
| useDraggable フック | `src/ui/useDraggable.ts` |
| useAutosave hook | `src/ui/useAutosave.ts` |
| MacroKnobPanel | `src/ui/MacroKnobPanel.tsx` |
| FxControlPanel | `src/ui/FxControlPanel.tsx` |
| SimpleMixer | `src/plugins/windows/simple-mixer/SimpleMixer.tsx` |
| Electron メインプロセス | `electron/main.js` |
| Electron preload | `electron/preload.js` |

## 今回のセッション（Day27）で完了したこと

### A. `isDev` 修正
- `electron/main.js` 20行目: `process.env.NODE_ENV !== 'production'` → `!app.isPackaged`
- 理由: ビルド済み `.app` かどうかを正確に判定するため

### B. `.dmg` ビルド・動作確認
- `pnpm build:electron` → `dist-electron/GeoGraphy-0.1.0-arm64.dmg` 生成 ✅
- アプリケーションフォルダへインストール・起動確認 ✅
- 自動保存復元・映像表示・プロジェクト保存 すべて動作確認 ✅

### C. UI 設計見直し（メニューバー整備）
- Electron 導入でメニューバーが生まれたため、UI 役割を全面整理
- 合意した設計：
  - `GeoGraphy` メニュー: About / **Preferences...（⌘,）** / Services / Hide / Quit
  - `File` メニュー: **New（⌘N）/ Open...（⌘O）/ Open Recent > / Save（⌘S）/ Save As...（⌘⇧S）** / Close Window
  - ⚙ボタン → **廃止**
  - Preferences パネルの Project タブ → **廃止**（File メニューに移管）

### D. 実装
- `PreferencesPanel.tsx`: Project タブ・ProjectButton・関連定数をすべて削除
- `App.tsx`: ⚙ボタン削除・メニューイベント受信 `useEffect` 追加（menu:new / open / save / save-as / preferences）
- `electron/main.js`: `Menu` 追加・`buildMenu()` 関数・Save/Open/Recent ロジックをメインプロセスに集約
- `electron/preload.js`: `onMenuEvents` / `removeMenuListeners` / `saveProjectFile` を追加
- `src/types/geoAPI.d.ts`: 新メソッドの型定義を追加
- `docs/spec/electron.spec.md`: アーキテクチャ原則（main.js 集約ルール・Output タブ注意）を追記

### E. `.gitignore` 修正
- `dist-electron/` を追加・追跡解除（294ファイルが誤コミットされていたのを修正）

## 現在の状態

- **ブランチ**: `main`
- **タグ**: `day27`
- **コミット**: `1a26d18` chore: dist-electron を .gitignore に追加・追跡解除
- **テスト**: 104 tests グリーン
- **tsc**: PASS（型エラーゼロ）

## アーキテクチャ原則（Day27 確立）

| 処理 | 置き場所 |
|---|---|
| Save / Load / Save As... / Recent | `electron/main.js` |
| ネイティブダイアログ / メニュー定義 | `electron/main.js` |
| engine 操作（restoreProject / buildProject） | レンダラー（React） |
| autosave 送受信（useAutosave.ts） | レンダラー（React） |
| Web MIDI API | レンダラー（React） |
| Output タブの外部出力（将来） | **最初から main.js 経由（IPC）で設計すること** |

## 発生した問題と解決策

- **問題**: zsh が `!app.isPackaged` を history expansion と解釈してエラー → **解決**: filesystem ツールで直接編集
- **問題**: `dist-electron/` が `.gitignore` になく 294 ファイルがコミットされた → **解決**: `git rm -r --cached` + `.gitignore` 追記
- **問題**: `geoAPI.d.ts` に新メソッドの型が未定義で tsc エラー → **解決**: `onMenuEvents` / `removeMenuListeners` / `saveProjectFile` を型定義に追加
- **問題**: `GeoGraphyProject` の `layers` フィールドが存在しない → **解決**: `sceneState.layers` / `setup` / `version` の正しい構造で初期化

## 次回やること（Day28 候補）

1. **SimpleMixer の Preview バス実装**
   - 現状: Preview エリアは SceneState（JSON）のみ保持・テキスト表示のみ
   - 目標: 320×180 の小キャンバスにサムネイルをリアルタイム描画
   - spec: `docs/spec/program-preview-bus.spec.md` を先に読むこと

2. **GeoGraphy v2 ブレインストーミング**
   - 将来方向性の整理（慎太郎さんが関心を示していた）

## 次回セッション開始時の確認コマンド

```bash
cd /Users/shinbigan/geography && pnpm tsc --noEmit && pnpm test --run
```

## 次回チャット用スタートプロンプト

```
GeoGraphy Day28を開始します。
まず HANDOVER.md を読んでください（/Users/shinbigan/geography/HANDOVER.md）

その後、以下の手順で進めてください：
1. 下記コマンドの結果を貼り付けます（104 tests グリーン確認）
   cd /Users/shinbigan/geography && pnpm tsc --noEmit && pnpm test --run
2. HANDOVER.md の「次回やること」セクションを読んで Day28 実装を開始してください

開発スタイル：SDD × CDD
- 実装前に必ず対応する docs/spec/ ファイルを読むこと
- 完了条件は pnpm tsc --noEmit（型エラーゼロ）+ pnpm test --run（全テストグリーン）両方通過
- any は使わない・型エラーは自律修正
- プランを提示・承認を得てから実装を開始すること
- ステップバイステップで進めること（いきなり実装しない）
```
