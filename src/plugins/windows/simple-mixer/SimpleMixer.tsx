import { useEffect, useRef, useState } from 'react'
import type { CSSBlendMode, Layer, TransitionPlugin } from '../../../types'
import beatCutPlugin from '../../transitions/beat-cut'
import crossfadePlugin from '../../transitions/crossfade'
import { programBus } from '../../../core/programBus'
import { previewBus } from '../../../core/previewBus'
import { engine } from '../../../core/engine'
import { useDraggable } from '../../../ui/useDraggable'

const AVAILABLE_TRANSITIONS: TransitionPlugin[] = [beatCutPlugin, crossfadePlugin]

const BLEND_MODES: { value: CSSBlendMode; label: string }[] = [
  { value: 'normal',   label: 'Normal' },
  { value: 'add',      label: 'Add' },
  { value: 'multiply', label: 'Multiply' },
  { value: 'screen',   label: 'Screen' },
  { value: 'overlay',  label: 'Overlay' },
]

/**
 * SimpleMixer — v1 固定実装の Mixer UI
 *
 * 閉じることができない（MixerPlugin ルール）。
 * v1 から MixerPlugin Interface に準拠した実装にする（v2 で Plugin 化するとき設計変更ゼロにするため）。
 */
export function SimpleMixer() {
  const [crossfader, setCrossfader] = useState(0)
  const [transitionId, setTransitionId] = useState(AVAILABLE_TRANSITIONS[0].id)
  const [displayBpm, setDisplayBpm] = useState(128)
  const [layers, setLayers] = useState<Layer[]>([])
  const [registeredPlugins, setRegisteredPlugins] = useState<{ id: string; name: string }[]>([])
  const previewRef = useRef<HTMLDivElement>(null)
  const tapTimesRef = useRef<number[]>([])
  const { pos, handleMouseDown } = useDraggable({
    x: Math.max(0, window.innerWidth / 2 - 260),
    y: Math.max(0, window.innerHeight - 300),
  })

  useEffect(() => {
    const syncLayers = () => {
      setLayers([...engine.getLayers()])
      // registeredPlugins は Registry が確定してから取得する（空なら毎回試みる）
      const plugins = engine.getRegisteredPlugins()
      if (plugins.length > 0) {
        setRegisteredPlugins(plugins)
      }
    }

    syncLayers()
    const timer = window.setInterval(syncLayers, 200)
    return () => window.clearInterval(timer)
  }, [])

  // PREVIEW バス: ref が準備できたら canvas を mount して表示する
  useEffect(() => {
    if (!previewRef.current) return
    const container = previewRef.current

    // まだ mount されていなければ mount する（canvas を container に追加）
    if (!previewBus.getCanvas()) {
      previewBus.mount(container)
    }

    // canvas を 160×90 で表示（内部解像度 320×180 はそのまま）
    const canvas = previewBus.getCanvas()
    if (!canvas) return
    canvas.style.width = '160px'
    canvas.style.height = '90px'

    // 既に別のコンテナに入っていれば移動する
    if (canvas.parentNode !== container) {
      container.appendChild(canvas)
    }

    return () => {
      // クリーンアップ: canvas を container から除去（previewBus は dispose しない）
      if (canvas.parentNode === container) {
        container.removeChild(canvas)
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

  // タスク 3: Transition 切り替え時にクロスフェーダーを 0 にリセット・engine に通知
  function handleTransitionChange(id: string) {
    setTransitionId(id)
    setCrossfader(0)
    engine.setTransition(id)
  }

  // Tap Tempo: タップ間隔から BPM を計算して engine.clock に反映
  function handleTap() {
    const now = performance.now()
    const taps = tapTimesRef.current

    // 2秒以上間隔が空いたらリセット
    if (taps.length > 0 && now - taps[taps.length - 1] > 2000) {
      tapTimesRef.current = []
    }

    tapTimesRef.current.push(now)

    // 2回以上タップで BPM 計算
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

  return (
    <div
      className="fixed z-50 bg-[#0f0f1e] border border-[#2a2a4e] rounded-lg
                 text-white font-mono text-xs select-none"
      style={{ left: pos.x, top: pos.y, width: 520, padding: '12px 16px' }}
    >
      {/* ヘッダー（ドラッグハンドル） */}
      <div
        onMouseDown={handleMouseDown}
        className="text-[10px] text-[#7878aa] mb-2 tracking-widest"
        style={{ cursor: 'grab' }}
      >
        SIMPLE MIXER
      </div>

      {/* バス表示エリア */}
      <div className="flex gap-4 mb-3">
        {/* Program バス */}
        <div className="flex-1">
          <div className="text-[10px] text-[#aaaacc] mb-1 tracking-wider">PROGRAM</div>
          <div
            className="flex gap-1 items-stretch"
            style={{ height: 150 }}
          >
            {layers.map((layer, i) => (
              <div
                key={layer.id}
                className="flex-1 rounded-sm border flex flex-col justify-between px-1 py-1 text-[9px] select-none"
                style={{
                  height: '100%',
                  background: layer.mute ? '#0a0a14' : '#1a1a2e',
                  borderColor: layer.mute ? '#1a1a3e' : '#2a2a4e',
                  opacity: layer.mute ? 0.6 : 1,
                }}
              >
                {/* レイヤー番号 */}
                <div className="text-[#8f8fd1] text-center mb-1">L{i + 1}</div>

                {/* Plugin プルダウン */}
                <select
                  value={layer.plugin?.id ?? ''}
                  onChange={(e) => engine.setLayerPlugin(layer.id, e.target.value === '' ? null : e.target.value)}
                  onClick={(e) => e.stopPropagation()}
                  className="w-full bg-[#0a0a1a] border border-[#2a2a4e] rounded text-[8px] text-[#aaaacc] outline-none cursor-pointer mb-1"
                  style={{ padding: '1px 2px' }}
                >
                  <option value="">None</option>
                  {registeredPlugins.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>

                {/* blendMode プルダウン */}
                <select
                  value={layer.blendMode}
                  onChange={(e) =>
                    engine.setLayerBlendMode(layer.id, e.target.value as CSSBlendMode)
                  }
                  onClick={(e) => e.stopPropagation()}
                  className="w-full bg-[#0a0a1a] border border-[#2a2a4e] rounded text-[8px] text-[#aaaacc] outline-none cursor-pointer mb-1"
                  style={{ padding: '1px 2px' }}
                >
                  {BLEND_MODES.map((bm) => (
                    <option key={bm.value} value={bm.value}>{bm.label}</option>
                  ))}
                </select>

                {/* Opacity スライダー */}
                <div className="flex items-center gap-1 mt-1">
                  <span className="text-[#4a4a6e]" style={{ minWidth: 14 }}>α</span>
                  <input
                    type="range"
                    min={0}
                    max={1}
                    step={0.01}
                    value={layer.opacity}
                    onChange={(e) => engine.setLayerOpacity(layer.id, parseFloat(e.target.value))}
                    onClick={(e) => e.stopPropagation()}
                    className="flex-1 accent-[#7878ff] cursor-pointer"
                    style={{ height: 3 }}
                  />
                </div>

                {/* MUTE/LIVE トグル */}
                <div
                  onClick={() => engine.setLayerMute(layer.id, !layer.mute)}
                  className="text-center font-bold cursor-pointer mt-1"
                  style={{ color: layer.mute ? '#ff4444' : '#44ff88' }}
                >
                  {layer.mute ? 'MUTE' : 'LIVE'}
                </div>
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

      {/* BPM / Tap Tempo */}
      <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
        <button
          onClick={handleTap}
          style={{
            padding: '6px 14px',
            background: '#333',
            color: '#fff',
            border: '1px solid #555',
            borderRadius: 4,
            cursor: 'pointer',
            fontSize: 13,
          }}
        >
          TAP
        </button>
        <span style={{ color: '#aaa', fontSize: 13 }}>{displayBpm} BPM</span>
      </div>
    </div>
  )
}
