/**
 * macroKnob.test.ts
 * spec: docs/spec/macro-knob.spec.md §5 Test Cases
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { macroKnobManager, normalize } from '../../src/core/macroKnob'
import { MACRO_KNOB_COUNT, MACRO_KNOB_MAX_ASSIGNS } from '../../src/core/config'
import type { MacroKnobConfig } from '../../src/types'

// テスト間でノブ状態をリセットするヘルパー
function resetKnob(id: string): void {
  macroKnobManager.setKnob(id, {
    id,
    name: '',
    midiCC: -1,
    assigns: [],
  })
}

describe('MacroKnobManager', () => {
  beforeEach(() => {
    // 使用するノブをリセット
    resetKnob('macro-1')
  })

  // TC-1: getKnobs() は32個を返す
  it('TC-1: getKnobs() は MACRO_KNOB_COUNT(32) 個を返す', () => {
    expect(macroKnobManager.getKnobs()).toHaveLength(MACRO_KNOB_COUNT)
  })

  // TC-2: MIDI値の正規化（中間値）
  it('TC-2: normalize(64, 0, 2) ≈ 1.0', () => {
    const val = normalize(64, 0, 2)
    expect(val).toBeCloseTo(1.0, 1)
  })

  // TC-3: CC=0 → min値
  it('TC-3: normalize(0, 0.5, 1.5) === 0.5', () => {
    expect(normalize(0, 0.5, 1.5)).toBe(0.5)
  })

  // TC-4: CC=127 → max値
  it('TC-4: normalize(127, 0.5, 1.5) === 1.5', () => {
    expect(normalize(127, 0.5, 1.5)).toBe(1.5)
  })

  // TC-5: assigns が MACRO_KNOB_MAX_ASSIGNS(3) を超えるとエラー
  it(`TC-5: assigns が ${MACRO_KNOB_MAX_ASSIGNS + 1} 個のとき setKnob() がエラーを throw する`, () => {
    const tooManyAssigns: MacroKnobConfig = {
      id: 'macro-1',
      name: 'TEST',
      midiCC: 10,
      assigns: [
        { paramId: 'p1', min: 0, max: 1, curve: 'linear' },
        { paramId: 'p2', min: 0, max: 1, curve: 'linear' },
        { paramId: 'p3', min: 0, max: 1, curve: 'linear' },
        { paramId: 'p4', min: 0, max: 1, curve: 'linear' }, // 4つ目 → エラー
      ],
    }
    expect(() => macroKnobManager.setKnob('macro-1', tooManyAssigns)).toThrow()
  })

  // 追加: setKnob が最大数内で正常に動作する
  it('assigns が 3 個以下のとき setKnob() は成功する', () => {
    const config: MacroKnobConfig = {
      id: 'macro-1',
      name: 'CHAOS',
      midiCC: 7,
      assigns: [
        { paramId: 'geo.speed', min: 0, max: 5, curve: 'linear' },
        { paramId: 'geo.scale', min: 0.1, max: 3, curve: 'linear' },
      ],
    }
    expect(() => macroKnobManager.setKnob('macro-1', config)).not.toThrow()
    expect(macroKnobManager.getKnobs()[0]).toMatchObject({ name: 'CHAOS', midiCC: 7 })
  })

  // 追加: getValue は未操作のとき 0 を返す
  it('getValue は操作前 0 を返す', () => {
    expect(macroKnobManager.getValue('macro-1')).toBe(0)
  })
})
