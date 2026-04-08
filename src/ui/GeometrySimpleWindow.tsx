import { useCallback, useEffect, useState } from 'react'
import { engine } from '../core/engine'
import { ccMapService } from '../core/ccMapService'
import { useDraggable } from './useDraggable'
import type { PluginParam } from '../types'

const LAYER_TABS = ['layer-1', 'layer-2', 'layer-3'] as const
type LayerId = (typeof LAYER_TABS)[number]

/**
 * GeometrySimpleWindow — Geometry Plugin params のデフォルト最小 UI
 *
 * キーボード「5」で表示/非表示を切り替えられる。
 *
 * 設計上の注意:
 * - params の値はローカル state で管理し、ポーリングでは上書きしない
 * - ポーリングは Geometry Plugin ID の変化（切り替え）だけを検知する
 */
export function GeometrySimpleWindow() {
  const [collapsed, setCollapsed] = useState(false)
  const [activeLayer, setActiveLayer] = useState<LayerId>('layer-1')
  const [geometryId, setGeometryId] = useState<string>('')
  const [geometryName, setGeometryName] = useState<string>('')
  const [params, setParams] = useState<Record<string, PluginParam>>({})
  const { pos, handleMouseDown } = useDraggable({ x: window.innerWidth - 900, y: 16 })

  // Geometry Plugin ID が変わったときだけ params を同期する
  const syncFromEngine = useCallback(() => {
    const geo = engine.getGeometryPlugin(activeLayer)
    if (!geo) {
      if (geometryId !== '') {
        setGeometryId('')
        setGeometryName('')
        setParams({})
      }
      return
    }
    if (geo.id !== geometryId) {
      setGeometryId(geo.id)
      setGeometryName(geo.name)
      setParams(structuredClone(geo.params))
    }
  }, [activeLayer, geometryId])

  // レイヤー切り替え時に初回同期
  useEffect(() => {
    const geo = engine.getGeometryPlugin(activeLayer)
    if (geo) {
      setGeometryId(geo.id)
      setGeometryName(geo.name)
      setParams(structuredClone(geo.params))
    } else {
      setGeometryId('')
      setGeometryName('')
      setParams({})
    }
  }, [activeLayer])

  // 200ms ポーリングは Geometry Plugin ID の変化検知のみ
  useEffect(() => {
    const timer = window.setInterval(syncFromEngine, 200)
    return () => window.clearInterval(timer)
  }, [syncFromEngine])

  function handleParam(paramKey: string, value: number, param: PluginParam) {
    const cc = ccMapService.getCcNumber(geometryId, paramKey)
    const normalized = (value - param.min) / (param.max - param.min)
    engine.handleMidiCC({ cc, value: normalized, protocol: 'midi2', resolution: 4294967296 })
    // フロントの表示はローカル state に即反映（200ms ポーリング待たず）
    setParams((prev) => ({
      ...prev,
      [paramKey]: { ...prev[paramKey], value },
    }))
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
            <span className="text-[10px] text-[#7878aa] tracking-widest">GEOMETRY SIMPLE WINDOW</span>
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

        {!collapsed && (
          <div className="flex flex-col gap-2">
            {/* Geometry 名表示 */}
            <div className="flex items-center gap-2">
              <span className="text-[9px] text-[#5a5a8e] w-14 shrink-0">Geometry</span>
              <span className="text-[10px] text-[#aaaaee]">
                {geometryName || '— none —'}
              </span>
            </div>

            {/* params スライダー */}
            {Object.keys(params).length > 0 && (
              <div className="flex flex-col gap-1 mt-1">
                {Object.entries(params).map(([key, param]) => (
                  <ParamRow
                    key={`${activeLayer}-${geometryId}-${key}`}
                    label={param.label}
                    value={param.value}
                    min={param.min}
                    max={param.max}
                    onChange={(v) => handleParam(key, v, param)}
                  />
                ))}
              </div>
            )}

            {!geometryId && (
              <div className="text-[#3a3a5e] text-[10px] py-2 text-center">
                — no geometry —
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

// ────────────────────────────────────────────────
// ParamRow: 1 パラメーターのスライダー行
// ────────────────────────────────────────────────

interface ParamRowProps {
  label: string
  value: number
  min: number
  max: number
  onChange: (value: number) => void
}

function ParamRow({ label, value, min, max, onChange }: ParamRowProps) {
  const isBinary = min === 0 && max === 1

  return (
    <div className="flex items-center gap-2">
      <span className="text-[9px] text-[#5a5a8e] w-20 truncate shrink-0">{label}</span>
      {isBinary ? (
        <button
          onClick={() => onChange(value >= 0.5 ? 0 : 1)}
          className="text-[10px] rounded px-2 py-0.5 border transition-colors"
          style={{
            background: value >= 0.5 ? '#2a2a6e' : '#1a1a2e',
            borderColor: value >= 0.5 ? '#5a5aaa' : '#2a2a4e',
            color: value >= 0.5 ? '#aaaaee' : '#4a4a6e',
          }}
        >
          {value >= 0.5 ? 'ON' : 'OFF'}
        </button>
      ) : (
        <>
          <input
            type="range"
            min={min}
            max={max}
            step={(max - min) / 200}
            value={value}
            onChange={(e) => onChange(parseFloat(e.target.value))}
            className="flex-1 accent-[#5a5aff] h-1 cursor-pointer"
          />
          <span className="text-[9px] text-[#5a5a8e] w-10 text-right tabular-nums">
            {value.toFixed(2)}
          </span>
        </>
      )}
    </div>
  )
}
