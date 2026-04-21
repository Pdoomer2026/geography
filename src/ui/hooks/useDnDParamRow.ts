/**
 * useDnDParamRow
 *
 * SimpleDnDWindow の ParamRow ロジック SSoT。
 * D&D ハンドル（≡）付きのパラメーター行で使用する。
 *
 * ## 責務
 *   - value の state 管理
 *   - paramCommand$（RxJS）経由での値送信
 *   - D&D ハンドルの dragStart / dragEnd ロジック
 *
 * ## 使用場所
 *   - GeometrySimpleDnDWindow
 *   - CameraSimpleDnDWindow
 *   - FxSimpleDnDWindow
 *
 * ## 将来
 *   Sequencer 等で別の見た目が必要になった場合も
 *   このフックを再利用できる。
 */

import { useEffect, useState } from 'react'
import { paramCommand$ } from '../../application/command/commandStream'
import type { RegisteredParameterWithCC } from '../../application/schema/midi-registry'
import type { DragPayload } from '../../application/schema'

// ============================================================
// Options
// ============================================================

export interface UseDnDParamRowOptions {
  param: RegisteredParameterWithCC
  layerId: string
  pluginId: string
}

// ============================================================
// Return
// ============================================================

export interface UseDnDParamRowReturn {
  value: number
  isDragging: boolean
  isBinary: boolean
  handleChange: (raw: number) => void
  handleDragStart: (e: React.DragEvent) => void
  handleDragEnd: () => void
}

// ============================================================
// Hook
// ============================================================

export function useDnDParamRow({
  param,
  layerId,
  pluginId,
}: UseDnDParamRowOptions): UseDnDParamRowReturn {
  const { min, max, step, ccNumber } = param

  const [value, setValue] = useState(param.value)
  const [isDragging, setIsDragging] = useState(false)

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

  function handleDragStart(e: React.DragEvent): void {
    const payload: DragPayload = {
      type: 'param',
      id: param.id,
      layerId,
      pluginId,
      ccNumber,
      min,
      max,
    }
    e.dataTransfer.setData('application/geography-param', JSON.stringify(payload))
    e.dataTransfer.effectAllowed = 'copy'
    setIsDragging(true)
  }

  function handleDragEnd(): void {
    setIsDragging(false)
  }

  return {
    value,
    isDragging,
    isBinary,
    handleChange,
    handleDragStart,
    handleDragEnd,
  }
}
