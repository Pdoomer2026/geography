# GeoGraphy 引き継ぎメモ｜Day26完了｜2026-03-24

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

## 今回のセッション（Day26）で完了したこと

### A. 自動保存の動作確認（手動テスト）
- `pnpm dev:electron` 起動 → Setup タブで Geometry 選択 → APPLY
- Cmd+Q で終了 → `~/Documents/GeoGraphy/autosave.geography` 生成を確認
- 再起動 → Console に `[GeoGraphy] autosave を復元しました: 2026-03-24T05:11:13.381Z` 表示を確認
- 映像（contour + starfield）も正しく復元されることを目視確認
- **全ステップ PASS ✅**

### B. Electron ウィンドウドラッグ移動
- `titleBarStyle: 'hiddenInset'` でネイティブタイトルバーがないため移動不可だった問題を修正
- `App.tsx` に上部 28px の透明ドラッグ領域（`WebkitAppRegion: 'drag'`）を追加
- ⚙ボタンに `WebkitAppRegion: 'no-drag'` を追加してクリックを確保

### C. フローティングパネルのドラッグ移動
- `src/ui/useDraggable.ts` を新規作成（共通フック）
  - `pos` state + `handleMouseDown` を返す
  - ボタン・input 上ではドラッグを起動しない設計
- 3つのパネルに適用：
  - `MacroKnobPanel.tsx`: ヘッダー `MACRO KNOBS` をドラッグハンドルに
  - `FxControlPanel.tsx`: ヘッダー `FX CONTROLS` をドラッグハンドルに
  - `SimpleMixer.tsx`: ヘッダー `SIMPLE MIXER` をドラッグハンドルに
- 初期位置：
  - MacroKnob: `{ x: window.innerWidth / 2 - 200, y: 16 }`（画面上部中央）
  - FxControl: `{ x: window.innerWidth - 300, y: 16 }`（右上）
  - SimpleMixer: `{ x: window.innerWidth / 2 - 260, y: window.innerHeight - 300 }`（下部中央）

### D. ⚙ボタン位置調整
- 赤黄緑ボタンと重なっていた問題を修正
- `top: 8` → `top: 40` に変更（赤黄緑ボタンの下に配置）

## 現在の状態

- **ブランチ**: `main`
- **タグ**: `day26`
- **コミット**: `7f701cf` feat: フローティングパネルドラッグ移動・⚙ボタン位置調整 (Day26)
- **テスト**: 104 tests グリーン
- **tsc**: PASS（型エラーゼロ）

## 発生した問題と解決策

- **問題**: Electron ウィンドウが移動できない → **解決**: `WebkitAppRegion: 'drag'` を上部 28px に設定
- **問題**: ⚙ボタンが赤黄緑ボタンと重なる → **解決**: `top: 40` に下げて回避

## 次回やること（Day27候補）

1. **`pnpm build:electron` で .dmg ビルド確認**
   - ビルドが通るか確認
   - 問題があれば `package.json` の electron-builder 設定を修正

2. **SimpleMixer の Preview バス実装**
   - 現状: Preview バスは SceneState（JSON）のみ保持
   - 今後: 小キャンバス（320×180）にサムネイルを描画
   - spec: `docs/spec/program-preview-bus.spec.md`

3. **GeoGraphy v2 ブレインストーミング**
   - 慎太郎さんが関心を示していた方向性

## 次回セッション開始時の確認コマンド

```bash
cd /Users/shinbigan/geography && pnpm tsc --noEmit && pnpm test --run
```

## 次回チャット用スタートプロンプト

```
GeoGraphy Day27を開始します。
まずHANDOVER.mdとCLAUDE.mdを読んで現状を把握してください。
その後、以下の手順で進めてください：
1. 下記コマンドの結果を貼り付けます（104 tests グリーン確認）
   cd /Users/shinbigan/geography && pnpm tsc --noEmit && pnpm test --run
2. HANDOVER.md の「次回やること」セクションを読んでDay27実装を開始してください
開発スタイル：SDD × CDD
- 実装前に必ず対応する docs/spec/ ファイルを読むこと
- 完了条件は pnpm tsc --noEmit（型エラーゼロ）+ pnpm test --run（全テストグリーン）両方通過
- any は使わない・型エラーは自律修正
- 各ステップ完了ごとに docs/progress/day27-[機能名].log.md に追記すること
- プランを提示・承認を得てから実装を開始すること
```
