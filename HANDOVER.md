# GeoGraphy 引き継ぎメモ｜Day16完了｜2026-03-23

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
| SimpleMixer | `src/plugins/windows/simple-mixer/` |
| SDD概要 | `docs/spec/SDD-OVERVIEW.md` |
| Day16進捗ログ | `docs/progress/day16-engine-fx-integration.log.md` |

## 今回のセッション（Day16）で完了したこと

### engine.ts + layerManager.ts への FX Stack 統合

**変更ファイル一覧**

| ファイル | 変更内容 |
|---|---|
| `src/types/index.ts` | `IFxStack` インターフェース追加、`Layer.fxStack: IFxStack`（`fx: FXPlugin[]` から変更） |
| `src/core/fxStack.ts` | `implements IFxStack`、`setEnabled`/`getPlugin` を `string` 引数に統一 |
| `src/core/layerManager.ts` | `EffectComposer` + `RenderPass` 統合、`setupFx()` 追加、composer経由レンダリング、autoClear制御 |
| `src/plugins/fx/index.ts` | クラス named export 追加、`createFxPlugins()` ファクトリ追加 |
| `src/core/engine.ts` | `createFxPlugins()` でレイヤーごと独立インスタンス生成、`setupFx()` 呼び出し |
| `src/ui/App.tsx` | **engine.initialize() 経由に完全移行**（旧: 独自 Three.js コードを直接記述） |
| `tests/core/layerManager.test.ts` | EffectComposer/RenderPass モック追加、setupFx テスト追加 |

### 重要な設計決定

1. **`createFxPlugins()` ファクトリ関数**: レイヤーごとに独立したインスタンスが必要。シングルトン共有はクラッシュの原因
2. **`IFxStack` インターフェース**: `types/index.ts` → `core/fxStack.ts` の循環参照を回避するため types 内に定義
3. **`setupFx(layerId, fxPlugins[])`**: `register + fx.create(composer)` を直接呼ぶ。`passes` 配列を直接操作（splice）すると EffectComposer 内部状態が壊れる
4. **`renderer.autoClear = false` + `renderPass.clear = true`**: 複数 EffectComposer の同一コンテキスト競合を防止
5. **mute レイヤーは FX 構築しない**: GPU 節約のため `setupFx` は mute=false レイヤーのみ

## 現在の状態（重要）

- **ブランチ**: `main`
- **最後のコミット**: `feat: Day16 - engine/layerManager FX Stack integration (64 tests)`
- **テスト**: 64 tests グリーン（Day15の63 → +1）
- **tsc**: PASS（型エラーゼロ）
- **未コミットファイル**: なし

## GeoGraphy UI 現状レイアウト

```
┌─────────────────────────────────────────┐
│  MACRO KNOBS  32 × MIDI   0 ASSIGNED    │
│  [#1][#2]...[#32]                       │
└─────────────────────────────────────────┘

         ← Starfield パーティクル背景 →

┌─────────────────────────────────────────┐
│  SIMPLE MIXER                           │
│  PROGRAM: [L1 normal LIVE][L2][L3]     │
│  PREVIEW: (空)                          │
│  TRANSITION: [Beat Cut ▼]              │
│  PGM ──●──────── PVW                   │
│  [TAP]  128 BPM                         │
└─────────────────────────────────────────┘
```

## engine / layerManager 現状アーキテクチャ

```
App.tsx
  └── engine.initialize(container)
        ├── layerManager.initialize(container)
        │     └── 3レイヤー × (WebGLRenderer + EffectComposer + RenderPass + FxStack)
        ├── registerGeometryPlugins() → registry に登録
        ├── layerManager.setPlugin(layer-1, gridWavePlugin)
        ├── layerManager.setMute(layer-2, true)
        ├── layerManager.setMute(layer-3, true)
        └── layerManager.setupFx(layer-1, createFxPlugins())
              └── FxStack(10) → EffectComposer に addPass

engine.start() → loop()
  └── layerManager.update(delta, beat)
        └── layer-1: plugin.update() → fxStack.update() → composer.render()
```

## FX スタック現状（layer-1 に統合済み）

```
RenderPass → AfterImage(ON) → Feedback(OFF) → Bloom(ON) → Kaleidoscope(OFF) → Mirror(OFF)
           → ZoomBlur(OFF) → RGBShift(ON) → CRT(OFF) → Glitch(OFF) → ColorGrading(ON)
```

**実際に映像に FX がかかる状態になった（Day16 の最大の達成）**

## 次回やること（Day17候補）

優先順位は慎太郎さんと相談。

1. **FX コントロール UI**（最優先候補）
   - どの FX を ON/OFF するかのパネル
   - パラメーター調整スライダー（strength, damp, amount など）
   - SimpleMixer または専用パネルとして実装
   - `engine.getLayers()[0].fxStack.setEnabled(id, bool)` で制御可能

2. **grid-wave の視認性改善**
   - カメラ位置を斜め上からに変更（旧 App.tsx では `camera.position.set(0, 8, 12)` だった）
   - 現在 `camera.position.z = 5`（正面）なのでグリッドが見えにくい
   - `layerManager.ts` の camera 初期化位置を調整

3. **カメラシステム spec 作成 → 実装**
   - `docs/spec/camera-system.spec.md` が未存在（spec 作成から）

### 次回セッション開始時の確認コマンド

```bash
cd /Users/shinbigan/geography
pnpm tsc --noEmit && pnpm test --run   # 64 tests グリーン確認
pnpm dev                                # ブラウザ目視確認
```

## ハマりポイント（次回の参考）

- シングルトン FX Plugin を複数レイヤーに渡すとクラッシュ → 必ず `createFxPlugins()` を使う
- `types/index.ts` から `core/` を import すると循環参照になりやすい → interface で回避
- `EffectComposer.passes` を直接 splice するとバッファ状態が壊れる → `setupFx()` パターンを維持
- **App.tsx が engine を呼んでいるか必ず確認**（Day16 の最大の落とし穴）

## 環境メモ

- **pnpm 必須**（npm / yarn 不可）
- **完了条件は必ず両方**: `pnpm tsc --noEmit` AND `pnpm test --run`
- **ファイル書き込みは `filesystem:write_file`** を使う
- `FX_STACK_ORDER` は変更禁止・ColorGrading は必ず最後
- `renderer.autoClear = false` + `renderPass.clear = true` のセットは変更しないこと

## 次回チャット用スタートプロンプト

```
GeoGraphy Day17を開始します。
まずHANDOVER.mdとCLAUDE.mdを読んで現状を把握してください。
その後、以下の手順で進めてください：
1. `pnpm tsc --noEmit && pnpm test --run` で現状確認（64 tests グリーン確認）
2. `pnpm dev` でブラウザ起動確認
3. HANDOVER.md の「次回やること」セクションを読んでDay17実装を開始してください
開発スタイル：SDD × CDD
- 実装前に必ず対応する `docs/spec/` ファイルを読むこと
- 完了条件は `pnpm tsc --noEmit`（型エラーゼロ）+ `pnpm test --run`（全テストグリーン）両方通過
- anyは使わない・型エラーは自律修正
- 各ステップ完了ごとに `docs/progress/day17-[機能名].log.md` に追記すること
- プランを提示してから実装を開始すること
```
