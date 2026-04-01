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

/**
 * ModulatablePlugin（MIDI 2.0 / MacroKnob 制御可能な Plugin の中間層）
 *
 * params を持ち、CC Standard 経由で MacroKnob から外部制御される Plugin はここを継承する。
 * 対象: Geometry / FX / Particle / Light / Sequencer（新設予定）
 * 非対象: Transition / Window / Mixer（params を持たない・外部制御不要）
 *
 * spec: docs/spec/macro-knob.spec.md §2
 */
export interface ModulatablePlugin extends PluginBase {
  /** CC Standard 経由で MacroKnob から制御可能なパラメーター群 */
  params: Record<string, PluginParam>
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
// Camera System（spec: docs/spec/camera-system.spec.md）
// ============================================================

export interface CameraPreset {
  position: { x: number; y: number; z: number }
  lookAt: { x: number; y: number; z: number }
}

// ============================================================
// Geometry / Particle / Light Plugin
// ============================================================

export interface GeometryPlugin extends ModulatablePlugin {
  create(scene: THREE.Scene): void
  update(delta: number, beat: number): void
  destroy(scene: THREE.Scene): void
  /** 推奨カメラ位置。未定義時は DEFAULT_CAMERA_PRESET を使用 */
  cameraPreset?: CameraPreset
}

/** Particle Plugin は Geometry Plugin と同じ Interface */
export interface ParticlePlugin extends GeometryPlugin {}

/** Light Plugin は Geometry Plugin と同じ Interface */
export interface LightPlugin extends GeometryPlugin {}

// ============================================================
// FX Plugin
// ============================================================

export interface FXPlugin extends ModulatablePlugin {
  create(composer: unknown): void // EffectComposer は後で型付け
  update(delta: number, beat: number): void
  destroy(): void
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
  /**
   * Setup APPLY 用：enabledIds に含まれるものだけ create()、
   * それ以外は destroy() してから composer を再構築する。
   * spec: docs/spec/plugin-lifecycle.spec.md §6
   */
  applySetup(enabledIds: string[], composer: unknown): void
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
  /**
   * CC Standard v0.1 のデフォルト CC 番号（ユーザーが上書き可能）
   * 詳細: docs/spec/cc-standard.spec.md §3
   * 例: radius → CC101, speed → CC300, hue → CC400
   */
  defaultCC?: number
}

/**
 * MIDI CC イベント（MIDI 1.0 / MIDI 2.0 共通フォーマット）
 * electron/main.js が変換して IPC 'geo:midi-cc' で送信する。
 * value は main.js 側で 0.0〜1.0 に正規化済み。
 * spec: docs/spec/macro-knob.spec.md §3
 */
export interface MidiCCEvent {
  /** CC番号: MIDI 1.0 = 0〜127 / MIDI 2.0 AC = 0〜32767 */
  cc: number
  /** 正規化済み値: 0.0〜1.0（main.js 側で正規化する） */
  value: number
  protocol: 'midi1' | 'midi2'
  /** MIDI 1.0 = 7bit(128) / MIDI 2.0 = 32bit(4294967296) */
  resolution: 128 | 4294967296
}

export interface MacroKnobConfig {
  /** 'macro-1' 〜 'macro-32' */
  id: string
  /** 表示名（例: 'CHAOS'） */
  name: string
  /** MIDI CC番号: 0〜127（MIDI 1.0）/ 0〜32767（MIDI 2.0 AC）/ -1=未割り当て */
  midiCC: number
  /** 最大 MACRO_KNOB_MAX_ASSIGNS 個 */
  assigns: MacroAssign[]
}

export interface MacroKnobManager {
  getKnobs(): MacroKnobConfig[]
  setKnob(id: string, config: MacroKnobConfig): void
  /**
   * MidiCCEvent を受け取り各 assign の paramId を Command 経由で更新する。
   * event.value は main.js 側で 0.0〜1.0 正規化済み。
   * Phase 14 実装対象（現在は旧シグネチャ handleMidiCC(cc, value) が実装中）
   */
  handleMidiCC(event: MidiCCEvent): void
  /** 0.0〜1.0 に正規化した現在値を返す */
  getValue(knobId: string): number
  /**
   * Sequencer Plugin から値を受け取る（0.0〜1.0）。
   * knobId に対応する assigns の min/max に rangeMap して paramId を更新する。
   * Phase 14 実装対象。
   */
  receiveModulation(knobId: string, value: number): void
}

// ============================================================
// Layer Routing / Screen Assign（spec: docs/spec/program-preview-bus.spec.md §3）
// ============================================================

export interface LayerRouting {
  layerId: string
  outputOpacity: number   // 0.0〜1.0  Output view へのブレンド量
  editOpacity: number     // 0.0〜1.0  Edit view へのブレンド量
}

export type ScreenAssign = 'output' | 'edit'

export interface ScreenAssignState {
  large: ScreenAssign   // デフォルト: 'output'
  small: ScreenAssign   // デフォルト: 'edit'
}

// ============================================================
// Project File（spec: docs/spec/project-file.spec.md §3）
// ============================================================

/**
 * GeoGraphy プロジェクトファイル（.geography）の型定義。
 * ファイルフォーマットバージョンは version フィールドで管理する。
 */
export interface GeoGraphyProject {
  /** フォーマットバージョン（例: "1.0.0"） */
  version: string
  /** 保存日時（ISO 8601） */
  savedAt: string
  /** プロジェクト名 */
  name: string
  /** Setup: 使うプラグインの選択状態 */
  setup: {
    geometry: string[]
    fx: string[]
  }
  /** 現在の描画状態（SceneState 型と同一） */
  sceneState: SceneState
  /** 各プラグインのプリセットファイル参照（任意） */
  presetRefs: Record<string, string>
}

/** プロジェクトファイルのフォーマットバージョン */
export const PROJECT_FILE_VERSION = '1.0.0'
