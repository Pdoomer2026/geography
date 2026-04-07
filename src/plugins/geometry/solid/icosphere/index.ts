import type * as THREE from 'three'
import type { GeometryPlugin } from '../../../../types'
import { defaultParams } from './icosphere.config'
import { IcosphereGeometry } from './IcosphereGeometry'

let icosphere: IcosphereGeometry | null = null
let elapsedTime = 0

const icospherePlugin: GeometryPlugin = {
  id: 'icosphere',
  name: 'Icosphere',
  renderer: 'threejs',
  enabled: true,
  params: structuredClone(defaultParams),
  defaultCameraPluginId: 'orbit-camera',
  defaultCameraParams: { radius: 10, height: 3, speed: 0.5, autoRotate: 1 },

  create(scene: THREE.Scene): void {
    const detail = Math.round(this.params.detail.value)
    const radius = this.params.radius.value
    const hue = this.params.hue.value
    icosphere = new IcosphereGeometry(detail, radius, hue)
    scene.add(icosphere.getMesh())
  },

  update(delta: number, _beat: number): void {
    if (!icosphere) return
    elapsedTime += delta
    icosphere.update(elapsedTime, {
      speed: this.params.speed.value,
      hue:   this.params.hue.value,
    })
  },

  destroy(scene: THREE.Scene): void {
    if (!icosphere) return
    scene.remove(icosphere.getMesh())
    icosphere.dispose()
    icosphere = null
    elapsedTime = 0
  },
}

export default icospherePlugin
