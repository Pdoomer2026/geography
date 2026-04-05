# src/core - CLAUDE.md

## 役割

GeoGraphy のエンジンコア。レンダーループ・Plugin Registry・Parameter Store・Command パターン・LayerManager・Program/Preview バスを管理する。

**engine.ts は App.tsx に依存してはいけない・単体で動作できること。**

---

## 完了条件（CDD原則・必須）

```bash
pnpm tsc --noEmit   # 型エラーゼロ
pnpm test --run     # 全テストグリーン
```

**両方通過するまで実装完了としない。`any` による解決は禁止。**

---

## ファイル構成

```
src/core/
├── engine.ts          ← レンダーループ・初期化（App.tsx に依存しない）
├── layerManager.ts    ← レイヤー管理（CSS 合成・Day12実装済み）
├── clock.ts           ← BPM クロック・beat 値
├── registry.ts        ← Plugin Registry（自動登録）
├── parameterStore.ts  ← パラメーター一元管理（Command 経由）
├── commandHistory.ts  ← Command パターン・アンドゥ履歴
├── programBus.ts      ← Program バス（フルサイズ Three.js Scene）
├── previewBus.ts      ← Preview バス（SceneState + 小キャンバス）
└── config.ts          ← 定数（MAX_LAYERS / MAX_UNDO_HISTORY など）
```

---

## Program / Preview バス設計

```
Program バス
  └── フルサイズ Three.js Scene（実際に出力・GPU 使用）

Preview バス
  ├── SceneState JSON（パラメーターのメモのみ・GPU 不使用）
  └── 小キャンバス（320×180・Mixer サムネイル確認用）

切り替え時
  → Preview の SceneState を Program のフルサイズ Scene に適用
  → 旧 Program Scene を dispose()
```

詳細仕様: `docs/spec/program-preview-bus.spec.md`

---

## LayerManager（Day12実装済み）

```typescript
// CSS mixBlendMode で合成（WebGL RenderTarget 不要）
// src/core/layerManager.ts にシングルトンで export
export const layerManager = new LayerManager()

interface Layer {
  id: string                   // 'layer-1' | 'layer-2' | 'layer-3'
  canvas: HTMLCanvasElement
  renderer: THREE.WebGLRenderer
  scene: THREE.Scene
  camera: THREE.PerspectiveCamera
  plugin: GeometryPlugin | null
  opacity: number              // 0.0〜1.0
  blendMode: CSSBlendMode
  mute: boolean
}
```

- `initialize(container)` は engine.initialize() 内で呼ぶ（DOM存在後）
- `position: absolute` + `alpha: true` + `setClearColor(0x000000, 0)` で透明背景
- `pointerEvents: 'none'` でマウスイベントを吸収しない
- MAX_LAYERS = 3（config.ts から参照）

詳細仕様: `docs/spec/layer-system.spec.md`

---

## Command パターン（最重要）

```typescript
interface Command {
  execute(): void
  undo(): void
  description: string
}
```

**Parameter Store は必ず Command 経由で変更すること。直接代入は禁止。**

詳細仕様: `docs/spec/command-pattern.spec.md`

---

## SceneState の型定義

```typescript
interface SceneState {
  layers: LayerState[]
}

interface LayerState {
  geometryId: string
  geometryParams: Record<string, number>
  fxStack: FxState[]
  opacity: number
  blendMode: string
}
```

---

## レンダーループの注意点

- `update()` の中で新規オブジェクトをアロケートしない（GC 負荷）
- `geometry.attributes.position.needsUpdate = true` を忘れずに
- `layerManager.render()` を毎フレーム呼ぶ（mute=falseかつpluginありのレイヤーのみ描画）
- GPU 使用率は `renderer.info.render` から算出

---

## config.ts の定数

```typescript
export const MAX_LAYERS = 3           // レイヤー上限
export const MAX_UNDO_HISTORY = 50    // アンドゥ履歴上限
export const DEFAULT_BPM = 128        // デフォルト BPM
export const LERP_FACTOR = 0.05       // カメラ補間係数
export const ENABLED_PLUGIN_GROUPS = {
  threejs: true,
  pixijs: false,   // v2 で追加
  opentype: false, // v3 で追加
}
```
