/**
 * FreiChen FX Plugin
 * Frei-Chen フィルターによるエッジ検出。
 * ShaderPass + FreiChenShader で実装。
 * デフォルト: enabled=false
 *
 * 公開パラメーター:
 *   width   — aspect.x（レンダラー幅）。create() 時に自動取得し、
 *             スライダーで微調整可能（小さくするほどエッジが太くなる）
 *   height  — aspect.y（レンダラー高さ）。同上。
 */

import * as THREE from 'three'
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js'
import { FreiChenShader } from 'three/examples/jsm/shaders/FreiChenShader.js'
import type { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js'
import type { FXPlugin, PluginParam } from '../../../types'

export class FreiChenPlugin implements FXPlugin {
  readonly id = 'frei-chen'
  readonly name = 'FreiChen'
  readonly renderer = 'threejs'
  enabled = false

  params: Record<string, PluginParam> = {
    width:  { value: 512, min: 64, max: 1920, label: 'Width' },
    height: { value: 512, min: 64, max: 1080, label: 'Height' },
  }

  private pass: ShaderPass | null = null

  create(composer: unknown): void {
    const c = composer as EffectComposer
    // renderer のサイズを自動取得して params に反映
    const w = c.renderer?.domElement?.width  ?? 512
    const h = c.renderer?.domElement?.height ?? 512
    this.params.width.value  = w
    this.params.height.value = h

    this.pass = new ShaderPass(FreiChenShader)
    const u = this.pass.uniforms as Record<string, { value: THREE.Vector2 | null }>
    u['aspect'].value = new THREE.Vector2(w, h)
    this.pass.enabled = this.enabled
    c.addPass(this.pass)
  }

  update(_delta: number, _beat: number): void {
    if (!this.pass) return
    const u = this.pass.uniforms as Record<string, { value: THREE.Vector2 | null }>
    const aspect = u['aspect'].value
    if (aspect instanceof THREE.Vector2) {
      aspect.set(this.params.width.value, this.params.height.value)
    }
    this.pass.enabled = this.enabled
  }

  destroy(): void {
    if (this.pass) {
      this.pass.dispose()
      this.pass = null
    }
  }
}

export const freiChenPlugin = new FreiChenPlugin()
