# Day 12 実装プロンプト｜レイヤーシステム（LayerManager）

## 前提確認
- ブランチ: `main`
- 最終コミット: `feat: Day11 - beat cut transition connected to engine`（6e65277）
- テスト: 38 tests グリーン ✅

## 今日やること（順番通りに進める）

---

### Step 1: まず動作確認

```bash
pnpm test --run 2>&1 | tee .claude/test-latest.txt
pnpm dev
```

38 tests グリーン・ブラウザで映像が表示されることを確認してから進む。

---

### Step 2: `src/core/layerManager.ts` を新規作成

以下の内容で作成する。

```typescript
import * as THREE from 'three'
import { MAX_LAYERS } from './config'
import type { GeometryPlugin } from '../types'

export type CSSBlendMode = 'normal' | 'add' | 'multiply' | 'screen' | 'overlay'

export interface Layer {
  id: string
  canvas: HTMLCanvasElement
  renderer: THREE.WebGLRenderer
  scene: THREE.Scene
  camera: THREE.PerspectiveCamera
  plugin: GeometryPlugin | null
  opacity: number
  blendMode: CSSBlendMode
  mute: boolean
}

export class LayerManager {
  private layers: Layer[] = []
  private container: HTMLElement | null = null

  /** コンテナに mount して Layer キャンバスを重ねる */
  initialize(container: HTMLElement): void {
    this.container = container

    for (let i = 0; i < MAX_LAYERS; i++) {
      const canvas = document.createElement('canvas')
      canvas.width = container.clientWidth
      canvas.height = container.clientHeight
      canvas.style.position = 'absolute'
      canvas.style.top = '0'
      canvas.style.left = '0'
      canvas.style.width = '100%'
      canvas.style.height = '100%'
      canvas.style.pointerEvents = 'none'
      container.appendChild(canvas)

      const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true })
      renderer.setSize(container.clientWidth, container.clientHeight)
      renderer.setPixelRatio(window.devicePixelRatio)
      renderer.setClearColor(0x000000, 0) // 透明背景

      const scene = new THREE.Scene()

      const camera = new THREE.PerspectiveCamera(
        75,
        container.clientWidth / container.clientHeight,
        0.1,
        1000
      )
      camera.position.z = 5

      const layer: Layer = {
        id: `layer-${i + 1}`,
        canvas,
        renderer,
        scene,
        camera,
        plugin: null,
        opacity: 1,
        blendMode: 'normal',
        mute: false,
      }

      this.layers.push(layer)
    }
  }

  /** 全レイヤーを取得 */
  getLayers(): Layer[] {
    return this.layers
  }

  /** レイヤーの opacity を更新 */
  setOpacity(layerId: string, opacity: number): void {
    const layer = this.layers.find((l) => l.id === layerId)
    if (!layer) return
    layer.opacity = opacity
    layer.canvas.style.opacity = String(opacity)
  }

  /** レイヤーの blendMode を更新 */
  setBlendMode(layerId: string, blendMode: CSSBlendMode): void {
    const layer = this.layers.find((l) => l.id === layerId)
    if (!layer) return
    layer.blendMode = blendMode
    layer.canvas.style.mixBlendMode = blendMode
  }

  /** レイヤーの mute を切り替え */
  setMute(layerId: string, mute: boolean): void {
    const layer = this.layers.find((l) => l.id === layerId)
    if (!layer) return
    layer.mute = mute
    layer.canvas.style.display = mute ? 'none' : 'block'
  }

  /** 全レイヤーをレンダリング（engine の loop から毎フレーム呼ぶ） */
  render(): void {
    for (const layer of this.layers) {
      if (layer.mute || !layer.plugin) continue
      layer.renderer.render(layer.scene, layer.camera)
    }
  }

  /** リサイズ対応 */
  resize(width: number, height: number): void {
    for (const layer of this.layers) {
      layer.canvas.width = width
      layer.canvas.height = height
      layer.renderer.setSize(width, height)
      layer.camera.aspect = width / height
      layer.camera.updateProjectionMatrix()
    }
  }

  /** クリーンアップ */
  dispose(): void {
    for (const layer of this.layers) {
      if (layer.plugin) {
        layer.plugin.destroy(layer.scene)
      }
      layer.renderer.dispose()
      layer.canvas.remove()
    }
    this.layers = []
    this.container = null
  }
}

export const layerManager = new LayerManager()
```

---

### Step 3: `engine.ts` に LayerManager を接続

#### 3-1. import を追加（ファイル先頭）

```typescript
import { layerManager } from './layerManager'
```

#### 3-2. `initialize()` に LayerManager の初期化を追加

`container.appendChild(this.renderer.domElement)` の直後に以下を追加:

```typescript
// LayerManager 初期化（レイヤーキャンバスを container に重ねる）
layerManager.initialize(container)
```

#### 3-3. `private render()` を修正

現在:
```typescript
private render(): void {
  if (!this.renderer || !this.scene || !this.camera) return
  this.renderer.render(this.scene, this.camera)
}
```

変更後:
```typescript
private render(): void {
  if (!this.renderer || !this.scene || !this.camera) return
  this.renderer.render(this.scene, this.camera)
  // 各レイヤーをレンダリング
  layerManager.render()
}
```

#### 3-4. `onResize` に LayerManager のリサイズを追加

現在:
```typescript
private onResize = (): void => {
  if (!this.container || !this.renderer || !this.camera) return
  const w = this.container.clientWidth
  const h = this.container.clientHeight
  this.camera.aspect = w / h
  this.camera.updateProjectionMatrix()
  this.renderer.setSize(w, h)
}
```

変更後:
```typescript
private onResize = (): void => {
  if (!this.container || !this.renderer || !this.camera) return
  const w = this.container.clientWidth
  const h = this.container.clientHeight
  this.camera.aspect = w / h
  this.camera.updateProjectionMatrix()
  this.renderer.setSize(w, h)
  layerManager.resize(w, h)
}
```

#### 3-5. `dispose()` に LayerManager のクリーンアップを追加

`window.removeEventListener('resize', this.onResize)` の前に以下を追加:

```typescript
layerManager.dispose()
```

#### 3-6. `getLayers()` メソッドを追加（SimpleMixer から参照できるように）

```typescript
getLayers() {
  return layerManager.getLayers()
}
```

---

### Step 4: `SimpleMixer.tsx` の PROGRAM エリアをレイヤー状態に反映

`SimpleMixer.tsx` を修正する。

#### 4-1. import を追加

```typescript
import { layerManager } from '../../../core/layerManager'
```

#### 4-2. レイヤー状態を state として持つ

```typescript
const [layers, setLayers] = useState(() => layerManager.getLayers())
```

#### 4-3. PROGRAM エリアの JSX を実際のレイヤー状態で置き換え

現在（プレースホルダー）:
```tsx
{[0, 1, 2].map((i) => (
  <div
    key={i}
    className="flex-1 rounded-sm border border-[#2a2a4e] bg-[#1a1a2e]
               flex items-end justify-center pb-1 text-[9px] text-[#4a4a6e]"
    style={{ height: '100%' }}
  >
    L{i + 1}
  </div>
))}
```

変更後:
```tsx
{layers.map((layer, i) => (
  <div
    key={layer.id}
    className="flex-1 rounded-sm border border-[#2a2a4e] bg-[#1a1a2e]
               flex flex-col items-center justify-between py-1 px-0.5"
    style={{ height: '100%' }}
  >
    <span className="text-[9px] text-[#4a4a6e]">L{i + 1}</span>
    <span className="text-[8px] text-[#3a3a5e]">
      {layer.mute ? 'MUTE' : layer.blendMode.toUpperCase()}
    </span>
  </div>
))}
```

---

### Step 5: テスト追加

`tests/layerManager.test.ts` を新規作成:

```typescript
import { describe, it, expect, beforeEach } from 'vitest'
import { LayerManager } from '../src/core/layerManager'

describe('LayerManager', () => {
  let manager: LayerManager

  beforeEach(() => {
    manager = new LayerManager()
  })

  it('初期状態は getLayers() が空配列', () => {
    expect(manager.getLayers()).toHaveLength(0)
  })

  it('dispose() 後は getLayers() が空配列に戻る', () => {
    // initialize は DOM 環境が必要なため dispose のみテスト
    manager.dispose()
    expect(manager.getLayers()).toHaveLength(0)
  })
})
```

---

### Step 6: 動作確認

```bash
pnpm test --run 2>&1 | tee .claude/test-latest.txt
```

40 tests（元の 38 + 新規 2）がグリーンであることを確認。

`pnpm dev` でブラウザを開き、以下を目視確認:
- 映像が正常に表示される（レイヤーキャンバスが重なっていても映像が壊れない）
- SimpleMixer の PROGRAM エリアに L1/L2/L3 のラベルと blendMode が表示される
- コンソールエラーがない

---

### Step 7: コミット

```bash
git add -A
git commit -m "feat: Day12 - layer system"
```

---

## 注意点

- `LayerManager.initialize()` は `engine.initialize()` の中から呼ぶ（DOM が存在する状態で呼ぶこと）
- 各レイヤーの canvas は `alpha: true` + `setClearColor(0x000000, 0)` で透明背景にする
- `position: absolute` で重ねるため、container は `position: relative` になっている必要がある（App.tsx 側で確認）
- `pointerEvents: 'none'` を設定してレイヤーキャンバスがマウスイベントを吸収しないようにする
- テスト環境は DOM がないため `initialize()` はテストしない（dispose のみテスト）
- `layerManager` はシングルトンで export する（`engine` と同様のパターン）
