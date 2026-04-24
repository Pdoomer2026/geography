/**
 * assignRegistry.test.ts
 * spec: docs/spec/macro-knob.spec.md §5 Test Cases
 *
 * Day61: macroKnob.test.ts → assignRegistry.test.ts に改名
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { assignRegistry, normalize } from '../../src/application/registry/assignRegistry'
import { MACRO_KNOB_COUNT, MACRO_KNOB_MAX_ASSIGNS } from '../../src/application/schema/config'
import type { MacroKnobConfig } from '../../src/application/schema'
import { toGeoParamAddress } from '../../src/application/schema/geoParamAddress'

const GEO_HUE   = toGeoParamAddress('layer-1', 'contour', 'hue')
const GEO_P1    = toGeoParamAddress('layer-1', 'icosphere', 'p1')
const GEO_P2    = toGeoParamAddress('layer-1', 'icosphere', 'p2')
const GEO_P3    = toGeoParamAddress('layer-1', 'icosphere', 'p3')
const GEO_P4    = toGeoParamAddress('layer-1', 'icosphere', 'p4')
const GEO_SPEED = toGeoParamAddress('layer-1', 'contour', 'speed')
const GEO_SCALE = toGeoParamAddress('layer-1', 'contour', 'scale')
const GEO_OVER  = toGeoParamAddress('layer-1', 'icosphere', 'over')

function resetKnob(id: string): void {
  assignRegistry.setKnob(id, {
    id,
    name: '',
    midiCC: -1,
    assigns: [],
  })
}

describe('AssignRegistry', () => {
  beforeEach(() => {
    resetKnob('macro-1')
  })

  it('TC-1: getKnobs() は MACRO_KNOB_COUNT(32) 個を返す', () => {
    expect(assignRegistry.getKnobs()).toHaveLength(MACRO_KNOB_COUNT)
  })

  it('TC-2: normalize(64, 0, 2) ≈ 1.0', () => {
    const val = normalize(64, 0, 2)
    expect(val).toBeCloseTo(1.0, 1)
  })

  it('TC-3: normalize(0, 0.5, 1.5) === 0.5', () => {
    expect(normalize(0, 0.5, 1.5)).toBe(0.5)
  })

  it('TC-4: normalize(127, 0.5, 1.5) === 1.5', () => {
    expect(normalize(127, 0.5, 1.5)).toBe(1.5)
  })

  it(`TC-5: assigns が ${MACRO_KNOB_MAX_ASSIGNS + 1} 個のとき setKnob() がエラーを throw する`, () => {
    const tooManyAssigns: MacroKnobConfig = {
      id: 'macro-1',
      name: 'TEST',
      midiCC: 10,
      assigns: [
        { geoParamAddress: GEO_P1, ccNumber: 101, layerId: 'layer-1', min: 0, max: 1, curve: 'linear' },
        { geoParamAddress: GEO_P2, ccNumber: 201, layerId: 'layer-1', min: 0, max: 1, curve: 'linear' },
        { geoParamAddress: GEO_P3, ccNumber: 300, layerId: 'layer-1', min: 0, max: 1, curve: 'linear' },
        { geoParamAddress: GEO_P4, ccNumber: 400, layerId: 'layer-1', min: 0, max: 1, curve: 'linear' },
      ],
    }
    expect(() => assignRegistry.setKnob('macro-1', tooManyAssigns)).toThrow()
  })

  it('assigns が 3 個以下のとき setKnob() は成功する', () => {
    const config: MacroKnobConfig = {
      id: 'macro-1',
      name: 'CHAOS',
      midiCC: 7,
      assigns: [
        { geoParamAddress: GEO_SPEED, ccNumber: 300, layerId: 'layer-1', min: 0, max: 5, curve: 'linear' },
        { geoParamAddress: GEO_SCALE, ccNumber: 101, layerId: 'layer-1', min: 0.1, max: 3, curve: 'linear' },
      ],
    }
    expect(() => assignRegistry.setKnob('macro-1', config)).not.toThrow()
    expect(assignRegistry.getKnobs()[0]).toMatchObject({ name: 'CHAOS', midiCC: 7 })
  })

  it('TC-9: addAssign() → assigns に追加される', () => {
    assignRegistry.addAssign('macro-1', {
      geoParamAddress: GEO_HUE,
      ccNumber: 400,
      layerId: 'layer-1',
      min: 0,
      max: 1,
      curve: 'linear',
    })
    const knob = assignRegistry.getKnobs().find((k) => k.id === 'macro-1')
    expect(knob?.assigns).toHaveLength(1)
    expect(knob?.assigns[0].geoParamAddress).toBe(GEO_HUE)
    expect(knob?.assigns[0].ccNumber).toBe(400)
  })

  it('TC-10: removeAssign() → assigns から削除される', () => {
    assignRegistry.addAssign('macro-1', {
      geoParamAddress: GEO_HUE,
      ccNumber: 400,
      layerId: 'layer-1',
      min: 0,
      max: 1,
      curve: 'linear',
    })
    assignRegistry.removeAssign('macro-1', GEO_HUE)
    const knob = assignRegistry.getKnobs().find((k) => k.id === 'macro-1')
    expect(knob?.assigns).toHaveLength(0)
  })

  it(`TC-11: addAssign() が ${MACRO_KNOB_MAX_ASSIGNS} 个超えると throw`, () => {
    for (let i = 0; i < MACRO_KNOB_MAX_ASSIGNS; i++) {
      assignRegistry.addAssign('macro-1', {
        geoParamAddress: toGeoParamAddress('layer-1', 'icosphere', `param${i}`),
        ccNumber: 100 + i,
        layerId: 'layer-1',
        min: 0,
        max: 1,
        curve: 'linear',
      })
    }
    expect(() =>
      assignRegistry.addAssign('macro-1', {
        geoParamAddress: GEO_OVER,
        ccNumber: 999,
        layerId: 'layer-1',
        min: 0,
        max: 1,
        curve: 'linear',
      })
    ).toThrow()
  })
})
