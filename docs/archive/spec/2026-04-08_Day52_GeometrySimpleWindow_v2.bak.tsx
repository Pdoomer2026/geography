import { useCallback, useEffect, useRef, useState } from 'react'
import { engine } from '../core/engine'
import { ccMapService } from '../core/ccMapService'
import { useDraggable } from './useDraggable'
import type { DragPayload, MacroAssign, PluginParam } from '../types'

const LAYER_TABS = ['layer-1', 'layer-2', 'layer-3'] as const
type LayerId = (typeof LAYER_TABS)[number]

/**
 * GeometrySimpleWindow — Geometry Plugin params のデフォルト最小 UI
 *
 * Day52 追加:
 * - 各パラメーター行に CC番号表示
 * - [≡] D&D ハンドル（MacroKnob へのドロップ元）
 * - 右クリックメニューでアサイン解除
 *
 * spec: docs/spec/simple-window.spec.md / docs/spec/macro-knob.spec.md §4-1
 */
export function GeometrySimpleWindow() {
  const [collapsed, setCollapsed] = useState(false)
  const [activeLayer, setActiveLayer] = useState<LayerId>('layer-1')
  const [geometryId, setGeometryId] = useState<string>('')
  const [geometryName, setGeometryName] = useState<string>('')
  const [params, setParams] = useState<Record<string, PluginParam>>({})
  const { pos, handleMouseDown } = useDraggable({ x: window.innerWidth - 900, y: 16 })

  // Geometry Plugin ID が変わったときだけ params を同期する
  const syncFromEngine = useCallback(() => {
    const geo = engine.getGeometryPlugin(activeLayer)
    if (!geo) {
      if (geometryId !== '') {
        setGeometryId('')
        setGeometryName('')
        setParams({})
      }
      return
    }
    if (geo.id !== geometryId) {
      setGeometryId(geo.id)
      setGeometryName(geo.name)
      setParams(structuredClone(geo.params))
    }
  }, [activeLayer, geometryId])

  useEffect(() => {
    const geo = engine.getGeometryPlugin(activeLayer)
    if (geo) {
      setGeometryId(geo.id)
      setGeometryName(geo.name)
      setParams(structuredClone(geo.params))
    } else {
      setGeometryId('')
      setGeometryName('')
      setParams({})
    }
  }, [activeLayer])

  useEffect(() => {
    const timer = window.setInterval(syncFromEngine, 200)
    return () => window.clearInterval(timer)
  }, [syncFromEngine])

  function handleParam(paramKey: string, value: number, param: PluginParam) {
    const cc = ccMapService.getCcNumber(geometryId, paramKey)
    const normalized = (value - param.min) / (param.max - param.min)
    engine.handleMidiCC({ cc, value: normalized, protocol: 'midi2', resolution: 4294967296 })
    setParams((prev) => ({
      ...prev,
      [paramKey]: { ...prev[paramKey], value },
    }))
  }

  return (
    <div
      className="fixed z-50 font-mono text-xs select-none"
      style={{ left: pos.x, top: pos.y, width: 320 }}
    >
      <div
        className="bg-[#0f0f1e] border border-[#2a2a4e] rounded-lg overflow-hidden"
        style={{ padding: '10px 14px' }}
      >
        {/* ヘッダー */}
        <div
          onMouseDown={handleMouseDown}
          className="flex items-center justify-between mb-2"
          style={{ cursor: 'grab' }}
        >
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-[#7878aa] tracking-widest">GEOMETRY SIMPLE WINDOW</span>
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
            {/* Geometry 名表示 */}
            <div className="flex items-center gap-2">
              <span className="text-[9px] text-[#5a5a8e] w-14 shrink-0">Geometry</span>
              <span className="text-[10px] text-[#aaaaee]">
                {geometryName || '— none —'}
              </span>
            </div>

            {/* params スライダー */}
            {Object.keys(params).length > 0 && (
              <div className="flex flex-col gap-1 mt-1">
                {Object.entries(params).map(([key, param]) => (
                  <ParamRow
                    key={`${activeLayer}-${geometryId}-${key}`}
                    paramKey={key}
                    pluginId={geometryId}
                    layerId={activeLayer}
                    label={param.label}
                    value={param.value}
                    min={param.min}
                    max={param.max}
                    onChange={(v) => handleParam(key, v, param)}
                  />
                ))}
              </div>
            )}

            {!geometryId && (
              <div className="text-[#3a3a5e] text-[10px] py-2 text-center">
                — no geometry —
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
// CC番号表示 + [≡] D&D ハンドル + 右クリック解除メニュー付き
// ────────────────────────────────────────────────

interface ParamRowProps {
  paramKey: string
  pluginId: string
  layerId: string
  label: string
  value: number
  min: number
  max: number
  onChange: (value: number) => void
}

function ParamRow({ paramKey, pluginId, layerId, label, value, min, max, onChange }: ParamRowProps) {
  const isBinary = min === 0 && max === 1
  const cc = ccMapService.getCcNumber(pluginId, paramKey)

  // 右クリックコンテキストメニュー
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null)
  const [assigns, setAssigns] = useState<{ knobId: string; assign: MacroAssign }[]>([])
  const menuRef = useRef<HTMLDivElement>(null)

  function handleContextMenu(e: React.MouseEvent) {
    e.preventDefault()
    const current = engine.getAssignsForParam(paramKey)
    setAssigns(current)
    setContextMenu({ x: e.clientX, y: e.clientY })
  }

  function handleRemoveAssign(knobId: string) {
    engine.removeMacroAssign(knobId, paramKey)
    setContextMenu(null)
  }

  // メニュー外クリックで閉じる
  useEffect(() => {
    if (!contextMenu) return
    function onClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setContextMenu(null)
      }
    }
    window.addEventListener('mousedown', onClickOutside)
    return () => window.removeEventListener('mousedown', onClickOutside)
  }, [contextMenu])

  // D&D ドラッグ開始
  function handleDragStart(e: React.DragEvent) {
    const payload: DragPayload = {
      type: 'param',
      id: paramKey,
      layerId,
      pluginId,
      ccNumber: cc,
      min,
      max,
    }
    e.dataTransfer.setData('application/geography-param', JSON.stringify(payload))
    e.dataTransfer.effectAllowed = 'copy'
  }

  return (
    <div className="flex items-center gap-1.5 relative">
      {/* CC番号 */}
      <span
        className="text-[8px] text-[#4a4a7e] w-10 shrink-0 tabular-nums"
        title={`CC${cc}`}
      >
        CC{cc}
      </span>

      {/* ラベル */}
      <span className="text-[9px] text-[#5a5a8e] w-16 truncate shrink-0">{label}</span>

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

      {/* [≡] D&D ハンドル */}
      <div
        draggable
        onDragStart={handleDragStart}
        onContextMenu={handleContextMenu}
        className="text-[10px] text-[#3a3a6e] hover:text-[#8888cc] cursor-grab
                   active:cursor-grabbing px-1 shrink-0 select-none transition-colors"
        title="MacroKnob にドラッグしてアサイン / 右クリックで解除"
      >
        ≡
      </div>

      {/* 右クリックコンテキストメニュー */}
      {contextMenu && (
        <div
          ref={menuRef}
          className="fixed z-[300] bg-[#0f0f1e] border border-[#3a3a6e] rounded shadow-lg py-1"
          style={{ left: contextMenu.x, top: contextMenu.y, minWidth: 180 }}
        >
          {assigns.length === 0 ? (
            <div className="px-3 py-1.5 text-[9px] text-[#4a4a6e]">アサインなし</div>
          ) : (
            assigns.map(({ knobId, assign }) => (
              <button
                key={knobId}
                onClick={() => handleRemoveAssign(knobId)}
                className="w-full text-left px-3 py-1.5 text-[9px] text-[#8888bb]
                           hover:bg-[#1a1a3e] hover:text-[#cc4444] transition-colors"
              >
                Remove: {knobId} (CC{assign.ccNumber}) [{assign.min}…{assign.max}]
              </button>
            ))
          )}
        </div>
      )}
    </div>
  )
}
