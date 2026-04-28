/**
 * CameraPanel — Inspector Layer タブ用 Camera パネル
 * CameraStandardDnDWindow の内容を Panel 化（外枠・タブ・ドラッグ除去）
 */

import { useCallback, useEffect, useRef, useState } from 'react'
import { engine } from '../../../../../application/orchestrator/engine'
import { useStandardDnDParamRow } from '../../../../hooks/useStandardDnDParamRow'
import { DnDHandleWithMenu } from './DnDHandleWithMenu'
import type { CameraPlugin } from '../../../../../application/schema'
import type { RegisteredParameterWithCC } from '../../../../../application/schema/midi-registry'
import { RangeSlider } from '../../../common/RangeSlider'

interface CameraPanelProps {
  layerId: string
}

export function CameraPanel({ layerId }: CameraPanelProps) {
  const [cameraId, setCameraId] = useState('')
  const [params, setParams] = useState<RegisteredParameterWithCC[]>([])
  const [availableCameras, setAvailableCameras] = useState<CameraPlugin[]>([])
  const loHiMapRef = useRef<Map<string, { lo: number; hi: number }>>(new Map())

  const getParams = useCallback((lid: string, cid: string) =>
    engine.getParametersLive(lid).filter((p) => p.pluginId === cid), [])

  useEffect(() => {
    setAvailableCameras(engine.listCameraPlugins())
    const cam = engine.getCameraPlugin(layerId)
    if (cam) { setCameraId(cam.id); setParams(getParams(layerId, cam.id)) }
    else { setCameraId(''); setParams([]) }
    return engine.onRegistryChanged(() => {
      const updated = engine.getCameraPlugin(layerId)
      if (!updated) return
      setCameraId(updated.id)
      setParams(getParams(layerId, updated.id))
    })
  }, [layerId, getParams])

  useEffect(() => {
    engine.onCameraChanged(() => {
      const cam = engine.getCameraPlugin(layerId)
      if (!cam) { setCameraId(''); setParams([]); return }
      setCameraId(cam.id)
      setParams(getParams(layerId, cam.id))
    })
  }, [layerId, getParams])

  // MacroKnob 操作など外部からの値変化をスライダーに反映
  useEffect(() => {
    return engine.onParamChanged(() => {
      const cam = engine.getCameraPlugin(layerId)
      if (!cam) return
      setParams(getParams(layerId, cam.id))
    })
  }, [layerId, getParams])

  function handleCameraChange(pluginId: string) {
    engine.setCameraPlugin(layerId, pluginId)
    const cam = engine.getCameraPlugin(layerId)
    if (cam) { setCameraId(cam.id); setParams(getParams(layerId, cam.id)) }
  }

  return (
    <div className="flex flex-col gap-1 font-mono text-xs">
      <div className="flex items-center gap-2 mb-1">
        <span style={{ fontSize: 9, color: '#5a5a8e', flexShrink: 0 }}>Camera</span>
        <select value={cameraId} onChange={(e) => handleCameraChange(e.target.value)}
          style={{ flex: 1, fontSize: 9, borderRadius: 3, padding: '2px 4px',
            background: '#1a1a2e', border: '1px solid #3a3a6e', color: '#aaaaee', outline: 'none' }}>
          {availableCameras.map((cam) => (
            <option key={cam.id} value={cam.id}>{cam.name}</option>
          ))}
        </select>
      </div>
      {params.length === 0 && (
        <div style={{ fontSize: 10, color: '#3a3a5e', textAlign: 'center', padding: '8px 0' }}>— no params —</div>
      )}
      {params.map((param) => {
        const key = `${cameraId}:${param.ccNumber}`
        const saved = loHiMapRef.current.get(key)
        return (
          <ParamRow key={key} param={param} layerId={layerId} pluginId={cameraId}
            initialLo={saved?.lo ?? param.min} initialHi={saved?.hi ?? param.max}
            onLoHiChange={(lo, hi) => loHiMapRef.current.set(key, { lo, hi })} />
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
  const { value, lo, hi, isDragging, isBinary, inverted, assignedKnobs, handleChange, handleLoHiChange, handleDragStart, handleDragEnd, handleToggleInverted, handleRemoveAssign } =
    useStandardDnDParamRow({ param, layerId, pluginId, initialLo, initialHi, onLoHiChange })

  return (
    <div className="flex flex-col gap-1 mb-1">
      <div className="flex items-center gap-1.5">
        <DnDHandleWithMenu
          paramName={name}
          isDragging={isDragging}
          inverted={inverted}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          onToggleInverted={handleToggleInverted}
          assignedKnobs={assignedKnobs}
          onRemoveAssign={handleRemoveAssign}
        />
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
