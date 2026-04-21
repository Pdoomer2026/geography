/**
 * Mirror FX Plugin
 * UV 座標を反転して左右（または上下）ミラーを作る。
 * デフォルト: enabled=false / horizontal=1（左右ミラー）
 */

import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js'
import type { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js'
import type { FXPlugin, PluginParam } from '../../../types'

const MirrorShader = {
  uniforms: {
    tDiffuse:   { value: null },
    horizontal: { value: 1.0 },
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
    uniform float horizontal;
    varying vec2 vUv;

    void main() {
      vec2 uv = vUv;
      if (horizontal > 0.5) {
        uv.x = uv.x < 0.5 ? uv.x * 2.0 : (1.0 - uv.x) * 2.0;
      } else {
        uv.y = uv.y < 0.5 ? uv.y * 2.0 : (1.0 - uv.y) * 2.0;
      }
      gl_FragColor = texture2D(tDiffuse, uv);
    }
  `,
}

export class MirrorPlugin implements FXPlugin {
  readonly id = 'mirror'
  readonly name = 'Mirror'
  readonly renderer = 'threejs'
  enabled = false

  params: Record<string, PluginParam> = {
    horizontal: { value: 1, min: 0, max: 1, label: 'Horizontal' },
  }

  private pass: ShaderPass | null = null

  create(composer: unknown): void {
    const c = composer as EffectComposer
    this.pass = new ShaderPass(MirrorShader)
    this.pass.enabled = this.enabled
    c.addPass(this.pass)
  }

  update(_delta: number, _beat: number): void {
    if (!this.pass) return
    this.pass.uniforms['horizontal'].value = this.params.horizontal.value
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

export const mirrorPlugin = new MirrorPlugin()
