import type { GeoParamAddress } from './geoParamAddress'
export type { GeoParamAddress } from './geoParamAddress'
export { toGeoParamAddress, parseGeoParamAddress, isGeoParamAddress } from './geoParamAddress'

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
 * params を持ち、CC Standard 経由で TransportManager から外部制御される Plugin はここを継承する。
 * 対象: Geometry / FX / Particle / Light / Camera / Sequencer（新設予定）
 * 非対象: Transition / Window / Mixer（params を持たない・外部制御不要）
 *
 * spec: docs/spec/macro-knob.spec.md §3
 */
export interface ModulatablePlugin extends PluginBase {
  /**
   * パラメーターの静的定義（カタログ）
   * spec: docs/spec/param-catalog.spec.md
   * optional: 段階的移行のため。catalog 対応済み Plugin のみ持つ。
   */
  catalog?: PluginCatalog
  /** CC Standard 経由で TransportManager から制御可能なパラメーター群 */
  params: Record<string, PluginParam>
  /** MIDI Registry への登録用。params から ParameterSchema[] に変換して返す */
  getParameters(): ParameterSchema[]
}

// ============================================================
// ParamCatalog（静的定義）
// spec: docs/spec/param-catalog.spec.md
// ============================================================

/**
 * Plugin パラメーターの静的定義エントリ。
 * 実行時状態（現在値・UI 可動域）は PluginParam が管理する。
 */
export interface ParamCatalogEntry {
  /** paramId（Record のキーと一致・明示的に保持） */
  id: string
  /** UI 表示名 */
  label: string
  /** パラメーター型（v1 は number / boolean のみ） */
  type: 'number' | 'boolean'
  /** 最小値（type: 'number' のみ有効） */
  min: number
  /** 最大値（type: 'number' のみ有効） */
  max: number
  /** デフォルト値（Plugin リセット時に参照） */
  default: number
  /** UI スライダーのステップ（省略時 0.001） */
  step?: number
  /** UI ヒント（将来: 'select' / 'color' 等を追加） */
  ui: 'slider' | 'toggle'
  /**
   * true のとき、この param の変更で Geometry Plugin の destroy→create が発生する。
   * spec: docs/spec/geometry-plugin.spec.md §9
   */
  requiresRebuild?: boolean
  /**
   * この param の変更が引き起こす処理の実行戦略。
   * 省略時は 'sync'（デフォルト・リアルタイム即時反映）。
   * 'async' を指定すると ExecutionPlanner が BullMQ キューに投げる。
   * spec: docs/spec/execution-planner.spec.md §4
   */
  execution?: 'sync' | 'async'
}

/** Plugin ごとのカタログ（paramId → 静的定義） */
export type PluginCatalog = Record<string, ParamCatalogEntry>

// ============================================================
// パラメーター定義（実行時状態）
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
  cameraId: string                    // Day60: カメラ種別を保存
  cameraParams: Record<string, number> // Day60: カメラパラメータ値を保存
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
  geoParamAddress: GeoParamAddress
  /**
   * CC Standard の CC 番号（ccMapService が提供する実効値）
   * spec: docs/spec/cc-mapping.spec.md §9
   */
  ccNumber: number
  /** アサイン元のレイヤー ID（'layer-1' 等）。全レイヤー同時書き込みを防ぐ */
  layerId: string
  min: number
  max: number
  curve: CurveType
}

/**
 * TransportEvent（旧: MidiCCEvent）
 * spec: docs/spec/transport-architecture.spec.md §2
 *
 * slot: プロトコル非依存の抽象 ID。MIDI 1.0 の全アドレス空間を 4096 値で表現。
 *   CC 空間:   slot = channel * 128 + cc         （範囲: 0 〜 2047）
 *     ch0, CC7  → slot 7    （Track Fader 1）
 *     ch1, CC7  → slot 135  （Track Fader 2）
 *     ch0, CC48 → slot 48   （Track Knob 1）
 *   Note 空間: slot = 2048 + channel * 128 + note （範囲: 2048 〜 4095）
 *     ch0, Note 82 → slot 2130 （Scene Launch 1）
 *     ch0, Note 52 → slot 2100 （Clip Stop Track 1）
 *     ch1, Note 52 → slot 2228 （Clip Stop Track 2）
 *   OSC / Sequencer 等将来プロトコル: Input Wrapper 内で同じ slot 空間に変換する
 *   spec: docs/spec/midi-learn.spec.md §slot-encoding
 *
 * source: ループ防止用・入力元の識別（省略可）
 * time: イベントのタイムスタンプ ms（省略可）
 *
 * protocol / resolution は Input Wrapper が吸収するため廃止（Day58）
 */
export interface TransportEvent {
  slot: number
  value: number
  /**
   * 送信元レイヤー ID（source:'window' の場合のみ付与）
   * source:'midi' / 'osc' の場合は undefined（外側の世界は layerId を知らない）
   * spec: docs/spec/transport-architecture.spec.md §2
   */
  layerId?: string
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
 * AssignRegistry — CC → パラメータのアサイン定義の SSoT
 * spec: docs/spec/macro-knob.spec.md §3
 *
 * アサイン設定・現在値キャッシュを管理する。
 * CC入力の解決は TransportManager が担当し、このRegistryを参照する。
 * Day61: MacroKnobManager → AssignRegistry に改名
 */
export interface AssignRegistry {
  getKnobs(): MacroKnobConfig[]
  setKnob(id: string, config: MacroKnobConfig): void
  addAssign(knobId: string, assign: MacroAssign): void
  removeAssign(knobId: string, geoParamAddress: GeoParamAddress): void
  /** 0.0〜1.0 に正規化した現在値を返す（表示用キャッシュ） */
  getValue(knobId: string): number
  /** TransportManager から書かれる現在値キャッシュの更新 */
  setValue(knobId: string, value: number): void
}

/**
 * TransportManager — プロトコル非依存のイベント処理エンジン
 * spec: docs/spec/transport-architecture.spec.md
 *
 * 旧: MidiManager（Day50 新設）
 * Day58 Step4: プロトコル非依存の TransportManager に昇格。
 * 全入力源（物理MIDI / SimpleWindow / Sequencer / LFO / AI）が
 * engine.handleMidiCC(TransportEvent) 経由でここに流れ込む。
 */
export interface TransportManager {
  init(store: { set(paramId: string, value: number): void }, knobManager: AssignRegistry): void
  handle(event: TransportEvent): void
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
    camera: [string, string, string]
    fx: Record<string, string[]>
  }
  sceneState: SceneState
  assignRegistryState: MacroKnobConfig[]
  presetRefs: Record<string, string>
  /** MIDI Learn アサイン（controlId → 外部CC番号）・spec: docs/spec/midi-learn.spec.md */
  midiLearnAssigns?: Record<string, number>
}

/** プロジェクトファイルのフォーマットバージョン */
export const PROJECT_FILE_VERSION = '1.0.0'

// ============================================================
// MidiLearnable / MidiLearnTarget（MIDI Learn 汎用インフラ）
// spec: docs/spec/midi-learn.spec.md
// ============================================================

/**
 * MIDI Learn 可能な全コントロールが実装する共通インターフェース。
 * ノブ・スライダー・フェーダー・Sequencer レーン等が対象。
 */
export interface MidiLearnable {
  /** 外部デバイスの CC番号（-1 = 未アサイン） */
  learnedCC: number
}

export type { MidiLearnTargetType, MidiLearnTarget } from './zod/midiLearnTarget.schema'
export { MidiLearnTargetTypeSchema, MidiLearnTargetSchema } from './zod/midiLearnTarget.schema'

// ============================================================
// MidiMonitorEvent（MIDI Monitor Window 専用・engine フローとは独立）
// spec: docs/spec/midi-monitor.spec.md
// ============================================================

export interface MidiMonitorEvent {
  /** 'cc' | 'note-on' | 'note-off' */
  type: 'cc' | 'note-on' | 'note-off'
  /** CC番号 or Note番号（0〜127） */
  number: number
  /** 正規化済み値（0.0〜1.0） */
  value: number
  /** 生の値（0〜127） */
  rawValue: number
  /** MIDI チャンネル（0〜15） */
  channel: number
  /** 送信元デバイス名 */
  deviceName: string
  /** イベント受信時刻 */
  timestamp: number
}

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
 *
 * 型定義・実行時検証は Zod スキーマから派生（SSoT: zod/dragPayload.schema.ts）
 * spec: docs/spec/param-catalog.spec.md
 */
export type { DragPayload } from './zod/dragPayload.schema'
export { DragPayloadSchema } from './zod/dragPayload.schema'

export type { RangeConstraint } from './zod/rangeConstraint.schema'
export { RangeConstraintSchema } from './zod/rangeConstraint.schema'

export type { AssignProposal } from './zod/assignProposal.schema'
export { AssignProposalSchema } from './zod/assignProposal.schema'
