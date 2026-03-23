# GeoGraphy 引き継ぎメモ｜Day14｜2026-03-23

## プロジェクト概要
- **アプリ名**: GeoGraphy（Geometry × 地形 × Graph のダブルミーニング）
- **目的**: No-Texture・Plugin駆動・マルチライブラリ対応のブラウザベース映像制作プラットフォーム
- **スタック**: Vite / React 18 / TypeScript / Three.js r160+ / pnpm v10.32+
- **開発スタイル**: SDD × CDD（仕様駆動 × コンパイラ駆動）
  - 実装前に `docs/spec/[機能].spec.md` を必ず読む
  - 完了条件: `pnpm tsc --noEmit` + `pnpm test --run` 両方通過
  - `any` 禁止・型エラーは自律修正
- **GitHub**: https://github.com/Pdoomer2026/geography
- **開発サーバー**: `pnpm dev`（ポート5173〜5176）
- **プロジェクトルート**: `/Users/shinbigan/geography`

---

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
| SimpleMixer | `src/plugins/windows/simple-mixer/SimpleMixer.tsx` |
| FX spec | `docs/spec/fx-stack.spec.md` |
| Day14進捗ログ | `docs/progress/day14-macro-knob-panel.log.md` |

---

## 今回のセッション（Day14）で完了したこと

- `src/ui/MacroKnobPanel.tsx` 新規作成
  - `KnobCell`：SVGアーク（-135°〜+135°）で値を可視化・MIDI CC割り当て済みは赤ドット表示
  - `EditDialog`：ノブ名（最大8文字・大文字）・MIDI CC（0〜127）を編集するモーダル
  - `MacroKnobPanel`：8×4グリッド固定パネル・**閉じるボタンなし**（spec §2 MUST）
  - 200ms ポーリングで `macroKnobManager.getKnobs()` / `getValue()` から状態取得
- `src/ui/App.tsx` 変更
  - `<MacroKnobPanel />` を追加（画面上部中央固定）
  - 既存ロジック変更なし
- `docs/progress/day14-macro-knob-panel.log.md` 作成
- **git push 完了**（コミット: `797ec70..75a08f3`）

---

## 現在の状態（重要）

- **ブランチ**: `main`
- **最後のコミット**: `feat: Day14 - MacroKnobPanel UI (8x4 grid, edit dialog, MIDI CC indicator)`（75a08f3）
- **テスト数**: 50 tests グリーン
- **tsc**: PASS（型エラーゼロ）
- **未コミットファイル**: なし

### 現在のUI レイアウト

```
┌─────────────────────────────────────────┐
│  MACRO KNOBS  32 × MIDI   N ASSIGNED    │  ← 画面上部中央（固定・閉じ不可）
│  [#1][#2][#3][#4][#5][#6][#7][#8]      │
│  [#9]...[#16]                           │
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

---

## 発生した問題と解決策

- **問題なし** — 型エラーゼロ・テスト全通過・ブラウザ目視確認済み
- Cursorターミナルへのフォーカス問題 → ターミナルの黒いエリアをクリックしてからEnter

---

## 次回やること（Day15候補）

### 優先度 HIGH
1. **FXスタック実装**
   - spec確認: `docs/spec/fx-stack.spec.md` を読んでから実装
   - Three.js `EffectComposer` + `postprocessing` パッケージ導入
   - 実装順序（厳守）: AfterImage → Feedback → Bloom → Kaleidoscope → Mirror → ZoomBlur → RGBShift → CRT → Glitch → ColorGrading
   - デフォルトON: Bloom（strength:0.8）・AfterImage（damp:0.85）・RGBShift（amount:0.001）・ColorGrading（saturation/contrast/brightness: 1.0）
   - テスト: `tests/plugins/fx/` に TC-1〜TC-3 を実装

### 優先度 MEDIUM
2. **カメラシステム spec 作成 → 実装**（`docs/spec/camera-system.spec.md` 未存在）
3. **MacroKnob assigns UI**（EditDialogにassigns追加/削除UIを追加）

---

## 環境メモ

- **pnpm 必須**（npm / yarn 不可）
- **完了条件は必ず両方**: `pnpm tsc --noEmit` AND `pnpm test --run`
- `engine.ts` の `threeClock`（THREE.Clock）と `clock`（BPM Clock）は別物・混同厳禁
- `MacroKnobPanel` は `src/ui/` 配下（App.tsx と同階層）
- `macroKnobManager` は `src/core/macroKnob.ts` からシングルトン直接import（engine経由不要）
- Beat Cut ラップアラウンド検出: `prevBeat > 0.8 && beat < 0.2`
- FX スタック順序は変更禁止（spec §2 MUST）
- Claude.ai Projects + MCP（filesystem）で開発フロー確立済み
