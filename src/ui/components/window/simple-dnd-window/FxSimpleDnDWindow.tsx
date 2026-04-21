/**
 * FxSimpleDnDWindow
 *
 * FxSimpleWindow に D&D ハンドル（≡）を追加した Window。
 */

import { useCallback, useEffect, useState } from 'react'
import { engine } from '../../../../application/orchestrator/engine'
import { useDraggable } from '../../../../ui/useDraggable'
import { useDnDParamRow } from '../../../../ui/hooks/useDnDParamRow'
import type { RegisteredParameterWithCC } from '../../../../application/schema/midi-registry'

const LAYER_TABS = ['layer-1', 'layer-2', 'layer-3'] as const
type LayerId = (typeof LAYER_TABS)[number]

interface FxGroup {
  pluginId: string
  pluginName: string
  enabled: boolean
  params: RegisteredParameterWithCC[]
}

export function FxSimpleDnDWindow() {
  const [collapsed, setCollapsed] = useState(false)
  const [activeLayer, setActiveLayer] = useState<LayerId>('layer-1')
  const [fxGroups, setFxGroups] = useState<FxGroup[]>([])
  const { pos, handleMouseDown } = useDraggable({ x: window.innerWidth - 300, y: 220 })

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
    engine.onFxChanged(() => {
      setFxGroups(buildFxGroups(activeLayer))
    })
  }, [activeLayer, buildFxGroups])

  // MacroKnob 操作など外部からの値変化を読み返す
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
    <div className="fixed z-50 font-mono text-xs select-none" style={{ left: pos.x, top: pos.y, width: 280 }}>
      <div className="bg-[#0f0f1e] border border-[#2a2a4e] rounded-lg overflow-hidden" style={{ padding: '10px 14px' }}>

        <div onMouseDown={handleMouseDown} className="flex items-center justify-between mb-2" style={{ cursor: 'grab' }}>
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-[#7878aa] tracking-widest">FX D&amp;D</span>
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
}

function FxGroupRow({ group, layerId, onToggle }: FxGroupRowProps) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
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
        <div className="ml-2 flex flex-col gap-1">
          {group.params.map((param) => (
            <ParamRow
              key={`${group.pluginId}-${param.id}`}
              param={param}
              layerId={layerId}
              pluginId={group.pluginId}
            />
          ))}
        </div>
      )}
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
  const { name, min, max, step } = param

  const {
    value,
    isDragging,
    isBinary,
    handleChange,
    handleDragStart,
    handleDragEnd,
  } = useDnDParamRow({ param, layerId, pluginId })

  return (
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
        title={`${name} をドラッグして MacroKnob にアサイン`}
      >
        ≡
      </div>

      <span className="text-[8px] text-[#4a4a7e] w-10 shrink-0 tabular-nums">CC{param.ccNumber}</span>
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
