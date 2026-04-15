/**
 * GeometrySimpleDnDWindow
 *
 * GeometrySimpleWindow に D&D ハンドル（≡）を追加した Window。
 * 各 ParamRow の先頭に draggable な ≡ を表示し、
 * MacroWindow の KnobCell にドロップしてアサインできる。
 *
 * Simple Window との差分:
 *   - ParamRow 先頭に draggable ≡ ハンドル追加
 *   - onDragStart で DragPayload を application/geography-param でセット
 *
 * 含めないもの:
 *   - RangeSlider（可動域制約） → StandardD&D Window で追加予定
 *   - Preset（Save / Load / Delete）
 */

import { useCallback, useEffect, useRef, useState } from 'react'
import { engine } from '../../../core/engine'
import { useDraggable } from '../../../ui/useDraggable'
import type { RegisteredParameterWithCC } from '../../../types/midi-registry'
import type { DragPayload } from '../../../types'

const LAYER_TABS = ['layer-1', 'layer-2', 'layer-3'] as const
type LayerId = (typeof LAYER_TABS)[number]

// ============================================================
// Props
// ============================================================

export interface GeometrySimpleDnDWindowProps {
  onPluginApply: (layerId: string, pluginId: string) => void
  onPluginRemove: (layerId: string) => void
}

// ============================================================
// GeometrySimpleDnDWindow
// ============================================================

export function GeometrySimpleDnDWindow({ onPluginApply, onPluginRemove }: GeometrySimpleDnDWindowProps) {
  const [collapsed, setCollapsed] = useState(false)
  const [activeLayer, setActiveLayer] = useState<LayerId>('layer-1')
  const [pluginName, setPluginName] = useState<string>('')
  const [pluginId, setPluginId] = useState<string>('')
  const [params, setParams] = useState<RegisteredParameterWithCC[]>([])
  const { pos, handleMouseDown } = useDraggable({ x: window.innerWidth - 560, y: 220 })

  const getParamsFromRegistry = useCallback((layerId: LayerId, geoId: string) => {
    return engine.getParameters(layerId).filter((p) => p.pluginId === geoId)
  }, [])

  useEffect(() => {
    return engine.onRegistryChanged(() => {
      const geo = engine.getGeometryPlugin(activeLayer)
      if (!geo) { setParams([]); return }
      setParams(getParamsFromRegistry(activeLayer, geo.id))
    })
  }, [activeLayer, getParamsFromRegistry])

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
    const timer = window.setInterval(() => {
      const geo = engine.getGeometryPlugin(activeLayer)
      if (!geo) {
        if (pluginIdRef.current !== '') {
          setPluginId(''); setPluginName(''); setParams([])
          onPluginRemove(activeLayer)
        }
        return
      }
      if (geo.id !== pluginIdRef.current) {
        setPluginId(geo.id); setPluginName(geo.name)
        onPluginApply(activeLayer, geo.id)
      }
      // MacroKnob 操作など外部からの値変化を読み返す
      const live = engine.getParametersLive(activeLayer).filter((p) => p.pluginId === geo.id)
      setParams(live)
    }, 200)
    return () => window.clearInterval(timer)
  }, [activeLayer, onPluginApply, onPluginRemove])

  return (
    <div className="fixed z-50 font-mono text-xs select-none" style={{ left: pos.x, top: pos.y, width: 320 }}>
      <div className="bg-[#0f0f1e] border border-[#2a2a4e] rounded-lg overflow-hidden" style={{ padding: '10px 14px' }}>

        {/* ヘッダー */}
        <div onMouseDown={handleMouseDown} className="flex items-center justify-between mb-2" style={{ cursor: 'grab' }}>
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-[#7878aa] tracking-widest">GEOMETRY D&amp;D</span>
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
                  pluginId={pluginId}
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
// ParamRow（D&D ハンドル付き）
// ============================================================

interface ParamRowProps {
  param: RegisteredParameterWithCC
  layerId: string
  pluginId: string
}

function ParamRow({ param, layerId, pluginId }: ParamRowProps) {
  const { name, min, max, step, ccNumber } = param
  const [value, setValue] = useState(param.value)
  const [isDragging, setIsDragging] = useState(false)

  useEffect(() => { setValue(param.value) }, [param.value])

  const isBinary = min === 0 && max === 1 && step === 1

  function handleChange(raw: number) {
    setValue(raw)
    const normalized = max > min ? (raw - min) / (max - min) : 0
    engine.handleMidiCC({ slot: ccNumber, value: Math.min(1, Math.max(0, normalized)), source: 'window', layerId })
  }

  function handleDragStart(e: React.DragEvent) {
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

  function handleDragEnd() {
    setIsDragging(false)
  }

  return (
    <div className="flex items-center gap-1.5">
      {/* D&D ハンドル */}
      <div
        draggable
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        className="shrink-0 flex items-center justify-center rounded cursor-grab transition-colors"
        style={{
          width: 14,
          height: 14,
          fontSize: 9,
          color: isDragging ? '#9090ff' : '#3a3a6e',
          background: isDragging ? '#1a1a4e' : 'transparent',
          userSelect: 'none',
        }}
        title={`${name} をドラッグして MacroKnob にアサイン`}
      >
        ≡
      </div>

      <span className="text-[8px] text-[#4a4a7e] w-10 shrink-0 tabular-nums">CC{ccNumber}</span>
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
