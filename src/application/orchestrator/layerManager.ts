import * as THREE from 'three'
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js'
import { getCameraPlugin } from '../../engine/cameras'
import { DEFAULT_CAMERA_PLUGIN_ID, MAX_LAYERS } from '../schema/config'
import { FxStack } from './fxStack'
import type { CameraPlugin, CSSBlendMode, FXPlugin, GeometryPlugin, Layer } from '../schema'

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

      layer.cameraPlugin.update(delta)

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
