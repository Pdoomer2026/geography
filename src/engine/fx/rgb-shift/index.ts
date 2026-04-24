/**
 * RGBShift FX Plugin
 * ShaderPass + カスタム GLSL で RGB チャンネルをずらす。
 * デフォルト: enabled=true / amount=0.001
 */

import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js'
import type { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js'
import type { FXPlugin, PluginParam } from '../../../application/schema'

const RGBShiftShader = {
  uniforms: {
    tDiffuse: { value: null },
    amount:   { value: 0.001 },
    angle:    { value: 0.0 },
  },
  vertexShader: `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    uniform sampler2D tDiffuse;
    uniform float amount;
    uniform float angle;
    varying vec2 vUv;

    void main() {
      vec2 offset = amount * vec2(cos(angle), sin(angle));
      vec4 cr = texture2D(tDiffuse, vUv + offset);
      vec4 cg = texture2D(tDiffuse, vUv);
      vec4 cb = texture2D(tDiffuse, vUv - offset);
      gl_FragColor = vec4(cr.r, cg.g, cb.b, cg.a);
    }
  `,
}

export class RGBShiftPlugin implements FXPlugin {
  readonly id = 'rgb-shift'
  readonly name = 'RGB Shift'
  readonly renderer = 'threejs'
  enabled = false

  params: Record<string, PluginParam> = {
    amount: { value: 0.001, min: 0, max: 0.05, label: 'Amount' },
    angle:  { value: 0.0,   min: 0, max: 6.28, label: 'Angle'  },
  }

  private pass: ShaderPass | null = null

  create(composer: unknown): void {
    const c = composer as EffectComposer
    this.pass = new ShaderPass(RGBShiftShader)
    this.pass.enabled = this.enabled
    c.addPass(this.pass)
  }

  update(_delta: number, _beat: number): void {
    if (!this.pass) return
    this.pass.uniforms['amount'].value = this.params.amount.value
    this.pass.uniforms['angle'].value  = this.params.angle.value
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

export const rgbShiftPlugin = new RGBShiftPlugin()
