/**
 * FxStandardDnDWindow
 *
 * FxStandardWindow（lo/hi RangeSlider）に D&D ハンドル（≡）を追加した Window。
 */

import { useCallback, useEffect, useRef, useState } from 'react'
import { engine } from '../../../../core/engine'
import { useDraggable } from '../../../../ui/useDraggable'
import type { RegisteredParameterWithCC } from '../../../../types/midi-registry'
import type { DragPayload } from '../../../../types'
import { RangeSlider } from '../standard-window/RangeSlider'

const LAYER_TABS = ['layer-1', 'layer-2', 'layer-3'] as const
type LayerId = (typeof LAYER_TABS)[number]

interface FxGroup {
  pluginId: string
  pluginName: string
  enabled: boolean
  params: RegisteredParameterWithCC[]
}

export function FxStandardDnDWindow() {
  const [collapsed, setCollapsed] = useState(false)
  const [activeLayer, setActiveLayer] = useState<LayerId>('layer-1')
  const [fxGroups, setFxGroups] = useState<FxGroup[]>([])
  const { pos, handleMouseDown } = useDraggable({ x: window.innerWidth - 320, y: 200 })
  const loHiMapRef = useRef<Map<number, { lo: number; hi: number }>>(new Map())

  const buildFxGroups = useCallback((lid: string): FxGroup[] => {
    return engine.getFxPlugins(lid).map((fx) => ({
      pluginId: fx.id,
      pluginName: fx.name,
      enabled: fx.enabled,
      params: engine.getParametersLive(lid).filter((p) => p.pluginId === fx.id),
    }))
  }, [])

  useEffect(() => {
    setFxGroups(buildFxGroups(activeLayer))
  }, [activeLayer, buildFxGroups])

  useEffect(() => {
    return engine.onRegistryChanged(() => {
      setFxGroups(buildFxGroups(activeLayer))
    })
  }, [activeLayer, buildFxGroups])

  useEffect(() => {
    return engine.onFxChanged(() => {
      setFxGroups(buildFxGroups(activeLayer))
    })
  }, [activeLayer, buildFxGroups])

  useEffect(() => {
    const timer = window.setInterval(() => {
      setFxGroups(buildFxGroups(activeLayer))
    }, 200)
    return () => window.clearInterval(timer)
  }, [activeLayer, buildFxGroups])

  function handleToggle(fxId: string, enabled: boolean) {
    engine.setFxEnabled(fxId, enabled, activeLayer)
  }

  return (
    <div className="fixed z-50 font-mono text-xs select-none" style={{ left: pos.x, top: pos.y, width: 300 }}>
      <div className="bg-[#0f0f1e] border border-[#2a2a4e] rounded-lg overflow-hidden" style={{ padding: '10px 14px' }}>

        <div onMouseDown={handleMouseDown} className="flex items-center justify-between mb-2" style={{ cursor: 'grab' }}>
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-[#7878aa] tracking-widest">FX STD D&amp;D</span>
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
          <div className="flex flex-col gap-3">
            {fxGroups.length === 0 && (
              <div className="text-[#3a3a5e] text-[10px] py-2 text-center">— no fx —</div>
            )}
            {fxGroups.map((group) => (
              <FxGroupRow
                key={`${activeLayer}-${group.pluginId}`}
                group={group}
                layerId={activeLayer}
                onToggle={handleToggle}
                loHiMapRef={loHiMapRef}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// ============================================================
// FxGroupRow
// ============================================================

interface FxGroupRowProps {
  group: FxGroup
  layerId: string
  onToggle: (fxId: string, enabled: boolean) => void
  loHiMapRef: React.RefObject<Map<number, { lo: number; hi: number }>>
}

function FxGroupRow({ group, layerId, onToggle, loHiMapRef }: FxGroupRowProps) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-[11px]" style={{ color: group.enabled ? '#aaaacc' : '#4a4a6e' }}>
          {group.pluginName}
        </span>
        <button
          onClick={() => onToggle(group.pluginId, !group.enabled)}
          className="text-[10px] rounded px-2 py-0.5 border transition-colors"
          style={{
            background: group.enabled ? '#2a2a6e' : '#1a1a2e',
            borderColor: group.enabled ? '#5a5aaa' : '#2a2a4e',
            color: group.enabled ? '#aaaaee' : '#4a4a6e',
          }}
        >
          {group.enabled ? 'ON' : 'OFF'}
        </button>
      </div>

      {group.enabled && group.params.length > 0 && (
        <div className="ml-2 flex flex-col gap-2.5">
          {group.params.map((param) => {
            const saved = loHiMapRef.current?.get(param.ccNumber)
            return (
              <ParamRow
                key={`${group.pluginId}-${param.id}`}
                param={param}
                layerId={layerId}
                pluginId={group.pluginId}
                initialLo={saved?.lo ?? param.min}
                initialHi={saved?.hi ?? param.max}
                onLoHiChange={(lo, hi) => {
                  loHiMapRef.current?.set(param.ccNumber, { lo, hi })
                }}
              />
            )
          })}
        </div>
      )}
    </div>
  )
}

// ============================================================
// ParamRow（RangeSlider 2段構成 + D&D ハンドル）
// ============================================================

interface ParamRowProps {
  param: RegisteredParameterWithCC
  layerId: string
  pluginId: string
  initialLo: number
  initialHi: number
  onLoHiChange: (lo: number, hi: number) => void
}

function ParamRow({ param, layerId, pluginId, initialLo, initialHi, onLoHiChange }: ParamRowProps) {
  const { name, min, max, step, ccNumber } = param
  const [value, setValue] = useState(param.value)
  const [lo, setLo] = useState(initialLo)
  const [hi, setHi] = useState(initialHi)
  const [isDragging, setIsDragging] = useState(false)

  useEffect(() => { setValue(param.value) }, [param.value])

  const isBinary = min === 0 && max === 1 && step === 1

  function handleChange(raw: number) {
    setValue(raw)
    const normalized = Math.min(1, Math.max(0, (raw - min) / (max - min || 1)))
    engine.handleMidiCC({ slot: ccNumber, value: normalized, source: 'window', layerId })
  }

  function handleLoHiChange(newLo: number, newHi: number) {
    setLo(newLo)
    setHi(newHi)
    onLoHiChange(newLo, newHi)
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
      lo,
      hi,
    }
    e.dataTransfer.setData('application/geography-param', JSON.stringify(payload))
    e.dataTransfer.effectAllowed = 'copy'
    setIsDragging(true)
  }

  function handleDragEnd() {
    setIsDragging(false)
  }

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-1.5">
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
          title={`${name} をドラッグして MacroKnob にアサイン（lo=${lo.toFixed(2)}, hi=${hi.toFixed(2)}）`}
        >
          ≡
        </div>
        <span className="text-[8px] text-[#4a4a7e] w-10 shrink-0 tabular-nums">CC{ccNumber}</span>
        <span className="text-[9px] text-[#5a5a8e] w-16 truncate shrink-0">{name}</span>
        <span className="text-[9px] text-[#aaaaee] w-10 text-right tabular-nums shrink-0">
          {value.toFixed(max <= 0.1 ? 4 : 2)}
        </span>
      </div>

      <div className="pl-[26px]">
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
