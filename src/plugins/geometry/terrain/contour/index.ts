import type * as THREE from 'three'
import type { GeometryPlugin } from '../../../../types'
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
  cameraPreset: {
    position: { x: 0, y: 10, z: 14 },
    lookAt:   { x: 0, y: 0,  z: 0  },
  },

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

  destroy(scene: THREE.Scene): void {
    if (!contour) return
    scene.remove(contour.getMesh())
    contour.dispose()
    contour = null
    elapsedTime = 0
  },
}

export default contourPlugin
