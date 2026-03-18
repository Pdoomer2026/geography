import { useEffect, useRef, useState } from 'react'
import type { TransitionPlugin } from '../../../types'
import beatCutPlugin from '../../transitions/beat-cut'
import crossfadePlugin from '../../transitions/crossfade'
import { programBus } from '../../../core/programBus'
import { previewBus } from '../../../core/previewBus'

const AVAILABLE_TRANSITIONS: TransitionPlugin[] = [beatCutPlugin, crossfadePlugin]

/**
 * SimpleMixer — v1 固定実装の Mixer UI
 *
 * 閉じることができない（MixerPlugin ルール）。
 * v1 から MixerPlugin Interface に準拠した実装にする（v2 で Plugin 化するとき設計変更ゼロにするため）。
 */
export function SimpleMixer() {
  const [crossfader, setCrossfader] = useState(0)
  const [transitionId, setTransitionId] = useState(AVAILABLE_TRANSITIONS[0].id)
  const previewRef = useRef<HTMLDivElement>(null)

  // タスク 1: previewBus.getCanvas() を PREVIEW エリアに mount する
  useEffect(() => {
    if (!previewRef.current) return
    const canvas = previewBus.getCanvas()
    if (!canvas) return
    // SimpleMixer 内では 160×90 で表示する（内部解像度 320×180 はそのまま）
    canvas.style.width = '160px'
    canvas.style.height = '90px'
    previewRef.current.appendChild(canvas)
    return () => {
      if (canvas.parentNode === previewRef.current) {
        previewRef.current?.removeChild(canvas)
      }
    }
  }, [])

  // タスク 2: クロスフェーダー変化時に execute() → programBus.load()
  function handleCrossfaderChange(value: number) {
    setCrossfader(value)
    const from = previewBus.getState()
    const to = programBus.getState()
    if (!from || !to) return
    const plugin = AVAILABLE_TRANSITIONS.find((t) => t.id === transitionId)
    if (!plugin) return
    const blended = plugin.execute(from, to, value)
    programBus.load(blended)
  }

  // タスク 3: Transition 切り替え時にクロスフェーダーを 0 にリセット
  function handleTransitionChange(id: string) {
    setTransitionId(id)
    setCrossfader(0)
  }

  return (
    <div
      className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50
                 bg-[#0f0f1e] border border-[#2a2a4e] rounded-lg
                 text-white font-mono text-xs select-none"
      style={{ width: 520, padding: '12px 16px' }}
    >
      {/* ヘッダー */}
      <div className="text-[10px] text-[#7878aa] mb-2 tracking-widest">
        SIMPLE MIXER
      </div>

      {/* バス表示エリア */}
      <div className="flex gap-4 mb-3">
        {/* Program バス */}
        <div className="flex-1">
          <div className="text-[10px] text-[#aaaacc] mb-1 tracking-wider">PROGRAM</div>
          <div
            className="flex gap-1 items-end"
            style={{ height: 80 }}
          >
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="flex-1 rounded-sm border border-[#2a2a4e] bg-[#1a1a2e]
                           flex items-end justify-center pb-1 text-[9px] text-[#4a4a6e]"
                style={{ height: '100%' }}
              >
                L{i + 1}
              </div>
            ))}
          </div>
        </div>

        {/* Preview バス */}
        <div>
          <div className="text-[10px] text-[#aaaacc] mb-1 tracking-wider">PREVIEW</div>
          <div
            ref={previewRef}
            className="rounded-sm border border-[#2a2a4e] bg-[#0a0a1a] overflow-hidden"
            style={{ width: 160, height: 90 }}
          />
        </div>
      </div>

      {/* Transition プルダウン */}
      <div className="flex items-center gap-2 mb-3">
        <span className="text-[#7878aa] text-[10px] tracking-wider">TRANSITION</span>
        <select
          value={transitionId}
          onChange={(e) => handleTransitionChange(e.target.value)}
          className="bg-[#1a1a2e] border border-[#2a2a4e] rounded px-2 py-0.5
                     text-[#aaaacc] text-[11px] outline-none cursor-pointer flex-1"
        >
          {AVAILABLE_TRANSITIONS.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name} — {t.preview}
            </option>
          ))}
        </select>
      </div>

      {/* クロスフェーダー */}
      <div className="flex items-center gap-2">
        <span className="text-[#4a4a6e] text-[10px] w-8">PGM</span>
        <input
          type="range"
          min={0}
          max={1}
          step={0.01}
          value={crossfader}
          onChange={(e) => handleCrossfaderChange(parseFloat(e.target.value))}
          className="flex-1 accent-[#7878ff] h-1.5 cursor-pointer"
        />
        <span className="text-[#4a4a6e] text-[10px] w-8 text-right">PVW</span>
      </div>

      {/* クロスフェーダー値表示 */}
      <div className="text-center text-[9px] text-[#4a4a6e] mt-1">
        {Math.round(crossfader * 100)}
      </div>
    </div>
  )
}
