# GeoGraphy 引き継ぎメモ｜Day17完了｜2026-03-23

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
| 引き継ぎメモ（最新） | `HANDOVER.md` |
| 引き継ぎメモ（過去） | `docs/handover/HANDOVER-day{N}.md` |
| 型定義 | `src/types/index.ts` |
| エンジン本体 | `src/core/engine.ts` |
| FxStack コア | `src/core/fxStack.ts` |
| LayerManager | `src/core/layerManager.ts` |
| MacroKnobManager | `src/core/macroKnob.ts` |
| BPM クロック | `src/core/clock.ts` |
| ParameterStore | `src/core/parameterStore.ts` |
| Plugin Registry | `src/core/registry.ts` |
| Program バス | `src/core/programBus.ts` |
| Preview バス | `src/core/previewBus.ts` |
| FX Plugins | `src/plugins/fx/` |
| App ルート | `src/ui/App.tsx` |
| FX コントロール UI | `src/ui/FxControlPanel.tsx` |
| SimpleMixer | `src/plugins/windows/simple-mixer/` |
| SDD概要 | `docs/spec/SDD-OVERVIEW.md` |
| Day17進捗ログ | `docs/progress/day17-fx-control-ui.log.md` |

## 今回のセッション（Day17）で完了したこと

### 1. FX コントロール UI パネル実装

| ファイル | 変更内容 |
|---|---|
| `docs/spec/fx-control-ui.spec.md` | 新規作成（SDD原則）|
| `src/core/engine.ts` | `getFxPlugins()` / `setFxEnabled()` / `setFxParam()` 追加 |
| `src/ui/FxControlPanel.tsx` | 新規作成（ON/OFF トグル + パラメータースライダー + 折りたたみ）|
| `src/ui/App.tsx` | `FxControlPanel` 追加 |
| `tests/core/engine.test.ts` | 新規作成（7テスト）|

**コミット**: `feat: Day17 - FX control UI panel (71 tests)` (`8b17bd1`)

### 2. Fキー本番モード（全UI非表示）実装

| ファイル | 変更内容 |
|---|---|
| `src/ui/App.tsx` | `uiVisible` state 追加・Fキー/ESCキー/fullscreenchange イベント処理 |

- **F キー** → 全UI非表示 + フルスクリーン（映像のみ表示）
- **ESC キー** → 全UI復帰
- ブラウザのフルスクリーン解除でも UI が自動復帰
- `input` / `select` にフォーカス中はキー操作を無視

**コミット**: `feat: Day17 - fullscreen mode (F key / ESC)` (`4cf7aad`)

### 3. HANDOVER.md アーカイブ体制の整備

- `docs/handover/` ディレクトリ新設
- 毎セッション終了時に `docs/handover/HANDOVER-day{N}.md` にコピー保存
- `HANDOVER.md` の `-prompt.md` ファイル依存を完全排除

**コミット**: `docs: add handover archive system (docs/handover/)` (`3f997a4`)

### 重要な設計決定

1. **`uiVisible` state 1本で管理**: v2 で `{ macro, fx, mixer }` の個別制御に拡張予定
2. **フルスクリーン API + キーイベントの組み合わせ**: `fullscreenchange` イベントでブラウザ標準の ESC にも対応
3. **`setFxParam()` は Command 非経由**: v1 ではリアルタイム性優先。v2 で Command 化予定

## 現在の状態（重要）

- **ブランチ**: `main`
- **最後のコミット**: `feat: Day17 - fullscreen mode (F key / ESC)` (`4cf7aad`)
- **テスト**: 71 tests グリーン（Day16の64 → +7）
- **tsc**: PASS（型エラーゼロ）
- **未コミットファイル**: なし

## GeoGraphy UI 現状レイアウト

```
【通常モード（uiVisible: true）】
┌─────────────────────────────────────────┐  ┌──────────────────────┐
│  MACRO KNOBS  32 × MIDI   0 ASSIGNED    │  │  FX CONTROLS    [－] │
│  [#1][#2]...[#32]                       │  │  AfterImage  [ON]    │
└─────────────────────────────────────────┘  │  Bloom       [ON]    │
                                             │  ...                 │
         ← Starfield パーティクル背景 →      └──────────────────────┘
┌─────────────────────────────────────────┐
│  SIMPLE MIXER  ...                      │  右下: F: 全UI非表示
└─────────────────────────────────────────┘

【本番モード（F キー / uiVisible: false）】
         ← 映像のみ・フルスクリーン →        右下: ESC: UI表示に戻る
```

## engine FX コントロール API 現状

```typescript
engine.getFxPlugins(): FXPlugin[]          // FX_STACK_ORDER順で10件
engine.setFxEnabled(fxId, enabled): void   // ON/OFF切り替え
engine.setFxParam(fxId, paramKey, value)   // パラメーター値更新
```

## FX スタック現状（layer-1）

```
RenderPass → AfterImage(ON) → Feedback(OFF) → Bloom(ON) → Kaleidoscope(OFF) → Mirror(OFF)
           → ZoomBlur(OFF) → RGBShift(ON) → CRT(OFF) → Glitch(OFF) → ColorGrading(ON)
```

## 次回やること（Day18候補）

優先順位は慎太郎さんと相談。

1. **個別UI表示/非表示（フェーズ2）**
   - `uiVisible` を `{ macro: bool, fx: bool, mixer: bool }` に拡張
   - キーボードショートカットで個別制御（例: `1`=Macro / `2`=FX / `3`=Mixer）

2. **grid-wave カメラ位置改善**
   - 現在 `camera.position.z = 5`（正面）→ `camera.position.set(0, 8, 12)`（斜め上）
   - `camera-system.spec.md` を作成してから実装（SDD原則）

3. **FxControlPanel の UX 改善**
   - RGB Shift の Amount が `0.00` 表示（実際は `0.001`）→ 表示精度の修正
   - パネルスクロール対応（全FX表示時に画面からはみ出る可能性）

4. **setFxParam を Command パターン経由に変更**
   - v2 では undo/redo 対応のため Command 化が必要

### 次回セッション開始時の確認コマンド

```bash
cd /Users/shinbigan/geography
pnpm tsc --noEmit && pnpm test --run   # 71 tests グリーン確認
pnpm dev                                # ブラウザ目視確認
```

## セッション終了時の作業手順（必ず守ること）

```
1. HANDOVER.md を当日完了内容に更新
2. docs/handover/HANDOVER-day{N}.md にコピー保存
3. git add -A && git commit   ← 必ずここで commit
4. 次の実装へ
```

## ハマりポイント（次回の参考）

- `HANDOVER.md` のスタートプロンプトに `cat .claude/dayN-prompt.md` を書かない → HANDOVER.md の「次回やること」を直接読む
- シングルトン FX Plugin を複数レイヤーに渡すとクラッシュ → 必ず `createFxPlugins()` を使う
- `types/index.ts` から `core/` を import すると循環参照になりやすい → interface で回避
- `EffectComposer.passes` を直接 splice するとバッファ状態が壊れる → `setupFx()` パターンを維持

## 環境メモ

- **pnpm 必須**（npm / yarn 不可）
- **完了条件は必ず両方**: `pnpm tsc --noEmit` AND `pnpm test --run`
- **ファイル書き込みは `filesystem:write_file`** を使う
- `FX_STACK_ORDER` は変更禁止・ColorGrading は必ず最後
- `renderer.autoClear = false` + `renderPass.clear = true` のセットは変更しないこと

## 次回チャット用スタートプロンプト

```
GeoGraphy Day18を開始します。
まずHANDOVER.mdとCLAUDE.mdを読んで現状を把握してください。
その後、以下の手順で進めてください：
1. `pnpm tsc --noEmit && pnpm test --run` で現状確認（71 tests グリーン確認）
2. `pnpm dev` でブラウザ起動確認
3. HANDOVER.md の「次回やること」セクションを読んでDay18実装を開始してください
開発スタイル：SDD × CDD
- 実装前に必ず対応する `docs/spec/` ファイルを読むこと
- 完了条件は `pnpm tsc --noEmit`（型エラーゼロ）+ `pnpm test --run`（全テストグリーン）両方通過
- anyは使わない・型エラーは自律修正
- 各ステップ完了ごとに `docs/progress/day18-[機能名].log.md` に追記すること
- プランを提示してから実装を開始すること
```
