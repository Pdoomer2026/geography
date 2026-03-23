/**
 * Glitch FX Plugin
 * three/examples/jsm の GlitchPass を使用。
 * デフォルト: enabled=false
 */

import { GlitchPass } from 'three/examples/jsm/postprocessing/GlitchPass.js'
import type { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js'
import type { FXPlugin, PluginParam } from '../../../types'

export class GlitchPlugin implements FXPlugin {
  readonly id = 'glitch'
  readonly name = 'Glitch'
  readonly renderer = 'threejs'
  enabled = false

  params: Record<string, PluginParam> = {
    goWild: { value: 0, min: 0, max: 1, label: 'Wild Mode' },
  }

  private pass: GlitchPass | null = null

  create(composer: unknown): void {
    const c = composer as EffectComposer
    this.pass = new GlitchPass()
    this.pass.goWild = this.params.goWild.value > 0.5
    this.pass.enabled = this.enabled
    c.addPass(this.pass)
  }

  update(_delta: number, _beat: number): void {
    if (!this.pass) return
    this.pass.goWild = this.params.goWild.value > 0.5
    this.pass.enabled = this.enabled
  }

  destroy(): void {
    if (this.pass) {
      this.pass.dispose()
      this.pass = null
    }
  }
}

export const glitchPlugin = new GlitchPlugin()
