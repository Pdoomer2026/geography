/**
 * AfterImage FX Plugin
 * three/examples/jsm の AfterimagePass を使用（クラス名は小文字 i）。
 * デフォルト: enabled=true / damp=0.85
 */

import { AfterimagePass } from 'three/examples/jsm/postprocessing/AfterimagePass.js'
import type { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js'
import type { FXPlugin, PluginParam } from '../../../types'

export class AfterImagePlugin implements FXPlugin {
  readonly id = 'after-image'
  readonly name = 'AfterImage'
  readonly renderer = 'threejs'
  enabled = false

  params: Record<string, PluginParam> = {
    damp: { value: 0.85, min: 0, max: 1, label: 'Damp' },
  }

  private pass: AfterimagePass | null = null

  create(composer: unknown): void {
    const c = composer as EffectComposer
    this.pass = new AfterimagePass(this.params.damp.value)
    this.pass.enabled = this.enabled
    c.addPass(this.pass)
  }

  update(_delta: number, _beat: number): void {
    if (!this.pass) return
    this.pass.uniforms['damp'].value = this.params.damp.value
    this.pass.enabled = this.enabled
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

export const afterImagePlugin = new AfterImagePlugin()
