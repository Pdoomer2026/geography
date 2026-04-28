import * as THREE from 'three'
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js'
import { getCameraPlugin } from '../../engine/cameras'
import { DEFAULT_CAMERA_PLUGIN_ID, MAX_LAYERS } from '../schema/config'
import { FxStack } from './fxStack'
import type { CameraPlugin, CSSBlendMode, FXPlugin, GeometryPlugin, Layer, LayerInstance, LayerPreset, LayerRuntime } from '../schema'
import { registry } from '../registry/registry'

export class LayerManager {
  private layers: Layer[] = []
  private composers: Map<string, EffectComposer> = new Map()
  private styleChangedListeners: Set<() => void> = new Set()
  private presetAppliedListeners: Set<(layerId: string) => void> = new Set()
  private runtimes: Map<string, LayerRuntime> = new Map()
  private pendingPresets: Map<string, LayerPreset> = new Map()

  onStyleChanged(cb: () => void): () => void {
    this.styleChangedListeners.add(cb)
    return () => this.styleChangedListeners.delete(cb)
  }

  onPresetApplied(cb: (layerId: string) => void): () => void {
    this.presetAppliedListeners.add(cb)
    return () => this.presetAppliedListeners.delete(cb)
  }

  private notifyStyleChanged(): void {
    for (const cb of this.styleChangedListeners) cb()
  }

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

      const layerId = `layer-${i + 1}`
      const fxStack = new FxStack()

      const composer = new EffectComposer(renderer)
      const renderPass = new RenderPass(scene, camera)
      renderPass.clear = true
      composer.addPass(renderPass)

      this.composers.set(layerId, composer)

      const camPlugin = getCameraPlugin(DEFAULT_CAMERA_PLUGIN_ID)
      if (!camPlugin) {
        throw new Error(`[LayerManager] default camera plugin '${DEFAULT_CAMERA_PLUGIN_ID}' not found`)
      }
      camPlugin.mount(camera, renderer)

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
        cameraPlugin: camPlugin,
        isCameraUserOverridden: false,
      })

      this.runtimes.set(layerId, {
        layerId,
        active: { id: `instance-init-${layerId}`, presetId: '', layerId },
        next: null,
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
   */
  applyFxSetup(enabledIds: string[]): void {
    for (const layer of this.layers) {
      const composer = this.composers.get(layer.id)
      if (!composer) continue
      layer.fxStack.applySetup(enabledIds, composer)
    }
  }

  applyFxSetupPerLayer(fxPerLayer: Record<string, string[]>): void {
    for (const layer of this.layers) {
      const composer = this.composers.get(layer.id)
      if (!composer) continue
      const enabledIds = fxPerLayer[layer.id] ?? []
      layer.fxStack.applySetup(enabledIds, composer)
    }
  }

  /**
   * Camera Plugin をレイヤーにアサインする。
   * spec: docs/spec/camera-plugin.spec.md §5-B
   */
  setCameraPlugin(
    layerId: string,
    plugin: CameraPlugin,
    overrideParams?: Record<string, number>,
    userOverride = false,
  ): void {
    const layer = this.layers.find((l) => l.id === layerId)
    if (!layer) return

    layer.cameraPlugin.dispose()

    if (overrideParams) {
      for (const [key, val] of Object.entries(overrideParams)) {
        if (key in plugin.params) {
          plugin.params[key].value = val
        }
      }
    }

    layer.cameraPlugin = plugin
    layer.cameraPlugin.mount(layer.camera, layer.renderer)

    if (userOverride) {
      layer.isCameraUserOverridden = true
    }
  }

  getCameraPlugin(layerId: string): CameraPlugin | null {
    const layer = this.layers.find((l) => l.id === layerId)
    return layer?.cameraPlugin ?? null
  }

  /**
   * Preset を元に次の LayerInstance を裏で準備し next にセットする。
   * 実際の差し替えは次の update() フレームで行われる（ダブルバッファ）。
   * UI からは engine 経由でのみ呼ぶこと（直接呼び出し禁止）。
   * spec: docs/spec/layer-window.spec.md §3
   */
  replaceLayerPreset(layerId: string, preset: LayerPreset): void {
    const runtime = this.runtimes.get(layerId)
    if (!runtime) return

    const next: LayerInstance = {
      id: `instance-${Date.now()}`,
      presetId: preset.id,
      layerId,
    }
    this.pendingPresets.set(layerId, preset)
    runtime.next = next
  }

  /**
   * Preset の内容をレイヤーに即時適用する内部ヘルパー。
   * update() のフレームループ内からのみ呼ぶ。
   * params は維持（Preset はPlugin 構成のみを変える）。
   * spec: docs/spec/layer-window.spec.md §3.4
   */
  private _applyPresetToLayer(layerId: string, preset: LayerPreset): void {
    const layer = this.layers.find((l) => l.id === layerId)
    const composer = this.composers.get(layerId)
    if (!layer) return

    // 1. Geometry 差し替え: factory があれば新規インスタンスを生成（モジュール共有変数問題を回避）
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

    // 2. Camera 差し替え（params は現在値を維持・userOverride リセット）
    const camPlugin = getCameraPlugin(preset.cameraPluginId)
    if (camPlugin) {
      layer.isCameraUserOverridden = false
      this.setCameraPlugin(layerId, camPlugin)
    } else {
      console.warn(`[LayerManager] Camera Plugin not found: ${preset.cameraPluginId}`)
    }

    // 3. FX 差し替え（レイヤー単位で applySetup）
    if (composer) {
      layer.fxStack.applySetup(preset.fxPluginIds, composer)
    }

    // Preset 適用完了を通知（engine が Registry と UI を同期）
    for (const cb of this.presetAppliedListeners) cb(layerId)
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

      if (!layer.isCameraUserOverridden) {
        const camId = plugin.defaultCameraPluginId ?? DEFAULT_CAMERA_PLUGIN_ID
        const camPlugin = getCameraPlugin(camId) ?? getCameraPlugin(DEFAULT_CAMERA_PLUGIN_ID)
        if (camPlugin) {
          this.setCameraPlugin(layerId, camPlugin, plugin.defaultCameraParams)
        }
      }
    }
  }

  setOpacity(layerId: string, opacity: number): void {
    const layer = this.layers.find((entry) => entry.id === layerId)
    if (!layer) return
    layer.opacity = opacity
    layer.canvas.style.opacity = String(opacity)
    this.notifyStyleChanged()
  }

  setBlendMode(layerId: string, blendMode: CSSBlendMode): void {
    const layer = this.layers.find((entry) => entry.id === layerId)
    if (!layer) return
    layer.blendMode = blendMode
    layer.canvas.style.mixBlendMode = blendMode
    this.notifyStyleChanged()
  }

  setMute(layerId: string, mute: boolean): void {
    const layer = this.layers.find((entry) => entry.id === layerId)
    if (!layer) return
    layer.mute = mute
    layer.canvas.style.display = mute ? 'none' : 'block'
    this.notifyStyleChanged()
  }

  update(delta: number, beat: number): void {
    // ダブルバッファ swap: next が存在するレイヤーを差し替える
    for (const runtime of this.runtimes.values()) {
      if (runtime.next) {
        const preset = this.pendingPresets.get(runtime.layerId)
        if (preset) {
          this._applyPresetToLayer(runtime.layerId, preset)
          this.pendingPresets.delete(runtime.layerId)
        }
        runtime.active = runtime.next
        runtime.next = null
      }
    }

    for (const layer of this.layers) {
      if (layer.mute || !layer.plugin) continue

      layer.plugin.update(delta, beat)
      layer.fxStack.update(delta, beat)

      layer.cameraPlugin.update(delta)

      const composer = this.composers.get(layer.id)
      const hasFx = layer.fxStack.getOrdered().length > 0
      if (composer && hasFx) {
        composer.render(delta)
      } else {
        layer.renderer.clearColor()
        layer.renderer.clearDepth()
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
      layer.cameraPlugin.dispose()
      layer.fxStack.dispose()
      layer.renderer.dispose()
      layer.canvas.remove()
    }

    for (const composer of this.composers.values()) {
      composer.dispose()
    }

    this.layers = []
    this.composers.clear()
    this.runtimes.clear()
    this.pendingPresets.clear()
  }

  /**
   * Geometry Plugin を destroy → create で再構築する。
   * spec: docs/spec/geometry-plugin.spec.md §9
   */
  rebuildPlugin(layerId: string): void {
    const layer = this.layers.find((l) => l.id === layerId)
    if (!layer || !layer.plugin) return
    layer.plugin.destroy(layer.scene)
    layer.plugin.create(layer.scene)
  }
}

export const layerManager = new LayerManager()
