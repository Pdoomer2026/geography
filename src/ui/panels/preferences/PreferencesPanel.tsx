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
import { engine } from '../../../core/engine'
import { registry } from '../../../core/registry'
import { presetStore, FX_LABELS, FX_DEFAULTS, FX_ORDER } from '../../../core/presetStore'
import type { GeoPreset } from '../../../core/presetStore'
import type { GeometryPlugin } from '../../../types'

// ----------------------------------------------------------------
// 型定義
// ----------------------------------------------------------------

type TabId = 'setup' | 'plugins' | 'audio' | 'midi' | 'output'

const TABS: { id: TabId; label: string }[] = [
  { id: 'setup',   label: 'Setup'   },
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
const LAYER_IDS = ['layer-1', 'layer-2', 'layer-3'] as const

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
}

export function PreferencesPanel({ open, onClose }: PreferencesPanelProps) {
  const [activeTab, setActiveTab] = useState<TabId>('setup')

  if (!open) return null

  return (
    <div
      className="fixed z-[200] font-mono text-xs select-none"
      style={{ top: 48, left: 8, width: 500 }}
    >
      <div className="bg-[#0f0f1e] border border-[#2a2a4e] rounded-lg overflow-hidden shadow-2xl">
        <div className="flex items-center justify-between px-4 py-2.5 border-b border-[#2a2a4e]">
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

        <div className="p-4" style={{ minHeight: 280 }}>
          {activeTab === 'setup' && <SetupTab onClose={onClose} />}
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

function SetupTab({ onClose }: { onClose: () => void }) {
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
  const [activeFxLayer, setActiveFxLayer] = useState<typeof LAYER_IDS[number]>('layer-1')

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
      [activeFxLayer]: { ...prev[activeFxLayer], [id]: !prev[activeFxLayer][id] },
    }))
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
    project.setup.fx = FX_ORDER.filter((id) => selectedFx['layer-1']?.[id] ?? false)
    // TODO: Day61 - setup.fx をレイヤー別に保存する形式に拡張予定

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
    const enabledFx = new Set(preset.setup.fx)
    const newFxL1 = Object.fromEntries(FX_ORDER.map((id) => [id, enabledFx.has(id)]))
    const newFx: Record<string, Record<string, boolean>> = {
      'layer-1': newFxL1,
      'layer-2': { ...newFxL1 },
      'layer-3': { ...newFxL1 },
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

  const layerLabels = ['Layer 1', 'Layer 2', 'Layer 3']
  const selectStyle = {
    background: '#1a1a2e',
    border: '1px solid #2a2a4e',
    color: '#aaaacc',
  }

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
          <button
            onClick={handleLoad}
            className="px-3 py-1 text-[10px] rounded border whitespace-nowrap"
            style={{ background: '#1a2a1e', borderColor: '#3a6e4a', color: '#7aaa8a' }}
          >Load</button>
          <button
            onClick={handleDelete}
            className="px-3 py-1 text-[10px] rounded border whitespace-nowrap"
            style={{ background: '#2a1a1a', borderColor: '#6e3a3a', color: '#aa7a7a' }}
          >Delete</button>
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
          <button
            onClick={handleSaveAs}
            className="px-3 py-1 text-[10px] rounded border whitespace-nowrap"
            style={{ background: '#1a1a2e', borderColor: '#5a5aaa', color: '#9999cc' }}
          >Save As</button>
        </div>

        {statusMsg && (
          <div className="mt-1.5 text-[9px]" style={{
            color: statusMsg.startsWith('⚠') ? '#aa6666' : '#6aaa7a'
          }}>{statusMsg}</div>
        )}
      </section>

      <div className="border-t border-[#1a1a3e]" />

      {/* ── GEOMETRY ── */}
      <section>
        <div className="text-[10px] text-[#7878aa] tracking-widest mb-2">GEOMETRY</div>
        <div className="flex flex-col gap-1.5">
          {layerLabels.map((label, i) => (
            <div key={i} className="flex items-center gap-3">
              <span className="text-[10px] text-[#4a4a6e] w-14 shrink-0">{label}</span>
              <select
                value={geoIds[i]}
                onChange={(e) => handleGeoChange(i, e.target.value)}
                className="flex-1 text-[11px] rounded px-2 py-1 outline-none"
                style={selectStyle}
              >
                <option value={NONE_ID}>None</option>
                {allGeometry.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
          ))}
        </div>
      </section>

      {/* ── CAMERA ── */}
      <section>
        <div className="text-[10px] text-[#7878aa] tracking-widest mb-2">CAMERA</div>
        <div className="flex flex-col gap-1.5">
          {layerLabels.map((label, i) => (
            <div key={i} className="flex items-center gap-3">
              <span className="text-[10px] text-[#4a4a6e] w-14 shrink-0">{label}</span>
              <select
                value={camIds[i]}
                onChange={(e) => handleCamChange(i, e.target.value)}
                className="flex-1 text-[11px] rounded px-2 py-1 outline-none"
                style={{ ...selectStyle, color: camOverridden[i] ? '#aaaaee' : '#aaaacc' }}
              >
                {allCameras.map((c) => (
                  <option key={c.id} value={c.id}>
                    {CAMERA_LABELS[c.id] ?? c.id}
                  </option>
                ))}
              </select>
              {camOverridden[i] && (
                <span className="text-[9px] text-[#5a5aaa] shrink-0">manual</span>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* ── FX ── */}
      <section>
        <div className="flex items-center justify-between mb-2">
          <div className="text-[10px] text-[#7878aa] tracking-widest">FX</div>
          <div className="flex gap-1">
            {LAYER_IDS.map((id, i) => (
              <button
                key={id}
                onClick={() => setActiveFxLayer(id)}
                className="text-[9px] rounded px-1.5 py-0.5 border transition-colors"
                style={{
                  background: activeFxLayer === id ? '#2a2a6e' : '#1a1a2e',
                  borderColor: activeFxLayer === id ? '#5a5aaa' : '#2a2a4e',
                  color: activeFxLayer === id ? '#aaaaee' : '#4a4a6e',
                }}
              >
                L{i + 1}
              </button>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-1.5">
          {FX_ORDER.map((fxId) => (
            <CheckItem
              key={fxId}
              id={fxId}
              label={FX_LABELS[fxId] ?? fxId}
              checked={selectedFx[activeFxLayer]?.[fxId] ?? false}
              onChange={() => toggleFx(fxId)}
            />
          ))}
        </div>
      </section>

      {/* ── ボタン行 ── */}
      <div className="flex items-center justify-between pt-1">
        <span className="text-[9px] text-[#3a3a5e]">
          Load: engine に即反映 / Apply: 手動で反映して閉じる
        </span>
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
// ComingSoonTab
// ----------------------------------------------------------------

function ComingSoonTab() {
  return (
    <div className="flex items-center justify-center h-40">
      <span className="text-[#3a3a5e] text-[12px] tracking-widest">COMING SOON</span>
    </div>
  )
}
