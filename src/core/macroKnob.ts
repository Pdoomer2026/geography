/**
 * MacroKnobManager
 * spec: docs/spec/macro-knob.spec.md
 *
 * 32個のマクロノブで複数のパラメーターを同時に操作する。
 * MIDIコントローラーのノブ・フェーダーに物理対応し、
 * 1ノブで最大 MACRO_KNOB_MAX_ASSIGNS パラメーターを制御できる。
 */

import { MACRO_KNOB_COUNT, MACRO_KNOB_MAX_ASSIGNS } from './config'
import type { MacroKnobConfig, MacroKnobManager } from '../types'
import type { ParameterStore } from './parameterStore'

// ============================================================
// normalize ヘルパー（spec §4）
// ============================================================

/**
 * MIDI値（0〜127）を min/max の範囲に正規化する
 * @param midi  0〜127
 * @param min   出力の最小値
 * @param max   出力の最大値
 */
export const normalize = (midi: number, min: number, max: number): number =>
  min + (midi / 127) * (max - min)

// ============================================================
// MacroKnobManagerImpl
// ============================================================

class MacroKnobManagerImpl implements MacroKnobManager {
  /** 各ノブの現在の MIDI値（0〜127）をキャッシュ */
  private currentValues: Map<string, number> = new Map()
  private knobs: MacroKnobConfig[]
  private store: ParameterStore | null = null

  constructor() {
    // 全32ノブをデフォルト状態で初期化
    this.knobs = Array.from({ length: MACRO_KNOB_COUNT }, (_, i) => ({
      id: `macro-${i + 1}`,
      name: '',
      midiCC: -1,   // 未割り当て
      assigns: [],
    }))
  }

  /** ParameterStore を注入（engine.initialize() で呼ぶ） */
  init(store: ParameterStore): void {
    this.store = store
  }

  // ----------------------------------------------------------------

  getKnobs(): MacroKnobConfig[] {
    return this.knobs
  }

  setKnob(id: string, config: MacroKnobConfig): void {
    if (config.assigns.length > MACRO_KNOB_MAX_ASSIGNS) {
      throw new Error(
        `MacroKnob "${id}": assigns は最大 ${MACRO_KNOB_MAX_ASSIGNS} 個までです（指定: ${config.assigns.length}）`
      )
    }
    const index = this.knobs.findIndex((k) => k.id === id)
    if (index === -1) {
      throw new Error(`MacroKnob "${id}" が存在しません`)
    }
    this.knobs[index] = { ...config }
  }

  handleMidiCC(cc: number, value: number): void {
    const knob = this.knobs.find((k) => k.midiCC === cc)
    if (!knob) return

    // 現在値をキャッシュ
    this.currentValues.set(knob.id, value)

    // 各 assign に対して paramId を Command 経由で更新
    if (!this.store) return
    for (const assign of knob.assigns) {
      const normalized = normalize(value, assign.min, assign.max)
      this.store.set(assign.paramId, normalized)
    }
  }

  getValue(knobId: string): number {
    const raw = this.currentValues.get(knobId) ?? 0
    return raw / 127
  }
}

// ============================================================
// シングルトン
// ============================================================

export const macroKnobManager = new MacroKnobManagerImpl()
