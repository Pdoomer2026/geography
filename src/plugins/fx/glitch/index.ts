/**
 * Glitch FX Plugin
 * three/examples/jsm の GlitchPass を使用。
 * デフォルト: enabled=false
 *
 * 公開パラメーター:
 *   goWild    — 0: 通常グリッチ / 1: 常時グリッチ (Wild Mode)
 *   interval  — グリッチ発生間隔 (フレーム数)。小さいほど頻繁。
 *               GlitchPass.randX を毎フレーム上書きして固定化する。
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
    goWild:   { value: 0,   min: 0,   max: 1,   label: 'Wild Mode' },
    interval: { value: 120, min: 10,  max: 240, label: 'Interval (frames)' },
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
    // interval パラメーターで randX を固定値に上書き（毎フレーム）
    ;(this.pass as GlitchPass & { randX: number }).randX =
      Math.round(this.params.interval.value)
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

export const glitchPlugin = new GlitchPlugin()
