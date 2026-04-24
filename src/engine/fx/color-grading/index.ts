/**
 * ColorGrading FX Plugin
 * FX スタックの最後に配置する（厳守）。
 * Saturation / Contrast / Brightness を GLSL で制御。
 * デフォルト: enabled=true / 各パラメーター 1.0
 */

import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js'
import type { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js'
import type { FXPlugin, PluginParam } from '../../../application/schema'

const ColorGradingShader = {
  uniforms: {
    tDiffuse:   { value: null },
    saturation: { value: 1.0 },
    contrast:   { value: 1.0 },
    brightness: { value: 1.0 },
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
    uniform float saturation;
    uniform float contrast;
    uniform float brightness;
    varying vec2 vUv;

    vec3 adjustSaturation(vec3 color, float sat) {
      float luminance = dot(color, vec3(0.2126, 0.7152, 0.0722));
      return mix(vec3(luminance), color, sat);
    }

    void main() {
      vec4 texel = texture2D(tDiffuse, vUv);
      vec3 color = texel.rgb;
      color *= brightness;
      color = (color - 0.5) * contrast + 0.5;
      color = adjustSaturation(color, saturation);
      gl_FragColor = vec4(clamp(color, 0.0, 1.0), texel.a);
    }
  `,
}

export class ColorGradingPlugin implements FXPlugin {
  readonly id = 'color-grading'
  readonly name = 'Color Grading'
  readonly renderer = 'threejs'
  enabled = false

  params: Record<string, PluginParam> = {
    saturation: { value: 1.0, min: 0, max: 2, label: 'Saturation' },
    contrast:   { value: 1.0, min: 0, max: 2, label: 'Contrast'   },
    brightness: { value: 1.0, min: 0, max: 2, label: 'Brightness' },
  }

  private pass: ShaderPass | null = null

  create(composer: unknown): void {
    const c = composer as EffectComposer
    this.pass = new ShaderPass(ColorGradingShader)
    this.pass.enabled = this.enabled
    c.addPass(this.pass)
  }

  update(_delta: number, _beat: number): void {
    if (!this.pass) return
    this.pass.uniforms['saturation'].value = this.params.saturation.value
    this.pass.uniforms['contrast'].value   = this.params.contrast.value
    this.pass.uniforms['brightness'].value = this.params.brightness.value
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

export const colorGradingPlugin = new ColorGradingPlugin()
