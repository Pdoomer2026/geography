import * as THREE from 'three'
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { DEFAULT_CAMERA_PRESET, MAX_LAYERS } from './config'
import { FxStack } from './fxStack'
import type { CameraMode, CSSBlendMode, FXPlugin, GeometryPlugin, Layer } from '../types'

export class LayerManager {
  private layers: Layer[] = []
  private composers: Map<string, EffectComposer> = new Map()

  initialize(container: HTMLElement): void {
    this.dispose()

    if (!container.style.position) {
      container.style.position = 'relative'
    }

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
      canvas.style.zIndex = String(i + 1)
      canvas.style.opacity = '1'
      canvas.style.mixBlendMode = 'normal'
      container.appendChild(canvas)

      const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, preserveDrawingBuffer: true })
      renderer.setSize(container.clientWidth, container.clientHeight)
      renderer.setPixelRatio(window.devicePixelRatio)
      renderer.setClearColor(0x000000, 0)
      renderer.autoClear = false

      const scene = new THREE.Scene()
      const camera = new THREE.PerspectiveCamera(
        75,
        container.clientWidth / container.clientHeight,
        0.1,
        1000,
      )
      // 初期カメラは DEFAULT_CAMERA_PRESET（setPlugin 時にプリセットが上書きされる）
      camera.position.set(
        DEFAULT_CAMERA_PRESET.position.x,
        DEFAULT_CAMERA_PRESET.position.y,
        DEFAULT_CAMERA_PRESET.position.z,
      )
      camera.lookAt(
        DEFAULT_CAMERA_PRESET.lookAt.x,
        DEFAULT_CAMERA_PRESET.lookAt.y,
        DEFAULT_CAMERA_PRESET.lookAt.z,
      )

      const layerId = `layer-${i + 1}`
      const fxStack = new FxStack()

      const composer = new EffectComposer(renderer)
      const renderPass = new RenderPass(scene, camera)
      renderPass.clear = true
      composer.addPass(renderPass)

      this.composers.set(layerId, composer)

      this.layers.push({
        id: layerId,
        canvas,
        renderer,
        scene,
        camera,
        plugin: null,
        opacity: 1,
        blendMode: 'normal',
        fxStack,
        mute: false,
        cameraMode: { type: 'static' },
        cameraAngle: 0,
        controls: null,
      })
    }
  }

  getLayers(): Layer[] {
    return this.layers
  }

  /**
   * FXPlugin 群を受け取り、fxStack に register して
   * EffectComposer に addPass する。
   * engine.initialize() の中で全レイヤーに対して呼ぶ。
   */
  setupFx(layerId: string, fxPlugins: FXPlugin[]): void {
    const layer = this.layers.find((l) => l.id === layerId)
    const composer = this.composers.get(layerId)
    if (!layer || !composer) return

    for (const fx of fxPlugins) {
      layer.fxStack.register(fx)
      fx.create(composer)
    }
  }

  /**
   * Setup APPLY 用：Plugin Lifecycle spec §6
   * 全レイヤーに対して fxStack.applySetup() を呼ぶ。
   * enabledIds に含まれる FX だけ create()、それ以外は destroy() して composer を再構築。
   */
  applyFxSetup(enabledIds: string[]): void {
    for (const layer of this.layers) {
      const composer = this.composers.get(layer.id)
      if (!composer) continue
      layer.fxStack.applySetup(enabledIds, composer)
    }
  }

  setPlugin(layerId: string, plugin: GeometryPlugin | null): void {
    const layer = this.layers.find((entry) => entry.id === layerId)
    if (!layer) return

    // 旧 Plugin を破棄
    if (layer.plugin) {
      layer.plugin.destroy(layer.scene)
    }

    // 旧 OrbitControls を破棄
    if (layer.controls) {
      ;(layer.controls as OrbitControls).dispose()
      layer.controls = null
    }

    layer.plugin = plugin
    if (plugin) {
      plugin.create(layer.scene)
    }

    // カメラプリセット適用（spec: camera-system.spec.md §5）
    const preset = plugin?.cameraPreset ?? DEFAULT_CAMERA_PRESET
    const mode: CameraMode = preset.mode ?? { type: 'static' }
    layer.cameraMode = mode
    layer.cameraAngle = 0

    if (mode.type === 'static') {
      layer.camera.position.set(preset.position.x, preset.position.y, preset.position.z)
      layer.camera.lookAt(preset.lookAt.x, preset.lookAt.y, preset.lookAt.z)

    } else if (mode.type === 'orbit') {
      // 初期位置を angle=0 から計算
      layer.camera.position.set(mode.radius, mode.height, 0)
      layer.camera.lookAt(0, 0, 0)
      // OrbitControls を生成（autoRotate 時は無効化しておく）
      const controls = new OrbitControls(layer.camera, layer.renderer.domElement)
      controls.enabled = !mode.autoRotate
      layer.controls = controls

    } else if (mode.type === 'aerial') {
      // 真上俯瞰の初期位置
      layer.camera.position.set(0, mode.height, 0)
      layer.camera.lookAt(0, 0, 0)
      // OrbitControls: 回転ロック・zoom/pan 有効
      const controls = new OrbitControls(layer.camera, layer.renderer.domElement)
      controls.enableRotate = false
      controls.enableZoom = true
      controls.enablePan = true
      layer.controls = controls
    }
  }

  /**
   * orbit モードのレイヤーの autoRotate を切り替える。
   * 将来の Camera WindowPlugin から呼ぶ接続口（spec: camera-system.spec.md §9）
   */
  setAutoRotate(layerId: string, autoRotate: boolean): void {
    const layer = this.layers.find((l) => l.id === layerId)
    if (!layer) return
    const mode = layer.cameraMode
    if (mode.type !== 'orbit') return
    layer.cameraMode = { ...mode, autoRotate }
    if (layer.controls) {
      ;(layer.controls as OrbitControls).enabled = !autoRotate
    }
  }

  setOpacity(layerId: string, opacity: number): void {
    const layer = this.layers.find((entry) => entry.id === layerId)
    if (!layer) return
    layer.opacity = opacity
    layer.canvas.style.opacity = String(opacity)
  }

  setBlendMode(layerId: string, blendMode: CSSBlendMode): void {
    const layer = this.layers.find((entry) => entry.id === layerId)
    if (!layer) return
    layer.blendMode = blendMode
    layer.canvas.style.mixBlendMode = blendMode
  }

  setMute(layerId: string, mute: boolean): void {
    const layer = this.layers.find((entry) => entry.id === layerId)
    if (!layer) return
    layer.mute = mute
    layer.canvas.style.display = mute ? 'none' : 'block'
  }

  update(delta: number, beat: number): void {
    for (const layer of this.layers) {
      if (layer.mute || !layer.plugin) continue

      layer.plugin.update(delta, beat)
      layer.fxStack.update(delta, beat)

      // カメラモードに応じた更新（spec: camera-system.spec.md §5）
      const mode = layer.cameraMode
      if (mode.type === 'orbit' && mode.autoRotate) {
        layer.cameraAngle += mode.speed * delta
        layer.camera.position.set(
          Math.cos(layer.cameraAngle) * mode.radius,
          mode.height,
          Math.sin(layer.cameraAngle) * mode.radius,
        )
        layer.camera.lookAt(0, 0, 0)
      } else if (
        (mode.type === 'orbit' && !mode.autoRotate) ||
        mode.type === 'aerial'
      ) {
        if (layer.controls) {
          ;(layer.controls as OrbitControls).update()
        }
      }

      const composer = this.composers.get(layer.id)
      const hasFx = layer.fxStack.getOrdered().length > 0
      if (composer && hasFx) {
        composer.render(delta)
      } else {
        layer.renderer.render(layer.scene, layer.camera)
      }
    }
  }

  resize(width: number, height: number): void {
    for (const layer of this.layers) {
      layer.canvas.width = width
      layer.canvas.height = height
      layer.renderer.setSize(width, height)
      layer.camera.aspect = width / height
      layer.camera.updateProjectionMatrix()

      const composer = this.composers.get(layer.id)
      if (composer) {
        composer.setSize(width, height)
      }
    }
  }

  dispose(): void {
    for (const layer of this.layers) {
      if (layer.plugin) {
        layer.plugin.destroy(layer.scene)
      }
      if (layer.controls) {
        ;(layer.controls as OrbitControls).dispose()
      }
      layer.fxStack.dispose()
      layer.renderer.dispose()
      layer.canvas.remove()
    }

    for (const composer of this.composers.values()) {
      composer.dispose()
    }

    this.layers = []
    this.composers.clear()
  }
}

export const layerManager = new LayerManager()
