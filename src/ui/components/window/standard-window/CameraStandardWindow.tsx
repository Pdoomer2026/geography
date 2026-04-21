/**
 * CameraStandardWindow
 * spec: docs/spec/plugin-manager.spec.md §4-1
 *
 * CameraSimpleWindow に稼働幅（lo/hi RangeSlider）を追加した上位 Window。
 *
 * SimpleWindow との差分:
 *   - ParamRow に RangeSlider を使用（2段構成）
 *   - lo/hi は ParamRow の localState（Registry/engine に影響しない）
 *   - 送信時の変換: normalized = (raw - lo) / (hi - lo)
 */

import { useCallback, useEffect, useState } from 'react'
import { engine } from '../../../../application/orchestrator/engine'
import { useDraggable } from '../../../../ui/useDraggable'
import { useStandardParamRow } from '../../../../ui/hooks/useStandardParamRow'
import type { CameraPlugin } from '../../../../application/schema'
import type { RegisteredParameterWithCC } from '../../../../application/schema/midi-registry'
import { RangeSlider } from './RangeSlider'

const LAYER_TABS = ['layer-1', 'layer-2', 'layer-3'] as const
type LayerId = (typeof LAYER_TABS)[number]

// ============================================================
// CameraStandardWindow
// ============================================================

export function CameraStandardWindow() {
  const [collapsed, setCollapsed] = useState(false)
  const [activeLayer, setActiveLayer] = useState<LayerId>('layer-1')
  const [cameraId, setCameraId] = useState<string>('')
  const [params, setParams] = useState<RegisteredParameterWithCC[]>([])
  const [availableCameras, setAvailableCameras] = useState<CameraPlugin[]>([])
  const { pos, handleMouseDown } = useDraggable({ x: window.innerWidth - 620, y: 200 })

  const getParamsFromRegistry = useCallback((layerId: LayerId, camId: string) => {
    return engine.getParameters(layerId).filter((p) => p.pluginId === camId)
  }, [])

  useEffect(() => {
    return engine.onRegistryChanged(() => {
      const cam = engine.getCameraPlugin(activeLayer)
      if (!cam) return
      setParams(getParamsFromRegistry(activeLayer, cam.id))
    })
  }, [activeLayer, getParamsFromRegistry])

  useEffect(() => {
    setAvailableCameras(engine.listCameraPlugins())
    const cam = engine.getCameraPlugin(activeLayer)
    if (cam) {
      setCameraId(cam.id)
      setParams(getParamsFromRegistry(activeLayer, cam.id))
    } else {
      setCameraId('')
      setParams([])
    }
  }, [activeLayer, getParamsFromRegistry])

  useEffect(() => {
    return engine.onRegistryChanged(() => {
      const cam = engine.getCameraPlugin(activeLayer)
      if (!cam) return
      if (cam.id !== cameraId) {
        setCameraId(cam.id)
        setParams(getParamsFromRegistry(activeLayer, cam.id))
        return
      }
      setParams(getParamsFromRegistry(activeLayer, cam.id))
    })
  }, [activeLayer, cameraId, getParamsFromRegistry])

  function handleCameraChange(pluginId: string) {
    engine.setCameraPlugin(activeLayer, pluginId)
    const cam = engine.getCameraPlugin(activeLayer)
    if (cam) {
      setCameraId(cam.id)
      setParams(getParamsFromRegistry(activeLayer, cam.id))
    }
  }

  return (
    <div className="fixed z-50 font-mono text-xs select-none" style={{ left: pos.x, top: pos.y, width: 320 }}>
      <div className="bg-[#0f0f1e] border border-[#2a2a4e] rounded-lg overflow-hidden" style={{ padding: '10px 14px' }}>

        {/* ヘッダー */}
        <div onMouseDown={handleMouseDown} className="flex items-center justify-between mb-2" style={{ cursor: 'grab' }}>
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-[#7878aa] tracking-widest">CAMERA STANDARD</span>
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
              <span className="text-[9px] text-[#5a5a8e] w-14 shrink-0">Camera</span>
              <select
                value={cameraId}
                onChange={(e) => handleCameraChange(e.target.value)}
                className="flex-1 text-[10px] rounded px-1.5 py-0.5 border outline-none cursor-pointer"
                style={{ background: '#1a1a2e', borderColor: '#3a3a6e', color: '#aaaaee' }}
              >
                {availableCameras.map((cam) => (
                  <option key={cam.id} value={cam.id}>{cam.name}</option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-3 mt-1">
              {params.length === 0 && (
                <div className="text-[#3a3a5e] text-[10px] py-2 text-center">— no params —</div>
              )}
              {params.map((param) => (
                <ParamRow key={param.ccNumber} param={param} layerId={activeLayer} />
              ))}
            </div>

            {!cameraId && (
              <div className="text-[#3a3a5e] text-[10px] py-2 text-center">initializing...</div>
            )}
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
  const { name, min, max, step } = param

  const {
    value,
    lo,
    hi,
    isBinary,
    handleChange,
    handleLoHiChange,
  } = useStandardParamRow({ param, layerId })

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-1.5">
        <span className="text-[9px] text-[#5a5a8e] w-20 truncate shrink-0">{name}</span>
        <span className="text-[9px] text-[#aaaaee] w-12 text-right tabular-nums shrink-0">
          {value.toFixed(max <= 0.1 ? 4 : 2)}
        </span>
      </div>

      <div className="pl-0">
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
