import { useEffect, useState } from 'react'
import { engine } from '../core/engine'
import type { FXPlugin } from '../types'

/**
 * FxControlPanel
 * layer-1 の FX スタックをリアルタイムに ON/OFF + パラメーター調整するパネル。
 * 折りたたみ可能。200ms ポーリングで FX 状態を同期。
 */
export function FxControlPanel() {
  const [collapsed, setCollapsed] = useState(false)
  const [fxPlugins, setFxPlugins] = useState<FXPlugin[]>([])

  // 200ms ポーリングで engine から FX 一覧を取得
  useEffect(() => {
    const sync = () => setFxPlugins([...engine.getFxPlugins()])
    sync()
    const timer = window.setInterval(sync, 200)
    return () => window.clearInterval(timer)
  }, [])

  function handleToggle(fxId: string, enabled: boolean) {
    engine.setFxEnabled(fxId, enabled)
  }

  function handleParam(fxId: string, paramKey: string, value: number) {
    engine.setFxParam(fxId, paramKey, value)
  }

  return (
    <div
      className="fixed right-4 top-4 z-50 font-mono text-xs select-none"
      style={{ width: 280 }}
    >
      <div
        className="bg-[#0f0f1e] border border-[#2a2a4e] rounded-lg overflow-hidden"
        style={{ padding: '10px 14px' }}
      >
        {/* ヘッダー */}
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] text-[#7878aa] tracking-widest">FX CONTROLS</span>
          <button
            onClick={() => setCollapsed((c) => !c)}
            className="text-[#4a4a6e] hover:text-[#aaaacc] transition-colors text-[11px] leading-none"
          >
            {collapsed ? '＋' : '－'}
          </button>
        </div>

        {/* FX リスト */}
        {!collapsed && (
          <div className="flex flex-col gap-2">
            {fxPlugins.map((fx) => (
              <FxRow
                key={fx.id}
                fx={fx}
                onToggle={(enabled) => handleToggle(fx.id, enabled)}
                onParam={(paramKey, value) => handleParam(fx.id, paramKey, value)}
              />
            ))}
            {fxPlugins.length === 0 && (
              <div className="text-[#3a3a5e] text-[10px] py-2 text-center">
                initializing...
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

// ────────────────────────────────────────────────
// FxRow: 1 FX の行（トグル + パラメータースライダー群）
// ────────────────────────────────────────────────

interface FxRowProps {
  fx: FXPlugin
  onToggle: (enabled: boolean) => void
  onParam: (paramKey: string, value: number) => void
}

function FxRow({ fx, onToggle, onParam }: FxRowProps) {
  const paramEntries = Object.entries(fx.params)

  return (
    <div>
      {/* FX 名 + トグル */}
      <div className="flex items-center justify-between">
        <span
          className="text-[11px]"
          style={{ color: fx.enabled ? '#aaaacc' : '#4a4a6e' }}
        >
          {fx.name}
        </span>
        <button
          onClick={() => onToggle(!fx.enabled)}
          className="text-[10px] rounded px-2 py-0.5 border transition-colors"
          style={{
            background: fx.enabled ? '#2a2a6e' : '#1a1a2e',
            borderColor: fx.enabled ? '#5a5aaa' : '#2a2a4e',
            color: fx.enabled ? '#aaaaee' : '#4a4a6e',
          }}
        >
          {fx.enabled ? 'ON' : 'OFF'}
        </button>
      </div>

      {/* パラメータースライダー（ON のときのみ表示） */}
      {fx.enabled && paramEntries.length > 0 && (
        <div className="mt-1 ml-2 flex flex-col gap-1">
          {paramEntries.map(([key, param]) => (
            <div key={key} className="flex items-center gap-2">
              <span className="text-[9px] text-[#5a5a8e] w-20 truncate">{param.label}</span>
              <input
                type="range"
                min={param.min}
                max={param.max}
                step={(param.max - param.min) / 200}
                value={param.value}
                onChange={(e) => onParam(key, parseFloat(e.target.value))}
                className="flex-1 accent-[#5a5aff] h-1 cursor-pointer"
              />
              <span className="text-[9px] text-[#5a5a8e] w-10 text-right tabular-nums">
                {param.value.toFixed(param.max <= 0.01 ? 4 : 2)}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
