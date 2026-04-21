/**
 * applyGeometrySetup テスト
 * spec: docs/spec/project-file.spec.md §5 Step 1
 *
 * Engine.applyGeometrySetup() は setLayerPlugin() を経由して
 * LayerManager.setPlugin() を呼ぶ。
 * Engine は Three.js / DOM に強依存するため、
 * ここでは setLayerPlugin() の核心ロジックを
 * LayerManager レベルで直接検証する。
 */

import { beforeEach, describe, expect, it, vi } from 'vitest'
import { LayerManager } from '../../src/core/layerManager'
import type { GeometryPlugin } from '../../src/application/schema'

// ---- Three.js / EffectComposer モック ----

vi.mock('three', () => {
  class Scene {}
  class PerspectiveCamera {
    position = { x: 0, y: 0, z: 0, set: vi.fn() }
    aspect = 1
    lookAt = vi.fn()
    updateProjectionMatrix = vi.fn()
  }
  class WebGLRenderer {
    constructor(_: unknown) {}
    setSize = vi.fn()
    setPixelRatio = vi.fn()
    setClearColor = vi.fn()
    render = vi.fn()
    dispose = vi.fn()
    domElement = document.createElement('canvas')
    autoClear = true
  }
  class Clock {
    start = vi.fn()
    getDelta = vi.fn().mockReturnValue(0.016)
  }
  return { Scene, PerspectiveCamera, WebGLRenderer, Clock }
})

vi.mock('three/examples/jsm/postprocessing/EffectComposer.js', () => ({
  EffectComposer: class {
    constructor(_: unknown) {}
    addPass = vi.fn()
    render = vi.fn()
    dispose = vi.fn()
    setSize = vi.fn()
  },
}))

vi.mock('three/examples/jsm/postprocessing/RenderPass.js', () => ({
  RenderPass: class {
    clear = true
  },
}))

// ---- GeometryPlugin モック ----

function makePlugin(id: string): GeometryPlugin {
  return {
    id,
    name: id,
    renderer: 'threejs',
    enabled: true,
    params: {},
    create: vi.fn(),
    update: vi.fn(),
    destroy: vi.fn(),
  }
}

// ---- テスト本体 ----

describe('LayerManager.setPlugin() — applyGeometrySetup の核心ロジック', () => {
  let lm: LayerManager

  beforeEach(() => {
    lm = new LayerManager()
    const container = document.createElement('div')
    Object.defineProperty(container, 'clientWidth', { value: 800 })
    Object.defineProperty(container, 'clientHeight', { value: 600 })
    lm.initialize(container)
  })

  it('setPlugin で layer-1 に plugin が割り当てられ、mute=false になる', () => {
    const p = makePlugin('grid-wave')
    lm.setPlugin('layer-1', p)
    lm.setMute('layer-1', false)

    const layer = lm.getLayers().find((l) => l.id === 'layer-1')
    expect(layer?.plugin?.id).toBe('grid-wave')
    expect(layer?.mute).toBe(false)
  })

  it('setPlugin(null) で layer-1 が mute=true になる', () => {
    const p = makePlugin('grid-wave')
    lm.setPlugin('layer-1', p)
    lm.setMute('layer-1', false)

    // null を渡して解除
    lm.setPlugin('layer-1', null)
    lm.setMute('layer-1', true)

    const layer = lm.getLayers().find((l) => l.id === 'layer-1')
    expect(layer?.plugin).toBeNull()
    expect(layer?.mute).toBe(true)
  })

  it('applyGeometrySetup 相当: 1つ選択 → layer-1 にセット / layer-2,3 は mute', () => {
    // selectedIds = ['grid-wave']  → layer-1: grid-wave / layer-2,3: null+mute
    const plugins = [makePlugin('grid-wave'), makePlugin('starfield'), makePlugin('contour')]
    const selectedIds = ['grid-wave']

    lm.getLayers().forEach((layer, index) => {
      const pluginId = selectedIds[index] ?? null
      if (pluginId === null) {
        lm.setPlugin(layer.id, null)
        lm.setMute(layer.id, true)
      } else {
        const plugin = plugins.find((p) => p.id === pluginId) ?? null
        lm.setPlugin(layer.id, plugin)
        lm.setMute(layer.id, false)
      }
    })

    const layers = lm.getLayers()
    expect(layers[0].plugin?.id).toBe('grid-wave')
    expect(layers[0].mute).toBe(false)
    expect(layers[1].plugin).toBeNull()
    expect(layers[1].mute).toBe(true)
    expect(layers[2].plugin).toBeNull()
    expect(layers[2].mute).toBe(true)
  })

  it('applyGeometrySetup 相当: 2つ選択 → layer-1,2 にセット / layer-3 は mute', () => {
    const plugins = [makePlugin('grid-wave'), makePlugin('starfield'), makePlugin('contour')]
    const selectedIds = ['grid-wave', 'starfield']

    lm.getLayers().forEach((layer, index) => {
      const pluginId = selectedIds[index] ?? null
      if (pluginId === null) {
        lm.setPlugin(layer.id, null)
        lm.setMute(layer.id, true)
      } else {
        const plugin = plugins.find((p) => p.id === pluginId) ?? null
        lm.setPlugin(layer.id, plugin)
        lm.setMute(layer.id, false)
      }
    })

    const layers = lm.getLayers()
    expect(layers[0].plugin?.id).toBe('grid-wave')
    expect(layers[0].mute).toBe(false)
    expect(layers[1].plugin?.id).toBe('starfield')
    expect(layers[1].mute).toBe(false)
    expect(layers[2].plugin).toBeNull()
    expect(layers[2].mute).toBe(true)
  })

  it('applyGeometrySetup 相当: 空配列 → 全レイヤー mute', () => {
    const plugins = [makePlugin('grid-wave')]
    lm.setPlugin('layer-1', plugins[0])
    lm.setMute('layer-1', false)

    // 空配列を適用
    const selectedIds: string[] = []
    lm.getLayers().forEach((layer, index) => {
      const pluginId = selectedIds[index] ?? null
      lm.setPlugin(layer.id, pluginId ? plugins.find((p) => p.id === pluginId) ?? null : null)
      lm.setMute(layer.id, pluginId === null)
    })

    const layers = lm.getLayers()
    expect(layers[0].plugin).toBeNull()
    expect(layers[0].mute).toBe(true)
  })

  it('plugin.create() が setPlugin 時に呼ばれる', () => {
    const p = makePlugin('grid-wave')
    lm.setPlugin('layer-1', p)
    expect(p.create).toHaveBeenCalledTimes(1)
  })

  it('上書き時に旧 plugin.destroy() が呼ばれる', () => {
    const old = makePlugin('grid-wave')
    const next = makePlugin('starfield')
    lm.setPlugin('layer-1', old)
    lm.setPlugin('layer-1', next)
    expect(old.destroy).toHaveBeenCalledTimes(1)
    expect(next.create).toHaveBeenCalledTimes(1)
  })
})
