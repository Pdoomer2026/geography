/**
 * MacroKnobManager
 * spec: docs/spec/macro-knob.spec.md
 *
 * 32個のマクロノブで複数のパラメーターを同時に操作する。
 * MIDIコントローラーのノブ・フェーダーに物理対応し、
 * 1ノブで最大 MACRO_KNOB_MAX_ASSIGNS パラメーターを制御できる。
 */

import { MACRO_KNOB_COUNT, MACRO_KNOB_MAX_ASSIGNS } from './config'
import type { MacroAssign, MacroKnobConfig, MacroKnobManager, MidiCCEvent } from '../types'
import type { ParameterStore } from './parameterStore'

// ============================================================
// ヘルパー関数（spec §4）
// ============================================================

/**
 * MIDI値（0〜127）を min/max の範囲に正規化する（山後互换用・Phase 14 で rangeMap に統一予定）
 * @param midi  0〜127
 * @param min   出力の最小値
 * @param max   出力の最大値
 */
export const normalize = (midi: number, min: number, max: number): number =>
  min + (midi / 127) * (max - min)

/**
 * 0.0〜1.0 の値を min/max の範囲に変換する（spec §4 rangeMap）
 * main.js から正規化済みの MidiCCEvent.value を assign の値偗に変換する。
 */
export const rangeMap = (v: number, min: number, max: number): number =>
  min + v * (max - min)

// ============================================================
// MacroKnobManagerImpl
// ============================================================

class MacroKnobManagerImpl implements MacroKnobManager {
  /** 各ノブの現在値（0.0〜1.0 正規化済み）をキャッシュ */
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

  addAssign(knobId: string, assign: MacroAssign): void {
    const knob = this.knobs.find((k) => k.id === knobId)
    if (!knob) throw new Error(`MacroKnob "${knobId}" が存在しません`)
    if (knob.assigns.length >= MACRO_KNOB_MAX_ASSIGNS) {
      throw new Error(
        `MacroKnob "${knobId}": assigns は最大 ${MACRO_KNOB_MAX_ASSIGNS} 個までです`
      )
    }
    knob.assigns.push({ ...assign })
  }

  removeAssign(knobId: string, paramId: string): void {
    const knob = this.knobs.find((k) => k.id === knobId)
    if (!knob) throw new Error(`MacroKnob "${knobId}" が存在しません`)
    knob.assigns = knob.assigns.filter((a) => a.paramId !== paramId)
  }

  handleMidiCC(event: MidiCCEvent): void {
    const knob = this.knobs.find((k) => k.midiCC === event.cc)
    if (!knob) return

    // 現在値をキャッシュ（0.0〜1.0 正規化済み）
    this.currentValues.set(knob.id, event.value)

    // 各 assign に対して paramId を Command 経由で更新
    if (!this.store) return
    for (const assign of knob.assigns) {
      const mapped = rangeMap(event.value, assign.min, assign.max)
      this.store.set(assign.paramId, mapped)
    }
  }

  receiveModulation(knobId: string, value: number): void {
    const knob = this.knobs.find((k) => k.id === knobId)
    if (!knob || !this.store) return

    // 現在値をキャッシュ
    this.currentValues.set(knobId, value)

    for (const assign of knob.assigns) {
      const mapped = rangeMap(value, assign.min, assign.max)
      this.store.set(assign.paramId, mapped)
    }
  }

  getValue(knobId: string): number {
    // currentValues は既に 0.0〜1.0 のままキャッシュされている
    return this.currentValues.get(knobId) ?? 0
  }
}

// ============================================================
// シングルトン
// ============================================================

export const macroKnobManager = new MacroKnobManagerImpl()
