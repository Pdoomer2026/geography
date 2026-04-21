import { vi } from 'vitest'

// Tone.js は Web Audio API を必要とするため jsdom 環境ではモックする
vi.mock('tone', () => {
  let bpmValue = 128
  const transport = {
    bpm: {
      get value() { return bpmValue },
      set value(v: number) { bpmValue = v },
    },
    ticks: 0,
    PPQ: 192,
    state: 'stopped' as 'started' | 'stopped' | 'paused',
    start()  { this.state = 'started' },
    pause()  { this.state = 'paused' },
    stop()   { this.state = 'stopped'; this.ticks = 0 },
  }
  return { getTransport: () => transport }
})

/**
 * engine.ts FX コントロール API テスト
 * spec: docs/spec/fx-control-ui.spec.md
 *
 * engine はシングルトンの layerManager / Three.js に強依存するため、
 * FX API の核心ロジック（getFxPlugins / setFxEnabled / setFxParam）を
 * FxStack + FXPlugin レベルで単体検証する。
 *
 * Camera API (setCameraPlugin) は LayerManager レベルで検証する。
 * spec: docs/spec/camera-plugin.spec.md §9
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { FxStack } from '../../src/application/orchestrator/fxStack'
import type { FXPlugin, PluginParam } from '../../src/application/schema'

// ---- テスト用 FXPlugin モック ----

function makeFxPlugin(id: string, enabled = true, params: Record<string, PluginParam> = {}): FXPlugin {
  return {
    id,
    name: id,
    renderer: 'threejs',
    enabled,
    params,
    create: () => {},
    update: () => {},
    destroy: () => {},
  }
}

// ---- テスト本体 ----

describe('engine FX コントロール API（FxStack レベル検証）', () => {
  let stack: FxStack

  beforeEach(() => {
    stack = new FxStack()
  })

  // TC-1: getFxPlugins() 相当 — getOrdered() が FX_STACK_ORDER 順で返る
  it('TC-1: getOrdered() は登録順に関わらず FX_STACK_ORDER 順で返す', () => {
    const bloom = makeFxPlugin('bloom')
    const afterImage = makeFxPlugin('after-image')
    const colorGrading = makeFxPlugin('color-grading')

    // 逆順で登録してもソートされる
    stack.register(colorGrading)
    stack.register(bloom)
    stack.register(afterImage)

    const ordered = stack.getOrdered()
    expect(ordered[0].id).toBe('after-image')
    expect(ordered[1].id).toBe('bloom')
    expect(ordered[2].id).toBe('color-grading')
  })

  it('TC-1: getOrdered() は 10 FX 全登録時に 10 件返す', () => {
    const allIds = [
      'after-image', 'feedback', 'bloom', 'kaleidoscope', 'mirror',
      'zoom-blur', 'rgb-shift', 'crt', 'glitch', 'color-grading',
    ]
    allIds.forEach((id) => stack.register(makeFxPlugin(id)))
    expect(stack.getOrdered()).toHaveLength(10)
    expect(stack.getOrdered()[0].id).toBe('after-image')
    expect(stack.getOrdered()[9].id).toBe('color-grading')
  })

  // TC-2: setFxEnabled() 相当 — setEnabled() で enabled が変わる
  it('TC-2: setEnabled() で指定 FX の enabled が false になる', () => {
    stack.register(makeFxPlugin('bloom', true))
    stack.setEnabled('bloom', false)
    expect(stack.getPlugin('bloom')?.enabled).toBe(false)
  })

  it('TC-2: setEnabled() で指定 FX の enabled が true に戻る', () => {
    stack.register(makeFxPlugin('bloom', false))
    stack.setEnabled('bloom', true)
    expect(stack.getPlugin('bloom')?.enabled).toBe(true)
  })

  it('TC-2: 存在しない fxId を setEnabled() しても例外を投げない', () => {
    expect(() => stack.setEnabled('non-existent', false)).not.toThrow()
  })

  // TC-3: setFxParam() 相当 — params.value が更新される
  it('TC-3: params.value を直接更新すると getPlugin() から参照できる', () => {
    const bloomParams: Record<string, PluginParam> = {
      strength: { value: 0.8, min: 0, max: 3, label: 'Strength' },
    }
    const bloom = makeFxPlugin('bloom', true, bloomParams)
    stack.register(bloom)

    // setFxParam の実装: plugin.params[paramKey].value = value
    const plugin = stack.getPlugin('bloom')
    if (plugin && 'strength' in plugin.params) {
      plugin.params['strength'].value = 1.5
    }

    expect(stack.getPlugin('bloom')?.params['strength'].value).toBe(1.5)
  })

  it('TC-3: 複数パラメーターを持つ FX の各 value を独立して更新できる', () => {
    const params: Record<string, PluginParam> = {
      strength:  { value: 0.8, min: 0, max: 3, label: 'Strength' },
      radius:    { value: 0.4, min: 0, max: 1, label: 'Radius' },
      threshold: { value: 0.1, min: 0, max: 1, label: 'Threshold' },
    }
    stack.register(makeFxPlugin('bloom', true, params))

    const plugin = stack.getPlugin('bloom')!
    plugin.params['strength'].value = 2.0
    plugin.params['radius'].value = 0.7

    expect(stack.getPlugin('bloom')?.params['strength'].value).toBe(2.0)
    expect(stack.getPlugin('bloom')?.params['radius'].value).toBe(0.7)
    expect(stack.getPlugin('bloom')?.params['threshold'].value).toBe(0.1) // 変更なし
  })
})

// ----------------------------------------------------------------
// Engine Camera Plugin API 委譲検証
// spec: camera-plugin.spec.md §9
// engine の Camera Plugin API が layerManager への単純委譲であることを検証する
// ----------------------------------------------------------------

describe('engine Camera Plugin API — layerManager への委譲検証', () => {
  it('TC-engine-1: setCameraPlugin() が layerManager.setCameraPlugin を呼び出す', async () => {
    const { layerManager } = await import('../../src/application/orchestrator/layerManager')
    const spy = vi.spyOn(layerManager, 'setCameraPlugin')

    const { engine } = await import('../../src/application/orchestrator/engine')
    engine.setCameraPlugin('layer-1', 'static-camera')

    expect(spy).toHaveBeenCalledWith(
      'layer-1',
      expect.objectContaining({ id: 'static-camera' }),
      undefined,
      true,
    )
    spy.mockRestore()
  })

  it('TC-engine-2: setCameraParam() が Camera Plugin の params を更新する', async () => {
    const { layerManager } = await import('../../src/application/orchestrator/layerManager')
    const { engine } = await import('../../src/application/orchestrator/engine')

    // getCameraPlugin が null でなければ params を更新できる
    const spy = vi.spyOn(layerManager, 'getCameraPlugin').mockReturnValue({
      id: 'static-camera',
      name: 'Static Camera',
      renderer: 'threejs',
      enabled: true,
      params: {
        posY: { value: 8, min: -50, max: 50, label: 'Pos Y' },
      },
      mount: vi.fn(),
      update: vi.fn(),
      dispose: vi.fn(),
    })

    engine.setCameraParam('layer-1', 'posY', 20)
    const cam = layerManager.getCameraPlugin('layer-1')
    expect(cam?.params.posY.value).toBe(20)

    spy.mockRestore()
  })
})

// ----------------------------------------------------------------
// setGeometryParam + requiresRebuild 検証
// spec: docs/spec/geometry-plugin.spec.md §9
// ----------------------------------------------------------------

describe('engine setGeometryParam — requiresRebuild ロジック検証', () => {
  it('TC-geo-1: requiresRebuild=false の param 変更時は rebuildPlugin を呼ばない', async () => {
    const { layerManager } = await import('../../src/application/orchestrator/layerManager')
    const { engine } = await import('../../src/application/orchestrator/engine')

    const mockPlugin = {
      id: 'grid-wave',
      name: 'Grid Wave',
      renderer: 'threejs',
      enabled: true,
      params: {
        speed: { value: 0.5, min: 0.1, max: 2.0, label: 'Speed' },
      },
      create: vi.fn(),
      update: vi.fn(),
      destroy: vi.fn(),
    }

    vi.spyOn(layerManager, 'getLayers').mockReturnValue([
      { id: 'layer-1', plugin: mockPlugin } as never,
    ])
    const rebuildSpy = vi.spyOn(layerManager, 'rebuildPlugin')

    engine.setGeometryParam('layer-1', 'speed', 1.0)

    expect(mockPlugin.params.speed.value).toBe(1.0)
    expect(rebuildSpy).not.toHaveBeenCalled()

    vi.restoreAllMocks()
  })

  it('TC-geo-2: requiresRebuild=true の param 変更時は rebuildPlugin を呼ぶ', async () => {
    const { layerManager } = await import('../../src/application/orchestrator/layerManager')
    const { engine } = await import('../../src/application/orchestrator/engine')

    const mockPlugin = {
      id: 'grid-wave',
      name: 'Grid Wave',
      renderer: 'threejs',
      enabled: true,
      params: {
        segments: { value: 60, min: 10, max: 100, label: 'Segments', requiresRebuild: true },
      },
      create: vi.fn(),
      update: vi.fn(),
      destroy: vi.fn(),
    }

    vi.spyOn(layerManager, 'getLayers').mockReturnValue([
      { id: 'layer-1', plugin: mockPlugin } as never,
    ])
    const rebuildSpy = vi.spyOn(layerManager, 'rebuildPlugin').mockImplementation(() => {})

    engine.setGeometryParam('layer-1', 'segments', 80)

    expect(mockPlugin.params.segments.value).toBe(80)
    expect(rebuildSpy).toHaveBeenCalledWith('layer-1')

    vi.restoreAllMocks()
  })
})
