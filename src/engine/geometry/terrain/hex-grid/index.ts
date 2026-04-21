import type * as THREE from 'three'
import type { GeometryPlugin } from '../../../../application/schema'
import { catalog, defaultParams } from './hex-grid.config'
import { HexGridGeometry } from './HexGridGeometry'

let hexGrid: HexGridGeometry | null = null
let elapsedTime = 0

const hexGridPlugin: GeometryPlugin = {
  id: 'hex-grid',
  name: 'Hex Grid',
  renderer: 'threejs',
  enabled: true,
  catalog,
  params: structuredClone(defaultParams),
  defaultCameraPluginId: 'aerial-camera',
  defaultCameraParams: { height: 20 },

  create(scene: THREE.Scene): void {
    const cols      = Math.round(this.params.cols.value)
    const rows      = Math.round(this.params.rows.value)
    const hexSize   = this.params.hexSize.value
    const hue       = this.params.hue.value
    hexGrid = new HexGridGeometry(cols, rows, hexSize, hue)
    scene.add(hexGrid.getGroup())
  },

  update(delta: number, _beat: number): void {
    if (!hexGrid) return
    elapsedTime += delta
    hexGrid.update(elapsedTime, {
      speed:     this.params.speed.value,
      maxHeight: this.params.maxHeight.value,
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
    if (!hexGrid) return
    scene.remove(hexGrid.getGroup())
    hexGrid.dispose()
    hexGrid = null
    elapsedTime = 0
  },
}

export default hexGridPlugin
