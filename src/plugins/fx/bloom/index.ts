/**
 * Bloom FX Plugin
 * three/examples/jsm の UnrealBloomPass を使用。
 * デフォルト: enabled=true / strength=0.8 / radius=0.4 / threshold=0.1
 */

import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js'
import { Vector2 } from 'three'
import type { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js'
import type { FXPlugin, PluginParam } from '../../../types'

export class BloomPlugin implements FXPlugin {
  readonly id = 'bloom'
  readonly name = 'Bloom'
  readonly renderer = 'threejs'
  enabled = false

  params: Record<string, PluginParam> = {
    strength:  { value: 0.8, min: 0, max: 3, label: 'Strength'  },
    radius:    { value: 0.4, min: 0, max: 1, label: 'Radius'    },
    threshold: { value: 0.1, min: 0, max: 1, label: 'Threshold' },
  }

  private pass: UnrealBloomPass | null = null

  create(composer: unknown): void {
    const c = composer as EffectComposer
    this.pass = new UnrealBloomPass(
      new Vector2(256, 256),
      this.params.strength.value,
      this.params.radius.value,
      this.params.threshold.value,
    )
    this.pass.enabled = this.enabled
    c.addPass(this.pass)
  }

  update(_delta: number, _beat: number): void {
    if (!this.pass) return
    this.pass.strength  = this.params.strength.value
    this.pass.radius    = this.params.radius.value
    this.pass.threshold = this.params.threshold.value
    this.pass.enabled   = this.enabled
  }

  getParameters() {
    return Object.entries(this.params).map(([id, p]) => ({
      id, name: p.label, min: p.min, max: p.max,
      step: (p.max - p.min) / 100,
    }))
  }

  destroy(): void {
    if (this.pass) {
      this.pass.dispose()
      this.pass = null
    }
  }
}

export const bloomPlugin = new BloomPlugin()
