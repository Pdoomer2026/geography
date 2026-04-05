# GeoGraphy 引き継ぎメモ｜Day23完了｜2026-03-23

## プロジェクト概要
- **アプリ名**: GeoGraphy（Geometry×地形×Graph のダブルミーニング）
- **目的**: No-Texture・Plugin駆動・マルチライブラリ対応のブラウザベース映像制作プラットフォーム
- **スタック**: Vite / React 18 / TypeScript / Three.js r160+ / pnpm v10.32+ / shadcn/ui / Framer Motion
- **開発スタイル**: SDD × CDD（仕様駆動 × コンパイラ駆動）
- **GitHub**: https://github.com/Pdoomer2026/geography
- **開発サーバー**: `pnpm dev`（ポート5173）
- **プロジェクトルート**: `/Users/shinbigan/geography`

## 重要ファイルパス

| ファイル | パス |
|---|---|
| CLAUDE.md（全体方針） | `CLAUDE.md` |
| 引き継ぎメモ（最新） | `HANDOVER.md` |
| 型定義 | `src/types/index.ts` |
| エンジン本体 | `src/core/engine.ts` |
| FxStack | `src/core/fxStack.ts` |
| LayerManager | `src/core/layerManager.ts` |
| Preferences パネル | `src/ui/PreferencesPanel.tsx` |
| Preferences spec | `docs/spec/preferences-panel.spec.md` |
| Plugin Lifecycle spec | `docs/spec/plugin-lifecycle.spec.md` |
| Electron spec | `docs/spec/electron.spec.md` |
| Project File spec | `docs/spec/project-file.spec.md` |
| Day23進捗ログ | `docs/progress/day23-preferences-panel.log.md` |

## 今回のセッション（Day23）で完了したこと

### 1. Preferences パネル実装（`src/ui/PreferencesPanel.tsx`）
- 画面左上 ⚙ ボタン（常時表示・H キーでも消えない・z-index:300）
- P キーで開閉トグル
- タブ: Setup / Project / Plugins / Audio / MIDI / Output
- **Setup タブ**: Geometry チェックリスト + FX チェックリスト + [APPLY]
- **Project タブ**: Save / Save As / Load（LocalStorage v1）・最近のファイル履歴（最大5件）
- **Plugins / Audio / MIDI / Output**: Coming Soon

### 2. App.tsx 更新
- ⚙ ボタン追加
- P キー・F キー対応
- ヒント表示に `P:Prefs` 追加

### 3. Plugin Lifecycle 実装（spec: plugin-lifecycle.spec.md §6）

**核心**: APPLY 前は全10FXがインスタンス化済み・VRAM確保済みだった。
今回の実装で「チェックされた FX だけインスタンス化・それ以外は destroy() で VRAM 解放」を実現。

変更ファイル:
- `src/types/index.ts`: `IFxStack` に `applySetup(enabledIds, composer)` 追加
- `src/core/fxStack.ts`: `applySetup()` 実装
  - 全プラグイン `destroy()`（VRAM解放）
  - composer.passes から RenderPass だけ残して削除
  - enabledIds のものだけ FX_STACK_ORDER 順で `create()`
- `src/core/layerManager.ts`: `applyFxSetup(enabledIds)` 追加（全レイヤーに適用）
- `src/core/engine.ts`: `applyFxSetup(enabledIds)` 公開
- `src/ui/PreferencesPanel.tsx`: `handleApply` を `engine.applyFxSetup(enabledIds)` に変更

## 現在の状態（重要）

- **ブランチ**: `main`
- **コミット**: `9001256` feat: Preferences パネル実装 + Plugin Lifecycle (applySetup) Day23
- **テスト**: 90 tests グリーン（変化なし）
- **tsc**: PASS（型エラーゼロ）

## GeoGraphy UI 現状レイアウト

```
【通常モード】
┌──────────────────────────────────────┐  ┌──────────────────────────────┐
│  ⚙（左上固定・Preferences 開閉）      │  │  FX CONTROLS  [L1][L2][L3] [－]│
│  MACRO KNOBS  32 × MIDI  0 ASSIGNED  │  │  AfterImage  [ON]            │
│  [#1][#2]...[#32]                    │  │  Bloom       [ON]            │
└──────────────────────────────────────┘  │  RGB Shift   [ON]            │
                                          │  ColorGrading[ON]            │
   ← 任意の Geometry Plugin × 3 レイヤー→  └──────────────────────────────┘
                                          
┌────────────────────────────────────────────────────────────┐
│  SIMPLE MIXER                                               │
│  L1:[Plugin▼][BlendMode▼] α[━━━━━] LIVE                   │
│  L2:[Plugin▼][BlendMode▼] α[━━━━━] LIVE                   │
│  L3:[Plugin▼][BlendMode▼] α[━━━━━] MUTE                   │
└────────────────────────────────────────────────────────────┘
右下ヒント: P:Prefs 1:Macro 2:FX 3:Mixer | H:Hide S:Show F:全非表示+全画面
```

## 次回やること（Day24候補）

1. **Electron 化**（最優先）
   - `electron/main.js` / `electron/preload.js` の追加
   - `pnpm add -D electron electron-builder`
   - Project タブの Save As が本物のファイルダイアログに
   - spec: `docs/spec/electron.spec.md`

2. **git push**
   - `git push origin main`

3. **Setup タブ: Geometry 選択の反映**
   - 現状: Geometry チェックリストは UI のみ（APPLY しても layerPlugin は変わらない）
   - 今後: チェックしたものだけレイヤーに割り当て直す

## 次回セッション開始時の確認コマンド

```bash
cd /Users/shinbigan/geography && pnpm tsc --noEmit && pnpm test --run
```

## 次回チャット用スタートプロンプト

```
GeoGraphy Day24を開始します。
まずHANDOVER.mdとCLAUDE.mdを読んで現状を把握してください。
その後、以下の手順で進めてください：
1. 下記コマンドの結果を貼り付けます（90 tests グリーン確認）
   cd /Users/shinbigan/geography && pnpm tsc --noEmit && pnpm test --run
2. pnpm dev でブラウザ起動確認済みです
3. HANDOVER.md の「次回やること」セクションを読んでDay24実装を開始してください
開発スタイル：SDD × CDD
- 実装前に必ず対応する docs/spec/ ファイルを読むこと
- 完了条件は pnpm tsc --noEmit（型エラーゼロ）+ pnpm test --run（全テストグリーン）両方通過
- any は使わない・型エラーは自律修正
- 各ステップ完了ごとに docs/progress/day24-[機能名].log.md に追記すること
- プランを提示してから実装を開始すること
```
