# src/core - CLAUDE.md

## 役割

GeoGraphy のエンジンコア。レンダーループ・Plugin Registry・Parameter Store・Command パターン・Layer Manager・Program/Preview バスを管理する。

**engine.ts は App.tsx に依存してはいけない・単体で動作できること。**

---

## ファイル構成

```
src/core/
├── engine.ts          ← レンダーループ・初期化（App.tsx に依存しない）
├── scene.ts           ← Three.js Scene 管理
├── camera.ts          ← カメラシステム（4モード + AUTO）
├── clock.ts           ← BPM クロック・beat 値
├── registry.ts        ← Plugin Registry（自動登録）
├── parameterStore.ts  ← パラメーター一元管理（Command 経由）
├── commandHistory.ts  ← Command パターン・アンドゥ履歴
├── layerManager.ts    ← レイヤー管理（CSS 合成）
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
  → 小キャンバスは次の映像の準備に再利用
```

**Preview バスは SceneState（JSON）のみ保持する。Three.js Scene は Program のみ。**

### SceneState の型定義

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

## Command パターン（最重要）

```typescript
interface Command {
  execute(): void
  undo(): void
  description: string
}

class CommandHistory {
  private stack: Command[] = []
  private cursor: number = -1
  readonly maxHistory = MAX_UNDO_HISTORY  // config.ts から

  execute(command: Command): void {
    this.stack.splice(this.cursor + 1)
    this.stack.push(command)
    this.cursor++
    command.execute()
  }
  undo(): void { if (this.cursor >= 0) this.stack[this.cursor--].undo() }
  redo(): void { if (this.cursor < this.stack.length - 1) this.stack[++this.cursor].execute() }
}
```

**Parameter Store は必ず Command 経由で変更すること。直接代入は禁止。**

---

## レイヤーシステム

```typescript
// CSS mixBlendMode で合成（WebGL RenderTarget 不要）
interface Layer {
  id: string
  canvas: HTMLCanvasElement
  renderer: THREE.WebGLRenderer
  scene: THREE.Scene
  plugin: GeometryPlugin
  opacity: number
  blendMode: CSSBlendMode
  fx: FXPlugin[]
  mute: boolean
}
// MAX_LAYERS = 3（config.ts）
// 上限到達時は shadcn/ui Toast で通知
```

---

## レンダーループの注意点

- `update()` の中で新規オブジェクトをアロケートしない（GC 負荷）
- `geometry.attributes.position.needsUpdate = true` を忘れずに
- 各レイヤーの renderer を順番にレンダリングする
- GPU 使用率は `renderer.info.render` から算出
- Preview バスの小キャンバス（320×180）は FPS への影響を最初に確認すること

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
