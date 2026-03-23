import * as THREE from 'three'
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js'
import { DEFAULT_CAMERA_PRESET, MAX_LAYERS } from './config'
import { FxStack } from './fxStack'
import type { CSSBlendMode, FXPlugin, GeometryPlugin, Layer } from '../types'

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

      const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true })
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

      // EffectComposer は FX 登録後に setupComposer() で構築する
      // ここでは null を入れておき、型合わせのためダミーを作成
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
      })
    }
  }

  getLayers(): Layer[] {
    return this.layers
  }

  /**
   * FXPlugin 群を受け取り、fxStack に register して
   * EffectComposer に addPass する。
   * engine.initialize() の中で mute でないレイヤーのみ呼ぶ。
   */
  setupFx(layerId: string, fxPlugins: FXPlugin[]): void {
    const layer = this.layers.find((l) => l.id === layerId)
    const composer = this.composers.get(layerId)
    if (!layer || !composer) return

    for (const fx of fxPlugins) {
      layer.fxStack.register(fx)
      fx.create(composer) // EffectComposer に直接 addPass
    }
  }

  setPlugin(layerId: string, plugin: GeometryPlugin | null): void {
    const layer = this.layers.find((entry) => entry.id === layerId)
    if (!layer) return

    if (layer.plugin) {
      layer.plugin.destroy(layer.scene)
    }

    layer.plugin = plugin
    if (plugin) {
      plugin.create(layer.scene)
    }

    // カメラプリセット適用（spec: camera-system.spec.md）
    const preset = plugin?.cameraPreset ?? DEFAULT_CAMERA_PRESET
    layer.camera.position.set(preset.position.x, preset.position.y, preset.position.z)
    layer.camera.lookAt(preset.lookAt.x, preset.lookAt.y, preset.lookAt.z)
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
