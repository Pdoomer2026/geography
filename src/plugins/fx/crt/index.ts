/**
 * CRT FX Plugin
 * スキャンライン＋樽型歪みで CRT モニター風エフェクト。
 * デフォルト: enabled=false
 */

import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js'
import type { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js'
import type { FXPlugin, PluginParam } from '../../../types'

const CRTShader = {
  uniforms: {
    tDiffuse:          { value: null },
    scanlineIntensity: { value: 0.5 },
    curvature:         { value: 0.1 },
    time:              { value: 0.0 },
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
    uniform float scanlineIntensity;
    uniform float curvature;
    uniform float time;
    varying vec2 vUv;

    vec2 curve(vec2 uv, float bend) {
      uv = uv * 2.0 - 1.0;
      uv += uv.yx * uv.yx * bend;
      return uv * 0.5 + 0.5;
    }

    void main() {
      vec2 uv = curve(vUv, curvature);
      if (uv.x < 0.0 || uv.x > 1.0 || uv.y < 0.0 || uv.y > 1.0) {
        gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0);
        return;
      }
      vec4 color = texture2D(tDiffuse, uv);
      float scanline = sin(uv.y * 800.0 + time * 10.0) * 0.5 + 0.5;
      color.rgb *= 1.0 - scanlineIntensity * (1.0 - scanline);
      gl_FragColor = color;
    }
  `,
}

export class CRTPlugin implements FXPlugin {
  readonly id = 'crt'
  readonly name = 'CRT'
  readonly renderer = 'threejs'
  enabled = false

  params: Record<string, PluginParam> = {
    scanlineIntensity: { value: 0.5, min: 0, max: 1,   label: 'Scanline'  },
    curvature:         { value: 0.1, min: 0, max: 0.5, label: 'Curvature' },
  }

  private pass: ShaderPass | null = null
  private time = 0

  create(composer: unknown): void {
    const c = composer as EffectComposer
    this.pass = new ShaderPass(CRTShader)
    this.pass.enabled = this.enabled
    c.addPass(this.pass)
  }

  update(delta: number, _beat: number): void {
    if (!this.pass) return
    this.time += delta
    this.pass.uniforms['scanlineIntensity'].value = this.params.scanlineIntensity.value
    this.pass.uniforms['curvature'].value         = this.params.curvature.value
    this.pass.uniforms['time'].value              = this.time
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

export const crtPlugin = new CRTPlugin()
