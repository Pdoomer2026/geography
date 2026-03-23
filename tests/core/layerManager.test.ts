import { beforeEach, describe, expect, it, vi } from 'vitest'
import { MAX_LAYERS } from '../../src/core/config'
import type { GeometryPlugin } from '../../src/types'
import { LayerManager } from '../../src/core/layerManager'

const rendererDispose = vi.fn()
const rendererRender = vi.fn()
const composerRender = vi.fn()
const composerDispose = vi.fn()
const composerSetSize = vi.fn()
const composerAddPass = vi.fn()

vi.mock('three', () => {
  class Scene {}

  class PerspectiveCamera {
    position = { x: 0, y: 0, z: 0, set(x: number, y: number, z: number) { this.x = x; this.y = y; this.z = z } }
    aspect = 1
    lookAt = vi.fn()

    updateProjectionMatrix(): void {}
  }

  class WebGLRenderer {
    constructor(_: unknown) {}

    setSize(): void {}

    setPixelRatio(): void {}

    setClearColor(): void {}

    render = rendererRender
    dispose = rendererDispose
  }

  return {
    Scene,
    PerspectiveCamera,
    WebGLRenderer,
  }
})

vi.mock('three/examples/jsm/postprocessing/EffectComposer.js', () => {
  class EffectComposer {
    passes: unknown[] = []

    constructor(_renderer: unknown) {}

    addPass(pass: unknown): void {
      this.passes.push(pass)
      composerAddPass(pass)
    }

    render = composerRender
    dispose = composerDispose
    setSize = composerSetSize
  }

  return { EffectComposer }
})

vi.mock('three/examples/jsm/postprocessing/RenderPass.js', () => {
  class RenderPass {
    constructor(_scene: unknown, _camera: unknown) {}
  }

  return { RenderPass }
})

describe('LayerManager', () => {
  let manager: LayerManager
  let container: HTMLDivElement

  beforeEach(() => {
    rendererDispose.mockClear()
    rendererRender.mockClear()
    composerRender.mockClear()
    composerDispose.mockClear()
    composerSetSize.mockClear()
    composerAddPass.mockClear()
    manager = new LayerManager()
    container = document.createElement('div')
    Object.defineProperty(container, 'clientWidth', { configurable: true, value: 640 })
    Object.defineProperty(container, 'clientHeight', { configurable: true, value: 360 })
    document.body.appendChild(container)
  })

  it('初期化でMAX_LAYERS個のレイヤーが生成される', () => {
    manager.initialize(container)
    expect(manager.getLayers()).toHaveLength(MAX_LAYERS)
  })

  it('初期状態でpluginはnull', () => {
    manager.initialize(container)
    manager.getLayers().forEach((layer) => {
      expect(layer.plugin).toBeNull()
    })
  })

  it('初期状態で各レイヤーにFxStackが存在する', () => {
    manager.initialize(container)
    manager.getLayers().forEach((layer) => {
      expect(layer.fxStack).toBeDefined()
    })
  })

  it('setOpacity後にcanvas.style.opacityが更新される', () => {
    manager.initialize(container)
    manager.setOpacity('layer-1', 0.5)
    expect(manager.getLayers()[0].canvas.style.opacity).toBe('0.5')
  })

  it('setMute(true)のレイヤーはupdate時にpluginを呼ばない', () => {
    manager.initialize(container)
    const update = vi.fn()
    const plugin: GeometryPlugin = {
      id: 'mock-plugin',
      name: 'Mock',
      renderer: 'threejs',
      enabled: true,
      params: {},
      create: vi.fn(),
      update,
      destroy: vi.fn(),
    }

    manager.setPlugin('layer-1', plugin)
    manager.setMute('layer-1', true)
    manager.update(0.016, 0.5)
    expect(update).not.toHaveBeenCalled()
  })

  it('dispose後にrenderer.disposeが呼ばれる', () => {
    manager.initialize(container)
    manager.dispose()
    expect(rendererDispose).toHaveBeenCalledTimes(MAX_LAYERS)
  })

  it('dispose後にcomposer.disposeが呼ばれる', () => {
    manager.initialize(container)
    manager.dispose()
    expect(composerDispose).toHaveBeenCalledTimes(MAX_LAYERS)
  })

  it('setupFx でFXプラグインがfxStackに登録される', () => {
    manager.initialize(container)
    const fxPlugin = {
      id: 'bloom',
      name: 'Bloom',
      renderer: 'threejs',
      enabled: true,
      params: {},
      create: vi.fn(),
      update: vi.fn(),
      destroy: vi.fn(),
    }
    manager.setupFx('layer-1', [fxPlugin])
    expect(fxPlugin.create).toHaveBeenCalledOnce()
    expect(manager.getLayers()[0].fxStack.getOrdered()).toHaveLength(1)
  })
})
