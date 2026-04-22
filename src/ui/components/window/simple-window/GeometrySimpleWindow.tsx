/**
 * GeometrySimpleWindow
 * spec: docs/spec/plugin-manager.spec.md §4-1
 *
 * Geometry Plugin 用 Simple Window（Day61 改名: SimpleWindowPlugin → GeometrySimpleWindow）
 *
 * 設計原則:
 *   - transportRegistry を直接購読する（App.tsx から params を受け取らない）
 *   - L1/L2/L3 タブで activeLayer を切り替える
 *   - engine.handleMidiCC() でパラメータ変更
 *   - onPluginApply / onPluginRemove は App.tsx 経由で受け取る
 *
 * 含めないもの:
 *   - RangeSlider（可動域制約）
 *   - D&D ハンドル（MacroKnob アサイン）
 *   - Preset（Save / Load / Delete）
 */

import { useCallback, useEffect, useRef, useState } from 'react'
import { engine } from '../../../../application/orchestrator/engine'
import { useDraggable } from '../../../../ui/useDraggable'
import { useSimpleParamRow } from '../../../../ui/hooks/useSimpleParamRow'
import type { RegisteredParameterWithCC } from '../../../../application/schema/midi-registry'

const LAYER_TABS = ['layer-1', 'layer-2', 'layer-3'] as const
type LayerId = (typeof LAYER_TABS)[number]

// ============================================================
// Props
// ============================================================

export interface GeometrySimpleWindowProps {
  onPluginApply: (layerId: string, pluginId: string) => void
  onPluginRemove: (layerId: string) => void
}

// ============================================================
// GeometrySimpleWindow
// ============================================================

export function GeometrySimpleWindow({ onPluginApply, onPluginRemove }: GeometrySimpleWindowProps) {
  const [collapsed, setCollapsed] = useState(false)
  const [activeLayer, setActiveLayer] = useState<LayerId>('layer-1')
  const [pluginName, setPluginName] = useState<string>('')
  const [pluginId, setPluginId] = useState<string>('')
  const [params, setParams] = useState<RegisteredParameterWithCC[]>([])
  const { pos, handleMouseDown } = useDraggable({ x: window.innerWidth - 560, y: 16 })

  const getParamsFromRegistry = useCallback((layerId: LayerId, geoId: string) => {
    return engine.getParameters(layerId).filter((p) => p.pluginId === geoId)
  }, [])

  useEffect(() => {
    const geo = engine.getGeometryPlugin(activeLayer)
    if (geo) {
      setPluginId(geo.id)
      setPluginName(geo.name)
      setParams(getParamsFromRegistry(activeLayer, geo.id))
    } else {
      setPluginId('')
      setPluginName('')
      setParams([])
    }
  }, [activeLayer, getParamsFromRegistry])

  const pluginIdRef = useRef(pluginId)
  pluginIdRef.current = pluginId

  useEffect(() => {
    return engine.onRegistryChanged(() => {
      const geo = engine.getGeometryPlugin(activeLayer)
      if (!geo) {
        if (pluginIdRef.current !== '') {
          setPluginId('')
          setPluginName('')
          setParams([])
          onPluginRemove(activeLayer)
        }
        return
      }
      if (geo.id !== pluginIdRef.current) {
        pluginIdRef.current = geo.id  // 先に更新して再入ループを防ぐ
        setPluginId(geo.id)
        setPluginName(geo.name)
        setParams(getParamsFromRegistry(activeLayer, geo.id))
        onPluginApply(activeLayer, geo.id)
        return
      }
      setParams(getParamsFromRegistry(activeLayer, geo.id))
    })
  }, [activeLayer, onPluginApply, onPluginRemove, getParamsFromRegistry])

  return (
    <div className="fixed z-50 font-mono text-xs select-none" style={{ left: pos.x, top: pos.y, width: 320 }}>
      <div className="bg-[#0f0f1e] border border-[#2a2a4e] rounded-lg overflow-hidden" style={{ padding: '10px 14px' }}>

        {/* ヘッダー */}
        <div onMouseDown={handleMouseDown} className="flex items-center justify-between mb-2" style={{ cursor: 'grab' }}>
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
            <div className="flex items-center gap-2">
              <span className="text-[9px] text-[#5a5a8e] w-14 shrink-0">Geometry</span>
              <span className="text-[10px] text-[#aaaaee]">{pluginName || '— none —'}</span>
            </div>

            <div className="flex flex-col gap-1.5">
              {params.length === 0 && (
                <div className="text-[#3a3a5e] text-[10px] py-2 text-center">— no params —</div>
              )}
              {params.map((param) => (
                <ParamRow
                  key={param.ccNumber}
                  param={param}
                  layerId={activeLayer}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ============================================================
// ParamRow
// ============================================================

interface ParamRowProps {
  param: RegisteredParameterWithCC
  layerId: string
}

function ParamRow({ param, layerId }: ParamRowProps) {
  const { name, min, max, step, ccNumber } = param

  const { value, isBinary, handleChange } = useSimpleParamRow({ param, layerId })

  return (
    <div className="flex items-center gap-1.5">
      <span className="text-[8px] text-[#4a4a7e] w-10 shrink-0 tabular-nums">
        CC{ccNumber}
      </span>
      <span className="text-[9px] text-[#5a5a8e] w-16 truncate shrink-0">{name}</span>
      {isBinary ? (
        <button
          onClick={() => handleChange(value >= 0.5 ? 0 : 1)}
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
            step={step}
            value={value}
            onChange={(e) => handleChange(parseFloat(e.target.value))}
            className="flex-1 accent-[#5a5aff] h-1 cursor-pointer"
          />
          <span className="text-[9px] text-[#5a5a8e] w-10 text-right tabular-nums shrink-0">
            {value.toFixed(max <= 0.1 ? 4 : 2)}
          </span>
        </>
      )}
    </div>
  )
}
