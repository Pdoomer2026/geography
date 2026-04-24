import type * as THREE from 'three'
import type { GeometryPlugin } from '../../../../application/schema'
import { catalog, defaultParams } from './torus.config'
import { TorusGeometryWrapper } from './TorusGeometryWrapper'

let torus: TorusGeometryWrapper | null = null
let elapsedTime = 0

const torusPlugin: GeometryPlugin = {
  id: 'torus',
  name: 'Torus',
  renderer: 'threejs',
  enabled: true,
  catalog,
  params: structuredClone(defaultParams),
  defaultCameraPluginId: 'orbit-camera',
  defaultCameraParams: { radius: 12, height: 4, speed: 0.4, autoRotate: 1 },

  create(scene: THREE.Scene): void {
    const radius      = this.params.radius.value
    const tube        = this.params.tube.value
    const radialSegs  = Math.round(this.params.radialSegs.value)
    const tubularSegs = Math.round(this.params.tubularSegs.value)
    const hue         = this.params.hue.value
    torus = new TorusGeometryWrapper(radius, tube, radialSegs, tubularSegs, hue)
    scene.add(torus.getMesh())
  },

  update(delta: number, _beat: number): void {
    if (!torus) return
    elapsedTime += delta
    torus.update(elapsedTime, {
      speed: this.params.speed.value,
      hue:   this.params.hue.value,
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
    if (!torus) return
    scene.remove(torus.getMesh())
    torus.dispose()
    torus = null
    elapsedTime = 0
  },
}

export default torusPlugin
