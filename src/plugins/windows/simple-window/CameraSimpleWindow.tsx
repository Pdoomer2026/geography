/**
 * CameraSimpleWindow
 * spec: docs/spec/plugin-manager.spec.md §4-1
 *
 * Camera Plugin 用 Simple Window（Day61 改名: CameraWindowPlugin → CameraSimpleWindow）
 *
 * 設計原則:
 *   - transportRegistry を直接購読する（ccMapService を知らない）
 *   - engine.handleMidiCC() でパラメータ変更（layerId 付与）
 *   - L1/L2/L3 タブで activeLayer を切り替える
 *   - props なし（自律動作）
 *
 * 含めないもの:
 *   - RangeSlider（可動域制約）
 *   - D&D ハンドル（MacroKnob アサイン）
 *   - Preset（Save / Load / Delete）
 */

import { useCallback, useEffect, useState } from 'react'
import { engine } from '../../../core/engine'
import { transportRegistry } from '../../../core/transportRegistry'
import { useDraggable } from '../../../ui/useDraggable'
import type { CameraPlugin } from '../../../types'
import type { RegisteredParameterWithCC } from '../../../types/midi-registry'

const LAYER_TABS = ['layer-1', 'layer-2', 'layer-3'] as const
type LayerId = (typeof LAYER_TABS)[number]

// ============================================================
// CameraSimpleWindow
// ============================================================

export function CameraSimpleWindow() {
  const [collapsed, setCollapsed] = useState(false)
  const [activeLayer, setActiveLayer] = useState<LayerId>('layer-1')
  const [cameraId, setCameraId] = useState<string>('')
  const [params, setParams] = useState<RegisteredParameterWithCC[]>([])
  const [availableCameras, setAvailableCameras] = useState<CameraPlugin[]>([])
  const { pos, handleMouseDown } = useDraggable({ x: window.innerWidth - 600, y: 16 })

  const getParamsFromRegistry = useCallback((layerId: LayerId, camId: string) => {
    return transportRegistry.getAll().filter(
      (p) => p.layerId === layerId && p.pluginId === camId
    )
  }, [])

  useEffect(() => {
    transportRegistry.onChanged(() => {
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
    const timer = window.setInterval(() => {
      const cam = engine.getCameraPlugin(activeLayer)
      if (!cam) return
      if (cam.id !== cameraId) {
        setCameraId(cam.id)
        setParams(getParamsFromRegistry(activeLayer, cam.id))
      }
    }, 200)
    return () => window.clearInterval(timer)
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
    <div className="fixed z-50 font-mono text-xs select-none" style={{ left: pos.x, top: pos.y, width: 280 }}>
      <div className="bg-[#0f0f1e] border border-[#2a2a4e] rounded-lg overflow-hidden" style={{ padding: '10px 14px' }}>

        {/* ヘッダー */}
        <div onMouseDown={handleMouseDown} className="flex items-center justify-between mb-2" style={{ cursor: 'grab' }}>
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-[#7878aa] tracking-widest">CAMERA SIMPLE WINDOW</span>
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

            <div className="flex flex-col gap-1 mt-1">
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

            {!cameraId && (
              <div className="text-[#3a3a5e] text-[10px] py-2 text-center">
                initializing...
              </div>
            )}
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
    <div className="flex items-center gap-2">
      <span className="text-[9px] text-[#5a5a8e] w-20 truncate shrink-0">{name}</span>
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
          <span className="text-[9px] text-[#5a5a8e] w-10 text-right tabular-nums">
            {value.toFixed(2)}
          </span>
        </>
      )}
    </div>
  )
}
