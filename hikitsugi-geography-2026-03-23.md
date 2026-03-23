# GeoGraphy 引き継ぎメモ｜Day16｜2026-03-23

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
| FX Plugins | `src/plugins/fx/` |
| App ルート | `src/ui/App.tsx` |
| SimpleMixer | `src/plugins/windows/simple-mixer/` |
| Day16進捗ログ | `docs/progress/day16-engine-fx-integration.log.md` |

## 今回のセッションで完了したこと

### engine.ts + layerManager.ts への FX Stack 統合

| ファイル | 変更内容 |
|---|---|
| `src/types/index.ts` | `IFxStack` インターフェース追加、`Layer.fxStack: IFxStack` に変更 |
| `src/core/fxStack.ts` | `implements IFxStack`、`setEnabled`/`getPlugin` を `string` 引数に統一 |
| `src/core/layerManager.ts` | EffectComposer 統合、`setupFx()` 追加、composer 経由レンダリング |
| `src/plugins/fx/index.ts` | クラス named export 追加、`createFxPlugins()` ファクトリ追加 |
| `src/core/engine.ts` | `createFxPlugins()` でレイヤーごと独立インスタンス生成、`setupFx()` 呼び出し |
| `src/ui/App.tsx` | **engine.initialize() 経由に完全移行**（最大の変更点） |
| `tests/core/layerManager.test.ts` | EffectComposer/RenderPass モック追加、setupFx テスト追加 |

## 現在の状態（重要）

- **ブランチ**: `main`
- **最終コミット**: `f7321bc` `docs: Day16 HANDOVER.md + progress log 更新`
- **テスト**: 64 tests グリーン（Day15の63 → +1）
- **tsc**: PASS（型エラーゼロ）
- **ブラウザ確認**: canvas 3枚（position:absolute / zIndex:1,2,3）正常生成・コンソールエラーゼロ・SimpleMixer L1/L2/L3 LIVE 表示確認済み

### engine / layerManager 統合後のアーキテクチャ

```
App.tsx
  └── engine.initialize(container)
        ├── layerManager.initialize(container)
        │     └── 3レイヤー × (WebGLRenderer + EffectComposer + RenderPass + FxStack)
        ├── registerGeometryPlugins() → registry に登録
        ├── layerManager.setPlugin(layer-1, gridWavePlugin)
        ├── layerManager.setMute(layer-2, true)  ← plugin なし
        ├── layerManager.setMute(layer-3, true)  ← plugin なし
        └── layerManager.setupFx(layer-1, createFxPlugins())
              └── FxStack(10 pass) → EffectComposer に addPass

engine.start() → loop()
  └── layerManager.update(delta, beat)
        └── layer-1: plugin.update() → fxStack.update() → composer.render()
```

### FX スタック現状（layer-1 に統合済み・実際に映像に適用中）

```
RenderPass → AfterImage(ON/damp=0.85) → Feedback(OFF) → Bloom(ON/str=0.8)
→ Kaleidoscope(OFF) → Mirror(OFF) → ZoomBlur(OFF) → RGBShift(ON/amount=0.001)
→ CRT(OFF) → Glitch(OFF) → ColorGrading(ON/各1.0)
```

## 発生した問題と解決策

| 問題 | 解決策 |
|---|---|
| `getAllFxPlugins()` シングルトンを複数レイヤーに渡してクラッシュ | `createFxPlugins()` ファクトリで毎回新インスタンスを生成 |
| `types/index.ts` → `core/fxStack.ts` の循環参照 | `IFxStack` インターフェースを `types/` 内に定義して回避 |
| `composer.passes` への splice が EffectComposer 内部状態を破壊 | `setupFx()` に設計変更（`register + fx.create(composer)` を直接呼ぶ） |
| ページがフリーズ | `renderer.autoClear = false` + `renderPass.clear = true` で複数 composer の競合を防止 |
| **App.tsx が engine を一度も呼んでいなかった（全バグの根本原因）** | `engine.initialize(container)` + `engine.start()` に完全移行 |

## 次回やること（Day17候補）

1. **FX コントロール UI**（最優先）
   - ON/OFF トグル: `engine.getLayers()[0].fxStack.setEnabled('bloom', true/false)`
   - パラメーター スライダー: `layer.fxStack.getPlugin('bloom').params.strength.value = 1.5`
   - SimpleMixer への統合 or 専用パネル
   - spec: `docs/spec/fx-stack.spec.md` に UI 仕様追記してから実装

2. **grid-wave の視認性改善**
   - `layerManager.ts` の camera 初期位置を `camera.position.set(0, 8, 12)` + `camera.lookAt(0,0,0)` に変更
   - 現在 `camera.position.z = 5`（正面）なのでグリッドが見えにくい

3. **カメラシステム**
   - `docs/spec/camera-system.spec.md` 未存在 → spec 作成から
   - OrbitControls を engine 経由で管理する設計を検討

## 環境メモ

- **pnpm 必須**（npm / yarn 不可）
- **完了条件は必ず両方**: `pnpm tsc --noEmit` AND `pnpm test --run`
- **ファイル書き込みは `filesystem:write_file`** を使う
- `createFxPlugins()` を使う（シングルトンの `afterImagePlugin` 等を直接渡すと複数レイヤーでクラッシュ）
- `renderer.autoClear = false` + `renderPass.clear = true` のセットは変更しないこと
- `FX_STACK_ORDER` は変更禁止・ColorGrading は必ず最後
