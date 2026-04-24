import type * as THREE from 'three'
import type { GeometryPlugin } from '../../../../application/schema'
import { catalog, defaultParams } from './grid-wave.config'
import { GridWaveGeometry } from './GridWaveGeometry'

let gridWave: GridWaveGeometry | null = null
let elapsedTime = 0

const gridWavePlugin: GeometryPlugin = {
  id: 'grid-wave',
  name: 'Grid Wave',
  renderer: 'threejs',
  enabled: true,
  catalog,
  params: structuredClone(defaultParams),

  create(scene: THREE.Scene): void {
    const segments = Math.round(this.params.segments.value)
    const size = this.params.size.value
    gridWave = new GridWaveGeometry(segments, size)
    scene.add(gridWave.getMesh())
  },

  update(delta: number, _beat: number): void {
    if (!gridWave) return
    elapsedTime += delta
    gridWave.update(elapsedTime, {
      speed:     this.params.speed.value,
      amplitude: this.params.amplitude.value,
      frequency: this.params.frequency.value,
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
    if (!gridWave) return
    scene.remove(gridWave.getMesh())
    gridWave.dispose()
    gridWave = null
    elapsedTime = 0
  },
}

export default gridWavePlugin
