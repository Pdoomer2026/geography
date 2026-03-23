import * as THREE from 'three'
import { MAX_LAYERS } from './config'
import type { CSSBlendMode, GeometryPlugin, Layer } from '../types'

export class LayerManager {
  private layers: Layer[] = []

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

      const scene = new THREE.Scene()
      const camera = new THREE.PerspectiveCamera(
        75,
        container.clientWidth / container.clientHeight,
        0.1,
        1000
      )
      camera.position.z = 5

      this.layers.push({
        id: `layer-${i + 1}`,
        canvas,
        renderer,
        scene,
        camera,
        plugin: null,
        opacity: 1,
        blendMode: 'normal',
        fx: [],
        mute: false,
      })
    }
  }

  getLayers(): Layer[] {
    return this.layers
  }

  setPlugin(layerId: string, plugin: GeometryPlugin): void {
    const layer = this.layers.find((entry) => entry.id === layerId)
    if (!layer) return

    if (layer.plugin) {
      layer.plugin.destroy(layer.scene)
    }

    layer.plugin = plugin
    plugin.create(layer.scene)
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
      layer.renderer.render(layer.scene, layer.camera)
    }
  }

  resize(width: number, height: number): void {
    for (const layer of this.layers) {
      layer.canvas.width = width
      layer.canvas.height = height
      layer.renderer.setSize(width, height)
      layer.camera.aspect = width / height
      layer.camera.updateProjectionMatrix()
    }
  }

  dispose(): void {
    for (const layer of this.layers) {
      if (layer.plugin) {
        layer.plugin.destroy(layer.scene)
      }
      layer.renderer.dispose()
      layer.canvas.remove()
    }

    this.layers = []
  }
}

export const layerManager = new LayerManager()
