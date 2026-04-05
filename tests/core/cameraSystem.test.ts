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

const orbitControlsDispose = vi.fn()
const orbitControlsUpdate = vi.fn()
let orbitControlsInstance: {
  enabled: boolean
  enableRotate: boolean
  enableZoom: boolean
  enablePan: boolean
  dispose: () => void
  update: () => void
} | null = null

vi.mock('three/examples/jsm/controls/OrbitControls.js', () => {
  class OrbitControls {
    enabled = true
    enableRotate = true
    enableZoom = true
    enablePan = true
    dispose = orbitControlsDispose
    update = orbitControlsUpdate
    constructor(_camera: unknown, _domElement: unknown) {
      orbitControlsInstance = this
    }
  }
  return { OrbitControls }
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

  it('TC-6: orbit モードの Plugin をセットすると cameraMode が orbit になる', () => {
    const preset = {
      position: { x: 10, y: 3, z: 0 },
      lookAt: { x: 0, y: 0, z: 0 },
      mode: { type: 'orbit' as const, radius: 10, height: 3, speed: 0.5, autoRotate: true },
    }
    const plugin = makePlugin(preset)
    manager.setPlugin('layer-1', plugin)

    const layer = manager.getLayers().find((l) => l.id === 'layer-1')
    expect(layer?.cameraMode.type).toBe('orbit')
  })

  it('TC-7: orbit + autoRotate:true で update() を呼ぶとカメラ position が変化する', () => {
    const preset = {
      position: { x: 10, y: 3, z: 0 },
      lookAt: { x: 0, y: 0, z: 0 },
      mode: { type: 'orbit' as const, radius: 10, height: 3, speed: 1.0, autoRotate: true },
    }
    const plugin = makePlugin(preset)
    manager.setPlugin('layer-1', plugin)
    positionSet.mockClear()

    manager.update(0.5, 0)
    // angle = 0.5 * 1.0 = 0.5rad → position が変化しているはず
    expect(positionSet).toHaveBeenCalled()
    const [x, , z] = positionSet.mock.calls[0] as [number, number, number]
    expect(x).toBeCloseTo(Math.cos(0.5) * 10, 3)
    expect(z).toBeCloseTo(Math.sin(0.5) * 10, 3)
  })

  it('TC-8: aerial モードは enableRotate=false が設定される', () => {
    orbitControlsInstance = null
    const preset = {
      position: { x: 0, y: 20, z: 0 },
      lookAt: { x: 0, y: 0, z: 0 },
      mode: { type: 'aerial' as const, height: 20 },
    }
    const plugin = makePlugin(preset)
    manager.setPlugin('layer-1', plugin)

    expect(orbitControlsInstance).not.toBeNull()
    expect(orbitControlsInstance?.enableRotate).toBe(false)
    expect(orbitControlsInstance?.enableZoom).toBe(true)
  })

  it('TC-9: setAutoRotate(false) で autoRotate フラグが切り替わる', () => {
    const preset = {
      position: { x: 10, y: 3, z: 0 },
      lookAt: { x: 0, y: 0, z: 0 },
      mode: { type: 'orbit' as const, radius: 10, height: 3, speed: 0.5, autoRotate: true },
    }
    const plugin = makePlugin(preset)
    manager.setPlugin('layer-1', plugin)

    manager.setAutoRotate('layer-1', false)

    const layer = manager.getLayers().find((l) => l.id === 'layer-1')
    const mode = layer?.cameraMode
    expect(mode?.type).toBe('orbit')
    if (mode?.type === 'orbit') {
      expect(mode.autoRotate).toBe(false)
    }
    // OrbitControls が enabled になっているはず
    expect(orbitControlsInstance?.enabled).toBe(true)
  })
})
