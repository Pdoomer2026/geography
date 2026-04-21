/**
 * ZoomBlur FX Plugin
 * 放射状ブラー（中心から外側に向かってサンプルをぼかす）。
 * デフォルト: enabled=false / strength=0.5
 */

import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js'
import type { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js'
import type { FXPlugin, PluginParam } from '../../../types'

const ZoomBlurShader = {
  uniforms: {
    tDiffuse: { value: null },
    strength: { value: 0.5 },
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
    uniform float strength;
    varying vec2 vUv;

    void main() {
      vec2 toCenter = vec2(0.5) - vUv;
      vec4 color = vec4(0.0);
      float total = 0.0;
      const int SAMPLES = 12;
      for (int i = 0; i < SAMPLES; i++) {
        float t = float(i) / float(SAMPLES - 1);
        float weight = 1.0 - t * 0.5;
        vec2 uv = vUv + toCenter * t * strength * 0.1;
        color += texture2D(tDiffuse, uv) * weight;
        total += weight;
      }
      gl_FragColor = color / total;
    }
  `,
}

export class ZoomBlurPlugin implements FXPlugin {
  readonly id = 'zoom-blur'
  readonly name = 'Zoom Blur'
  readonly renderer = 'threejs'
  enabled = false

  params: Record<string, PluginParam> = {
    strength: { value: 0.5, min: 0, max: 2, label: 'Strength' },
  }

  private pass: ShaderPass | null = null

  create(composer: unknown): void {
    const c = composer as EffectComposer
    this.pass = new ShaderPass(ZoomBlurShader)
    this.pass.enabled = this.enabled
    c.addPass(this.pass)
  }

  update(_delta: number, _beat: number): void {
    if (!this.pass) return
    this.pass.uniforms['strength'].value = this.params.strength.value
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

export const zoomBlurPlugin = new ZoomBlurPlugin()
