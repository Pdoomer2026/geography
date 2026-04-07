import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { CameraPlugin, GeometryPlugin } from '../../src/types'
import { LayerManager } from '../../src/core/layerManager'

// ============================================================
// Three.js モック
// ============================================================

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
    domElement = document.createElement('canvas')
    constructor(_: unknown) {}
    setSize(): void {}
    setPixelRatio(): void {}
    setClearColor(): void {}
    render = vi.fn()
    dispose = rendererDispose
    autoClear = false
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
    clear = false
    constructor(_scene: unknown, _camera: unknown) {}
  }
  return { RenderPass }
})

// ============================================================
// Camera Plugin モック
// ============================================================

const mockCameraMount = vi.fn()
const mockCameraUpdate = vi.fn()
const mockCameraDispose = vi.fn()

function makeStaticCamera(overrideParams?: Record<string, number>): CameraPlugin {
  const params = {
    posX:    { value: overrideParams?.posX    ?? 0,  min: -50, max: 50, label: 'Pos X' },
    posY:    { value: overrideParams?.posY    ?? 8,  min: -50, max: 50, label: 'Pos Y' },
    posZ:    { value: overrideParams?.posZ    ?? 12, min: -50, max: 50, label: 'Pos Z' },
    lookAtX: { value: 0, min: -50, max: 50, label: 'LookAt X' },
    lookAtY: { value: 0, min: -50, max: 50, label: 'LookAt Y' },
    lookAtZ: { value: 0, min: -50, max: 50, label: 'LookAt Z' },
  }
  return {
    id: 'static-camera',
    name: 'Static Camera',
    renderer: 'threejs',
    enabled: true,
    params,
    mount: mockCameraMount,
    update: mockCameraUpdate,
    dispose: mockCameraDispose,
  }
}

function makeOrbitCamera(): CameraPlugin {
  return {
    id: 'orbit-camera',
    name: 'Orbit Camera',
    renderer: 'threejs',
    enabled: true,
    params: {
      radius:     { value: 10,  min: 1,   max: 50,  label: 'Radius' },
      height:     { value: 3,   min: -20, max: 30,  label: 'Height' },
      speed:      { value: 0.5, min: 0.0, max: 3.0, label: 'Speed' },
      autoRotate: { value: 1,   min: 0,   max: 1,   label: 'Auto Rotate' },
    },
    mount: mockCameraMount,
    update: mockCameraUpdate,
    dispose: mockCameraDispose,
  }
}

// ============================================================
// Camera Plugin Registry モック
// ============================================================

vi.mock('../../src/plugins/cameras', () => ({
  getCameraPlugin: (id: string) => {
    // 毎回新しいインスタンスを返す（実装のファクトリパターンを再現）
    if (id === 'static-camera') return makeStaticCamera()
    if (id === 'orbit-camera')  return makeOrbitCamera()
    return undefined
  },
  listCameraPlugins: () => [makeStaticCamera(), makeOrbitCamera()],
}))

// ============================================================
// Geometry Plugin ヘルパー
// ============================================================

function makeGeometryPlugin(opts?: {
  defaultCameraPluginId?: string
  defaultCameraParams?: Record<string, number>
}): GeometryPlugin {
  return {
    id: 'test-geometry',
    name: 'Test',
    renderer: 'threejs',
    enabled: true,
    params: {},
    defaultCameraPluginId: opts?.defaultCameraPluginId,
    defaultCameraParams:   opts?.defaultCameraParams,
    create:  vi.fn(),
    update:  vi.fn(),
    destroy: vi.fn(),
  }
}

// ============================================================
// テスト
// ============================================================

describe('Camera Plugin System', () => {
  let manager: LayerManager
  let container: HTMLDivElement

  beforeEach(() => {
    positionSet.mockClear()
    cameraLookAt.mockClear()
    rendererDispose.mockClear()
    composerDispose.mockClear()
    mockCameraMount.mockClear()
    mockCameraUpdate.mockClear()
    mockCameraDispose.mockClear()
    orbitControlsInstance = null

    manager = new LayerManager()
    container = document.createElement('div')
    Object.defineProperty(container, 'clientWidth',  { configurable: true, value: 640 })
    Object.defineProperty(container, 'clientHeight', { configurable: true, value: 360 })
    document.body.appendChild(container)
    manager.initialize(container)
  })

  // --- TC-1: 初期化時の Camera Plugin ---

  it('TC-1: 初期化時に static-camera が各レイヤーに mount される', () => {
    // MAX_LAYERS=3 分の mount が呼ばれているはず
    expect(mockCameraMount).toHaveBeenCalledTimes(3)
  })

  // --- TC-2: Geometry Plugin の defaultCameraPluginId 連動 ---

  it('TC-2: defaultCameraPluginId を持つ Plugin をセットすると対応 Camera が mount される', () => {
    mockCameraMount.mockClear()
    mockCameraDispose.mockClear()

    const plugin = makeGeometryPlugin({ defaultCameraPluginId: 'orbit-camera' })
    manager.setPlugin('layer-1', plugin)

    // 旧 Camera.dispose → 新 Camera.mount の順
    expect(mockCameraDispose).toHaveBeenCalledTimes(1)
    expect(mockCameraMount).toHaveBeenCalledTimes(1)
    const cam = manager.getCameraPlugin('layer-1')
    expect(cam?.id).toBe('orbit-camera')
  })

  // --- TC-3: defaultCameraPluginId なし → static-camera がデフォルト ---

  it('TC-3: defaultCameraPluginId を持たない Plugin には static-camera が連動する', () => {
    mockCameraMount.mockClear()
    mockCameraDispose.mockClear()

    const plugin = makeGeometryPlugin()
    manager.setPlugin('layer-1', plugin)

    const cam = manager.getCameraPlugin('layer-1')
    expect(cam?.id).toBe('static-camera')
  })

  // --- TC-4: defaultCameraParams が Camera Plugin の params に反映される ---

  it('TC-4: defaultCameraParams が Camera Plugin の params に上書きされる', () => {
    const plugin = makeGeometryPlugin({
      defaultCameraPluginId: 'static-camera',
      defaultCameraParams: { posX: 0, posY: 10, posZ: 14 },
    })
    manager.setPlugin('layer-1', plugin)

    const cam = manager.getCameraPlugin('layer-1')
    expect(cam?.params.posY.value).toBe(10)
    expect(cam?.params.posZ.value).toBe(14)
  })

  // --- TC-5: setCameraPlugin で userOverride=true が立つ ---

  it('TC-5: setCameraPlugin() を呼ぶと isCameraUserOverridden が true になる', () => {
    const orbitCam = makeOrbitCamera()
    manager.setCameraPlugin('layer-1', orbitCam, undefined, true)

    const layer = manager.getLayers().find((l) => l.id === 'layer-1')
    expect(layer?.isCameraUserOverridden).toBe(true)
  })

  // --- TC-6: isCameraUserOverridden=true のとき Geometry 切り替えで Camera が変わらない ---

  it('TC-6: isCameraUserOverridden=true のとき setPlugin() しても Camera が追従しない', () => {
    // 最初に手動でカメラを設定
    const orbitCam = makeOrbitCamera()
    manager.setCameraPlugin('layer-1', orbitCam, undefined, true)

    mockCameraDispose.mockClear()
    mockCameraMount.mockClear()

    // orbit-camera を defaultCameraPluginId に持たない Geometry を設定
    const plugin = makeGeometryPlugin({ defaultCameraPluginId: 'static-camera' })
    manager.setPlugin('layer-1', plugin)

    // Camera Plugin が変わっていないこと（mount が呼ばれていない）
    expect(mockCameraMount).not.toHaveBeenCalled()
    const cam = manager.getCameraPlugin('layer-1')
    expect(cam?.id).toBe('orbit-camera')
  })

  // --- TC-7: update() で cameraPlugin.update(delta) が呼ばれる ---

  it('TC-7: update() を呼ぶと cameraPlugin.update(delta) が呼ばれる', () => {
    const plugin = makeGeometryPlugin()
    manager.setPlugin('layer-1', plugin)
    mockCameraUpdate.mockClear()

    manager.update(0.016, 0)
    expect(mockCameraUpdate).toHaveBeenCalledWith(0.016)
  })

  // --- TC-8: dispose() で cameraPlugin.dispose() が呼ばれる ---

  it('TC-8: dispose() を呼ぶと全レイヤーの cameraPlugin.dispose() が呼ばれる', () => {
    mockCameraDispose.mockClear()
    manager.dispose()
    expect(mockCameraDispose).toHaveBeenCalledTimes(3)
  })

  // --- TC-9: Camera Plugin ごとに独立した params インスタンスを持つ ---

  it('TC-9: 各レイヤーの Camera Plugin は独立した params を持つ', () => {
    const layers = manager.getLayers()
    const cam1 = layers[0]?.cameraPlugin
    const cam2 = layers[1]?.cameraPlugin
    // モックが毎回新インスタンスを返すため、cam1 と cam2 は別オブジェクト
    expect(cam1).not.toBe(cam2)
    // params の値を一方だけ書き換えてもう一方に影響しない
    if (cam1 && cam2) {
      const originalVal = cam2.params.posY?.value ?? 0
      if (cam1.params.posY !== undefined) {
        cam1.params.posY.value = 999
      }
      expect(cam2.params.posY?.value).toBe(originalVal)
    }
  })
})
