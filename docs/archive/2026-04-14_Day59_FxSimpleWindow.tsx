import { useEffect, useState } from 'react'
import { engine } from '../core/engine'
import { ccMapService } from '../core/ccMapService'
import { useDraggable } from './useDraggable'
import type { FXPlugin, PluginParam } from '../types'

const LAYER_TABS = ['layer-1', 'layer-2', 'layer-3'] as const
type LayerId = (typeof LAYER_TABS)[number]

/**
 * FxSimpleWindow — FX Plugin のデフォルト最小 UI（Simple Window）
 *
 * 旧名称: FxControlPanel
 * View メニュー（⌘2）またはキーボード「2」で表示/非表示を切り替えられる。
 * カスタム Window Plugin がないときのフォールバックとして機能する（v2〜）。
 *
 * [L1][L2][L3] タブで対象レイヤーを切り替えて FX スタックを操作する。
 * 折りたたみ可能。200ms ポーリングで FX 状態を同期。
 */
export function FxSimpleWindow() {
  const [collapsed, setCollapsed] = useState(false)
  const [activeLayer, setActiveLayer] = useState<LayerId>('layer-1')
  const [fxPlugins, setFxPlugins] = useState<FXPlugin[]>([])
  const { pos, handleMouseDown } = useDraggable({ x: window.innerWidth - 300, y: 16 })

  useEffect(() => {
    const sync = () => setFxPlugins([...engine.getFxPlugins(activeLayer)])
    sync()
    const timer = window.setInterval(sync, 200)
    return () => window.clearInterval(timer)
  }, [activeLayer])

  function handleToggle(fxId: string, enabled: boolean) {
    engine.setFxEnabled(fxId, enabled, activeLayer)
  }

  function handleParam(fxId: string, paramKey: string, value: number, param: PluginParam) {
    const cc = ccMapService.getCcNumber(fxId, paramKey)
    const normalized = (value - param.min) / (param.max - param.min)
    engine.handleMidiCC({ slot: cc, value: normalized, source: 'window' })
  }

  return (
    <div
      className="fixed z-50 font-mono text-xs select-none"
      style={{ left: pos.x, top: pos.y, width: 280 }}
    >
      <div
        className="bg-[#0f0f1e] border border-[#2a2a4e] rounded-lg overflow-hidden"
        style={{ padding: '10px 14px' }}
      >
        {/* ヘッダー（ドラッグハンドル） */}
        <div
          onMouseDown={handleMouseDown}
          className="flex items-center justify-between mb-2"
          style={{ cursor: 'grab' }}
        >
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-[#7878aa] tracking-widest">FX SIMPLE WINDOW</span>
            {/* レイヤー切り替えタブ */}
            <div className="flex gap-1">
              {LAYER_TABS.map((id, i) => (
                <button
                  key={id}
                  onClick={() => setActiveLayer(id)}
                  className="text-[9px] rounded px-1.5 py-0.5 border transition-colors"
                  style={{
                    background: activeLayer === id ? '#2a2a6e' : '#1a1a2e',
                    borderColor: activeLayer === id ? '#5a5aaa' : '#2a2a4e',
                    color: activeLayer === id ? '#aaaaee' : '#4a4a6e',
                  }}
                >
                  L{i + 1}
                </button>
              ))}
            </div>
          </div>
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
                onParam={(paramKey, value, param) => handleParam(fx.id, paramKey, value, param)}
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
  onParam: (paramKey: string, value: number, param: PluginParam) => void
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
                onChange={(e) => onParam(key, parseFloat(e.target.value), param)}
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
