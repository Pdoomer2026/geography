import { useCallback, useEffect, useState } from 'react'
import { engine } from '../core/engine'
import { ccMapService } from '../core/ccMapService'
import { useDraggable } from './useDraggable'
import type { CameraPlugin, PluginParam } from '../types'

const LAYER_TABS = ['layer-1', 'layer-2', 'layer-3'] as const
type LayerId = (typeof LAYER_TABS)[number]

/**
 * CameraSimpleWindow — Camera Plugin のデフォルト最小 UI（Simple Window）
 *
 * spec: docs/spec/camera-plugin.spec.md §8
 * キーボード「4」で表示/非表示を切り替えられる。
 *
 * 設計上の注意:
 * - params の値はローカル state で管理し、ポーリングでは上書きしない
 * - ポーリングは Camera Plugin ID の変化（切り替え）だけを検知する
 * - Camera Plugin が切り替わったときだけ params をリセットする
 */
export function CameraSimpleWindow() {
  const [collapsed, setCollapsed] = useState(false)
  const [activeLayer, setActiveLayer] = useState<LayerId>('layer-1')
  const [cameraId, setCameraId] = useState<string>('')
  const [params, setParams] = useState<Record<string, PluginParam>>({})
  const [availableCameras, setAvailableCameras] = useState<CameraPlugin[]>([])
  const { pos, handleMouseDown } = useDraggable({ x: window.innerWidth - 600, y: 16 })

  // Camera Plugin ID が変わったときだけ params を同期する
  const syncFromEngine = useCallback(() => {
    const cam = engine.getCameraPlugin(activeLayer)
    if (!cam) return
    if (cam.id !== cameraId) {
      setCameraId(cam.id)
      setParams(structuredClone(cam.params))
    }
  }, [activeLayer, cameraId])

  // レイヤー切り替え時に初回同期
  useEffect(() => {
    setAvailableCameras(engine.listCameraPlugins())
    const cam = engine.getCameraPlugin(activeLayer)
    if (cam) {
      setCameraId(cam.id)
      setParams(structuredClone(cam.params))
    }
  }, [activeLayer])

  // 200ms ポーリングは Camera Plugin ID の変化検知のみ
  useEffect(() => {
    const timer = window.setInterval(syncFromEngine, 200)
    return () => window.clearInterval(timer)
  }, [syncFromEngine])

  function handleCameraChange(pluginId: string) {
    engine.setCameraPlugin(activeLayer, pluginId)
    const cam = engine.getCameraPlugin(activeLayer)
    if (cam) {
      setCameraId(cam.id)
      setParams(structuredClone(cam.params))
    }
  }

  function handleParam(paramKey: string, value: number, param: PluginParam) {
    const cc = ccMapService.getCcNumber(cameraId, paramKey)
    const normalized = (value - param.min) / (param.max - param.min)
    engine.handleMidiCC({ slot: cc, value: normalized, source: 'window' })
    // フロントの表示はローカル state に即反映（200ms ポーリング待たず）
    setParams((prev) => ({
      ...prev,
      [paramKey]: { ...prev[paramKey], value },
    }))
  }

  return (
    <div
      className="fixed z-50 font-mono text-xs select-none"
      style={{ left: pos.x, top: pos.y, width: 280 }}
    >
      <div
        className="bg-[#0f0f1e] border border-[#2a2a4e] rounded-lg overflow-hidden"
        style={{ padding: '10px 14px' }}
      >
        {/* ヘッダー（ドラッグハンドル） */}
        <div
          onMouseDown={handleMouseDown}
          className="flex items-center justify-between mb-2"
          style={{ cursor: 'grab' }}
        >
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
            {/* Camera Plugin 切り替えドロップダウン */}
            <div className="flex items-center gap-2">
              <span className="text-[9px] text-[#5a5a8e] w-14 shrink-0">Camera</span>
              <select
                value={cameraId}
                onChange={(e) => handleCameraChange(e.target.value)}
                className="flex-1 text-[10px] rounded px-1.5 py-0.5 border outline-none cursor-pointer"
                style={{
                  background: '#1a1a2e',
                  borderColor: '#3a3a6e',
                  color: '#aaaaee',
                }}
              >
                {availableCameras.map((cam) => (
                  <option key={cam.id} value={cam.id}>
                    {cam.name}
                  </option>
                ))}
              </select>
            </div>

            {/* params スライダー */}
            {Object.keys(params).length > 0 && (
              <div className="flex flex-col gap-1 mt-1">
                {Object.entries(params).map(([key, param]) => (
                  <ParamRow
                    key={`${activeLayer}-${cameraId}-${key}`}
                    label={param.label}
                    value={param.value}
                    min={param.min}
                    max={param.max}
                    onChange={(v) => handleParam(key, v, param)}
                  />
                ))}
              </div>
            )}

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

// ────────────────────────────────────────────────
// ParamRow: 1 パラメーターのスライダー行
// ────────────────────────────────────────────────

interface ParamRowProps {
  label: string
  value: number
  min: number
  max: number
  onChange: (value: number) => void
}

function ParamRow({ label, value, min, max, onChange }: ParamRowProps) {
  const isBinary = min === 0 && max === 1

  return (
    <div className="flex items-center gap-2">
      <span className="text-[9px] text-[#5a5a8e] w-20 truncate shrink-0">{label}</span>
      {isBinary ? (
        <button
          onClick={() => onChange(value >= 0.5 ? 0 : 1)}
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
            step={(max - min) / 200}
            value={value}
            onChange={(e) => onChange(parseFloat(e.target.value))}
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
