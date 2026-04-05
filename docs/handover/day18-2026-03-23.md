# GeoGraphy 引き継ぎメモ｜Day18完了｜2026-03-23

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
| 引き継ぎメモ（過去） | `docs/handover/HANDOVER-day{N}.md` |
| 型定義 | `src/types/index.ts` |
| エンジン本体 | `src/core/engine.ts` |
| FxStack コア | `src/core/fxStack.ts` |
| LayerManager | `src/core/layerManager.ts` |
| FX Plugins | `src/plugins/fx/` |
| App ルート | `src/ui/App.tsx` |
| FX コントロール UI | `src/ui/FxControlPanel.tsx` |
| SimpleMixer | `src/plugins/windows/simple-mixer/` |
| Day18進捗ログ | `docs/progress/day18-fx-onoff-bug.log.md` |

## 今回のセッション（Day18）で完了したこと

### 1. FX ON/OFF バグ修正（本質的修正）

**原因**: `fxStack.update()` で `if (!plugin.enabled) continue` していたため、
`plugin.update()` 内の `this.pass.enabled = this.enabled` が実行されず、
Three.js の Pass が有効のまま残り続けていた。

| ファイル | 変更内容 |
|---|---|
| `src/core/fxStack.ts` | `update()` の `if (!enabled) continue` を削除 |
| `tests/core/fxStack.test.ts` | TC-2を新仕様（pass.enabledが毎フレーム反映される）に更新 |

**切り分け方法（慎太郎さんの提案）**: `MAX_LAYERS=1` にして layer-1 単独でFX動作確認 → FX自体は機能していることを確認

### 2. レイヤーアーキテクチャ修正

**原因**: registry に geometry/particle/light が混在しており、ambient（Light Plugin）が
layer-2 に割り当てられ、starfield が layer-3（mute）になっていた。
さらにレイヤーの blendMode が `normal` のため上位レイヤーが下位を覆い隠していた。

| ファイル | 変更内容 |
|---|---|
| `src/core/engine.ts` | レイヤー初期化ロジック整理（geometry→layer-1+FX、starfield→layer-2+add合成、layer-3 mute） |
| `src/plugins/lights/ambient/index.ts` | `enabled: false`（Light Plugin は v1 でレイヤー割り当て対象外） |

**結果レイヤー構成**:
```
layer-1: grid-wave（geometry） + FX（EffectComposer） → blendMode: normal
layer-2: starfield（particle）                        → blendMode: add（加算合成・背景透過）
layer-3: mute
```

**コミット**: `fix: Day18 - FX ON/OFF bug fix + layer architecture fix` (`17a4b9b`)

## 現在の状態（重要）

- **ブランチ**: `main`
- **最後のコミット**: `fix: Day18 - FX ON/OFF bug fix + layer architecture fix` (`17a4b9b`)
- **テスト**: 71 tests グリーン
- **tsc**: PASS（型エラーゼロ）
- **未コミットファイル**: なし

## GeoGraphy UI 現状レイアウト

```
【通常モード】
┌─────────────────────────────────────────┐  ┌──────────────────────┐
│  MACRO KNOBS  32 × MIDI   0 ASSIGNED    │  │  FX CONTROLS    [－] │
│  [#1][#2]...[#32]                       │  │  AfterImage  [ON]    │
└─────────────────────────────────────────┘  │  Bloom       [ON]    │
                                             │  ...                 │
   ← grid-wave メッシュ + FX（layer-1） →   └──────────────────────┘
   ← starfield 星（layer-2・add合成） →
┌─────────────────────────────────────────┐
│  SIMPLE MIXER                           │
│  L1:normal/LIVE  L2:add/LIVE  L3:MUTE  │
└─────────────────────────────────────────┘
```

## engine FX コントロール API 現状

```typescript
engine.getFxPlugins(): FXPlugin[]              // layer-1のFXを返す
engine.setFxEnabled(fxId, enabled): void       // layer-1のFX ON/OFF
engine.setFxParam(fxId, paramKey, value): void // layer-1のFXパラメーター更新
```

## FX スタック現状（layer-1）

```
RenderPass → AfterImage(ON) → Feedback(OFF) → Bloom(ON) → Kaleidoscope(OFF) → Mirror(OFF)
           → ZoomBlur(OFF) → RGBShift(ON) → CRT(OFF) → Glitch(OFF) → ColorGrading(ON)
```

## 判明した既知の問題・技術的負債

### Light Plugin 管理
- ambient は `enabled: false` で registry に登録されているだけ
- v2 では Light Plugin 専用の管理システムが必要
- 現状は grid-wave の scene に ambient が追加されない（アンビエントライトなし）

### registry の種別管理
- registry は geometry/particle/light を区別しない
- `registry.list().filter(enabled)` の順序が登録順に依存（fragile）
- v2 では `registry.listByCategory('geometry')` のような API が必要

### FxControlPanel の小数表示
- RGB Shift の Amount が `0.00` 表示（実際は `0.001`）→ 未修正
- Day18の中で発見したが、レイヤーバグの対応に時間を使い未実施

## 次回やること（Day19候補）

1. **FxControlPanel 小数表示バグ修正**（Day18で発見・未実施）
   - `formatParamValue()` を range 基準の桁数判定に変更
   - `src/ui/FxControlPanel.tsx` の表示ロジック修正

2. **個別UI表示/非表示（フェーズ2）**
   - `uiVisible` を `{ macro: bool, fx: bool, mixer: bool }` に拡張
   - キーボードショートカット：`1`=Macro / `2`=FX / `3`=Mixer 個別トグル

3. **grid-wave カメラ位置改善**
   - `camera.position.set(0, 8, 12)` + `lookAt(0, 0, 0)` で斜め上視点
   - `camera-system.spec.md` を作成してから実装（SDD原則）

4. **Light Plugin 管理の整備**
   - ambient を grid-wave の scene に正しく追加する仕組みを作る

### 次回セッション開始時の確認コマンド

```bash
cd /Users/shinbigan/geography
pnpm tsc --noEmit && pnpm test --run   # 71 tests グリーン確認
pnpm dev                                # ブラウザ目視確認
```

## ハマりポイント（今回の教訓）

- **FX ON/OFFが効かない根本原因**: `fxStack.update()` で enabled=false をスキップすると pass.enabled が true のまま残る
- **レイヤー構成の落とし穴**: registry に light/geometry/particle が混在すると割り当て順が壊れる
- **切り分けには MAX_LAYERS=1 が有効**: layer 単独でFXの動作を確認できる
- **blendMode: add が背景合成のキー**: starfield のような黒背景の粒子は add で透過できる
- **zsh で `!` や `)` を含む git commit -m はシングルクォートで囲む**

## セッション終了時の作業手順（必ず守ること）

```
1. HANDOVER.md を当日完了内容に更新
2. docs/handover/HANDOVER-day{N}.md にコピー保存
3. git add -A && git commit   ← 必ずここで commit
4. 次の実装へ
```

## 次回チャット用スタートプロンプト

```
GeoGraphy Day19を開始します。
まずHANDOVER.mdとCLAUDE.mdを読んで現状を把握してください。
その後、以下の手順で進めてください：
1. `pnpm tsc --noEmit && pnpm test --run` で現状確認（71 tests グリーン確認）
2. `pnpm dev` でブラウザ起動確認
3. HANDOVER.md の「次回やること」セクションを読んでDay19実装を開始してください
開発スタイル：SDD × CDD
- 実装前に必ず対応する `docs/spec/` ファイルを読むこと
- 完了条件は `pnpm tsc --noEmit`（型エラーゼロ）+ `pnpm test --run`（全テストグリーン）両方通過
- anyは使わない・型エラーは自律修正
- 各ステップ完了ごとに `docs/progress/day19-[機能名].log.md` に追記すること
- プランを提示してから実装を開始すること
```
