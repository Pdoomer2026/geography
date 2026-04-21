import { useEffect, useRef, useState } from 'react'
import type { Layer, LayerRouting, ScreenAssignState, TransitionPlugin } from '../../../../types'
import beatCutPlugin from '../../../../plugins/transitions/beat-cut'
import crossfadePlugin from '../../../../plugins/transitions/crossfade'
import { programBus } from '../../../../core/programBus'
import { previewBus } from '../../../../core/previewBus'
import { engine } from '../../../../core/engine'
import { useDraggable } from '../../../../ui/useDraggable'

const AVAILABLE_TRANSITIONS: TransitionPlugin[] = [beatCutPlugin, crossfadePlugin]


// ============================================================
// 縦フェーダーコンポーネント
// ============================================================

function VerticalFader({
  label,
  value,
  onChange,
}: {
  label: string
  value: number
  onChange: (v: number) => void
}) {
  return (
    <div className="flex flex-col items-center gap-1" style={{ width: 36 }}>
      <div className="text-[9px] text-[#7878aa]">{label}</div>
      <div
        className="relative flex items-center justify-center"
        style={{ height: 100, width: 20 }}
      >
        <input
          type="range"
          min={0}
          max={1}
          step={0.01}
          value={value}
          onChange={(e) => onChange(parseFloat(e.target.value))}
          onClick={(e) => e.stopPropagation()}
          className="accent-[#7878ff] cursor-pointer"
          style={{
            writingMode: 'vertical-lr',
            direction: 'rtl',
            height: 100,
            width: 20,
          }}
        />
      </div>
      <div className="text-[9px] text-[#4a4a6e]">{Math.round(value * 100)}%</div>
    </div>
  )
}

// ============================================================
// MixerSimpleWindow
// ============================================================

/**
 * MixerSimpleWindow — v1 固定実装の Mixer Simple Window
 *
 * Phase 11 UI: Edit view × 3 + Output view × 3 の縦フェーダー + SWAP ボタン
 * v2 送り機能（Transition / Crossfader / Tap Tempo）はコードを残して非表示。
 * View メニュー（⌘3）またはキーボード「3」で表示/非表示を切り替えられる。
 */
export function MixerSimpleWindow() {
  const [layers, setLayers] = useState<Layer[]>([])
  const [routings, setRoutings] = useState<LayerRouting[]>(engine.getLayerRoutings())
  const [screenAssign, setScreenAssign] = useState<ScreenAssignState>(engine.getScreenAssign())
  const smallScreenRef = useRef<HTMLCanvasElement>(null)

  // --- v2 送り（コードは残す・UI は非表示） ---
  const [crossfader, setCrossfader] = useState(0)
  const [transitionId, setTransitionId] = useState(AVAILABLE_TRANSITIONS[0].id)
  const [displayBpm, setDisplayBpm] = useState(128)
  const tapTimesRef = useRef<number[]>([])
  // --- v2 送りここまで ---

  const { pos, handleMouseDown } = useDraggable({
    x: Math.max(0, window.innerWidth / 2 - 280),
    y: Math.max(0, window.innerHeight - 320),
  })

  // 200ms ポーリング：レイヤー状態・ルーティング・アサインを同期
  useEffect(() => {
    const sync = () => {
      setLayers([...engine.getLayers()])
      setRoutings([...engine.getLayerRoutings()])
      setScreenAssign({ ...engine.getScreenAssign() })
    }
    sync()
    const timer = window.setInterval(sync, 200)
    return () => window.clearInterval(timer)
  }, [])

  // Small screen：200ms ポーリングで layerManager の canvas を drawImage 合成
  useEffect(() => {
    const DPR = window.devicePixelRatio || 1
    const SMALL_W = 240 * DPR
    const SMALL_H = 135 * DPR
    const timer = window.setInterval(() => {
      const canvas = smallScreenRef.current
      if (!canvas) return
      const ctx = canvas.getContext('2d')
      if (!ctx) return
      const assign = engine.getScreenAssign().small
      const currentRoutings = engine.getLayerRoutings()
      const currentLayers = engine.getLayers()

      ctx.clearRect(0, 0, SMALL_W, SMALL_H)
      ctx.fillStyle = '#0a0a14'
      ctx.fillRect(0, 0, SMALL_W, SMALL_H)

      for (const layer of currentLayers) {
        if (!layer.plugin) continue
        const routing = currentRoutings.find((r) => r.layerId === layer.id)
        if (!routing) continue
        const opacity = assign === 'output' ? routing.outputOpacity : routing.editOpacity
        if (opacity === 0) continue
        ctx.globalAlpha = opacity
        ctx.drawImage(layer.canvas, 0, 0, SMALL_W, SMALL_H)
      }
      ctx.globalAlpha = 1
    }, 200)
    return () => window.clearInterval(timer)
  }, [])

  // Edit view フェーダー変更
  function handleEditOpacity(layerId: string, value: number) {
    const r = routings.find((r) => r.layerId === layerId)
    if (!r) return
    engine.setLayerRouting(layerId, r.outputOpacity, value)
  }

  // Output view フェーダー変更
  function handleOutputOpacity(layerId: string, value: number) {
    const r = routings.find((r) => r.layerId === layerId)
    if (!r) return
    engine.setLayerRouting(layerId, value, r.editOpacity)
  }

  // SWAP ボタン
  function handleSwap() {
    engine.swapScreenAssign()
    setScreenAssign({ ...engine.getScreenAssign() })
  }

  // --- v2 送り関数（コードは残す・UI は非表示） ---
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
  function handleTransitionChange(id: string) {
    setTransitionId(id)
    setCrossfader(0)
    engine.setTransition(id)
  }
  function handleTap() {
    const now = performance.now()
    const taps = tapTimesRef.current
    if (taps.length > 0 && now - taps[taps.length - 1] > 2000) {
      tapTimesRef.current = []
    }
    tapTimesRef.current.push(now)
    if (tapTimesRef.current.length >= 2) {
      const intervals = []
      for (let i = 1; i < tapTimesRef.current.length; i++) {
        intervals.push(tapTimesRef.current[i] - tapTimesRef.current[i - 1])
      }
      const avg = intervals.reduce((a, b) => a + b, 0) / intervals.length
      const bpm = Math.round(60000 / avg)
      engine.clock.setTempo(bpm)
      setDisplayBpm(bpm)
    }
  }
  // v2 送り関数ここまで（crossfader / transitionId / displayBpm / handleCrossfaderChange /
  // handleTransitionChange / handleTap は v2 で UI 公開）
  void crossfader; void handleCrossfaderChange; void handleTransitionChange
  void displayBpm; void handleTap

  return (
    <div
      className="fixed z-50 bg-[#0f0f1e] border border-[#2a2a4e] rounded-lg
                 text-white font-mono text-xs select-none"
      style={{ left: pos.x, top: pos.y, width: 680, padding: '12px 16px' }}
    >
      {/* ヘッダー（ドラッグハンドル） */}
      <div
        onMouseDown={handleMouseDown}
        className="text-[10px] text-[#7878aa] mb-3 tracking-widest"
        style={{ cursor: 'grab' }}
      >
        MIXER SIMPLE WINDOW
      </div>

      {/* Small screen + フェーダーエリア 横並び */}
      <div className="flex items-start gap-4">

        {/* Small screen */}
        <div className="flex-shrink-0">
          <div className="text-[9px] text-[#4a4a6e] mb-1 tracking-wider">
            SMALL SCREEN —
            <span className="text-[#aaaaff] ml-1">{screenAssign.small.toUpperCase()}</span>
          </div>
          <canvas
            ref={smallScreenRef}
            width={240 * (window.devicePixelRatio || 1)}
            height={135 * (window.devicePixelRatio || 1)}
            style={{
              width: 240,
              height: 135,
              display: 'block',
              border: '1px solid #2a2a4e',
              borderRadius: 4,
            }}
          />
        </div>

        {/* フェーダーエリア */}
        <div className="flex items-center gap-3">

        {/* EDIT view フェーダー × 3 */}
        <div>
          <div className="text-[10px] text-[#aaaacc] mb-2 tracking-wider">EDIT view</div>
          <div className="flex gap-2">
            {layers.map((layer, i) => {
              const r = routings.find((r) => r.layerId === layer.id)
              return (
                <div key={layer.id} className="flex flex-col items-center">
                  <VerticalFader
                    label={`L${i + 1}`}
                    value={r?.editOpacity ?? 1}
                    onChange={(v) => handleEditOpacity(layer.id, v)}
                  />
                  <div
                    className="text-[8px] text-center mt-1"
                    style={{ color: layer.plugin ? '#7878aa' : '#3a3a5e', width: 36 }}
                  >
                    {layer.plugin?.name ?? 'None'}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* 中央：SWAP ボタン + アサインラベル */}
        <div className="flex flex-col items-center justify-center" style={{ paddingTop: 20, minWidth: 80 }}>
          <button
            onClick={handleSwap}
            className="bg-[#1a1a3e] border border-[#4a4a7e] rounded px-3 py-1
                       text-[#aaaaff] text-[11px] cursor-pointer hover:bg-[#2a2a5e]
                       tracking-wider mb-3"
          >
            ⇄ SWAP
          </button>
          <div className="text-[9px] text-center" style={{ lineHeight: 1.8 }}>
            <div>
              <span className="text-[#4a4a6e]">Large: </span>
              <span className="text-[#aaaaff] font-bold">
                {screenAssign.large.toUpperCase()}
              </span>
            </div>
            <div>
              <span className="text-[#4a4a6e]">Small: </span>
              <span className="text-[#aaaaff] font-bold">
                {screenAssign.small.toUpperCase()}
              </span>
            </div>
          </div>
        </div>

        {/* OUTPUT view フェーダー × 3 */}
        <div>
          <div className="text-[10px] text-[#aaaacc] mb-2 tracking-wider">OUTPUT view</div>
          <div className="flex gap-2">
            {layers.map((layer, i) => {
              const r = routings.find((r) => r.layerId === layer.id)
              return (
                <div key={layer.id} className="flex flex-col items-center">
                  <VerticalFader
                    label={`L${i + 1}`}
                    value={r?.outputOpacity ?? 1}
                    onChange={(v) => handleOutputOpacity(layer.id, v)}
                  />
                  <div
                    className="text-[8px] text-center mt-1"
                    style={{ color: layer.plugin ? '#7878aa' : '#3a3a5e', width: 36 }}
                  >
                    {layer.plugin?.name ?? 'None'}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        </div>

      </div>
    </div>
  )
}
