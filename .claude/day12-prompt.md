# Day 12 実装プロンプト｜レイヤーシステム（LayerManager）
# Multi-Layered Orchestration × Compiler-Driven Development 対応版

---

## ⚠️ 実装前に必ず読むこと（SDD原則）

```bash
cat docs/spec/layer-system.spec.md
```

---

## 完了条件（両方必須）

```bash
pnpm tsc --noEmit   # 型エラーゼロ
pnpm test --run     # 全テストグリーン
```

**anyによる解決は禁止。型エラーは自律的に修正すること。**

---

## 自律修正ループ

1. 実装 → `pnpm tsc --noEmit` を実行
2. 型エラーが出たら人間に報告せず自律修正
3. 型エラーゼロ → `pnpm test --run` を実行
4. 両方通過するまでループ
5. 各ステップ完了ごとに `docs/progress/day12-layer-system.log.md` に追記

---

## Step 0: プラン提示（実装前に必須）

specを読んだ後、以下を提示してから実装を開始すること：
- 作成・変更するファイル一覧
- specのどのConstraintをどう満たすか
- 型設計（新しいInterfaceが必要か）
- テストケースの対応

**プラン提示なしにコードを書いてはいけない。**

---

## Step 1: 動作確認

```bash
pnpm test --run 2>&1 | tee .claude/test-latest.txt
```

38 tests グリーンを確認してから進む。

---

## Step 2: `src/core/layerManager.ts` を新規作成

spec §3 の Interface・§2 の Constraints に準拠して実装する。

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

  getLayers(): Layer[] { return this.layers }

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

実装後: `pnpm tsc --noEmit` を実行。型エラーがあれば自律修正。

---

## Step 3: `engine.ts` に LayerManager を接続

1. `import { layerManager } from './layerManager'` を追加
2. `initialize()` で `layerManager.initialize(container)` を呼ぶ
3. `render()` で `layerManager.render()` を呼ぶ
4. `onResize` で `layerManager.resize(w, h)` を呼ぶ
5. `dispose()` で `layerManager.dispose()` を呼ぶ
6. `getLayers()` メソッドを追加

実装後: `pnpm tsc --noEmit` を実行。

---

## Step 4: `SimpleMixer.tsx` のPROGRAMエリアを実装

`layers.map()` で実際のレイヤー状態（blendMode・mute）を表示する。

実装後: `pnpm tsc --noEmit` を実行。

---

## Step 5: テスト追加（spec §5 のTest Casesに準拠）

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

---

## Step 6: 完了確認

```bash
pnpm tsc --noEmit && pnpm test --run 2>&1 | tee .claude/test-latest.txt
```

**両方通過するまでStep 2〜5をループする。**

---

## Step 7: ブラウザ目視確認

- 映像が正常に表示される
- SimpleMixer の PROGRAM エリアに L1/L2/L3 が表示される
- コンソールエラーがない

---

## Step 8: コミット

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
- **anyは使わない・型エラーは自律修正**
