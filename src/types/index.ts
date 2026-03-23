import type * as THREE from 'three'
import type { FC } from 'react'

// ============================================================
// PluginBase（すべての Plugin の共通基底）
// ============================================================

export interface PluginBase {
  id: string
  name: string
  /** v1: 'threejs' / v2: 'pixijs' / v3: 'opentype' */
  renderer: 'threejs' | 'pixijs' | 'opentype' | string
  /** false のとき Registry は update() を呼ばない */
  enabled: boolean
}

// ============================================================
// パラメーター定義
// ============================================================

export interface PluginParam {
  value: number
  min: number
  max: number
  label: string
}

// ============================================================
// Geometry / Particle / Light Plugin
// ============================================================

export interface GeometryPlugin extends PluginBase {
  create(scene: THREE.Scene): void
  update(delta: number, beat: number): void
  destroy(scene: THREE.Scene): void
  params: Record<string, PluginParam>
}

/** Particle Plugin は Geometry Plugin と同じ Interface */
export interface ParticlePlugin extends GeometryPlugin {}

/** Light Plugin は Geometry Plugin と同じ Interface */
export interface LightPlugin extends GeometryPlugin {}

// ============================================================
// FX Plugin
// ============================================================

export interface FXPlugin extends PluginBase {
  create(composer: unknown): void // EffectComposer は後で型付け
  update(delta: number, beat: number): void
  destroy(): void
  params: Record<string, PluginParam>
}

export type CSSBlendMode =
  | 'normal'
  | 'add'
  | 'multiply'
  | 'screen'
  | 'overlay'

/**
 * FxStack の公開インターフェース（循環参照回避のため types/ 内に定義）
 * 実装は src/core/fxStack.ts。
 */
export interface IFxStack {
  register(plugin: FXPlugin): void
  getOrdered(): FXPlugin[]
  buildComposer(composer: unknown): void
  update(delta: number, beat: number): void
  dispose(): void
  setEnabled(fxId: string, enabled: boolean): void
  getPlugin(fxId: string): FXPlugin | undefined
}

export interface Layer {
  id: string
  canvas: HTMLCanvasElement
  renderer: THREE.WebGLRenderer
  scene: THREE.Scene
  camera: THREE.PerspectiveCamera
  plugin: GeometryPlugin | null
  opacity: number
  blendMode: CSSBlendMode
  /** FX ポストプロセッシングスタック */
  fxStack: IFxStack
  mute: boolean
}

// ============================================================
// Window Plugin
// ============================================================

export interface WindowPlugin extends PluginBase {
  component: FC
}

// ============================================================
// SceneState（Program / Preview バスの核心）
// ============================================================

export interface FxState {
  fxId: string
  params: Record<string, number>
  enabled: boolean
}

export interface LayerState {
  geometryId: string
  geometryParams: Record<string, number>
  fxStack: FxState[]
  opacity: number
  blendMode: string
}

export interface SceneState {
  layers: LayerState[]
}

// ============================================================
// Transition Plugin
// ============================================================

export interface TransitionPlugin extends PluginBase {
  duration: number
  category: 'pixel' | 'parameter' | 'bpm'
  execute(from: SceneState, to: SceneState, progress: number): SceneState
  /** プルダウン表示用のプレビュー説明文 */
  preview: string
}

// ============================================================
// Mixer Plugin
// ============================================================

export interface MixerPlugin {
  id: string
  name: string
  renderer: string
  enabled: boolean
  /** 閉じることができない Window Plugin として機能する React FC */
  component: FC
}

// ============================================================
// Modulator Driver
// ============================================================

export interface ModulatorDriver {
  id: string
  name: string
  getValue(paramId: string): number | null
}

// ============================================================
// Macro Knob System（spec: docs/spec/macro-knob.spec.md）
// ============================================================

/** v1: linear のみ / v2 で exp・log・s-curve を追加予定 */
export type CurveType = 'linear'

export interface MacroAssign {
  paramId: string
  min: number
  max: number
  curve: CurveType
}

export interface MacroKnobConfig {
  /** 'macro-1' 〜 'macro-32' */
  id: string
  /** 表示名（例: 'CHAOS'） */
  name: string
  /** MIDI CC番号: 0〜127 */
  midiCC: number
  /** 最大 MACRO_KNOB_MAX_ASSIGNS 個 */
  assigns: MacroAssign[]
}

export interface MacroKnobManager {
  getKnobs(): MacroKnobConfig[]
  setKnob(id: string, config: MacroKnobConfig): void
  /** value: 0〜127 の MIDI CC値を受け取り、各 assign の paramId を Command 経由で更新 */
  handleMidiCC(cc: number, value: number): void
  /** 0.0〜1.0 に正規化した現在値を返す */
  getValue(knobId: string): number
}
