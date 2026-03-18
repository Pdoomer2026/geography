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
