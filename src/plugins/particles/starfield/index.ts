import type { ParticlePlugin } from '../../../types'
import { defaultParams } from './starfield.config'
import { StarfieldParticle } from './StarfieldParticle'

let starfield: StarfieldParticle | null = null

const starfieldPlugin: ParticlePlugin = {
  id: 'starfield',
  name: 'Starfield',
  params: structuredClone(defaultParams),

  create(scene) {
    starfield = new StarfieldParticle(
      Math.round(this.params.count.value),
      this.params.depth.value,
    )
    scene.add(starfield.getPoints())
  },

  update(delta, _beat) {
    if (!starfield) return
    starfield.update(delta, {
      speed:   this.params.speed.value,
      size:    this.params.size.value,
      opacity: this.params.opacity.value,
      depth:   this.params.depth.value,
    })
  },

  destroy(scene) {
    if (!starfield) return
    scene.remove(starfield.getPoints())
    starfield.dispose()
    starfield = null
  },
}

export default starfieldPlugin
