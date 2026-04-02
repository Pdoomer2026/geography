/**
 * Feedback FX Plugin
 * 前フレームの出力を現フレームに混ぜるフィードバックループ。
 * ShaderPass + WebGLRenderTarget で実装。
 * デフォルト: enabled=false / amount=0.7
 *
 * 公開パラメーター:
 *   amount  — フィードバック混合率 (0=無効 / 0.95=強残像)
 *   decay   — フィードバックの減衰率。amount に乗算して適用。
 *             1.0=減衰なし / 0.9=急速に消える
 *   offsetX — フィードバックテクスチャの X サンプリングオフセット
 *   offsetY — フィードバックテクスチャの Y サンプリングオフセット
 *             正値で右下に流れる残像、負値で左上に流れる残像
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
    decay:     { value: 1.0 },
    offsetX:   { value: 0.0 },
    offsetY:   { value: 0.0 },
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
    uniform float decay;
    uniform float offsetX;
    uniform float offsetY;
    varying vec2 vUv;

    void main() {
      vec2 feedbackUv = vUv + vec2(offsetX, offsetY);
      vec4 current  = texture2D(tDiffuse,  vUv);
      vec4 feedback = texture2D(tFeedback, feedbackUv) * decay;
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
    amount:  { value: 0.7,  min: 0,     max: 0.95, label: 'Amount' },
    decay:   { value: 1.0,  min: 0.9,   max: 1.0,  label: 'Decay' },
    offsetX: { value: 0.0,  min: -0.05, max: 0.05, label: 'Offset X' },
    offsetY: { value: 0.0,  min: -0.05, max: 0.05, label: 'Offset Y' },
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
    this.pass.uniforms['amount'].value  = this.params.amount.value
    this.pass.uniforms['decay'].value   = this.params.decay.value
    this.pass.uniforms['offsetX'].value = this.params.offsetX.value
    this.pass.uniforms['offsetY'].value = this.params.offsetY.value
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
