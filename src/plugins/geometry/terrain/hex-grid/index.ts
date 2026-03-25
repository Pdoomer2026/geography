import type * as THREE from 'three'
import type { GeometryPlugin } from '../../../../types'
import { defaultParams } from './hex-grid.config'
import { HexGridGeometry } from './HexGridGeometry'

let hexGrid: HexGridGeometry | null = null
let elapsedTime = 0

const hexGridPlugin: GeometryPlugin = {
  id: 'hex-grid',
  name: 'Hex Grid',
  renderer: 'threejs',
  enabled: true,
  params: structuredClone(defaultParams),
  cameraPreset: {
    position: { x: 0, y: 20, z: 5 },
    lookAt:   { x: 0, y: 0,  z: 0 },
  },

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

  destroy(scene: THREE.Scene): void {
    if (!hexGrid) return
    scene.remove(hexGrid.getGroup())
    hexGrid.dispose()
    hexGrid = null
    elapsedTime = 0
  },
}

export default hexGridPlugin
