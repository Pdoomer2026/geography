/**
 * useSimpleParamRow
 *
 * SimpleWindow の ParamRow ロジック SSoT。
 * D&D なし・lo/hi なしのシンプルなパラメーター行で使用する。
 *
 * ## 責務
 *   - value の state 管理
 *   - paramCommand$（RxJS）経由での値送信
 *
 * ## useDnDParamRow との違い
 *   - D&D ハンドルを持たない
 *   - pluginId 不要
 *
 * ## 使用場所
 *   - GeometrySimpleWindow
 *   - CameraSimpleWindow
 *   - FxSimpleWindow
 */

import { useEffect, useState } from 'react'
import { paramCommand$ } from '../../application/command/commandStream'
import type { RegisteredParameterWithCC } from '../../application/schema/midi-registry'

// ============================================================
// Options
// ============================================================

export interface UseSimpleParamRowOptions {
  param: RegisteredParameterWithCC
  layerId: string
}

// ============================================================
// Return
// ============================================================

export interface UseSimpleParamRowReturn {
  value: number
  isBinary: boolean
  handleChange: (raw: number) => void
}

// ============================================================
// Hook
// ============================================================

export function useSimpleParamRow({
  param,
  layerId,
}: UseSimpleParamRowOptions): UseSimpleParamRowReturn {
  const { min, max, step, ccNumber } = param

  const [value, setValue] = useState(param.value)

  // 外部（MacroKnob 操作等）からの値変化を反映
  useEffect(() => {
    setValue(param.value)
  }, [param.value])

  const isBinary = min === 0 && max === 1 && step === 1

  function handleChange(raw: number): void {
    setValue(raw)
    const normalized = Math.min(1, Math.max(0, max > min ? (raw - min) / (max - min) : 0))
    paramCommand$.next({ slot: ccNumber, value: normalized, source: 'window', layerId })
  }

  return {
    value,
    isBinary,
    handleChange,
  }
}
