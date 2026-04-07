import type * as THREE from 'three'
import type { GeometryPlugin } from '../../../../types'
import { defaultParams } from './torusknot.config'
import { TorusknotGeometry } from './TorusknotGeometry'

let torusknot: TorusknotGeometry | null = null
let elapsedTime = 0

const torusknotPlugin: GeometryPlugin = {
  id: 'torusknot',
  name: 'Torus Knot',
  renderer: 'threejs',
  enabled: true,
  params: structuredClone(defaultParams),
  defaultCameraPluginId: 'orbit-camera',
  defaultCameraParams: { radius: 10, height: 3, speed: 0.6, autoRotate: 1 },

  create(scene: THREE.Scene): void {
    const radius      = this.params.radius.value
    const tube        = this.params.tube.value
    const tubularSegs = Math.round(this.params.tubularSegs.value)
    const radialSegs  = Math.round(this.params.radialSegs.value)
    const p           = Math.round(this.params.p.value)
    const q           = Math.round(this.params.q.value)
    const hue         = this.params.hue.value
    torusknot = new TorusknotGeometry(radius, tube, tubularSegs, radialSegs, p, q, hue)
    scene.add(torusknot.getMesh())
  },

  update(delta: number, _beat: number): void {
    if (!torusknot) return
    elapsedTime += delta
    torusknot.update(elapsedTime, {
      speed: this.params.speed.value,
      hue:   this.params.hue.value,
    })
  },

  destroy(scene: THREE.Scene): void {
    if (!torusknot) return
    scene.remove(torusknot.getMesh())
    torusknot.dispose()
    torusknot = null
    elapsedTime = 0
  },
}

export default torusknotPlugin
