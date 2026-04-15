/**
 * RangeSlider
 * Standard Window 専用コンポーネント
 *
 * 2段構成:
 *   段1: lo/hi カスタムdivドラッグ（稼働幅）
 *   段2: 現在値 range input（書き込み可能）
 *
 * 設計原則:
 *   - lo/hi は親(ParamRow)の localState。Registry/engine に影響しない
 *   - 現在値スライダーは Simple Window と同じく engine.handleMidiCC() を呼ぶ
 *   - 変換式: normalized = (raw - lo) / (hi - lo)
 */

import { useCallback, useRef } from 'react'

// ============================================================
// Props
// ============================================================

export interface RangeSliderProps {
  min: number
  max: number
  lo: number
  hi: number
  value: number
  step: number
  onLoHiChange: (lo: number, hi: number) => void
  onChange: (raw: number) => void
}

// ============================================================
// RangeSlider
// ============================================================

export function RangeSlider({ min, max, lo, hi, value, step, onLoHiChange, onChange }: RangeSliderProps) {
  const trackRef = useRef<HTMLDivElement>(null)

  const range = max - min || 1

  // 0〜1 の位置に変換
  const loFrac = (lo - min) / range
  const hiFrac = (hi - min) / range
  const valFrac = (value - min) / range

  // ドラッグ中に生値を計算
  const fractionFromEvent = useCallback((e: MouseEvent): number => {
    const track = trackRef.current
    if (!track) return 0
    const rect = track.getBoundingClientRect()
    return Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width))
  }, [])

  function startDragLo(e: React.MouseEvent) {
    e.preventDefault()
    const onMove = (ev: MouseEvent) => {
      const frac = fractionFromEvent(ev)
      const newLo = min + frac * range
      const snapped = Math.round(newLo / step) * step
      const clamped = Math.min(snapped, hi - step)
      onLoHiChange(clamped, hi)
    }
    const onUp = () => {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
  }

  function startDragHi(e: React.MouseEvent) {
    e.preventDefault()
    const onMove = (ev: MouseEvent) => {
      const frac = fractionFromEvent(ev)
      const newHi = min + frac * range
      const snapped = Math.round(newHi / step) * step
      const clamped = Math.max(snapped, lo + step)
      onLoHiChange(lo, clamped)
    }
    const onUp = () => {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
  }

  function handleValueChange(raw: number) {
    onChange(raw)
  }

  const loDisplay = lo.toFixed(max <= 1 ? 3 : max <= 10 ? 2 : 1)
  const hiDisplay = hi.toFixed(max <= 1 ? 3 : max <= 10 ? 2 : 1)

  return (
    <div className="flex flex-col gap-0.5 w-full">

      {/* 段1: lo/hi レンジトラック */}
      <div
        ref={trackRef}
        className="relative w-full"
        style={{ height: 14 }}
      >
        {/* ベーストラック */}
        <div
          className="absolute top-1/2 -translate-y-1/2 w-full rounded-full"
          style={{ height: 3, background: '#1e1e3e' }}
        />
        {/* アクティブ帯（lo〜hi） */}
        <div
          className="absolute top-1/2 -translate-y-1/2 rounded-full"
          style={{
            height: 3,
            left: `${loFrac * 100}%`,
            width: `${(hiFrac - loFrac) * 100}%`,
            background: '#3a3aaa',
          }}
        />
        {/* lo ハンドル ▼ */}
        <div
          onMouseDown={startDragLo}
          className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 flex items-center justify-center rounded-sm cursor-ew-resize select-none"
          style={{
            left: `${loFrac * 100}%`,
            width: 10,
            height: 14,
            background: '#5a5aff',
            fontSize: 7,
            color: '#fff',
            userSelect: 'none',
          }}
          title={`lo: ${loDisplay}`}
        >
          ▼
        </div>
        {/* hi ハンドル ▲ */}
        <div
          onMouseDown={startDragHi}
          className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 flex items-center justify-center rounded-sm cursor-ew-resize select-none"
          style={{
            left: `${hiFrac * 100}%`,
            width: 10,
            height: 14,
            background: '#5a5aff',
            fontSize: 7,
            color: '#fff',
            userSelect: 'none',
          }}
          title={`hi: ${hiDisplay}`}
        >
          ▲
        </div>
      </div>

      {/* 段2: 現在値スライダー */}
      <div className="relative w-full" style={{ height: 14 }}>
        <div
          className="absolute top-1/2 -translate-y-1/2 w-full rounded-full"
          style={{ height: 3, background: '#1e1e3e' }}
        />
        {/* 現在値バー */}
        <div
          className="absolute top-1/2 -translate-y-1/2 rounded-full"
          style={{
            height: 3,
            left: 0,
            width: `${valFrac * 100}%`,
            background: '#2a2a7e',
          }}
        />
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => handleValueChange(parseFloat(e.target.value))}
          className="absolute inset-0 w-full opacity-0 cursor-pointer"
          style={{ height: '100%' }}
        />
        {/* ノブ表示 */}
        <div
          className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 rounded-full pointer-events-none"
          style={{
            left: `${valFrac * 100}%`,
            width: 8,
            height: 8,
            background: '#aaaaff',
          }}
        />
      </div>

      {/* lo / hi 数値表示 */}
      <div className="flex justify-between" style={{ marginTop: 1 }}>
        <span className="text-[8px] tabular-nums" style={{ color: '#5a5aaa' }}>{loDisplay}</span>
        <span className="text-[8px] tabular-nums" style={{ color: '#5a5aaa' }}>{hiDisplay}</span>
      </div>
    </div>
  )
}
