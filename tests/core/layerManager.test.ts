import { beforeEach, describe, expect, it, vi } from 'vitest'
import { MAX_LAYERS } from '../../src/core/config'
import type { GeometryPlugin } from '../../src/types'
import { LayerManager } from '../../src/core/layerManager'

const rendererDispose = vi.fn()
const rendererRender = vi.fn()

vi.mock('three', () => {
  class Scene {}

  class PerspectiveCamera {
    position = { z: 0 }
    aspect = 1

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

describe('LayerManager', () => {
  let manager: LayerManager
  let container: HTMLDivElement

  beforeEach(() => {
    rendererDispose.mockClear()
    rendererRender.mockClear()
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
})
