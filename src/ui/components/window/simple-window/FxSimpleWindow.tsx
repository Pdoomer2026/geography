/**
 * FxSimpleWindow
 * spec: docs/spec/plugin-manager.spec.md §4-2
 *
 * FX Plugin 用 Simple Window（Day61 改名: FxWindowPlugin → FxSimpleWindow）
 *
 * 設計原則:
 *   - transportRegistry.onChanged() を購読 → params を更新
 *   - 初回 useEffect → Registry から filter して初期表示
 *   - L1/L2/L3 タブで activeLayer を切り替える
 *   - props なし（自律動作）
 *
 * FX 固有仕様:
 *   - enabled フラグが存在する（ON/OFF トグル）
 *   - engine.onFxChanged() を購読 → enabled 変化を検知
 *
 * 含めないもの:
 *   - RangeSlider（可動域制約）
 *   - D&D ハンドル（MacroKnob アサイン）
 */

import { useCallback, useEffect, useState } from 'react'
import { engine } from '../../../../application/orchestrator/engine'
import { useDraggable } from '../../../../ui/useDraggable'
import type { RegisteredParameterWithCC } from '../../../../application/schema/midi-registry'

const LAYER_TABS = ['layer-1', 'layer-2', 'layer-3'] as const
type LayerId = (typeof LAYER_TABS)[number]

// ============================================================
// 型定義
// ============================================================

export interface FxGroup {
  pluginId: string
  pluginName: string
  enabled: boolean
  params: RegisteredParameterWithCC[]
}

// ============================================================
// FxSimpleWindow
// ============================================================

export function FxSimpleWindow() {
  const [collapsed, setCollapsed] = useState(false)
  const [activeLayer, setActiveLayer] = useState<LayerId>('layer-1')
  const [fxGroups, setFxGroups] = useState<FxGroup[]>([])
  const { pos, handleMouseDown } = useDraggable({ x: window.innerWidth - 300, y: 16 })

  const buildFxGroups = useCallback((lid: string): FxGroup[] => {
    return engine.getFxPlugins(lid).map((fx) => ({
      pluginId: fx.id,
      pluginName: fx.name,
      enabled: fx.enabled,
      params: engine.getParameters(lid).filter((p) => p.pluginId === fx.id),
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

  function handleToggle(fxId: string, enabled: boolean) {
    engine.setFxEnabled(fxId, enabled, activeLayer)
  }

  return (
    <div className="fixed z-50 font-mono text-xs select-none" style={{ left: pos.x, top: pos.y, width: 280 }}>
      <div className="bg-[#0f0f1e] border border-[#2a2a4e] rounded-lg overflow-hidden" style={{ padding: '10px 14px' }}>

        {/* ヘッダー */}
        <div onMouseDown={handleMouseDown} className="flex items-center justify-between mb-2" style={{ cursor: 'grab' }}>
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-[#7878aa] tracking-widest">FX SIMPLE WINDOW</span>
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
        <span
          className="text-[11px]"
          style={{ color: group.enabled ? '#aaaacc' : '#4a4a6e' }}
        >
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
            />
          ))}
        </div>
      )}
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
  const [value, setValue] = useState(param.value)

  const isBinary = min === 0 && max === 1 && step === 1

  function handleChange(raw: number) {
    setValue(raw)
    const normalized = max > min ? (raw - min) / (max - min) : 0
    engine.handleMidiCC({
      slot: ccNumber,
      value: Math.min(1, Math.max(0, normalized)),
      source: 'window',
      layerId,
    })
  }

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
