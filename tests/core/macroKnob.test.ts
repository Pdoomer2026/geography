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
        { paramId: 'p1', ccNumber: 101, min: 0, max: 1, curve: 'linear' },
        { paramId: 'p2', ccNumber: 201, min: 0, max: 1, curve: 'linear' },
        { paramId: 'p3', ccNumber: 300, min: 0, max: 1, curve: 'linear' },
        { paramId: 'p4', ccNumber: 400, min: 0, max: 1, curve: 'linear' }, // 4つ目 → エラー
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
        { paramId: 'geo.speed', ccNumber: 300, min: 0, max: 5, curve: 'linear' },
        { paramId: 'geo.scale', ccNumber: 101, min: 0.1, max: 3, curve: 'linear' },
      ],
    }
    expect(() => macroKnobManager.setKnob('macro-1', config)).not.toThrow()
    expect(macroKnobManager.getKnobs()[0]).toMatchObject({ name: 'CHAOS', midiCC: 7 })
  })

  // TC-6: receiveModulation → rangeMap
  // TC-7: handleMidiCC → rangeMap
  // TC-8: last-write-wins
  // ↓ 上記 3ケースは ParameterStore の注入が必要なため engine.test.ts 側で検証

  // TC-9: addAssign() → assigns に追加される
  it('TC-9: addAssign() → assigns に追加される', () => {
    macroKnobManager.addAssign('macro-1', {
      paramId: 'hue',
      ccNumber: 400,
      min: 0,
      max: 1,
      curve: 'linear',
    })
    const knob = macroKnobManager.getKnobs().find((k) => k.id === 'macro-1')
    expect(knob?.assigns).toHaveLength(1)
    expect(knob?.assigns[0].paramId).toBe('hue')
    expect(knob?.assigns[0].ccNumber).toBe(400)
  })

  // TC-10: removeAssign() → assigns から削除される
  it('TC-10: removeAssign() → assigns から削除される', () => {
    macroKnobManager.addAssign('macro-1', {
      paramId: 'hue',
      ccNumber: 400,
      min: 0,
      max: 1,
      curve: 'linear',
    })
    macroKnobManager.removeAssign('macro-1', 'hue')
    const knob = macroKnobManager.getKnobs().find((k) => k.id === 'macro-1')
    expect(knob?.assigns).toHaveLength(0)
  })

  // TC-11: addAssign() が MACRO_KNOB_MAX_ASSIGNS を超えるとエラー
  it(`TC-11: addAssign() が ${MACRO_KNOB_MAX_ASSIGNS} 个超えると throw`, () => {
    for (let i = 0; i < MACRO_KNOB_MAX_ASSIGNS; i++) {
      macroKnobManager.addAssign('macro-1', {
        paramId: `param${i}`,
        ccNumber: 100 + i,
        min: 0,
        max: 1,
        curve: 'linear',
      })
    }
    expect(() =>
      macroKnobManager.addAssign('macro-1', {
        paramId: 'over',
        ccNumber: 999,
        min: 0,
        max: 1,
        curve: 'linear',
      })
    ).toThrow()
  })
})
