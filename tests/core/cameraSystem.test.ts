import { beforeEach, describe, expect, it, vi } from 'vitest'
import { DEFAULT_CAMERA_PRESET } from '../../src/core/config'
import type { GeometryPlugin } from '../../src/types'
import { LayerManager } from '../../src/core/layerManager'

// --- Three.js モック（カメラのposition/lookAt を追跡できる形に拡張） ---

const positionSet = vi.fn()
const cameraLookAt = vi.fn()
const rendererDispose = vi.fn()
const composerDispose = vi.fn()
const composerSetSize = vi.fn()
const composerAddPass = vi.fn()

vi.mock('three', () => {
  class Vector3 {
    x = 0; y = 0; z = 0
    set(x: number, y: number, z: number): void {
      this.x = x; this.y = y; this.z = z
      positionSet(x, y, z)
    }
  }

  class Scene {}

  class PerspectiveCamera {
    position = new Vector3()
    aspect = 1
    lookAt = cameraLookAt
    updateProjectionMatrix(): void {}
  }

  class WebGLRenderer {
    constructor(_: unknown) {}
    setSize(): void {}
    setPixelRatio(): void {}
    setClearColor(): void {}
    render = vi.fn()
    dispose = rendererDispose
  }

  return { Scene, PerspectiveCamera, WebGLRenderer, Vector3 }
})

vi.mock('three/examples/jsm/postprocessing/EffectComposer.js', () => {
  class EffectComposer {
    constructor(_renderer: unknown) {}
    addPass(pass: unknown): void { composerAddPass(pass) }
    render = vi.fn()
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

// --- ヘルパー ---

function makePlugin(preset?: GeometryPlugin['cameraPreset']): GeometryPlugin {
  return {
    id: 'test-plugin',
    name: 'Test',
    renderer: 'threejs',
    enabled: true,
    params: {},
    cameraPreset: preset,
    create: vi.fn(),
    update: vi.fn(),
    destroy: vi.fn(),
  }
}

// --- テスト ---

describe('Camera System', () => {
  let manager: LayerManager
  let container: HTMLDivElement

  beforeEach(() => {
    positionSet.mockClear()
    cameraLookAt.mockClear()
    rendererDispose.mockClear()
    composerDispose.mockClear()

    manager = new LayerManager()
    container = document.createElement('div')
    Object.defineProperty(container, 'clientWidth', { configurable: true, value: 640 })
    Object.defineProperty(container, 'clientHeight', { configurable: true, value: 360 })
    document.body.appendChild(container)
    manager.initialize(container)
  })

  it('TC-1: 初期化時にカメラが DEFAULT_CAMERA_PRESET 位置にセットされる', () => {
    const p = DEFAULT_CAMERA_PRESET.position
    // initialize() 内で各レイヤーに position.set が呼ばれる
    expect(positionSet).toHaveBeenCalledWith(p.x, p.y, p.z)
  })

  it('TC-2: cameraPreset を持つ Plugin をセットするとそのプリセットが適用される', () => {
    positionSet.mockClear()
    cameraLookAt.mockClear()

    const preset = { position: { x: 1, y: 2, z: 3 }, lookAt: { x: 0, y: 0, z: 0 } }
    const plugin = makePlugin(preset)

    manager.setPlugin('layer-1', plugin)

    expect(positionSet).toHaveBeenCalledWith(1, 2, 3)
    expect(cameraLookAt).toHaveBeenCalledWith(0, 0, 0)
  })

  it('TC-3: cameraPreset を持たない Plugin には DEFAULT_CAMERA_PRESET が適用される', () => {
    positionSet.mockClear()
    cameraLookAt.mockClear()

    const plugin = makePlugin(undefined) // cameraPreset なし
    manager.setPlugin('layer-1', plugin)

    const p = DEFAULT_CAMERA_PRESET.position
    const l = DEFAULT_CAMERA_PRESET.lookAt
    expect(positionSet).toHaveBeenCalledWith(p.x, p.y, p.z)
    expect(cameraLookAt).toHaveBeenCalledWith(l.x, l.y, l.z)
  })

  it('TC-4: null をセットしたときも DEFAULT_CAMERA_PRESET が適用される', () => {
    positionSet.mockClear()
    cameraLookAt.mockClear()

    manager.setPlugin('layer-1', null)

    const p = DEFAULT_CAMERA_PRESET.position
    const l = DEFAULT_CAMERA_PRESET.lookAt
    expect(positionSet).toHaveBeenCalledWith(p.x, p.y, p.z)
    expect(cameraLookAt).toHaveBeenCalledWith(l.x, l.y, l.z)
  })

  it('TC-5: grid-tunnel の cameraPreset は z=5 の正面視点', () => {
    const preset = { position: { x: 0, y: 0, z: 5 }, lookAt: { x: 0, y: 0, z: 0 } }
    const plugin = makePlugin(preset)
    positionSet.mockClear()

    manager.setPlugin('layer-1', plugin)
    expect(positionSet).toHaveBeenCalledWith(0, 0, 5)
  })
})
