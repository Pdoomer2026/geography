# GeoGraphy 引き継ぎメモ｜Day19完了｜2026-03-23

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
| Day19進捗ログ | `docs/progress/day19-fx-display-and-ui-shortcut.log.md` |

## 今回のセッション（Day19）で完了したこと

### 1. FxControlPanel 小数表示バグ修正

**問題**: RGB Shift の Amount（max=0.05）が `0.00` と表示されていた。
`param.max <= 0.01` の判定では `max=0.05` が条件を満たさず `.toFixed(2)` になっていた。

**修正**: `formatParamValue(value, min, max)` 関数を追加。`range = max - min` の大きさで桁数を判定。

| range | 桁数 | 例 |
|---|---|---|
| < 0.1 | `.toFixed(4)` | 0.0010 |
| < 1.0 | `.toFixed(3)` | 0.050 |
| < 10 | `.toFixed(2)` | 0.80 |
| < 100 | `.toFixed(1)` | 1.0 |
| それ以上 | 整数 | 60 |

### 2. 個別UI表示/非表示ショートカット

**変更**: `uiVisible: boolean` → `uiVisible: { macro: boolean, fx: boolean, mixer: boolean }` に拡張

| キー | 動作 |
|---|---|
| `1` | Macro パネル ON/OFF |
| `2` | FX パネル ON/OFF |
| `3` | Mixer パネル ON/OFF |
| `F` | 全パネル非表示 + フルスクリーン（本番モード） |
| `H` | 全パネル非表示のみ（Hide） |
| `S` | 全パネル表示（Show） |
| ESC | フルスクリーン解除のみ（ブラウザ標準） |

**コミット**: `feat: Day19 - FxControlPanel小数表示バグ修正 + 個別UIショートカット(1/2/3/H/S/Fキー)` (`50ccf0e`)

### 3. 副次的調査（実装なし）

全FX OFFでもモヤがかかる問題を調査。
原因は EffectComposer の RenderPass による自然な出力でバグではなく仕様。
layer-1/layer-2 を個別に JS から非表示にして特定。

## 現在の状態（重要）

- **ブランチ**: `main`
- **最後のコミット**: `feat: Day19 - FxControlPanel小数表示バグ修正 + 個別UIショートカット(1/2/3/H/S/Fキー)` (`50ccf0e`)
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
                                             │  RGB Shift   [ON]    │
   ← grid-wave メッシュ + FX（layer-1） →   │  ColorGrading[ON]    │
   ← starfield 星（layer-2・add合成） →     └──────────────────────┘
┌─────────────────────────────────────────┐
│  SIMPLE MIXER                           │
│  L1:normal/LIVE  L2:add/LIVE  L3:MUTE  │
└─────────────────────────────────────────┘
右下ヒント: 1:Macro 2:FX 3:Mixer | H:Hide S:Show F:全非表示+全画面
```

## キーボードショートカット一覧

| キー | 動作 |
|---|---|
| `1` | Macro パネル ON/OFF |
| `2` | FX パネル ON/OFF |
| `3` | Mixer パネル ON/OFF |
| `F` | 全パネル非表示 + フルスクリーン |
| `H` | 全パネル非表示のみ（Hide） |
| `S` | 全パネル表示（Show） |
| ESC | フルスクリーン解除（ブラウザ標準） |

## 判明した既知の問題・技術的負債

### Light Plugin 管理
- ambient は `enabled: false` で registry に登録されているだけ
- v2 では Light Plugin 専用の管理システムが必要

### registry の種別管理
- registry は geometry/particle/light を区別しない
- v2 では `registry.listByCategory('geometry')` のような API が必要

### FxControlPanel の表示
- 全FX OFFでもEffectComposerのRenderPassによりモヤがかかるが仕様

## 次回やること（Day20候補）

1. **新しい Geometry Plugin 追加**
   - 既存の grid-wave 以外の形状を追加（例: sphere・torus・terrain）
   - `docs/spec/geometry-plugin.spec.md` を確認してから実装

2. **Light Plugin 管理の整備**
   - ambient を grid-wave の scene に正しく追加する仕組みを作る

3. **カメラシステム改善**
   - `docs/spec/camera-system.spec.md` を作成してから実装
   - `camera.position.set(0, 8, 12)` + `lookAt(0, 0, 0)` で斜め上視点

4. **MacroKnob → FX パラメーター割り当て**
   - マクロノブをFXパラメーターにアサインする仕組み

### 次回セッション開始時の確認コマンド

```bash
cd /Users/shinbigan/geography
pnpm tsc --noEmit && pnpm test --run   # 71 tests グリーン確認
pnpm dev                                # ブラウザ目視確認
```

## 次回チャット用スタートプロンプト

```
GeoGraphy Day20を開始します。
まずHANDOVER.mdとCLAUDE.mdを読んで現状を把握してください。
その後、以下の手順で進めてください：
1. `pnpm tsc --noEmit && pnpm test --run` で現状確認（71 tests グリーン確認）
2. `pnpm dev` でブラウザ起動確認
3. HANDOVER.md の「次回やること」セクションを読んでDay20実装を開始してください
開発スタイル：SDD × CDD
- 実装前に必ず対応する `docs/spec/` ファイルを読むこと
- 完了条件は `pnpm tsc --noEmit`（型エラーゼロ）+ `pnpm test --run`（全テストグリーン）両方通過
- anyは使わない・型エラーは自律修正
- 各ステップ完了ごとに `docs/progress/day20-[機能名].log.md` に追記すること
- プランを提示してから実装を開始すること
```
