/**
 * Feedback FX Plugin
 * 前フレームの出力を現フレームに混ぜるフィードバックループ。
 * ShaderPass + WebGLRenderTarget で実装。
 * デフォルト: enabled=false / amount=0.7
 */

import * as THREE from 'three'
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js'
import type { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js'
import type { FXPlugin, PluginParam } from '../../../types'

const FeedbackShader = {
  uniforms: {
    tDiffuse:  { value: null as THREE.Texture | null },
    tFeedback: { value: null as THREE.Texture | null },
    amount:    { value: 0.7 },
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
    uniform sampler2D tFeedback;
    uniform float amount;
    varying vec2 vUv;

    void main() {
      vec4 current  = texture2D(tDiffuse,  vUv);
      vec4 feedback = texture2D(tFeedback, vUv);
      gl_FragColor  = mix(current, feedback, amount);
    }
  `,
}

export class FeedbackPlugin implements FXPlugin {
  readonly id = 'feedback'
  readonly name = 'Feedback'
  readonly renderer = 'threejs'
  enabled = false

  params: Record<string, PluginParam> = {
    amount: { value: 0.7, min: 0, max: 0.95, label: 'Amount' },
  }

  private pass: ShaderPass | null = null
  private renderTarget: THREE.WebGLRenderTarget | null = null

  create(composer: unknown): void {
    const c = composer as EffectComposer
    // renderer が存在しない環境（テスト等）でも安全に動作するよう fallback
    const w = (c.renderer?.domElement?.width) ?? 256
    const h = (c.renderer?.domElement?.height) ?? 256
    this.renderTarget = new THREE.WebGLRenderTarget(w, h)
    this.pass = new ShaderPass(FeedbackShader)
    this.pass.uniforms['tFeedback'].value = this.renderTarget.texture
    this.pass.enabled = this.enabled
    c.addPass(this.pass)
  }

  update(_delta: number, _beat: number): void {
    if (!this.pass) return
    this.pass.uniforms['amount'].value = this.params.amount.value
    this.pass.enabled = this.enabled
  }

  destroy(): void {
    if (this.pass) {
      this.pass.dispose()
      this.pass = null
    }
    if (this.renderTarget) {
      this.renderTarget.dispose()
      this.renderTarget = null
    }
  }
}

export const feedbackPlugin = new FeedbackPlugin()
