# Day 12 実装プロンプト｜レイヤーシステム（LayerManager）

## ⚠️ SDD原則：最初に必ずspecを読むこと

```bash
cat docs/spec/layer-system.spec.md
```

このspecがSSoT（唯一の真実）。Interface・Constraints・Test Casesに準拠して実装する。

---

## 前提確認

```bash
pnpm test --run 2>&1 | tee .claude/test-latest.txt
```

38 tests グリーンを確認してから進む。

---

## 今日やること（順番通りに進める）

### Step 1: spec確認（必須）

```bash
cat docs/spec/layer-system.spec.md
```

### Step 2: `src/core/layerManager.ts` を新規作成

spec §3 の Interface に準拠して実装する。

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
      renderer.setClearColor(0x000000, 0)

      const scene = new THREE.Scene()
      const camera = new THREE.PerspectiveCamera(
        75,
        container.clientWidth / container.clientHeight,
        0.1,
        1000
      )
      camera.position.z = 5

      this.layers.push({
        id: `layer-${i + 1}`,
        canvas,
        renderer,
        scene,
        camera,
        plugin: null,
        opacity: 1,
        blendMode: 'normal',
        mute: false,
      })
    }
  }

  getLayers(): Layer[] {
    return this.layers
  }

  setOpacity(layerId: string, opacity: number): void {
    const layer = this.layers.find((l) => l.id === layerId)
    if (!layer) return
    layer.opacity = opacity
    layer.canvas.style.opacity = String(opacity)
  }

  setBlendMode(layerId: string, blendMode: CSSBlendMode): void {
    const layer = this.layers.find((l) => l.id === layerId)
    if (!layer) return
    layer.blendMode = blendMode
    layer.canvas.style.mixBlendMode = blendMode
  }

  setMute(layerId: string, mute: boolean): void {
    const layer = this.layers.find((l) => l.id === layerId)
    if (!layer) return
    layer.mute = mute
    layer.canvas.style.display = mute ? 'none' : 'block'
  }

  render(): void {
    for (const layer of this.layers) {
      if (layer.mute || !layer.plugin) continue
      layer.renderer.render(layer.scene, layer.camera)
    }
  }

  resize(width: number, height: number): void {
    for (const layer of this.layers) {
      layer.canvas.width = width
      layer.canvas.height = height
      layer.renderer.setSize(width, height)
      layer.camera.aspect = width / height
      layer.camera.updateProjectionMatrix()
    }
  }

  dispose(): void {
    for (const layer of this.layers) {
      if (layer.plugin) layer.plugin.destroy(layer.scene)
      layer.renderer.dispose()
      layer.canvas.remove()
    }
    this.layers = []
    this.container = null
  }
}

export const layerManager = new LayerManager()
```

### Step 3: `engine.ts` に LayerManager を接続

1. `import { layerManager } from './layerManager'` を追加
2. `initialize()` で `layerManager.initialize(container)` を呼ぶ
3. `render()` で `layerManager.render()` を呼ぶ
4. `onResize` で `layerManager.resize(w, h)` を呼ぶ
5. `dispose()` で `layerManager.dispose()` を呼ぶ
6. `getLayers()` メソッドを追加

### Step 4: `SimpleMixer.tsx` のPROGRAMエリアをレイヤー状態に反映

`layers.map()` で実際のレイヤー状態（blendMode・mute）を表示する。

### Step 5: テスト追加（spec §5 のTest Casesに準拠）

`tests/core/layerManager.test.ts` を新規作成:

```typescript
import { describe, it, expect, beforeEach } from 'vitest'
import { LayerManager } from '../../src/core/layerManager'

describe('LayerManager', () => {
  let manager: LayerManager

  beforeEach(() => {
    manager = new LayerManager()
  })

  it('初期状態は getLayers() が空配列', () => {
    expect(manager.getLayers()).toHaveLength(0)
  })

  it('dispose() 後は getLayers() が空配列に戻る', () => {
    manager.dispose()
    expect(manager.getLayers()).toHaveLength(0)
  })
})
```

### Step 6: テスト確認

```bash
pnpm test --run 2>&1 | tee .claude/test-latest.txt
```

40 tests グリーンを確認。

### Step 7: ブラウザ目視確認

- 映像が正常に表示される
- SimpleMixer の PROGRAM エリアに L1/L2/L3 が表示される
- コンソールエラーがない

### Step 8: コミット

```bash
git add -A && git commit -m "feat: Day12 - layer system"
```

---

## 注意点（spec §2 Constraints より）

- `LayerManager.initialize()` は DOM が存在する状態で呼ぶ（engine.initialize() 内）
- 各レイヤーは `alpha: true` + `setClearColor(0x000000, 0)` で透明背景
- `position: absolute` で重ねる → container は `position: relative` が必要
- `pointerEvents: 'none'` でマウスイベントを吸収しない
- テスト環境はDOMがないため `initialize()` はテストしない
