/**
 * Kaleidoscope FX Plugin
 * UV を極座標に変換して角度を折り返す万華鏡エフェクト。
 * デフォルト: enabled=false / segments=6
 */

import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js'
import type { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js'
import type { FXPlugin, PluginParam } from '../../../types'

const KaleidoscopeShader = {
  uniforms: {
    tDiffuse: { value: null },
    segments: { value: 6.0 },
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
    #define PI 3.14159265358979
    uniform sampler2D tDiffuse;
    uniform float segments;
    uniform float angle;
    varying vec2 vUv;

    void main() {
      vec2 p = vUv - 0.5;
      float r = length(p);
      float a = atan(p.y, p.x) + angle;
      float slice = PI * 2.0 / segments;
      a = mod(a, slice);
      if (a > slice * 0.5) a = slice - a;
      vec2 uv = vec2(cos(a), sin(a)) * r + 0.5;
      gl_FragColor = texture2D(tDiffuse, uv);
    }
  `,
}

export class KaleidoscopePlugin implements FXPlugin {
  readonly id = 'kaleidoscope'
  readonly name = 'Kaleidoscope'
  readonly renderer = 'threejs'
  enabled = false

  params: Record<string, PluginParam> = {
    segments: { value: 6,   min: 2,    max: 16,   label: 'Segments' },
    angle:    { value: 0.0, min: 0,    max: 6.28, label: 'Angle'    },
  }

  private pass: ShaderPass | null = null

  create(composer: unknown): void {
    const c = composer as EffectComposer
    this.pass = new ShaderPass(KaleidoscopeShader)
    this.pass.enabled = this.enabled
    c.addPass(this.pass)
  }

  update(_delta: number, _beat: number): void {
    if (!this.pass) return
    this.pass.uniforms['segments'].value = this.params.segments.value
    this.pass.uniforms['angle'].value    = this.params.angle.value
    this.pass.enabled = this.enabled
  }

  destroy(): void {
    if (this.pass) {
      this.pass.dispose()
      this.pass = null
    }
  }
}

export const kaleidoscopePlugin = new KaleidoscopePlugin()
