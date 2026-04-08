import { useCallback, useEffect, useRef, useState } from 'react'
import { engine } from '../core/engine'
import { ccMapService } from '../core/ccMapService'
import { useDraggable } from './useDraggable'
import type { DragPayload, MacroAssign, PluginParam, PluginPreset } from '../types'
import { GEO_PRESET_STORE_KEY, PROJECT_FILE_VERSION } from '../types'

const LAYER_TABS = ['layer-1', 'layer-2', 'layer-3'] as const
type LayerId = (typeof LAYER_TABS)[number]

// ============================================================
// Preset Store ヘルパー（localStorage）
// ============================================================

type GeoPresetStore = Record<string, PluginPreset>

function loadGeoPresets(): GeoPresetStore {
  try {
    const raw = localStorage.getItem(GEO_PRESET_STORE_KEY)
    if (!raw) return {}
    return JSON.parse(raw) as GeoPresetStore
  } catch {
    return {}
  }
}

function saveGeoPresets(store: GeoPresetStore): void {
  try {
    localStorage.setItem(GEO_PRESET_STORE_KEY, JSON.stringify(store))
  } catch {
    // ignore
  }
}

// ============================================================
// GeometrySimpleWindow
// ============================================================

export function GeometrySimpleWindow() {
  const [collapsed, setCollapsed] = useState(false)
  const [activeLayer, setActiveLayer] = useState<LayerId>('layer-1')
  const [geometryId, setGeometryId] = useState<string>('')
  const [geometryName, setGeometryName] = useState<string>('')
  const [params, setParams] = useState<Record<string, PluginParam>>({})
  const { pos, handleMouseDown } = useDraggable({ x: window.innerWidth - 900, y: 16 })

  // Preset state
  const [presets, setPresets] = useState<GeoPresetStore>(() => loadGeoPresets())
  const [selectedPreset, setSelectedPreset] = useState<string>('')
  const [presetName, setPresetName] = useState<string>('')
  const [statusMsg, setStatusMsg] = useState<string | null>(null)

  function flash(msg: string) {
    setStatusMsg(msg)
    setTimeout(() => setStatusMsg(null), 2000)
  }

  const filteredPresets = Object.values(presets).filter((p) => p.pluginId === geometryId)
  const filteredNames = filteredPresets.map((p) => p.name).sort()

  // ── Preset: Save ───────────────────────────────────────────
  function handlePresetSave() {
    const name = presetName.trim() || selectedPreset
    if (!name) { flash('⚠ 名前を入力してください'); return }
    if (!geometryId) { flash('⚠ Geometry が選択されていません'); return }

    const preset: PluginPreset = {
      version: PROJECT_FILE_VERSION,
      savedAt: new Date().toISOString(),
      pluginId: geometryId,
      name,
      params: Object.fromEntries(
        Object.entries(params).map(([k, p]) => [k, p.value])
      ),
    }
    const key = `${geometryId}::${name}`
    const next = { ...presets, [key]: preset }
    setPresets(next)
    saveGeoPresets(next)
    setSelectedPreset(name)
    setPresetName('')
    flash(`✓ Saved: "${name}"`)
  }

  // ── Preset: Load ───────────────────────────────────────────
  function handlePresetLoad() {
    if (!selectedPreset) { flash('⚠ プリセットを選択してください'); return }
    const key = `${geometryId}::${selectedPreset}`
    const preset = presets[key]
    if (!preset) { flash('⚠ プリセットが見つかりません'); return }

    for (const [paramKey, value] of Object.entries(preset.params)) {
      const param = params[paramKey]
      if (!param) continue
      const cc = ccMapService.getCcNumber(geometryId, paramKey)
      const rMin = param.rangeMin ?? param.min
      const rMax = param.rangeMax ?? param.max
      const clamped = Math.min(rMax, Math.max(rMin, value))
      const normalized = (clamped - param.min) / (param.max - param.min)
      engine.handleMidiCC({ cc, value: normalized, protocol: 'midi2', resolution: 4294967296 })
    }

    setParams((prev) => {
      const next = { ...prev }
      for (const [k, v] of Object.entries(preset.params)) {
        if (next[k]) {
          const rMin = next[k].rangeMin ?? next[k].min
          const rMax = next[k].rangeMax ?? next[k].max
          next[k] = { ...next[k], value: Math.min(rMax, Math.max(rMin, v)) }
        }
      }
      return next
    })
    flash(`✓ Loaded: "${selectedPreset}"`)
  }

  // ── Preset: Delete ─────────────────────────────────────────
  function handlePresetDelete() {
    if (!selectedPreset) { flash('⚠ プリセットを選択してください'); return }
    const key = `${geometryId}::${selectedPreset}`
    const next = { ...presets }
    delete next[key]
    setPresets(next)
    saveGeoPresets(next)
    const deleted = selectedPreset
    setSelectedPreset('')
    flash(`✓ Deleted: "${deleted}"`)
  }

  // ── Geometry 同期 ───────────────────────────────────────────
  const isDraggingRef = useRef(false)

  const syncFromEngine = useCallback(() => {
    if (isDraggingRef.current) return
    const geo = engine.getGeometryPlugin(activeLayer)
    if (!geo) {
      if (geometryId !== '') {
        setGeometryId(''); setGeometryName(''); setParams({})
      }
      return
    }
    if (geo.id !== geometryId) {
      setGeometryId(geo.id)
      setGeometryName(geo.name)
      setParams(structuredClone(geo.params))
      setSelectedPreset('')
    } else {
      setParams((prev) => {
        let changed = false
        const next = { ...prev }
        for (const [key, geoParam] of Object.entries(geo.params)) {
          if (prev[key] && Math.abs(prev[key].value - geoParam.value) > 0.001) {
            next[key] = { ...prev[key], value: geoParam.value }
            changed = true
          }
        }
        return changed ? next : prev
      })
    }
  }, [activeLayer, geometryId])

  useEffect(() => {
    const geo = engine.getGeometryPlugin(activeLayer)
    if (geo) {
      setGeometryId(geo.id); setGeometryName(geo.name)
      setParams(structuredClone(geo.params))
    } else {
      setGeometryId(''); setGeometryName(''); setParams({})
    }
    setSelectedPreset('')
  }, [activeLayer])

  useEffect(() => {
    const timer = window.setInterval(syncFromEngine, 200)
    return () => window.clearInterval(timer)
  }, [syncFromEngine])

  // ── param 値変更（engine 経由）─────────────────────────────
  function handleParam(paramKey: string, value: number, param: PluginParam) {
    const cc = ccMapService.getCcNumber(geometryId, paramKey)
    // rangeMin/rangeMax で正規化（assign.min/max と同じ軍軸）
    const rMin = param.rangeMin ?? param.min
    const rMax = param.rangeMax ?? param.max
    const normalized = rMax > rMin ? (value - rMin) / (rMax - rMin) : 0
    engine.handleMidiCC({ cc, value: Math.min(1, Math.max(0, normalized)), protocol: 'midi2', resolution: 4294967296 })
    setParams((prev) => ({ ...prev, [paramKey]: { ...prev[paramKey], value } }))
  }

  // ── rangeMin/rangeMax 変更（UI state のみ・engine には流さない）──
  function handleRangeMin(paramKey: string, rangeMin: number) {
    setParams((prev) => {
      const p = prev[paramKey]
      if (!p) return prev
      const newRangeMin = Math.min(rangeMin, p.rangeMax ?? p.max)
      // value が範囲外になったらクランプして engine にも流す
      const newValue = Math.max(p.value, newRangeMin)
      if (newValue !== p.value) {
        const cc = ccMapService.getCcNumber(geometryId, paramKey)
        const normalized = (newValue - p.min) / (p.max - p.min)
        engine.handleMidiCC({ cc, value: normalized, protocol: 'midi2', resolution: 4294967296 })
      }
      return { ...prev, [paramKey]: { ...p, rangeMin: newRangeMin, value: newValue } }
    })
  }

  function handleRangeMax(paramKey: string, rangeMax: number) {
    setParams((prev) => {
      const p = prev[paramKey]
      if (!p) return prev
      const newRangeMax = Math.max(rangeMax, p.rangeMin ?? p.min)
      const newValue = Math.min(p.value, newRangeMax)
      if (newValue !== p.value) {
        const cc = ccMapService.getCcNumber(geometryId, paramKey)
        const normalized = (newValue - p.min) / (p.max - p.min)
        engine.handleMidiCC({ cc, value: normalized, protocol: 'midi2', resolution: 4294967296 })
      }
      return { ...prev, [paramKey]: { ...p, rangeMax: newRangeMax, value: newValue } }
    })
  }

  const selectStyle = {
    background: '#1a1a2e', border: '1px solid #2a2a4e', color: '#aaaacc',
  }

  return (
    <div className="fixed z-50 font-mono text-xs select-none" style={{ left: pos.x, top: pos.y, width: 360 }}>
      <div className="bg-[#0f0f1e] border border-[#2a2a4e] rounded-lg overflow-hidden" style={{ padding: '10px 14px' }}>

        {/* ヘッダー */}
        <div onMouseDown={handleMouseDown} className="flex items-center justify-between mb-2" style={{ cursor: 'grab' }}>
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-[#7878aa] tracking-widest">GEOMETRY SIMPLE WINDOW</span>
            <div className="flex gap-1">
              {LAYER_TABS.map((id, i) => (
                <button key={id} onClick={() => setActiveLayer(id)}
                  className="text-[9px] rounded px-1.5 py-0.5 border transition-colors"
                  style={{
                    background: activeLayer === id ? '#2a2a6e' : '#1a1a2e',
                    borderColor: activeLayer === id ? '#5a5aaa' : '#2a2a4e',
                    color: activeLayer === id ? '#aaaaee' : '#4a4a6e',
                  }}>L{i + 1}</button>
              ))}
            </div>
          </div>
          <button onClick={() => setCollapsed((c) => !c)}
            className="text-[#4a4a6e] hover:text-[#aaaacc] transition-colors text-[11px] leading-none">
            {collapsed ? '＋' : '－'}
          </button>
        </div>

        {!collapsed && (
          <div className="flex flex-col gap-2">
            {/* Geometry 名 + Preset */}
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center gap-2">
                <span className="text-[9px] text-[#5a5a8e] w-14 shrink-0">Geometry</span>
                <span className="text-[10px] text-[#aaaaee]">{geometryName || '— none —'}</span>
              </div>

              {geometryId && (
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-1.5">
                    <select value={selectedPreset} onChange={(e) => setSelectedPreset(e.target.value)}
                      className="flex-1 text-[9px] rounded px-1.5 py-0.5 outline-none" style={selectStyle}>
                      <option value="">— preset —</option>
                      {filteredNames.map((name) => <option key={name} value={name}>{name}</option>)}
                    </select>
                    <button onClick={handlePresetLoad}
                      className="px-2 py-0.5 text-[8px] rounded border whitespace-nowrap"
                      style={{ background: '#1a2a1e', borderColor: '#3a6e4a', color: '#7aaa8a' }}>Load</button>
                    <button onClick={handlePresetDelete}
                      className="px-2 py-0.5 text-[8px] rounded border whitespace-nowrap"
                      style={{ background: '#2a1a1a', borderColor: '#6e3a3a', color: '#aa7a7a' }}>Del</button>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <input type="text" value={presetName} onChange={(e) => setPresetName(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter') handlePresetSave() }}
                      placeholder="preset name..."
                      className="flex-1 text-[9px] rounded px-1.5 py-0.5 outline-none"
                      style={{ ...selectStyle, color: '#ccccee' }} />
                    <button onClick={handlePresetSave}
                      className="px-2 py-0.5 text-[8px] rounded border whitespace-nowrap"
                      style={{ background: '#1a1a2e', borderColor: '#5a5aaa', color: '#9999cc' }}>Save</button>
                  </div>
                  {statusMsg && (
                    <div className="text-[8px]" style={{ color: statusMsg.startsWith('⚠') ? '#aa6666' : '#6aaa7a' }}>
                      {statusMsg}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* params */}
            {Object.keys(params).length > 0 && (
              <div className="flex flex-col gap-1.5 mt-1">
                {Object.entries(params).map(([key, param]) => (
                  <ParamRow
                    key={`${activeLayer}-${geometryId}-${key}`}
                    paramKey={key}
                    pluginId={geometryId}
                    layerId={activeLayer}
                    param={param}
                    onChange={(v) => handleParam(key, v, param)}
                    onRangeMinChange={(v) => handleRangeMin(key, v)}
                    onRangeMaxChange={(v) => handleRangeMax(key, v)}
                    onSliderDragStart={() => { isDraggingRef.current = true }}
                    onSliderDragEnd={() => { isDraggingRef.current = false }}
                  />
                ))}
              </div>
            )}

            {!geometryId && (
              <div className="text-[#3a3a5e] text-[10px] py-2 text-center">— no geometry —</div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

// ============================================================
// ParamRow — RangeSlider + D&D ハンドル
// ============================================================

interface ParamRowProps {
  paramKey: string
  pluginId: string
  layerId: string
  param: PluginParam
  onChange: (value: number) => void
  onRangeMinChange: (value: number) => void
  onRangeMaxChange: (value: number) => void
  onSliderDragStart: () => void
  onSliderDragEnd: () => void
}

function ParamRow({
  paramKey, pluginId, layerId, param,
  onChange, onRangeMinChange, onRangeMaxChange,
  onSliderDragStart, onSliderDragEnd,
}: ParamRowProps) {
  const { value, min, max, label } = param
  const rangeMin = param.rangeMin ?? min
  const rangeMax = param.rangeMax ?? max
  const isBinary = min === 0 && max === 1
  const cc = ccMapService.getCcNumber(pluginId, paramKey)

  // 右クリックコンテキストメニュー
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null)
  const [assigns, setAssigns] = useState<{ knobId: string; assign: MacroAssign }[]>([])
  const menuRef = useRef<HTMLDivElement>(null)

  function handleContextMenu(e: React.MouseEvent) {
    e.preventDefault()
    setAssigns(engine.getAssignsForParam(paramKey))
    setContextMenu({ x: e.clientX, y: e.clientY })
  }

  function handleRemoveAssign(knobId: string) {
    engine.removeMacroAssign(knobId, paramKey)
    setContextMenu(null)
  }

  useEffect(() => {
    if (!contextMenu) return
    function onClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setContextMenu(null)
    }
    window.addEventListener('mousedown', onClickOutside)
    return () => window.removeEventListener('mousedown', onClickOutside)
  }, [contextMenu])

  // D&D: rangeMin/rangeMax を DragPayload の min/max として使う
  function handleDragStart(e: React.DragEvent) {
    const payload: DragPayload = {
      type: 'param',
      id: paramKey,
      layerId,
      pluginId,
      ccNumber: cc,
      min: rangeMin,   // 絞った範囲を初期値として渡す
      max: rangeMax,
    }
    e.dataTransfer.setData('application/geography-param', JSON.stringify(payload))
    e.dataTransfer.effectAllowed = 'copy'
  }

  // レール全体に対する % 計算
  const toPercent = (v: number) => ((v - min) / (max - min)) * 100
  const rangeMinPct = toPercent(rangeMin)
  const rangeMaxPct = toPercent(rangeMax)

  // linear-gradient で範囲外を暗く・範囲内を明るく
  const trackGradient = `linear-gradient(to right,
    #1a1a3e 0%,
    #1a1a3e ${rangeMinPct}%,
    #4a4aaa ${rangeMinPct}%,
    #4a4aaa ${rangeMaxPct}%,
    #1a1a3e ${rangeMaxPct}%,
    #1a1a3e 100%
  )`

  const step = (max - min) / 200

  return (
    <div className="flex items-center gap-1.5 relative">
      {/* CC番号 */}
      <span className="text-[8px] text-[#4a4a7e] w-10 shrink-0 tabular-nums" title={`CC${cc}`}>
        CC{cc}
      </span>

      {/* ラベル */}
      <span className="text-[9px] text-[#5a5a8e] w-14 truncate shrink-0">{label}</span>

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
          {/* RangeSlider: 3本の input を重ねる */}
          <div className="relative flex-1" style={{ height: 16 }}>
            {/* ── 共通スタイル ── */}
            <style>{`
              .geo-range {
                position: absolute;
                width: 100%;
                height: 4px;
                top: 50%;
                transform: translateY(-50%);
                -webkit-appearance: none;
                appearance: none;
                background: transparent;
                outline: none;
                pointer-events: none;
              }
              .geo-range::-webkit-slider-thumb {
                -webkit-appearance: none;
                appearance: none;
                pointer-events: all;
                cursor: pointer;
                border-radius: 50%;
              }
              /* 値スライダー: 青紫・大きめ */
              .geo-range-value::-webkit-slider-thumb {
                width: 10px; height: 10px;
                background: #8080ff;
                border: 1px solid #aaaaff;
              }
              /* rangeMin/rangeMax つまみ: 白・小さめ */
              .geo-range-bound::-webkit-slider-thumb {
                width: 7px; height: 14px;
                background: #667;
                border: 1px solid #99a;
                border-radius: 2px;
              }
              .geo-range-bound::-webkit-slider-thumb:hover {
                background: #889;
              }
            `}</style>

            {/* トラック背景（色分け） */}
            <div
              className="absolute rounded-full"
              style={{
                left: 0, right: 0,
                top: '50%', transform: 'translateY(-50%)',
                height: 4,
                background: trackGradient,
              }}
            />

            {/* rangeMin つまみ */}
            <input
              type="range" min={min} max={max} step={step}
              value={rangeMin}
              onChange={(e) => onRangeMinChange(parseFloat(e.target.value))}
              className="geo-range geo-range-bound"
              style={{ zIndex: 2 }}
            />

            {/* rangeMax つまみ */}
            <input
              type="range" min={min} max={max} step={step}
              value={rangeMax}
              onChange={(e) => onRangeMaxChange(parseFloat(e.target.value))}
              className="geo-range geo-range-bound"
              style={{ zIndex: 2 }}
            />

            {/* 値スライダー（rangeMin〜rangeMax の範囲内のみ） */}
            <input
              type="range" min={rangeMin} max={rangeMax} step={step}
              value={Math.min(rangeMax, Math.max(rangeMin, value))}
              onChange={(e) => onChange(parseFloat(e.target.value))}
              onMouseDown={onSliderDragStart}
              onMouseUp={onSliderDragEnd}
              className="geo-range geo-range-value"
              style={{ zIndex: 3 }}
            />
          </div>

          {/* 現在値 */}
          <span className="text-[9px] text-[#5a5a8e] w-10 text-right tabular-nums shrink-0">
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
        title="MacroKnob にドラッグ（絞った範囲が初期値になる）/ 右クリックで解除"
      >≡</div>

      {/* 右クリックメニュー */}
      {contextMenu && (
        <div ref={menuRef}
          className="fixed z-[300] bg-[#0f0f1e] border border-[#3a3a6e] rounded shadow-lg py-1"
          style={{ left: contextMenu.x, top: contextMenu.y, minWidth: 180 }}>
          {assigns.length === 0 ? (
            <div className="px-3 py-1.5 text-[9px] text-[#4a4a6e]">アサインなし</div>
          ) : assigns.map(({ knobId, assign }) => (
            <button key={knobId} onClick={() => handleRemoveAssign(knobId)}
              className="w-full text-left px-3 py-1.5 text-[9px] text-[#8888bb]
                         hover:bg-[#1a1a3e] hover:text-[#cc4444] transition-colors">
              Remove: {knobId} (CC{assign.ccNumber}) [{assign.min}…{assign.max}]
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
