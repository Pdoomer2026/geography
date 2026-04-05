# GeoGraphy 引き継ぎメモ｜Day14完了｜2026-03-23

## プロジェクト概要
- **アプリ名**: GeoGraphy（Geometry×地形×Graph のダブルミーニング）
- **目的**: No-Texture・Plugin駆動・マルチライブラリ対応のブラウザベース映像制作プラットフォーム
- **スタック**: Vite / React 18 / TypeScript / Three.js r160+ / pnpm v10.32+ / shadcn/ui / Framer Motion
- **開発スタイル**: SDD × CDD（仕様駆動 × コンパイラ駆動）
  - 実装前に `docs/spec/[機能].spec.md` を必ず読む
  - 完了条件: `pnpm tsc --noEmit` + `pnpm test --run` 両方通過
  - `any` 禁止・型エラーは自律修正
- **GitHub**: https://github.com/Pdoomer2026/geography
- **開発サーバー**: `pnpm dev`（ポート5173〜5176）
- **プロジェクトルート**: `/Users/shinbigan/geography`

## 重要ファイルパス

| ファイル | パス |
|---|---|
| CLAUDE.md（全体方針） | `CLAUDE.md` |
| 引き継ぎメモ | `HANDOVER.md` |
| 型定義 | `src/types/index.ts` |
| エンジン設定定数 | `src/core/config.ts` |
| エンジン本体 | `src/core/engine.ts` |
| MacroKnobManager | `src/core/macroKnob.ts` |
| LayerManager | `src/core/layerManager.ts` |
| BPM クロック | `src/core/clock.ts` |
| ParameterStore | `src/core/parameterStore.ts` |
| Plugin Registry | `src/core/registry.ts` |
| Program バス | `src/core/programBus.ts` |
| Preview バス | `src/core/previewBus.ts` |
| **MacroKnobPanel UI** | `src/ui/MacroKnobPanel.tsx` ← Day14新規 |
| App ルート | `src/ui/App.tsx` |
| SimpleMixer | `src/plugins/windows/simple-mixer/` |
| SDD概要 | `docs/spec/SDD-OVERVIEW.md` |
| spec一覧 | `docs/spec/` |
| Day14進捗ログ | `docs/progress/day14-macro-knob-panel.log.md` |

## 今回のセッション（Day14）で完了したこと

- `src/ui/MacroKnobPanel.tsx` 新規作成
  - `KnobCell` コンポーネント（SVGアーク値表示・赤ドットMIDIインジケーター）
  - `EditDialog` コンポーネント（名前・MIDI CC編集モーダル、v1簡易版）
  - `MacroKnobPanel` メインコンポーネント（8×4グリッド・閉じるボタンなし）
  - 200ms ポーリングで `macroKnobManager` から状態取得
- `src/ui/App.tsx` 変更
  - `<MacroKnobPanel />` を追加（SimpleMixer の上・画面上部中央固定）
- `docs/progress/day14-macro-knob-panel.log.md` 作成
- **git push 完了**（コミット: `797ec70..75a08f3`）

## 現在の状態（重要）

- **ブランチ**: `main`
- **最後のコミット**: `feat: Day14 - MacroKnobPanel UI (8x4 grid, edit dialog, MIDI CC indicator)`（75a08f3）
- **テスト**: 50 tests グリーン（Day13から変化なし・UIのみ追加）
- **tsc**: PASS（型エラーゼロ）
- **未コミットファイル**: なし

## 発生した問題と解決策

- **問題なし** — 型エラーゼロ・テスト全通過・ブラウザ目視確認済み

## GeoGraphy UI 現状レイアウト

```
┌─────────────────────────────────────────┐
│  MACRO KNOBS  32 × MIDI   N ASSIGNED    │  ← 画面上部中央（固定・閉じ不可）
│  [#1][FILTER][#3][#4][#5][#6][#7][#8]  │
│  [#9][#10]...[#16]                      │
│  [#17]...[#24]                          │
│  [#25]...[#32]                          │
└─────────────────────────────────────────┘

         ← Three.js グリッドウェーブ背景 →

┌─────────────────────────────────────────┐
│  SIMPLE MIXER                           │  ← 画面下部中央（固定・閉じ不可）
│  PROGRAM │ PREVIEW                      │
│  TRANSITION: [Beat Cut ▼]              │
│  PGM ──●──────── PVW                   │
│  [TAP]  128 BPM                         │
└─────────────────────────────────────────┘
```

## 次回やること（Day15候補）

優先順位は慎太郎さんと相談。候補：

1. **FXスタック実装**（spec存在・未着手・最優先候補）
   - spec: `docs/spec/fx-stack.spec.md`
   - 順序: AfterImage → Feedback → Bloom → Kaleidoscope → Mirror → ZoomBlur → RGBShift → CRT → Glitch → ColorGrading
   - Three.js EffectComposer を使用
2. **カメラシステム spec 作成 → 実装**
   - `docs/spec/camera-system.spec.md` が未存在（Claude Desktop で spec 作成から）
3. **MacroKnob assigns UI**（v1.5的な拡張）
   - EditDialog に assigns 追加/削除 UI を実装
   - paramId をドロップダウンで選択できるように

### Day15開始時の確認コマンド

```bash
cd /Users/shinbigan/geography
pnpm tsc --noEmit && pnpm test --run   # 50 tests グリーン確認
pnpm dev                                # ブラウザ目視確認
cat .claude/day15-prompt.md            # Day15プロンプト確認（あれば）
```

## 環境メモ

- **pnpm 必須**（npm / yarn 不可）
- **完了条件は必ず両方**: `pnpm tsc --noEmit` AND `pnpm test --run`
- `engine.ts` の `threeClock`（THREE.Clock）と `clock`（BPM Clock）は別物・混同しないこと
- `macroKnobManager.init(store)` は `engine.initialize()` 内で呼ぶ（DI パターン）
- `normalize()` は `macroKnob.ts` から named export → テストで直接インポート可能
- `MacroKnobPanel` は `src/ui/` 配下（App.tsx と同階層）
- Beat Cut ラップアラウンド検出条件: `prevBeat > 0.8 && beat < 0.2`
- Claude.ai Projects + MCP（filesystem）で Cursor チャットへの貼り付け不要なフロー確立済み

## Day15新チャット用スタートプロンプト

```
GeoGraphy Day15を開始します。
まずHANDOVER.mdとCLAUDE.mdを読んで現状を把握してください。
その後、以下の手順で進めてください：
1. `pnpm tsc --noEmit && pnpm test --run` で現状確認（50 tests グリーン確認）
2. `pnpm dev` でブラウザ起動確認
3. `cat .claude/day15-prompt.md` を読んでDay15実装を開始してください
開発スタイル：SDD × CDD
- 実装前に必ず対応する `docs/spec/` ファイルを読むこと
- 完了条件は `pnpm tsc --noEmit`（型エラーゼロ）+ `pnpm test --run`（全テストグリーン）両方通過
- anyは使わない・型エラーは自律修正
- 各ステップ完了ごとに `docs/progress/day15-[機能名].log.md` に追記すること
- プランを提示してから実装を開始すること
```
