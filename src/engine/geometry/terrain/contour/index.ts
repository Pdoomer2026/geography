import type * as THREE from 'three'
import type { GeometryPlugin } from '../../../../application/schema'
import { defaultParams } from './contour.config'
import { ContourGeometry } from './ContourGeometry'

let contour: ContourGeometry | null = null
let elapsedTime = 0

const contourPlugin: GeometryPlugin = {
  id: 'contour',
  name: 'Contour',
  renderer: 'threejs',
  enabled: true,
  params: structuredClone(defaultParams),
  defaultCameraPluginId: 'static-camera',
  defaultCameraParams: { posX: 0, posY: 10, posZ: 14 },

  create(scene: THREE.Scene): void {
    const segments = Math.round(this.params.segments.value)
    const size = this.params.size.value
    const hue = this.params.hue.value
    contour = new ContourGeometry(segments, size, hue)
    scene.add(contour.getMesh())
  },

  update(delta: number, _beat: number): void {
    if (!contour) return
    elapsedTime += delta
    contour.update(elapsedTime, {
      speed:     this.params.speed.value,
      scale:     this.params.scale.value,
      amplitude: this.params.amplitude.value,
      hue:       this.params.hue.value,
    })
  },

  getParameters() {
    return Object.entries(this.params).map(([id, p]) => ({
      id,
      name: p.label,
      min: p.min,
      max: p.max,
      step: 0.01,
    }))
  },

  destroy(scene: THREE.Scene): void {
    if (!contour) return
    scene.remove(contour.getMesh())
    contour.dispose()
    contour = null
    elapsedTime = 0
  },
}

export default contourPlugin
