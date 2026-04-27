/**
 * PreferencesPanel
 * spec: docs/spec/preferences-panel.spec.md
 *
 * 画面左上の ⚙ ボタンクリック / P キーで開閉するプリファレンスパネル。
 * タブ: Setup / Project / Plugins / Audio / MIDI / Output
 *
 * Day60: Preset CRUD ロジックを presetStore.ts に移動
 *        FX 定数を presetStore.ts から import
 *        このファイルは UI state + 描画のみを担当する
 */

import { useState, useEffect } from 'react'
import { engine } from '../../../application/orchestrator/engine'
import { registry } from '../../../application/registry/registry'
import { presetStore, FX_LABELS, FX_DEFAULTS, FX_ORDER } from '../../../application/adapter/storage/presetStore'
import type { GeoPreset } from '../../../application/adapter/storage/presetStore'
import {
  loadLayerPresetFolders,
  saveLayerPreset,
  deleteLayerPreset,
  loadScenePresets,
  saveScenePreset,
  deleteScenePreset,
} from '../../../application/adapter/storage/layerPresetStore'
import type { GeometryPlugin, LayerPreset, ScenePreset } from '../../../application/schema'
import type { WindowMode, GeoWindowMode, MacroWindowMode, MixerWindowMode, LayerId } from '../../../application/schema/windowMode'
import { LAYER_IDS } from '../../../application/schema/windowMode'
import { useDraggable } from '../../useDraggable'

// ----------------------------------------------------------------
// 型定義
// ----------------------------------------------------------------

type TabId = 'setup' | 'presets' | 'plugins' | 'audio' | 'midi' | 'output'

const TABS: { id: TabId; label: string }[] = [
  { id: 'setup',   label: 'Setup'   },
  { id: 'presets', label: 'Presets' },
  { id: 'plugins', label: 'Plugins' },
  { id: 'audio',   label: 'Audio'   },
  { id: 'midi',    label: 'MIDI'    },
  { id: 'output',  label: 'Output'  },
]

const CAMERA_LABELS: Record<string, string> = {
  'orbit-camera':  'Orbit',
  'aerial-camera': 'Aerial',
  'static-camera': 'Static',
}

// ----------------------------------------------------------------
// helpers
// ----------------------------------------------------------------

const NONE_ID = '__none__'

function resolveCamId(geoId: string | undefined): string {
  if (!geoId || geoId === NONE_ID) return 'static-camera'
  const plugin = registry.get(geoId) as GeometryPlugin | undefined
  return plugin?.defaultCameraPluginId ?? 'static-camera'
}

/** engine に Geo/Cam/FX を即時反映する共通関数 */
function applyToEngine(
  geoIds: [string, string, string],
  camIds: [string, string, string],
  selectedFx: Record<string, Record<string, boolean>>,
): void {
  const selectedGeoIds = geoIds
    .map((id) => (id === NONE_ID ? null : id))
    .filter((id): id is string => id !== null)
  engine.applyGeometrySetup(selectedGeoIds)
  engine.applyCameraSetup([camIds[0], camIds[1], camIds[2]])
  // レイヤー別に FX を適用
  const fxPerLayer: Record<string, string[]> = {}
  for (const lid of LAYER_IDS) {
    fxPerLayer[lid] = FX_ORDER.filter((id) => selectedFx[lid]?.[id] ?? false)
  }
  engine.applyFxSetupPerLayer(fxPerLayer)
}

// ----------------------------------------------------------------
// PreferencesPanel
// ----------------------------------------------------------------

interface PreferencesPanelProps {
  open: boolean
  onClose: () => void
  windowMode: WindowMode
  onWindowModeChange: (mode: WindowMode) => void
}

export function PreferencesPanel({ open, onClose, windowMode, onWindowModeChange }: PreferencesPanelProps) {
  const [activeTab, setActiveTab] = useState<TabId>('setup')
  const { pos, handleMouseDown } = useDraggable({ x: 8, y: 80 })

  if (!open) return null

  return (
    <div
      className="fixed z-[200] font-mono text-xs select-none"
      style={{ left: pos.x, top: pos.y, width: 500 }}
    >
      <div className="bg-[#0f0f1e] border border-[#2a2a4e] rounded-lg overflow-hidden shadow-2xl">
        <div onMouseDown={handleMouseDown} className="flex items-center justify-between px-4 py-2.5 border-b border-[#2a2a4e]" style={{ cursor: 'grab' }}>
          <span className="text-[11px] text-[#7878aa] tracking-widest">⚙ PREFERENCES</span>
          <button
            onClick={onClose}
            className="text-[#4a4a6e] hover:text-[#aaaacc] transition-colors text-[14px] leading-none"
            aria-label="Close"
          >✕</button>
        </div>

        <div className="flex border-b border-[#2a2a4e] overflow-x-auto">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className="px-4 py-2 text-[10px] tracking-wide transition-colors whitespace-nowrap"
              style={{
                color: activeTab === tab.id ? '#aaaaee' : '#4a4a6e',
                borderBottom: activeTab === tab.id ? '2px solid #5a5aaa' : '2px solid transparent',
                background: 'transparent',
              }}
            >{tab.label}</button>
          ))}
        </div>

        <div className="p-4 overflow-y-auto" style={{ minHeight: 280, maxHeight: 'calc(100vh - 80px)' }}>
          {activeTab === 'setup'   && <SetupTab onClose={onClose} windowMode={windowMode} onWindowModeChange={onWindowModeChange} />}
          {activeTab === 'presets' && <PresetsTab />}
          {(activeTab === 'plugins' || activeTab === 'audio' ||
            activeTab === 'midi'   || activeTab === 'output') && <ComingSoonTab />}
        </div>
      </div>
    </div>
  )
}

// ----------------------------------------------------------------
// SetupTab
// ----------------------------------------------------------------

function SetupTab({ onClose, windowMode, onWindowModeChange }: { onClose: () => void; windowMode: WindowMode; onWindowModeChange: (m: WindowMode) => void }) {
  const allGeometry = engine.getRegisteredPlugins()
  const allCameras  = engine.listCameraPlugins()

  // ── state ──────────────────────────────────────────────────────
  const [geoIds, setGeoIds] = useState<[string, string, string]>(() => {
    const layers = engine.getLayers()
    return [
      layers[0]?.plugin?.id ?? NONE_ID,
      layers[1]?.plugin?.id ?? NONE_ID,
      layers[2]?.plugin?.id ?? NONE_ID,
    ]
  })

  const [camIds, setCamIds] = useState<[string, string, string]>(() => {
    const layers = engine.getLayers()
    return [
      layers[0]?.cameraPlugin?.id ?? 'static-camera',
      layers[1]?.cameraPlugin?.id ?? 'static-camera',
      layers[2]?.cameraPlugin?.id ?? 'static-camera',
    ]
  })

  const [camOverridden, setCamOverridden] = useState<[boolean, boolean, boolean]>(
    [false, false, false]
  )

  const [selectedFx, setSelectedFx] = useState<Record<string, Record<string, boolean>>>(() => {
    const result: Record<string, Record<string, boolean>> = {}
    for (const lid of LAYER_IDS) {
      const currentFx = engine.getFxPlugins(lid)
      if (currentFx.length > 0) {
        result[lid] = Object.fromEntries(currentFx.map((fx) => [fx.id, fx.enabled]))
      } else {
        result[lid] = { ...FX_DEFAULTS }
      }
    }
    return result
  })
  const [activeLayer, setActiveLayer] = useState<LayerId>('layer-1')

  // ── Preset state（presetStore から取得）───────────────────────
  const [presetNames, setPresetNames] = useState<string[]>(() => presetStore.getNames())
  const [selectedPreset, setSelectedPreset] = useState<string>('')
  const [presetName, setPresetName] = useState<string>('')
  const [statusMsg, setStatusMsg] = useState<string | null>(null)

  function flash(msg: string) {
    setStatusMsg(msg)
    setTimeout(() => setStatusMsg(null), 2500)
  }

  // ── 初回補正：パネルを開いた瞬間に engine の実際のカメラ状態を反映 ──
  useEffect(() => {
    const layers = engine.getLayers()
    setCamIds([
      layers[0]?.cameraPlugin?.id ?? 'static-camera',
      layers[1]?.cameraPlugin?.id ?? 'static-camera',
      layers[2]?.cameraPlugin?.id ?? 'static-camera',
    ])
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Geometry 変更 → Camera 自動連動（手動上書きなしのレイヤーのみ）
  useEffect(() => {
    setCamIds((prev) => {
      const next = [...prev] as [string, string, string]
      LAYER_IDS.forEach((_, i) => {
        if (camOverridden[i]) return
        next[i] = resolveCamId(geoIds[i])
      })
      return next
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [geoIds])

  // ── ハンドラー ─────────────────────────────────────────────────

  function handleGeoChange(index: number, value: string) {
    const next = [...geoIds] as [string, string, string]
    next[index] = value
    setGeoIds(next)
  }

  function handleCamChange(index: number, value: string) {
    const nextCam = [...camIds] as [string, string, string]
    nextCam[index] = value
    setCamIds(nextCam)
    const nextOv = [...camOverridden] as [boolean, boolean, boolean]
    nextOv[index] = true
    setCamOverridden(nextOv)
  }

  function toggleFx(id: string) {
    setSelectedFx((prev) => ({
      ...prev,
      [activeLayer]: { ...prev[activeLayer], [id]: !prev[activeLayer][id] },
    }))
  }

  // ── Window Mode ハンドラー ──────────────────────────────────────
  function handleWindowChange(kind: 'geometry' | 'camera' | 'fx', value: GeoWindowMode) {
    onWindowModeChange({ ...windowMode, [kind]: value })
  }

  function handleMacroChange(value: MacroWindowMode) {
    onWindowModeChange({ ...windowMode, macro: value })
  }

  function handleMixerChange(value: MixerWindowMode) {
    onWindowModeChange({ ...windowMode, mixer: value })
  }

  function handleMonitorChange(checked: boolean) {
    onWindowModeChange({ ...windowMode, monitor: checked })
  }

  // ── Preset: Save As ────────────────────────────────────────────
  function handleSaveAs() {
    const name = presetName.trim()
    if (!name) { flash('⚠ Name required'); return }

    const project = engine.buildProject(name) as GeoPreset
    project.setup.geometry = geoIds
      .map((id) => (id === NONE_ID ? null : id))
      .filter((id): id is string => id !== null)
    project.setup.camera = [camIds[0], camIds[1], camIds[2]]
    project.setup.fx = Object.fromEntries(
      LAYER_IDS.map((lid) => [
        lid,
        FX_ORDER.filter((id) => selectedFx[lid]?.[id] ?? false),
      ])
    )

    presetStore.add(name, project)
    setPresetNames(presetStore.getNames())
    setSelectedPreset(name)
    setPresetName('')
    flash(`✓ Saved: "${name}"`)
  }

  // ── Preset: Load → 即 engine 反映（APPLY 不要）────────────────
  function handleLoad() {
    const preset = presetStore.get(selectedPreset)
    if (!preset) { flash('⚠ Select a preset'); return }

    const newGeoIds: [string, string, string] = [
      preset.setup.geometry[0] ?? NONE_ID,
      preset.setup.geometry[1] ?? NONE_ID,
      preset.setup.geometry[2] ?? NONE_ID,
    ]
    const newCamIds: [string, string, string] = preset.setup.camera ?? [
      'static-camera', 'static-camera', 'static-camera',
    ]
    const enabledFx = preset.setup.fx
    // 新形式（Record<string, string[]>）と旧形式（string[]）の両方に対応
    const getFxForLayer = (lid: string): Record<string, boolean> => {
      if (Array.isArray(enabledFx)) {
        // 旧形式: 全レイヤー同じ
        return Object.fromEntries(FX_ORDER.map((id) => [id, (enabledFx as string[]).includes(id)]))
      }
      const ids = (enabledFx as Record<string, string[]>)[lid] ?? []
      return Object.fromEntries(FX_ORDER.map((id) => [id, ids.includes(id)]))
    }
    const newFx: Record<string, Record<string, boolean>> = {
      'layer-1': getFxForLayer('layer-1'),
      'layer-2': getFxForLayer('layer-2'),
      'layer-3': getFxForLayer('layer-3'),
    }

    setGeoIds(newGeoIds)
    setCamIds(newCamIds)
    setCamOverridden([true, true, true])
    setSelectedFx(newFx)

    applyToEngine(newGeoIds, newCamIds, newFx)
    flash(`✓ Loaded: "${selectedPreset}"`)
  }

  // ── Preset: Delete ─────────────────────────────────────────────
  function handleDelete() {
    if (!presetStore.get(selectedPreset)) { flash('⚠ Select a preset'); return }
    presetStore.remove(selectedPreset)
    setPresetNames(presetStore.getNames())
    const deleted = selectedPreset
    setSelectedPreset('')
    flash(`✓ Deleted: "${deleted}"`)
  }

  // ── APPLY（手動で engine に反映したいとき用）──────────────────
  function handleApply() {
    applyToEngine(geoIds, camIds, selectedFx)
    onClose()
  }

  const selectStyle = {
    background: '#1a1a2e',
    border: '1px solid #2a2a4e',
    color: '#aaaacc',
  }
  const GEO_WINDOW_OPTIONS: { value: GeoWindowMode; label: string }[] = [
    { value: 'none',         label: '— none —'     },
    { value: 'simple',       label: 'Simple'       },
    { value: 'simple-dnd',   label: 'Simple D&D'  },
    { value: 'standard',     label: 'Standard'     },
    { value: 'standard-dnd', label: 'Standard D&D' },
  ]

  return (
    <div className="flex flex-col gap-4">

      {/* ── PRESETS ── */}
      <section>
        <div className="text-[10px] text-[#7878aa] tracking-widest mb-2">PRESETS</div>

        <div className="flex items-center gap-2 mb-2">
          <select
            value={selectedPreset}
            onChange={(e) => setSelectedPreset(e.target.value)}
            className="flex-1 text-[11px] rounded px-2 py-1 outline-none"
            style={selectStyle}
          >
            <option value="">— select preset —</option>
            {presetNames.map((name) => (
              <option key={name} value={name}>{name}</option>
            ))}
          </select>
          <button onClick={handleLoad} className="px-3 py-1 text-[10px] rounded border whitespace-nowrap" style={{ background: '#1a2a1e', borderColor: '#3a6e4a', color: '#7aaa8a' }}>Load</button>
          <button onClick={handleDelete} className="px-3 py-1 text-[10px] rounded border whitespace-nowrap" style={{ background: '#2a1a1a', borderColor: '#6e3a3a', color: '#aa7a7a' }}>Delete</button>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="text"
            value={presetName}
            onChange={(e) => setPresetName(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') handleSaveAs() }}
            placeholder="New preset name..."
            className="flex-1 text-[11px] rounded px-2 py-1 outline-none"
            style={{ ...selectStyle, color: '#ccccee' }}
          />
          <button onClick={handleSaveAs} className="px-3 py-1 text-[10px] rounded border whitespace-nowrap" style={{ background: '#1a1a2e', borderColor: '#5a5aaa', color: '#9999cc' }}>Save As</button>
        </div>

        {statusMsg && (
          <div className="mt-1.5 text-[9px]" style={{ color: statusMsg.startsWith('⚠') ? '#aa6666' : '#6aaa7a' }}>{statusMsg}</div>
        )}
      </section>

      <div className="border-t border-[#1a1a3e]" />

      {/* ── WINDOWS ── */}
      <section>
        <div className="text-[10px] text-[#7878aa] tracking-widest mb-2">WINDOWS</div>
        <div className="flex flex-col gap-1.5">
          {(['geometry', 'camera', 'fx'] as const).map((kind) => (
            <div key={kind} className="flex items-center gap-3">
              <span className="text-[10px] text-[#4a4a6e] w-16 shrink-0 capitalize">{kind}</span>
              <select
                value={windowMode[kind]}
                onChange={(e) => handleWindowChange(kind, e.target.value as GeoWindowMode)}
                className="flex-1 text-[11px] rounded px-2 py-1 outline-none"
                style={selectStyle}
              >
                {GEO_WINDOW_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
          ))}
        </div>
      </section>

      <div className="border-t border-[#1a1a3e]" />

      {/* ── 共有レイヤータブ（SETUP用）── */}
      <div className="flex gap-1">
        {LAYER_IDS.map((id, i) => (
          <button
            key={id}
            onClick={() => setActiveLayer(id)}
            className="text-[9px] rounded px-2.5 py-1 border transition-colors"
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

      {/* ── SETUP ── */}
      <section>
        <div className="text-[10px] text-[#7878aa] tracking-widest mb-2">SETUP</div>
        <div className="flex flex-col gap-1.5 mb-3">
          <div className="flex items-center gap-3">
            <span className="text-[10px] text-[#4a4a6e] w-16 shrink-0">Geometry</span>
            <select
              value={geoIds[LAYER_IDS.indexOf(activeLayer)]}
              onChange={(e) => handleGeoChange(LAYER_IDS.indexOf(activeLayer), e.target.value)}
              className="flex-1 text-[11px] rounded px-2 py-1 outline-none"
              style={selectStyle}
            >
              <option value={NONE_ID}>None</option>
              {allGeometry.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-[10px] text-[#4a4a6e] w-16 shrink-0">Camera</span>
            <select
              value={camIds[LAYER_IDS.indexOf(activeLayer)]}
              onChange={(e) => handleCamChange(LAYER_IDS.indexOf(activeLayer), e.target.value)}
              className="flex-1 text-[11px] rounded px-2 py-1 outline-none"
              style={{ ...selectStyle, color: camOverridden[LAYER_IDS.indexOf(activeLayer)] ? '#aaaaee' : '#aaaacc' }}
            >
              {allCameras.map((c) => (
                <option key={c.id} value={c.id}>{CAMERA_LABELS[c.id] ?? c.id}</option>
              ))}
            </select>
            {camOverridden[LAYER_IDS.indexOf(activeLayer)] && (
              <span className="text-[9px] text-[#5a5aaa] shrink-0">manual</span>
            )}
          </div>
        </div>

        {/* FX チェックボックス */}
        <div className="text-[10px] text-[#4a4a6e] mb-1.5">FX</div>
        <div className="grid grid-cols-2 gap-1.5">
          {FX_ORDER.map((fxId) => (
            <CheckItem
              key={fxId}
              id={fxId}
              label={FX_LABELS[fxId] ?? fxId}
              checked={selectedFx[activeLayer]?.[fxId] ?? false}
              onChange={() => toggleFx(fxId)}
            />
          ))}
        </div>
      </section>

      <div className="border-t border-[#1a1a3e]" />

      {/* ── レイヤー非依存 Window ── */}
      <section>
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-3">
            <span className="text-[10px] text-[#4a4a6e] w-16 shrink-0">Macro</span>
            <select
              value={windowMode.macro}
              onChange={(e) => handleMacroChange(e.target.value as MacroWindowMode)}
              className="flex-1 text-[11px] rounded px-2 py-1 outline-none"
              style={selectStyle}
            >
              <option value="none">— none —</option>
              <option value="macro-8-window">Macro 8</option>
            </select>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-[10px] text-[#4a4a6e] w-16 shrink-0">Mixer</span>
            <select
              value={windowMode.mixer}
              onChange={(e) => handleMixerChange(e.target.value as MixerWindowMode)}
              className="flex-1 text-[11px] rounded px-2 py-1 outline-none"
              style={selectStyle}
            >
              <option value="none">— none —</option>
              <option value="mixer-simple">MixerSimple</option>
            </select>
          </div>
        </div>
      </section>

      {/* ── Monitor（debug）── */}
      <div className="flex items-center gap-2">
        <input
          id="pref-monitor"
          type="checkbox"
          checked={windowMode.monitor}
          onChange={(e) => handleMonitorChange(e.target.checked)}
          className="accent-[#5a5aff] cursor-pointer"
        />
        <label htmlFor="pref-monitor" className="text-[10px] cursor-pointer" style={{ color: windowMode.monitor ? '#aaaacc' : '#4a4a6e' }}>
          Monitor <span className="text-[8px] text-[#3a3a5e]">(debug)</span>
        </label>
      </div>

      {/* ── ボタン行 ── */}
      <div className="flex items-center justify-between pt-1">
        <span className="text-[9px] text-[#3a3a5e]">Load: engine に即反映 / Apply: 手動で反映して閉じる</span>
        <button
          onClick={handleApply}
          className="px-5 py-1.5 text-[11px] rounded border transition-colors"
          style={{ background: '#2a2a6e', borderColor: '#5a5aaa', color: '#aaaaee' }}
        >APPLY</button>
      </div>
    </div>
  )
}

// ----------------------------------------------------------------
// CheckItem
// ----------------------------------------------------------------

interface CheckItemProps {
  id: string
  label: string
  checked: boolean
  onChange: () => void
}

function CheckItem({ id, label, checked, onChange }: CheckItemProps) {
  return (
    <label className="flex items-center gap-2 cursor-pointer" htmlFor={`pref-check-${id}`}>
      <input
        id={`pref-check-${id}`}
        type="checkbox"
        checked={checked}
        onChange={onChange}
        className="accent-[#5a5aff] cursor-pointer"
      />
      <span
        className="text-[11px] transition-colors"
        style={{ color: checked ? '#aaaacc' : '#4a4a6e' }}
      >{label}</span>
    </label>
  )
}

// ----------------------------------------------------------------
// PresetsTab
// ----------------------------------------------------------------

const LAYER_COLORS = ['#5a5aff', '#5affaa', '#ffaa5a'] as const
const LAYER_LABELS = ['L1', 'L2', 'L3'] as const

function PresetsTab() {
  const [layerPresets, setLayerPresets] = useState<LayerPreset[]>([])
  const [scenePresets, setScenePresets] = useState<ScenePreset[]>([])
  const [selectedLayer, setSelectedLayer] = useState('')
  const [selectedScene, setSelectedScene] = useState('')
  const [layerName, setLayerName] = useState('')
  const [sceneName, setSceneName] = useState('')
  const [status, setStatus] = useState<string | null>(null)

  const selectStyle = {
    background: '#1a1a2e', border: '1px solid #2a2a4e',
    color: '#aaaacc', borderRadius: 3, padding: '3px 8px', fontSize: 10, outline: 'none',
  }
  const inputStyle = { ...selectStyle, color: '#ccccee' }

  function flash(msg: string) {
    setStatus(msg)
    setTimeout(() => setStatus(null), 2500)
  }

  async function loadAll() {
    const [folders, scenes] = await Promise.all([
      loadLayerPresetFolders(),
      loadScenePresets(),
    ])
    setLayerPresets(folders.flatMap((f) => f.presets))
    setScenePresets(scenes)
  }

  useEffect(() => { loadAll() }, [])

  async function handleSaveLayer(layerIndex: number) {
    const name = layerName.trim()
    if (!name) { flash('⚠ Name required'); return }
    const preset = engine.captureLayerPreset(`layer-${layerIndex + 1}`, name)
    await saveLayerPreset(name, preset)
    setLayerName('')
    flash(`✓ Saved: "${name}" (${LAYER_LABELS[layerIndex]})`)
    await loadAll()
    setSelectedLayer(name)
  }

  function handleLoadLayer(layerIndex: number) {
    const preset = layerPresets.find((p) => p.name === selectedLayer)
    if (!preset) { flash('⚠ Select a preset'); return }
    engine.replaceLayerPreset(`layer-${layerIndex + 1}`, preset)
    flash(`✓ Loaded: "${preset.name}" → ${LAYER_LABELS[layerIndex]}`)
  }

  async function handleDeleteLayer() {
    if (!selectedLayer) { flash('⚠ Select a preset'); return }
    await deleteLayerPreset(selectedLayer)
    flash(`✓ Deleted: "${selectedLayer}"`)
    setSelectedLayer('')
    await loadAll()
  }

  async function handleSaveScene() {
    const name = sceneName.trim()
    if (!name) { flash('⚠ Name required'); return }
    const captured = (['layer-1', 'layer-2', 'layer-3'] as const).map((lid, i) => engine.captureLayerPreset(lid, `${name} - L${i + 1}`))
    const preset: ScenePreset = {
      id: `scene-${Date.now()}`, name,
      layerPresets: [captured[0], captured[1], captured[2]],
      createdAt: new Date().toISOString(),
    }
    await saveScenePreset(name, preset)
    setSceneName('')
    flash(`✓ Scene saved: "${name}"`)
    await loadAll()
    setSelectedScene(name)
  }

  function handleLoadScene() {
    const preset = scenePresets.find((p) => p.name === selectedScene)
    if (!preset) { flash('⚠ Select a preset'); return }
    ;(['layer-1', 'layer-2', 'layer-3'] as const).forEach((lid, i) => {
      const lp = preset.layerPresets[i]
      if (lp) engine.replaceLayerPreset(lid, lp)
    })
    flash(`✓ Scene loaded: "${preset.name}"`)
  }

  async function handleDeleteScene() {
    if (!selectedScene) { flash('⚠ Select a preset'); return }
    await deleteScenePreset(selectedScene)
    flash(`✓ Deleted: "${selectedScene}"`)
    setSelectedScene('')
    await loadAll()
  }

  return (
    <div className="flex flex-col gap-4 font-mono text-xs">

      {status && (
        <div style={{ fontSize: 9, color: status.startsWith('⚠') ? '#aa6666' : '#6aaa7a' }}>{status}</div>
      )}

      {/* LAYER PRESETS */}
      <section>
        <div className="tracking-widest mb-2" style={{ fontSize: 10, color: '#7878aa' }}>LAYER PRESETS</div>

        {/* 選択 + Load + Delete */}
        <div className="flex items-center gap-1.5 mb-2">
          <select value={selectedLayer} onChange={(e) => setSelectedLayer(e.target.value)}
            className="flex-1 rounded outline-none" style={selectStyle}>
            <option value="">— select preset —</option>
            {layerPresets.map((p) => (
              <option key={p.id} value={p.name}>{p.name}</option>
            ))}
          </select>
          {LAYER_LABELS.map((label, i) => (
            <button key={i} onClick={() => handleLoadLayer(i)}
              className="px-2 py-1 rounded whitespace-nowrap hover:opacity-80"
              style={{ fontSize: 9, background: '#1a2a1e', border: `1px solid ${LAYER_COLORS[i]}`, color: LAYER_COLORS[i] }}>
              →{label}
            </button>
          ))}
          <button onClick={handleDeleteLayer}
            className="px-2 py-1 rounded whitespace-nowrap"
            style={{ fontSize: 9, background: '#2a1a1a', border: '1px solid #6e3a3a', color: '#aa7a7a' }}>
            Delete
          </button>
        </div>

        {/* 保存 */}
        <div className="flex items-center gap-1.5">
          <input type="text" value={layerName} onChange={(e) => setLayerName(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') handleSaveLayer(0) }}
            placeholder="New preset name..."
            className="flex-1 rounded" style={inputStyle} />
          {LAYER_LABELS.map((label, i) => (
            <button key={i} onClick={() => handleSaveLayer(i)}
              className="px-2 py-1 rounded whitespace-nowrap hover:opacity-80"
              style={{ fontSize: 9, background: '#1a1a2e', border: `1px solid ${LAYER_COLORS[i]}`, color: LAYER_COLORS[i] }}>
              {label}
            </button>
          ))}
        </div>
      </section>

      <div style={{ borderTop: '1px solid #1a1a2e' }} />

      {/* SCENE PRESETS */}
      <section>
        <div className="tracking-widest mb-2" style={{ fontSize: 10, color: '#7878aa' }}>SCENE PRESETS</div>

        {/* 選択 + Load + Delete */}
        <div className="flex items-center gap-1.5 mb-2">
          <select value={selectedScene} onChange={(e) => setSelectedScene(e.target.value)}
            className="flex-1 rounded outline-none" style={selectStyle}>
            <option value="">— select scene —</option>
            {scenePresets.map((p) => (
              <option key={p.id} value={p.name}>{p.name}</option>
            ))}
          </select>
          <button onClick={handleLoadScene}
            className="px-3 py-1 rounded whitespace-nowrap"
            style={{ fontSize: 9, background: '#1a2a1e', border: '1px solid #3a6e4a', color: '#7aaa8a' }}>
            Load
          </button>
          <button onClick={handleDeleteScene}
            className="px-2 py-1 rounded whitespace-nowrap"
            style={{ fontSize: 9, background: '#2a1a1a', border: '1px solid #6e3a3a', color: '#aa7a7a' }}>
            Delete
          </button>
        </div>

        {/* 保存 */}
        <div className="flex items-center gap-1.5">
          <input type="text" value={sceneName} onChange={(e) => setSceneName(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') handleSaveScene() }}
            placeholder="New scene name..."
            className="flex-1 rounded" style={inputStyle} />
          <button onClick={handleSaveScene}
            className="px-3 py-1 rounded whitespace-nowrap"
            style={{ fontSize: 9, background: '#1a1a2e', border: '1px solid #7878aa', color: '#aaaacc' }}>
            Save All
          </button>
        </div>
      </section>
    </div>
  )
}

// ----------------------------------------------------------------
// ComingSoonTab
// ----------------------------------------------------------------

function ComingSoonTab() {
  return (
    <div className="flex items-center justify-center h-40">
      <span className="text-[#3a3a5e] text-[12px] tracking-widest">COMING SOON</span>
    </div>
  )
}
