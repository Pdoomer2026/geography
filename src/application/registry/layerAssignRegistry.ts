/**
 * LayerAssignRegistry
 * spec: docs/spec/layer-macro-preset.spec.md
 *
 * レイヤーごとの専用 MacroKnob アサイン定義を管理する。
 * グローバルの assignRegistry（macro-1〜macro-8）とは完全に独立。
 *
 * Knob ID 名前空間:
 *   Global:  macro-1 〜 macro-8         （assignRegistry が管理）
 *   Layer:   layer-1:macro-1 〜 layer-3:macro-8（このファイルが管理）
 *
 * 設計原則:
 *   - 既存の assignRegistry / AssignRegistryImpl には一切触れない
 *   - AssignRegistry interface を実装して同じ API を提供する
 *   - LayerAssignRegistryManager が 3 レイヤー分のインスタンスを保持する
 *
 * Day87: 新規作成
 */

import { LAYER_MACRO_KNOB_COUNT, MACRO_KNOB_MAX_ASSIGNS } from '../schema/config'
import { rangeMap } from './assignRegistry'
import type { MacroAssign, MacroKnobConfig, AssignRegistry } from '../schema'

export { rangeMap }

// ============================================================
// LayerAssignRegistryImpl
// ============================================================

/**
 * 1レイヤー分の MacroKnob アサイン定義。
 * AssignRegistry と同じ interface を実装する。
 */
class LayerAssignRegistryImpl implements AssignRegistry {
  private currentValues: Map<string, number> = new Map()
  private knobs: MacroKnobConfig[]
  readonly layerId: string

  constructor(layerId: string) {
    this.layerId = layerId
    this.knobs = Array.from({ length: LAYER_MACRO_KNOB_COUNT }, (_, i) => ({
      id: `${layerId}:macro-${i + 1}`,
      name: '',
      midiCC: -1,
      assigns: [],
    }))
  }

  getKnobs(): MacroKnobConfig[] {
    return this.knobs
  }

  setKnob(id: string, config: MacroKnobConfig): void {
    if (config.assigns.length > MACRO_KNOB_MAX_ASSIGNS) {
      throw new Error(
        `LayerAssignRegistry "${id}": assigns は最大 ${MACRO_KNOB_MAX_ASSIGNS} 個までです（指定: ${config.assigns.length}）`
      )
    }
    const index = this.knobs.findIndex((k) => k.id === id)
    if (index === -1) {
      throw new Error(`LayerAssignRegistry "${id}" が存在しません`)
    }
    this.knobs[index] = { ...config }
  }

  addAssign(knobId: string, assign: MacroAssign): void {
    const knob = this.knobs.find((k) => k.id === knobId)
    if (!knob) throw new Error(`LayerAssignRegistry "${knobId}" が存在しません`)
    if (knob.assigns.length >= MACRO_KNOB_MAX_ASSIGNS) {
      throw new Error(
        `LayerAssignRegistry "${knobId}": assigns は最大 ${MACRO_KNOB_MAX_ASSIGNS} 個までです`
      )
    }
    knob.assigns.push({ ...assign })
  }

  removeAssign(knobId: string, geoParamAddress: string): void {
    const knob = this.knobs.find((k) => k.id === knobId)
    if (!knob) throw new Error(`LayerAssignRegistry "${knobId}" が存在しません`)
    knob.assigns = knob.assigns.filter((a) => a.geoParamAddress !== geoParamAddress)
  }

  getValue(knobId: string): number {
    return this.currentValues.get(knobId) ?? 0
  }

  setValue(knobId: string, value: number): void {
    this.currentValues.set(knobId, value)
  }

  /** Preset 保存用: MacroKnobConfig[] をスナップショットとして返す */
  snapshot(): MacroKnobConfig[] {
    return this.knobs.map((k) => ({ ...k, assigns: k.assigns.map((a) => ({ ...a })) }))
  }

  /** Preset ロード用: MacroKnobConfig[] をレジストリに復元する */
  restore(knobs: MacroKnobConfig[]): void {
    knobs.forEach((config, i) => {
      if (i < this.knobs.length) {
        this.knobs[i] = { ...config, assigns: config.assigns.map((a) => ({ ...a })) }
      }
    })
  }

  /** アサインを全クリアする（Reset to default 用） */
  clearAllAssigns(): void {
    this.knobs.forEach((knob) => {
      knob.assigns = []
      knob.name = ''
      knob.midiCC = -1
    })
    this.currentValues.clear()
  }
}

// ============================================================
// LayerAssignRegistryManager
// ============================================================

/**
 * 全レイヤーの LayerAssignRegistryImpl を管理するマネージャー。
 * engine.ts が参照するシングルトン。
 */
class LayerAssignRegistryManager {
  private registries: Map<string, LayerAssignRegistryImpl> = new Map()

  /**
   * 指定レイヤーのレジストリを返す。
   * 未初期化の場合は自動生成する。
   */
  forLayer(layerId: string): LayerAssignRegistryImpl {
    if (!this.registries.has(layerId)) {
      this.registries.set(layerId, new LayerAssignRegistryImpl(layerId))
    }
    return this.registries.get(layerId)!
  }

  /**
   * 全レイヤーのレジストリ一覧を返す。
   * TransportManager が MIDI 受信時に横断検索するために使う。
   */
  getAll(): LayerAssignRegistryImpl[] {
    return Array.from(this.registries.values())
  }

  /**
   * 全レイヤーの全ノブを横断して knobId でヒットするものを返す。
   * MIDI 受信時に Layer Macro を探すために使う。
   */
  findKnob(knobId: string): { registry: LayerAssignRegistryImpl; knob: MacroKnobConfig } | null {
    for (const registry of this.registries.values()) {
      const knob = registry.getKnobs().find((k) => k.id === knobId)
      if (knob) return { registry, knob }
    }
    return null
  }
}

// ============================================================
// シングルトン
// ============================================================

export const layerAssignRegistry = new LayerAssignRegistryManager()
