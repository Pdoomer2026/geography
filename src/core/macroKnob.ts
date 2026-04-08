/**
 * MacroKnobManager
 * spec: docs/spec/macro-knob.spec.md
 *
 * 32個のマクロノブのUI設定管理。
 * ノブの名前・MIDI CC番号・アサイン設定・現在値キャッシュを管理する。
 * CC入力の処理（handleMidiCC / receiveModulation）は MidiManager に移管（Day50）。
 */

import { MACRO_KNOB_COUNT, MACRO_KNOB_MAX_ASSIGNS } from './config'
import type { MacroAssign, MacroKnobConfig, MacroKnobManager } from '../types'

// ============================================================
// ヘルパー関数（spec §4）
// ============================================================

/**
 * MIDI値（0〜127）を min/max の範囲に正規化する
 */
export const normalize = (midi: number, min: number, max: number): number =>
  min + (midi / 127) * (max - min)

/**
 * 0.0〜1.0 の値を min/max の範囲に変換する（spec §4 rangeMap）
 * MidiManager が使用する。
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

  constructor() {
    this.knobs = Array.from({ length: MACRO_KNOB_COUNT }, (_, i) => ({
      id: `macro-${i + 1}`,
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

  getValue(knobId: string): number {
    return this.currentValues.get(knobId) ?? 0
  }

  /** MidiManager から書かれる現在値キャッシュの更新（Day50 新設） */
  setValue(knobId: string, value: number): void {
    this.currentValues.set(knobId, value)
  }
}

// ============================================================
// シングルトン
// ============================================================

export const macroKnobManager = new MacroKnobManagerImpl()
