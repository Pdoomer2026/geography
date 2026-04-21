/**
 * Film FX Plugin
 * three/examples/jsm の FilmPass を使用。
 * フィルムノイズ・スキャンラインエフェクト。
 * デフォルト: enabled=false / intensity=0.5
 *
 * 公開パラメーター:
 *   intensity  — ノイズ＆スキャンラインの強度 (0=無効 / 1=最大)
 *   grayscale  — 0: カラー / 1: グレースケール
 */

import { FilmPass } from 'three/examples/jsm/postprocessing/FilmPass.js'
import type { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js'
import type { FXPlugin, PluginParam } from '../../../types'

export class FilmPlugin implements FXPlugin {
  readonly id = 'film'
  readonly name = 'Film'
  readonly renderer = 'threejs'
  enabled = false

  params: Record<string, PluginParam> = {
    intensity:  { value: 0.5, min: 0, max: 1, label: 'Intensity' },
    grayscale:  { value: 0,   min: 0, max: 1, label: 'Grayscale' },
  }

  private pass: FilmPass | null = null

  create(composer: unknown): void {
    const c = composer as EffectComposer
    this.pass = new FilmPass(this.params.intensity.value)
    this.pass.enabled = this.enabled
    c.addPass(this.pass)
  }

  update(_delta: number, _beat: number): void {
    if (!this.pass) return
    const u = this.pass.uniforms as Record<string, { value: number }>
    u['intensity'].value = this.params.intensity.value
    u['grayscale'].value = this.params.grayscale.value > 0.5 ? 1 : 0
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

export const filmPlugin = new FilmPlugin()
