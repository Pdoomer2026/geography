/**
 * useStandardParamRow
 *
 * StandardWindow の ParamRow ロジック SSoT。
 * lo/hi RangeSlider による変化幅制約付きのパラメーター行で使用する。
 *
 * ## 責務
 *   - value / lo / hi の state 管理
 *   - lo/hi によるリマップ正規化して paramCommand$ に送信
 *   - RangeSlider の onLoHiChange ハンドラー
 *
 * ## lo/hi の意味
 *   - lo/hi は RangeConstraint（ユーザーが設定した操作範囲）
 *   - min/max は Plugin の物理限界値
 *   - RangeSlider の段2スライダーは min={lo} max={hi} で動作するため、
 *     ユーザーは lo〜hi の範囲内でしかパラメーターを動かせない
 *   - 詳細: src/application/schema/zod/rangeConstraint.schema.ts
 *
 * ## 使用場所
 *   - GeometryStandardWindow
 *   - CameraStandardWindow
 *   - FxStandardWindow
 */

import { useEffect, useState } from 'react'
import { paramCommand$ } from '../../application/command/commandStream'
import type { RegisteredParameterWithCC } from '../../application/schema/midi-registry'

// ============================================================
// Options
// ============================================================

export interface UseStandardParamRowOptions {
  param: RegisteredParameterWithCC
  layerId: string
}

// ============================================================
// Return
// ============================================================

export interface UseStandardParamRowReturn {
  value: number
  lo: number
  hi: number
  isBinary: boolean
  handleChange: (raw: number) => void
  handleLoHiChange: (newLo: number, newHi: number) => void
}

// ============================================================
// Hook
// ============================================================

export function useStandardParamRow({
  param,
  layerId,
}: UseStandardParamRowOptions): UseStandardParamRowReturn {
  const { min, max, step, ccNumber } = param

  const [value, setValue] = useState(param.value)
  const [lo, setLo] = useState(min)
  const [hi, setHi] = useState(max)

  // 外部（MacroKnob 操作等）からの値変化を反映
  useEffect(() => {
    setValue(param.value)
  }, [param.value])

  const isBinary = min === 0 && max === 1 && step === 1

  function handleChange(raw: number): void {
    setValue(raw)
    // スライダーの全可動域 [min, max] を [lo, hi] にリマップして正規化
    const fullRange = max - min || 1
    const t = (raw - min) / fullRange
    const remapped = lo + t * (hi - lo)
    const normalized = Math.min(1, Math.max(0, (remapped - min) / fullRange))
    paramCommand$.next({ slot: ccNumber, value: normalized, source: 'window', layerId })
  }

  function handleLoHiChange(newLo: number, newHi: number): void {
    setLo(newLo)
    setHi(newHi)
  }

  return {
    value,
    lo,
    hi,
    isBinary,
    handleChange,
    handleLoHiChange,
  }
}
