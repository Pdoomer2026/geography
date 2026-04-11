import type * as THREE from 'three'
import type { FC } from 'react'
import type { ParameterSchema } from './midi-registry'
export type { ParameterSchema } from './midi-registry'

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
 * params を持ち、CC Standard 経由で MidiManager から外部制御される Plugin はここを継承する。
 * 対象: Geometry / FX / Particle / Light / Camera / Sequencer（新設予定）
 * 非対象: Transition / Window / Mixer（params を持たない・外部制御不要）
 *
 * spec: docs/spec/macro-knob.spec.md §3
 */
export interface ModulatablePlugin extends PluginBase {
  /** CC Standard 経由で MidiManager から制御可能なパラメーター群 */
  params: Record<string, PluginParam>
  /** MIDI Registry への登録用。params から ParameterSchema[] に変換して返す */
  getParameters(): ParameterSchema[]
}

// ============================================================
// パラメーター定義
// ============================================================

export interface PluginParam {
  value: number
  min: number
  max: number
  label: string
  /**
   * true のとき、この param を変更すると Geometry Plugin の destroy→create が発生する。
   * mesh の頂点数や形状が変わる param（segments / size / radius 等）に設定する。
   * spec: docs/spec/geometry-plugin.spec.md §9
   */
  requiresRebuild?: boolean
  /**
   * UI 上の可動域の下限（省略時は min と同じ）。
   * SimpleWindow のスライダーで絞った範囲を保持する。
   * MacroKnob D&D アサイン時の初期 min 値としても使われる。
   * Day52 追加
   */
  rangeMin?: number
  /**
   * UI 上の可動域の上限（省略時は max と同じ）。
   * Day52 追加
   */
  rangeMax?: number
}

// ============================================================
// Camera Plugin（spec: docs/spec/camera-plugin.spec.md）
// ============================================================

export interface CameraPlugin extends ModulatablePlugin {
  mount(camera: THREE.PerspectiveCamera, renderer: THREE.WebGLRenderer): void
  update(delta: number): void
  dispose(): void
}

// ============================================================
// Geometry / Particle / Light Plugin
// ============================================================

export interface GeometryPlugin extends ModulatablePlugin {
  create(scene: THREE.Scene): void
  update(delta: number, beat: number): void
  destroy(scene: THREE.Scene): void
  defaultCameraPluginId?: string
  defaultCameraParams?: Record<string, number>
}

/** Particle Plugin は Geometry Plugin と同じ Interface */
export interface ParticlePlugin extends GeometryPlugin {}

/** Light Plugin は Geometry Plugin と同じ Interface */
export interface LightPlugin extends GeometryPlugin {}

// ============================================================
// FX Plugin
// ============================================================

export interface FXPlugin extends ModulatablePlugin {
  create(composer: unknown): void
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
 */
export interface IFxStack {
  register(plugin: FXPlugin): void
  getOrdered(): FXPlugin[]
  buildComposer(composer: unknown): void
  update(delta: number, beat: number): void
  dispose(): void
  setEnabled(fxId: string, enabled: boolean): void
  getPlugin(fxId: string): FXPlugin | undefined
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
  fxStack: IFxStack
  mute: boolean
  cameraPlugin: CameraPlugin
  isCameraUserOverridden: boolean
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
  /**
   * CC Standard の CC 番号（ccMapService が提供する実効値）
   * spec: docs/spec/cc-mapping.spec.md §9
   */
  ccNumber: number
  min: number
  max: number
  curve: CurveType
}

/**
 * TransportEvent（旧: MidiCCEvent）
 * spec: docs/spec/transport-architecture.spec.md §2
 *
 * slot: プロトコル非依存の抽象 ID（現在は CC番号と同値。将来 OSC 等に対応するとき分離する）
 * source: ループ防止用・入力元の識別（省略可）
 * time: イベントのタイムスタンプ ms（省略可）
 *
 * protocol / resolution は Input Wrapper が吸収するため廃止（Day58）
 */
export interface TransportEvent {
  slot: number
  value: number
  source?: 'window' | 'plugin' | 'midi' | 'osc'
  time?: number
}

export interface MacroKnobConfig {
  id: string
  name: string
  midiCC: number
  assigns: MacroAssign[]
}

/**
 * MacroKnobManager — 32ノブのUI設定管理
 * spec: docs/spec/macro-knob.spec.md §3
 *
 * ノブの名前・MIDI CC番号・アサイン設定・現在値キャッシュを管理する。
 * CC入力の処理は MidiManager が担当する（Day50 責務分離）。
 */
export interface MacroKnobManager {
  getKnobs(): MacroKnobConfig[]
  setKnob(id: string, config: MacroKnobConfig): void
  addAssign(knobId: string, assign: MacroAssign): void
  removeAssign(knobId: string, paramId: string): void
  /** 0.0〜1.0 に正規化した現在値を返す（表示用キャッシュ） */
  getValue(knobId: string): number
  /** MidiManager から書かれる現在値キャッシュの更新 */
  setValue(knobId: string, value: number): void
}

/**
 * MidiManager — CC入力の唯一の通路
 * spec: docs/spec/macro-knob.spec.md §3
 *
 * 全入力源（物理MIDI / SimpleWindow / Sequencer / LFO / AI）が
 * engine.handleMidiCC(MidiCCEvent) 経由でここに流れ込む。
 * Day50 新設・MacroKnobManager から handleMidiCC / receiveModulation を移管。
 */
export interface MidiManager {
  init(store: { set(paramId: string, value: number): void }, knobManager: MacroKnobManager): void
  handleMidiCC(event: TransportEvent): void
  receiveModulation(knobId: string, value: number): void
}

// ============================================================
// Layer Routing / Screen Assign（spec: docs/spec/program-preview-bus.spec.md §3）
// ============================================================

export interface LayerRouting {
  layerId: string
  outputOpacity: number
  editOpacity: number
}

export type ScreenAssign = 'output' | 'edit'

export interface ScreenAssignState {
  large: ScreenAssign
  small: ScreenAssign
}

// ============================================================
// Project File（spec: docs/spec/project-file.spec.md §3）
// ============================================================

export interface GeoGraphyProject {
  version: string
  savedAt: string
  name: string
  setup: {
    geometry: string[]
    fx: string[]
  }
  sceneState: SceneState
  macroKnobAssigns: MacroKnobConfig[]
  presetRefs: Record<string, string>
}

/** プロジェクトファイルのフォーマットバージョン */
export const PROJECT_FILE_VERSION = '1.0.0'

// ============================================================
// Plugin Preset（spec: docs/spec/project-file.spec.md §4）
// ============================================================

/**
 * 個別 Plugin のパラメーターセットを保存する。
 * 保存先: localStorage `geography:geo-presets-v1`（便宜的）→ 将来 GeoGraphyProject に統合
 */
export interface PluginPreset {
  version: string              // '1.0.0'
  savedAt: string              // ISO 8601
  pluginId: string             // 'icosphere' 等
  name: string                 // ユーザーが付けた名前
  params: Record<string, number>  // paramKey → value
}

/** localStorage キー */
export const GEO_PRESET_STORE_KEY = 'geography:geo-presets-v1'



/**
 * D&D ドラッグペイロード（パラメーター側 ↔ MacroKnob側 共通）
 *
 * Phase 1: 'param' | 'macroKnob'
 * Phase 2 (Sequencer): | 'sequencerLane' を追加するだけで拡張できる
 */
export interface DragPayload {
  type: 'param' | 'macroKnob'
  id: string        // paramId or knobId
  layerId: string   // アサイン元のレイヤー ID（'layer-1' 等）
  pluginId: string  // アサイン元の Plugin ID（表示用）
  ccNumber: number  // CC Standard の番号
  min: number       // スライダー可動域 min
  max: number       // スライダー可動域 max
}
