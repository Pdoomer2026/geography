/**
 * GeometryPanel — Inspector Layer タブ用 Geometry パネル
 * GeometryStandardDnDWindow の内容を Panel 化（外枠・タブ・ドラッグ除去）
 */

import { useCallback, useEffect, useRef, useState } from 'react'
import { engine } from '../../../../../application/orchestrator/engine'
import { useStandardDnDParamRow } from '../../../../hooks/useStandardDnDParamRow'
import type { RegisteredParameterWithCC } from '../../../../../application/schema/midi-registry'
import { RangeSlider } from '../../../window/standard-window/RangeSlider'

interface GeometryPanelProps {
  layerId: string
}

export function GeometryPanel({ layerId }: GeometryPanelProps) {
  const [pluginName, setPluginName] = useState('')
  const [pluginId, setPluginId] = useState('')
  const [params, setParams] = useState<RegisteredParameterWithCC[]>([])
  const loHiMapRef = useRef<Map<string, { lo: number; hi: number }>>(new Map())

  const getParams = useCallback((lid: string, pid: string) =>
    engine.getParametersLive(lid).filter((p) => p.pluginId === pid), [])

  useEffect(() => {
    const geo = engine.getGeometryPlugin(layerId)
    if (geo) {
      setPluginId(geo.id)
      setPluginName(geo.name)
      setParams(getParams(layerId, geo.id))
    } else {
      setPluginId(''); setPluginName(''); setParams([])
    }
  }, [layerId, getParams])

  useEffect(() => {
    return engine.onRegistryChanged(() => {
      const geo = engine.getGeometryPlugin(layerId)
      if (!geo) { setPluginId(''); setPluginName(''); setParams([]); return }
      setPluginId(geo.id); setPluginName(geo.name)
      setParams(getParams(layerId, geo.id))
    })
  }, [layerId, getParams])

  useEffect(() => {
    engine.onGeometryChanged(() => {
      const geo = engine.getGeometryPlugin(layerId)
      if (!geo) { setPluginId(''); setPluginName(''); setParams([]); return }
      setPluginId(geo.id); setPluginName(geo.name)
      setParams(getParams(layerId, geo.id))
    })
  }, [layerId, getParams])

  useEffect(() => {
    return engine.onParamChanged(() => {
      const geo = engine.getGeometryPlugin(layerId)
      if (!geo) return
      setParams(getParams(layerId, geo.id))
    })
  }, [layerId, getParams])

  return (
    <div className="flex flex-col gap-1 font-mono text-xs">
      <div className="flex items-center gap-2 mb-1">
        <span style={{ fontSize: 9, color: '#5a5a8e' }}>Plugin</span>
        <span style={{ fontSize: 10, color: '#aaaaee' }}>{pluginName || '— none —'}</span>
      </div>
      {params.length === 0 && (
        <div style={{ fontSize: 10, color: '#3a3a5e', textAlign: 'center', padding: '8px 0' }}>
          — no params —
        </div>
      )}
      {params.map((param) => {
        const key = `${pluginId}:${param.ccNumber}`
        const saved = loHiMapRef.current.get(key)
        return (
          <ParamRow
            key={key}
            param={param}
            layerId={layerId}
            pluginId={pluginId}
            initialLo={saved?.lo ?? param.min}
            initialHi={saved?.hi ?? param.max}
            onLoHiChange={(lo, hi) => loHiMapRef.current.set(key, { lo, hi })}
          />
        )
      })}
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
        <div
          draggable onDragStart={handleDragStart} onDragEnd={handleDragEnd}
          className="shrink-0 flex items-center justify-center rounded cursor-grab"
          style={{ width: 14, height: 14, fontSize: 9, color: isDragging ? '#9090ff' : '#3a3a6e', userSelect: 'none' }}
        >≡</div>
        <span style={{ fontSize: 8, color: '#4a4a7e', width: 28, flexShrink: 0 }}>CC{param.ccNumber}</span>
        <span style={{ fontSize: 9, color: '#5a5a8e', width: 56, flexShrink: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{name}</span>
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
