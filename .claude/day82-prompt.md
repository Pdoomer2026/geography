# Day82: Geometry Plugin Factory Function パターン化

## 背景・問題

全 Geometry Plugin がモジュールレベル変数（`let torus`, `let icosphere` 等）を持つため、
複数レイヤーで同じ Plugin ID を使うと変数が競合し、二重表示・destroy 誤作動が発生する。
Camera Plugin（Day45）と同一のバグ。

## 対象ファイル（6プラグイン）

- `src/engine/geometry/solid/torus/index.ts`
- `src/engine/geometry/solid/icosphere/index.ts`
- `src/engine/geometry/solid/torusknot/index.ts`
- `src/engine/geometry/wave/grid-wave/index.ts`
- `src/engine/geometry/tunnel/grid-tunnel/index.ts`
- `src/engine/geometry/terrain/contour/index.ts`
- `src/engine/geometry/terrain/hex-grid/index.ts`

## 実装手順

### Step 1: `registry.ts` に factory 型を追加

`src/application/registry/registry.ts` を修正：

```ts
import type { GeometryPlugin, LightPlugin, ParticlePlugin } from '../schema'
import { paramCatalogRegistry } from '../catalog/paramCatalogRegistry'

type AnyPlugin = GeometryPlugin | LightPlugin | ParticlePlugin
export type GeometryPluginFactory = () => GeometryPlugin

class PluginRegistry {
  private plugins = new Map<string, AnyPlugin>()
  private geometryFactories = new Map<string, GeometryPluginFactory>()

  register(plugin: AnyPlugin): void {
    this.plugins.set(plugin.id, plugin)
    if (plugin.catalog) {
      paramCatalogRegistry.register(plugin.id, plugin.catalog)
    }
  }

  registerFactory(id: string, factory: GeometryPluginFactory, catalog?: AnyPlugin['catalog']): void {
    this.geometryFactories.set(id, factory)
    // catalog 登録のためにダミーインスタンスを一度生成して catalog を取得
    if (catalog) {
      paramCatalogRegistry.register(id, catalog)
    }
  }

  getFactory(id: string): GeometryPluginFactory | undefined {
    return this.geometryFactories.get(id)
  }

  get(id: string): AnyPlugin | undefined {
    return this.plugins.get(id)
  }

  list(): AnyPlugin[] {
    return Array.from(this.plugins.values())
  }

  listIds(): string[] {
    return [
      ...Array.from(this.plugins.keys()),
      ...Array.from(this.geometryFactories.keys()),
    ]
  }
}

export const registry = new PluginRegistry()
```

### Step 2: 各 Geometry Plugin を factory function に変換

**パターン**: モジュールレベル変数をクロージャ変数に移動し、`default export` を factory function にする。

torus を例に示す（他も同様）:

```ts
// src/engine/geometry/solid/torus/index.ts
import type * as THREE from 'three'
import type { GeometryPlugin } from '../../../../application/schema'
import { catalog, defaultParams } from './torus.config'
import { TorusGeometryWrapper } from './TorusGeometryWrapper'

export default function createTorusPlugin(): GeometryPlugin {
  let torus: TorusGeometryWrapper | null = null
  let elapsedTime = 0

  return {
    id: 'torus',
    name: 'Torus',
    renderer: 'threejs',
    enabled: true,
    catalog,
    params: structuredClone(defaultParams),
    defaultCameraPluginId: 'orbit-camera',
    defaultCameraParams: { radius: 12, height: 4, speed: 0.4, autoRotate: 1 },

    create(scene: THREE.Scene): void {
      const radius      = this.params.radius.value
      const tube        = this.params.tube.value
      const radialSegs  = Math.round(this.params.radialSegs.value)
      const tubularSegs = Math.round(this.params.tubularSegs.value)
      const hue         = this.params.hue.value
      torus = new TorusGeometryWrapper(radius, tube, radialSegs, tubularSegs, hue)
      scene.add(torus.getMesh())
    },

    update(delta: number, _beat: number): void {
      if (!torus) return
      elapsedTime += delta
      torus.update(elapsedTime, {
        speed: this.params.speed.value,
        hue:   this.params.hue.value,
      })
    },

    getParameters() {
      return Object.entries(this.params).map(([id, p]) => ({
        id,
        name: p.label,
        min: p.min,
        max: p.max,
        step: 0.01,
      }))
    },

    destroy(scene: THREE.Scene): void {
      if (!torus) return
      scene.remove(torus.getMesh())
      torus.dispose()
      torus = null
      elapsedTime = 0
    },
  }
}
```

**他の5プラグインも同じパターンで変換する。**
各プラグインのクロージャ変数は元のモジュールレベル変数と同じものをそのまま使う。

### Step 3: 各プラグインの登録を factory 登録に変更

各プラグインの登録箇所（`import.meta.glob` で自動登録している場合はその処理）を確認し、
`registerFactory` を使うよう変更する。

登録ファイルを確認して適切に対応すること。
おそらく `src/application/registry/` 配下か `src/engine/geometry/index.ts` に登録処理がある。

### Step 4: `layerManager.setPlugin()` を factory 対応に変更

`src/application/orchestrator/layerManager.ts` の `_applyPresetToLayer()` を修正:

```ts
private _applyPresetToLayer(layerId: string, preset: LayerPreset): void {
  const layer = this.layers.find((l) => l.id === layerId)
  const composer = this.composers.get(layerId)
  if (!layer) return

  // 1. Geometry 差し替え: factory があればインスタンスを新規生成
  const factory = registry.getFactory(preset.geometryPluginId)
  if (factory) {
    this.setPlugin(layerId, factory())
  } else {
    const geomPlugin = registry.get(preset.geometryPluginId)
    if (geomPlugin) {
      this.setPlugin(layerId, geomPlugin as GeometryPlugin)
    } else {
      console.warn(`[LayerManager] Geometry Plugin not found: ${preset.geometryPluginId}`)
    }
  }

  // 2. Camera 差し替え（変更なし）
  const camPlugin = getCameraPlugin(preset.cameraPluginId)
  if (camPlugin) {
    layer.isCameraUserOverridden = false
    this.setCameraPlugin(layerId, camPlugin)
  }

  // 3. FX 差し替え（変更なし）
  if (composer) {
    layer.fxStack.applySetup(preset.fxPluginIds, composer)
  }
}
```

### Step 5: UI 側の registry.list() 参照を確認・修正

`registry.list()` でプラグイン一覧を取得している箇所が factory 登録したプラグインも含むよう
`listIds()` または修正した `list()` を使うようにする。

GeometrySimpleWindow や LayerTab などで `registry.list()` を呼んでいる箇所を grep して対応。

### Step 6: 検証

```bash
pnpm tsc --noEmit 2>&1
pnpm test --run 2>&1 | tee .claude/test-latest.txt
```

129 tests グリーン・tsc エラーゼロを確認してから報告すること。

## 注意事項

- `any` 型禁止
- 既存テストを壊さないこと
- `import.meta.glob` で自動登録している場合、glob のパターンが factory function の default export を正しく処理できるか確認すること
- catalog の paramCatalogRegistry 登録が抜けないよう注意（UI の param スライダーに影響する）
