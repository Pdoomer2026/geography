/**
 * FxPanel — Inspector Layer タブ用 FX パネル
 * FxStandardDnDWindow の内容を Panel 化（外枠・タブ・ドラッグ除去）
 */

import { useCallback, useEffect, useRef, useState } from 'react'
import { engine } from '../../../../../application/orchestrator/engine'
import { useStandardDnDParamRow } from '../../../../hooks/useStandardDnDParamRow'
import type { RegisteredParameterWithCC } from '../../../../../application/schema/midi-registry'
import { RangeSlider } from '../../../window/standard-window/RangeSlider'

interface FxGroup {
  pluginId: string
  pluginName: string
  enabled: boolean
  params: RegisteredParameterWithCC[]
}

interface FxPanelProps {
  layerId: string
}

export function FxPanel({ layerId }: FxPanelProps) {
  const [fxGroups, setFxGroups] = useState<FxGroup[]>([])
  const loHiMapRef = useRef<Map<string, { lo: number; hi: number }>>(new Map())

  const buildGroups = useCallback((lid: string): FxGroup[] =>
    engine.getFxPlugins(lid).map((fx) => ({
      pluginId: fx.id, pluginName: fx.name, enabled: fx.enabled,
      params: engine.getParametersLive(lid).filter((p) => p.pluginId === fx.id),
    })), [])

  useEffect(() => { setFxGroups(buildGroups(layerId)) }, [layerId, buildGroups])
  useEffect(() => engine.onRegistryChanged(() => setFxGroups(buildGroups(layerId))), [layerId, buildGroups])
  useEffect(() => engine.onFxChanged(() => setFxGroups(buildGroups(layerId))), [layerId, buildGroups])
  useEffect(() => {
    const t = window.setInterval(() => setFxGroups(buildGroups(layerId)), 200)
    return () => window.clearInterval(t)
  }, [layerId, buildGroups])

  return (
    <div className="flex flex-col gap-2 font-mono text-xs">
      {fxGroups.length === 0 && (
        <div style={{ fontSize: 10, color: '#3a3a5e', textAlign: 'center', padding: '8px 0' }}>— no fx —</div>
      )}
      {fxGroups.map((group) => (
        <FxGroupRow key={`${layerId}-${group.pluginId}`}
          group={group} layerId={layerId} loHiMapRef={loHiMapRef}
          onToggle={(id, en) => engine.setFxEnabled(id, en, layerId)} />
      ))}
    </div>
  )
}

interface FxGroupRowProps {
  group: FxGroup
  layerId: string
  loHiMapRef: React.RefObject<Map<string, { lo: number; hi: number }>>
  onToggle: (fxId: string, enabled: boolean) => void
}

function FxGroupRow({ group, layerId, loHiMapRef, onToggle }: FxGroupRowProps) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span style={{ fontSize: 10, color: group.enabled ? '#aaaacc' : '#4a4a6e' }}>{group.pluginName}</span>
        <button onClick={() => onToggle(group.pluginId, !group.enabled)}
          style={{ fontSize: 9, padding: '1px 6px', borderRadius: 3,
            background: group.enabled ? '#2a2a6e' : '#1a1a2e',
            border: `1px solid ${group.enabled ? '#5a5aaa' : '#2a2a4e'}`,
            color: group.enabled ? '#aaaaee' : '#4a4a6e' }}>
          {group.enabled ? 'ON' : 'OFF'}
        </button>
      </div>
      {group.enabled && group.params.length > 0 && (
        <div style={{ marginLeft: 8 }} className="flex flex-col gap-1">
          {group.params.map((param) => {
            const key = `${group.pluginId}:${param.ccNumber}`
            const saved = loHiMapRef.current?.get(key)
            return (
              <ParamRow key={`${group.pluginId}-${param.id}`}
                param={param} layerId={layerId} pluginId={group.pluginId}
                initialLo={saved?.lo ?? param.min} initialHi={saved?.hi ?? param.max}
                onLoHiChange={(lo, hi) => loHiMapRef.current?.set(key, { lo, hi })} />
            )
          })}
        </div>
      )}
    </div>
  )
}

interface ParamRowProps {
  param: RegisteredParameterWithCC
  layerId: string
  pluginId: string
  initialLo: number
  initialHi: number
  onLoHiChange: (lo: number, hi: number) => void
}

function ParamRow({ param, layerId, pluginId, initialLo, initialHi, onLoHiChange }: ParamRowProps) {
  const { min, max, step, name } = param
  const { value, lo, hi, isDragging, isBinary, handleChange, handleLoHiChange, handleDragStart, handleDragEnd } =
    useStandardDnDParamRow({ param, layerId, pluginId, initialLo, initialHi, onLoHiChange })

  return (
    <div className="flex flex-col gap-1 mb-1">
      <div className="flex items-center gap-1.5">
        <div draggable onDragStart={handleDragStart} onDragEnd={handleDragEnd}
          className="shrink-0 flex items-center justify-center cursor-grab"
          style={{ width: 14, height: 14, fontSize: 9, color: isDragging ? '#9090ff' : '#3a3a6e', userSelect: 'none' }}>≡</div>
        <span style={{ fontSize: 9, color: '#5a5a8e', width: 60, flexShrink: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{name}</span>
        <span style={{ fontSize: 9, color: '#aaaaee', width: 36, textAlign: 'right', flexShrink: 0 }}>{value.toFixed(max <= 0.1 ? 4 : 2)}</span>
      </div>
      <div style={{ paddingLeft: 18 }}>
        {isBinary ? (
          <button onClick={() => handleChange(value >= 0.5 ? 0 : 1)}
            style={{ fontSize: 10, padding: '1px 8px', borderRadius: 3,
              background: value >= 0.5 ? '#2a2a6e' : '#1a1a2e',
              border: `1px solid ${value >= 0.5 ? '#5a5aaa' : '#2a2a4e'}`,
              color: value >= 0.5 ? '#aaaaee' : '#4a4a6e' }}>
            {value >= 0.5 ? 'ON' : 'OFF'}
          </button>
        ) : (
          <RangeSlider min={min} max={max} lo={lo} hi={hi} value={value} step={step}
            onLoHiChange={handleLoHiChange} onChange={handleChange} />
        )}
      </div>
    </div>
  )
}
