/**
 * AssignRegistry
 * spec: docs/spec/macro-knob.spec.md
 *
 * CC → パラメータのアサイン定義を管理する SSoT。
 * - 32スロットのアサイン設定（名前・midiCC・assigns）
 * - 現在値キャッシュ（TransportManager が書く・MacroWindow が読む）
 *
 * Day61: MacroKnobManager → AssignRegistry に改名
 *   MacroWindow 化により「32個の仮想ノブ UI」の責務は MacroWindow に移転。
 *   残った本質 = CC入力 → アサイン解決 → パラメータ変調のマッピング定義。
 */

import { MACRO_KNOB_COUNT, MACRO_KNOB_MAX_ASSIGNS } from '../schema/config'
import type { MacroAssign, MacroKnobConfig, AssignRegistry } from '../schema'

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
 * TransportManager が使用する。
 */
export const rangeMap = (v: number, min: number, max: number): number =>
  min + v * (max - min)

// ============================================================
// AssignRegistryImpl
// ============================================================

class AssignRegistryImpl implements AssignRegistry {
  /** 各スロットの現在値（0.0〜1.0 正規化済み）キャッシュ */
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
        `AssignRegistry "${id}": assigns は最大 ${MACRO_KNOB_MAX_ASSIGNS} 個までです（指定: ${config.assigns.length}）`
      )
    }
    const index = this.knobs.findIndex((k) => k.id === id)
    if (index === -1) {
      throw new Error(`AssignRegistry "${id}" が存在しません`)
    }
    this.knobs[index] = { ...config }
  }

  addAssign(knobId: string, assign: MacroAssign): void {
    const knob = this.knobs.find((k) => k.id === knobId)
    if (!knob) throw new Error(`AssignRegistry "${knobId}" が存在しません`)
    if (knob.assigns.length >= MACRO_KNOB_MAX_ASSIGNS) {
      throw new Error(
        `AssignRegistry "${knobId}": assigns は最大 ${MACRO_KNOB_MAX_ASSIGNS} 個までです`
      )
    }
    knob.assigns.push({ ...assign })
  }

  removeAssign(knobId: string, geoParamAddress: string): void {
    const knob = this.knobs.find((k) => k.id === knobId)
    if (!knob) throw new Error(`AssignRegistry "${knobId}" が存在しません`)
    knob.assigns = knob.assigns.filter((a) => a.geoParamAddress !== geoParamAddress)
  }

  getValue(knobId: string): number {
    return this.currentValues.get(knobId) ?? 0
  }

  /** TransportManager から書かれる現在値キャッシュの更新 */
  setValue(knobId: string, value: number): void {
    this.currentValues.set(knobId, value)
  }
}

// ============================================================
// シングルトン
// ============================================================

export const assignRegistry = new AssignRegistryImpl()
