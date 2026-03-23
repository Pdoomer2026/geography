# GeoGraphy 引き継ぎメモ｜Day15完了｜2026-03-23

## プロジェクト概要
- **アプリ名**: GeoGraphy（Geometry×地形×Graph のダブルミーニング）
- **目的**: No-Texture・Plugin駆動・マルチライブラリ対応のブラウザベース映像制作プラットフォーム
- **スタック**: Vite / React 18 / TypeScript / Three.js r160+ / pnpm v10.32+ / shadcn/ui / Framer Motion
- **開発スタイル**: SDD × CDD（仕様駆動 × コンパイラ駆動）
- **GitHub**: https://github.com/Pdoomer2026/geography
- **開発サーバー**: `pnpm dev`（ポート5173〜5176）
- **プロジェクトルート**: `/Users/shinbigan/geography`

## 重要ファイルパス

| ファイル | パス |
|---|---|
| CLAUDE.md（全体方針） | `CLAUDE.md` |
| 引き継ぎメモ | `HANDOVER.md` |
| 型定義 | `src/types/index.ts` |
| エンジン本体 | `src/core/engine.ts` |
| FxStack コア | `src/core/fxStack.ts` ← Day15新規 |
| MacroKnobManager | `src/core/macroKnob.ts` |
| LayerManager | `src/core/layerManager.ts` |
| BPM クロック | `src/core/clock.ts` |
| ParameterStore | `src/core/parameterStore.ts` |
| Plugin Registry | `src/core/registry.ts` |
| Program バス | `src/core/programBus.ts` |
| Preview バス | `src/core/previewBus.ts` |
| FX Plugins | `src/plugins/fx/` ← Day15新規（10個） |
| MacroKnobPanel UI | `src/ui/MacroKnobPanel.tsx` |
| App ルート | `src/ui/App.tsx` |
| SimpleMixer | `src/plugins/windows/simple-mixer/` |
| SDD概要 | `docs/spec/SDD-OVERVIEW.md` |
| Day15進捗ログ | `docs/progress/day15-fx-stack.log.md` |

## 今回のセッション（Day15）で完了したこと

### FX スタック実装（全10個）

- `src/core/fxStack.ts` 新規作成
  - `FxStack` クラス（EffectComposer に 10 pass を固定順で管理）
  - `FX_STACK_ORDER` 定数（変更禁止）
  - `register()` / `getOrdered()` / `buildComposer()` / `update()` / `dispose()` / `setEnabled()` / `getPlugin()`

- `src/plugins/fx/` 配下 10プラグイン新規作成

| Plugin | ID | デフォルト | 実装方式 |
|---|---|---|---|
| AfterImage | `after-image` | ON / damp=0.85 | `AfterimagePass`（jsm） |
| Feedback | `feedback` | OFF / amount=0.7 | ShaderPass + RenderTarget |
| Bloom | `bloom` | ON / str=0.8 | `UnrealBloomPass`（jsm） |
| Kaleidoscope | `kaleidoscope` | OFF / seg=6 | ShaderPass + 極座標GLSL |
| Mirror | `mirror` | OFF | ShaderPass + UV反転GLSL |
| ZoomBlur | `zoom-blur` | OFF | ShaderPass + 放射状GLSL |
| RGBShift | `rgb-shift` | ON / amount=0.001 | ShaderPass + チャンネルGLSL |
| CRT | `crt` | OFF | ShaderPass + スキャンラインGLSL |
| Glitch | `glitch` | OFF | `GlitchPass`（jsm） |
| ColorGrading | `color-grading` | ON / 各1.0 | ShaderPass + 色調整GLSL |

- `src/plugins/fx/index.ts` バレルエクスポート + `getAllFxPlugins()`
- `tests/core/fxStack.test.ts` 新規作成（11テスト・TC-1〜3完全カバー）
- **git push 完了**（コミット: `f1704de`）

### ハマりポイント（次回の参考）
- `create_file` ツールはプロジェクトに書けない → `filesystem:write_file` を使う
- `AfterImagePass` → 正しくは `AfterimagePass`（i が小文字、three 0.170）

## 現在の状態（重要）

- **ブランチ**: `main`
- **最後のコミット**: `feat: Day15 - FX Stack (10 plugins, fxStack core, 61 tests)`（f1704de）
- **テスト**: 61 tests グリーン（Day14の50 → +11）
- **tsc**: PASS（型エラーゼロ）
- **未コミットファイル**: なし

## GeoGraphy UI 現状レイアウト

```
┌─────────────────────────────────────────┐
│  MACRO KNOBS  32 × MIDI   N ASSIGNED    │
│  [#1][FILTER][#3]...[#32]              │
└─────────────────────────────────────────┘

         ← Three.js グリッドウェーブ背景 →

┌─────────────────────────────────────────┐
│  SIMPLE MIXER                           │
│  PROGRAM │ PREVIEW                      │
│  TRANSITION: [Beat Cut ▼]              │
│  PGM ──●──────── PVW                   │
│  [TAP]  128 BPM                         │
└─────────────────────────────────────────┘
```

## FX スタック現状

```
AfterImage(ON) → Feedback(OFF) → Bloom(ON) → Kaleidoscope(OFF) → Mirror(OFF)
→ ZoomBlur(OFF) → RGBShift(ON) → CRT(OFF) → Glitch(OFF) → ColorGrading(ON)
```

**エンジン統合はまだ**（FxStack は実装済み・engine.ts への組み込みは未着手）

## 次回やること（Day16候補）

優先順位は慎太郎さんと相談。

1. **engine.ts 統合**（最優先候補）
   - 各レイヤーに `EffectComposer` を紐付ける
   - `layerManager.update()` で `fxStack.update()` を呼ぶ
   - 実際に映像に FX がかかる状態にする

2. **FX コントロール UI**
   - どの FX を ON/OFF するかのパネル
   - パラメーター調整スライダー
   - SimpleMixer に統合 or 専用パネル

3. **カメラシステム**
   - `docs/spec/camera-system.spec.md` が未存在（spec作成から）

### Day16開始時の確認コマンド

```bash
cd /Users/shinbigan/geography
pnpm tsc --noEmit && pnpm test --run   # 61 tests グリーン確認
pnpm dev                                # ブラウザ目視確認
cat .claude/day16-prompt.md            # Day16プロンプト確認（あれば）
```

## 環境メモ

- **pnpm 必須**（npm / yarn 不可）
- **完了条件は必ず両方**: `pnpm tsc --noEmit` AND `pnpm test --run`
- **ファイル書き込みは `filesystem:write_file`** を使う（`create_file` はプロジェクトに書けない）
- `AfterimagePass` は小文字 i（three 0.170 の正式名）
- `FX_STACK_ORDER` は変更禁止・ColorGrading は必ず最後

## Day16新チャット用スタートプロンプト

```
GeoGraphy Day16を開始します。
まずHANDOVER.mdとCLAUDE.mdを読んで現状を把握してください。
その後、以下の手順で進めてください：
1. `pnpm tsc --noEmit && pnpm test --run` で現状確認（61 tests グリーン確認）
2. `pnpm dev` でブラウザ起動確認
3. `cat .claude/day16-prompt.md` を読んでDay16実装を開始してください
開発スタイル：SDD × CDD
- 実装前に必ず対応する `docs/spec/` ファイルを読むこと
- 完了条件は `pnpm tsc --noEmit`（型エラーゼロ）+ `pnpm test --run`（全テストグリーン）両方通過
- anyは使わない・型エラーは自律修正
- 各ステップ完了ごとに `docs/progress/day16-[機能名].log.md` に追記すること
- プランを提示してから実装を開始すること
```
