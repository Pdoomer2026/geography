# GeoGraphy 引き継ぎメモ｜Day22完了｜2026-03-23

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
| Preferences Panel spec | `docs/spec/preferences-panel.spec.md` |
| Electron spec | `docs/spec/electron.spec.md` |
| Project File spec | `docs/spec/project-file.spec.md` |
| Plugin Lifecycle spec | `docs/spec/plugin-lifecycle.spec.md` |
| Day22進捗ログ | `docs/progress/day22-spec-and-setup.log.md` |

## 今回のセッション（Day22）で完了したこと

### 1. CLAUDE.md v8 更新
- 開発環境制約セクションを新設
- filesystem MCP が使えれば Claude Desktop 環境と判断できることを明記
- ターミナルコマンド依頼時は必ずコピペ可能なコマンドを渡すルールを追加

### 2. SimpleMixer.tsx PREVIEW バス修正
- `previewBus.mount()` を useEffect 内で呼ぶよう修正
- canvas が未生成なら mount() → append の順で処理

### 3. 壁打ち：大きな設計決定

#### Electron 化を決定
- GeoGraphy は Electron アプリとして配布（.dmg / .exe）
- サーバー不要・ローカルファイルに自由アクセス
- 既存コード（Vite + React + Three.js）はそのまま使える

#### Preferences パネル設計
- 画面左上に固定の ⚙ ボタン
- タブ: Setup / Project / Plugins / Audio / MIDI / Output
- キー `P` で開閉

#### Setup タブ
- 使う Geometry・FX を選択 → [APPLY] で再構築
- 描画が一瞬止まることは許容済み

#### Project タブ（プロジェクトファイル概念）
- `.geography` 拡張子の JSON ファイル
- 内容: setup選択状態 + SceneState + プリセットファイル参照
- 自動保存: 終了時に `~/Documents/GeoGraphy/autosave.geography`

#### プラグイン配布（段階的）
- v1: 手動でフォルダに追加
- v2: ドラッグ＆ドロップでインストール
- v3: アプリ内プラグインストア（1クリック）

### 4. spec ファイル新規作成
- `docs/spec/electron.spec.md`
- `docs/spec/preferences-panel.spec.md`
- `docs/spec/project-file.spec.md`

## 現在の状態（重要）

- **ブランチ**: `main`
- **テスト**: 90 tests グリーン（変化なし）
- **tsc**: PASS（型エラーゼロ）
- **コミット済み**: ✅

## GeoGraphy UI 現状レイアウト

```
【通常モード】
┌──────────────────────────────────────┐  ┌──────────────────────────────┐
│  MACRO KNOBS  32 × MIDI  0 ASSIGNED  │  │  FX CONTROLS  [L1][L2][L3] [－]│
│  [#1][#2]...[#32]                    │  │  AfterImage  [ON]            │
└──────────────────────────────────────┘  │  Bloom       [ON]            │
                                          │  RGB Shift   [ON]            │
   ← 任意の Geometry Plugin × 3 レイヤー→  │  ColorGrading[ON]            │
                                          └──────────────────────────────┘
┌────────────────────────────────────────────────────────────┐
│  SIMPLE MIXER                                               │
│  L1:[Plugin▼][BlendMode▼] α[━━━━━] LIVE                   │
│  L2:[Plugin▼][BlendMode▼] α[━━━━━] LIVE                   │
│  L3:[Plugin▼][BlendMode▼] α[━━━━━] MUTE                   │
└────────────────────────────────────────────────────────────┘
```

## 次回やること（Day23候補）

1. **⚙ Preferences パネル実装**（最優先）
   - App.tsx に ⚙ ボタンを追加（左上固定）
   - PreferencesPanel コンポーネント新規作成
   - タブ切り替え UI（Setup / Project / Plugins / Audio / MIDI / Output）
   - Setup タブ: Geometry・FX のチェックリスト + [APPLY]
   - Project タブ: Save / Load / Save As（v1 は LocalStorage）
   - spec: `docs/spec/preferences-panel.spec.md`

2. **Electron 化**
   - `electron/main.js` / `electron/preload.js` の追加
   - `pnpm add electron electron-builder`
   - spec: `docs/spec/electron.spec.md`

3. **Plugin Lifecycle 実装（FX）**
   - Setup タブの [APPLY] と連動して FX の create/destroy を制御
   - spec: `docs/spec/plugin-lifecycle.spec.md`

## 次回セッション開始時の確認コマンド

※ Claude はターミナル実行不可。コマンド結果を貼り付けてください。

```bash
cd /Users/shinbigan/geography && pnpm tsc --noEmit && pnpm test --run
```

## 次回チャット用スタートプロンプト

```
GeoGraphy Day23を開始します。
まずHANDOVER.mdとCLAUDE.mdを読んで現状を把握してください。
その後、以下の手順で進めてください：
1. `pnpm tsc --noEmit && pnpm test --run` の結果を貼り付けます（90 tests グリーン確認）
2. `pnpm dev` でブラウザ起動確認
3. HANDOVER.md の「次回やること」セクションを読んでDay23実装を開始してください
開発スタイル：SDD × CDD
- 実装前に必ず対応する `docs/spec/` ファイルを読むこと
- 完了条件は `pnpm tsc --noEmit`（型エラーゼロ）+ `pnpm test --run`（全テストグリーン）両方通過
- any は使わない・型エラーは自律修正
- 各ステップ完了ごとに `docs/progress/day23-[機能名].log.md` に追記すること
- プランを提示してから実装を開始すること
```
