/**
 * useStandardDnDParamRow
 *
 * StandardDnDWindow の ParamRow ロジック SSoT。
 * lo/hi RangeSlider による変化幅制約 + D&D ハンドル付きの行で使用する。
 *
 * ## 責務
 *   - value / lo / hi の state 管理
 *   - paramCommand$ 経由での値送信（lo/hi は使わず min/max で正規化）
 *   - RangeSlider の onLoHiChange ハンドラー + 親への通知
 *   - D&D ハンドルの dragStart / dragEnd ロジック
 *     → payload に proposal: { lo, hi } を乗せる
 *
 * ## SimpleDnDWindow との違い
 *   - D&D payload に proposal（AssignProposal）を含める
 *   - lo/hi state を持つ（RangeSlider の変化幅）
 *
 * ## StandardWindow との違い
 *   - D&D ハンドルを持つ
 *   - handleChange は lo/hi リマップを行わない
 *     （RangeSlider の段2スライダーが min={lo} max={hi} で制約するため）
 *
 * ## データフロー
 *   RangeSlider の lo/hi（RangeConstraint）
 *       ↓ D&D payload に AssignProposal として乗る
 *       ↓ MacroWindow の AssignDialog が初期値として表示
 *       ↓ ユーザーが確認・調整
 *   MacroAssign.min / max（0〜1 の正規化済み確定値）
 *
 * ## 使用場所
 *   - GeometryStandardDnDWindow
 *   - CameraStandardDnDWindow
 *   - FxStandardDnDWindow
 */

import { useEffect, useState } from 'react'
import { paramCommand$ } from '../../application/command/commandStream'
import type { RegisteredParameterWithCC } from '../../application/schema/midi-registry'
import type { DragPayload } from '../../application/schema'

// ============================================================
// Options
// ============================================================

export interface UseStandardDnDParamRowOptions {
  param: RegisteredParameterWithCC
  layerId: string
  pluginId: string
  /** 親コンポーネントから渡す初期 lo（loHiMapRef から復元） */
  initialLo?: number
  /** 親コンポーネントから渡す初期 hi（loHiMapRef から復元） */
  initialHi?: number
  /** lo/hi 変化を親に通知（loHiMapRef への書き込み用） */
  onLoHiChange?: (lo: number, hi: number) => void
}

// ============================================================
// Return
// ============================================================

export interface UseStandardDnDParamRowReturn {
  value: number
  lo: number
  hi: number
  isDragging: boolean
  isBinary: boolean
  handleChange: (raw: number) => void
  handleLoHiChange: (newLo: number, newHi: number) => void
  handleDragStart: (e: React.DragEvent) => void
  handleDragEnd: () => void
}

// ============================================================
// Hook
// ============================================================

export function useStandardDnDParamRow({
  param,
  layerId,
  pluginId,
  initialLo,
  initialHi,
  onLoHiChange,
}: UseStandardDnDParamRowOptions): UseStandardDnDParamRowReturn {
  const { min, max, step, ccNumber } = param

  const [value, setValue] = useState(param.value)
  const [lo, setLo] = useState(initialLo ?? min)
  const [hi, setHi] = useState(initialHi ?? max)
  const [isDragging, setIsDragging] = useState(false)

  // 外部（MacroKnob 操作等）からの値変化を反映
  useEffect(() => {
    setValue(param.value)
  }, [param.value])

  const isBinary = min === 0 && max === 1 && step === 1

  function handleChange(raw: number): void {
    setValue(raw)
    // RangeSlider の段2スライダーが min={lo} max={hi} で制約しているため
    // ここでは lo/hi リマップは行わず、min/max で正規化するだけ
    const normalized = Math.min(1, Math.max(0, (raw - min) / (max - min || 1)))
    paramCommand$.next({ slot: ccNumber, value: normalized, source: 'window', layerId })
  }

  function handleLoHiChange(newLo: number, newHi: number): void {
    setLo(newLo)
    setHi(newHi)
    onLoHiChange?.(newLo, newHi)
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
      // RangeSlider で設定した lo/hi を AssignProposal として乗せる
      proposal: { lo, hi },
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
    lo,
    hi,
    isDragging,
    isBinary,
    handleChange,
    handleLoHiChange,
    handleDragStart,
    handleDragEnd,
  }
}
