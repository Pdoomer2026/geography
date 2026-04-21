/**
 * GeometryStandardWindow
 * spec: docs/spec/plugin-manager.spec.md §4-1
 *
 * GeometrySimpleWindow に稼働幅（lo/hi RangeSlider）を追加した上位 Window。
 *
 * SimpleWindow との差分:
 *   - ParamRow に RangeSlider を使用（2段構成）
 *   - lo/hi は ParamRow の localState（Registry/engine に影響しない）
 *   - 送信時の変換: normalized = (raw - lo) / (hi - lo)
 *
 * 含めないもの:
 *   - D&D ハンドル（MacroKnob アサイン）
 *   - Preset（Save / Load / Delete）
 */

import { useCallback, useEffect, useRef, useState } from 'react'
import { engine } from '../../../../core/engine'
import { useDraggable } from '../../../../ui/useDraggable'
import type { RegisteredParameterWithCC } from '../../../../application/schema/midi-registry'
import { RangeSlider } from './RangeSlider'

const LAYER_TABS = ['layer-1', 'layer-2', 'layer-3'] as const
type LayerId = (typeof LAYER_TABS)[number]

// ============================================================
// Props
// ============================================================

export interface GeometryStandardWindowProps {
  onPluginApply: (layerId: string, pluginId: string) => void
  onPluginRemove: (layerId: string) => void
}

// ============================================================
// GeometryStandardWindow
// ============================================================

export function GeometryStandardWindow({ onPluginApply, onPluginRemove }: GeometryStandardWindowProps) {
  const [collapsed, setCollapsed] = useState(false)
  const [activeLayer, setActiveLayer] = useState<LayerId>('layer-1')
  const [pluginName, setPluginName] = useState<string>('')
  const [pluginId, setPluginId] = useState<string>('')
  const [params, setParams] = useState<RegisteredParameterWithCC[]>([])
  const { pos, handleMouseDown } = useDraggable({ x: window.innerWidth - 580, y: 200 })

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
        setParams(getParamsFromRegistry(activeLayer, geo.id))
        onPluginApply(activeLayer, geo.id)
      }
    }, 200)
    return () => window.clearInterval(timer)
  }, [activeLayer, onPluginApply, onPluginRemove, getParamsFromRegistry])

  return (
    <div className="fixed z-50 font-mono text-xs select-none" style={{ left: pos.x, top: pos.y, width: 340 }}>
      <div className="bg-[#0f0f1e] border border-[#2a2a4e] rounded-lg overflow-hidden" style={{ padding: '10px 14px' }}>

        {/* ヘッダー */}
        <div onMouseDown={handleMouseDown} className="flex items-center justify-between mb-2" style={{ cursor: 'grab' }}>
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-[#7878aa] tracking-widest">GEOMETRY STANDARD</span>
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

            <div className="flex flex-col gap-3">
              {params.length === 0 && (
                <div className="text-[#3a3a5e] text-[10px] py-2 text-center">— no params —</div>
              )}
              {params.map((param) => (
                <ParamRow key={param.ccNumber} param={param} layerId={activeLayer} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ============================================================
// ParamRow（RangeSlider 2段構成）
// ============================================================

interface ParamRowProps {
  param: RegisteredParameterWithCC
  layerId: string
}

function ParamRow({ param, layerId }: ParamRowProps) {
  const { name, min, max, step, ccNumber } = param
  const [value, setValue] = useState(param.value)
  const [lo, setLo] = useState(min)
  const [hi, setHi] = useState(max)

  useEffect(() => { setValue(param.value) }, [param.value])

  const isBinary = min === 0 && max === 1 && step === 1

  function handleChange(raw: number) {
    setValue(raw)
    const fullRange = max - min || 1
    const t = (raw - min) / fullRange
    const remapped = lo + t * (hi - lo)
    const normalized = Math.min(1, Math.max(0, (remapped - min) / fullRange))
    engine.handleMidiCC({ slot: ccNumber, value: normalized, source: 'window', layerId })
  }

  function handleLoHiChange(newLo: number, newHi: number) {
    setLo(newLo)
    setHi(newHi)
  }

  return (
    <div className="flex flex-col gap-1">
      {/* ラベル行 */}
      <div className="flex items-center gap-1.5">
        <span className="text-[8px] text-[#4a4a7e] w-10 shrink-0 tabular-nums">CC{ccNumber}</span>
        <span className="text-[9px] text-[#5a5a8e] w-20 truncate shrink-0">{name}</span>
        <span className="text-[9px] text-[#aaaaee] w-12 text-right tabular-nums shrink-0">
          {value.toFixed(max <= 0.1 ? 4 : 2)}
        </span>
      </div>

      {/* スライダー行 */}
      <div className="pl-10">
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
          <RangeSlider
            min={min}
            max={max}
            lo={lo}
            hi={hi}
            value={value}
            step={step}
            onLoHiChange={handleLoHiChange}
            onChange={handleChange}
          />
        )}
      </div>
    </div>
  )
}
