import type { LightPlugin } from '../../../types'
import { defaultParams } from './ambient.config'
import { AmbientLightController } from './AmbientLight'

let controller: AmbientLightController | null = null

const ambientPlugin: LightPlugin = {
  id: 'ambient',
  name: 'Ambient Light',
  renderer: 'threejs',
  // Light Plugin はレイヤーに単独で割り当てるものではなく、
  // geometry/particle シーンに直接追加するもの。
  // registry.list().filter(enabled) でレイヤー割り当てから除外するため false にする。
  // v2 で Light Plugin 専用の管理システムを実装予定。
  enabled: false,
  params: structuredClone(defaultParams),

  getParameters() {
    return Object.entries(this.params).map(([id, p]) => ({
      id, name: p.label, min: p.min, max: p.max,
      step: (p.max - p.min) / 100,
    }))
  },

  create(scene) {
    controller = new AmbientLightController()
    controller.create(scene, this.params.intensity.value)
  },

  update(_delta, _beat) {
    controller?.update(this.params.intensity.value)
  },

  destroy(scene) {
    controller?.destroy(scene)
    controller = null
  },
}

export default ambientPlugin
