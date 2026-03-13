import type { LightPlugin } from '../../../types'
import { defaultParams } from './ambient.config'
import { AmbientLightController } from './AmbientLight'

let controller: AmbientLightController | null = null

const ambientPlugin: LightPlugin = {
  id: 'ambient',
  name: 'Ambient Light',
  renderer: 'threejs',
  enabled: true,
  params: structuredClone(defaultParams),

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
