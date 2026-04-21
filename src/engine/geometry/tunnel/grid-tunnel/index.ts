import type * as THREE from 'three'
import type { GeometryPlugin } from '../../../../types'
import { defaultParams } from './grid-tunnel.config'
import { GridTunnelGeometry } from './GridTunnelGeometry'

let tunnel: GridTunnelGeometry | null = null

const gridTunnelPlugin: GeometryPlugin = {
  id: 'grid-tunnel',
  name: 'Grid Tunnel',
  renderer: 'threejs',
  enabled: true,
  params: structuredClone(defaultParams),
  defaultCameraPluginId: 'static-camera',
  defaultCameraParams: { posX: 0, posY: 0, posZ: 5 },

  create(scene: THREE.Scene): void {
    tunnel = new GridTunnelGeometry({
      radius:   this.params.radius.value,
      segments: Math.round(this.params.segments.value),
      rings:    Math.round(this.params.rings.value),
      length:   this.params.length.value,
      hue:      this.params.hue.value,
    })
    scene.add(tunnel.getGroup())
  },

  update(delta: number, _beat: number): void {
    if (!tunnel) return
    tunnel.update(delta, {
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
    if (!tunnel) return
    scene.remove(tunnel.getGroup())
    tunnel.dispose()
    tunnel = null
  },
}

export default gridTunnelPlugin
