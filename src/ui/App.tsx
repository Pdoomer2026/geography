import { useCallback, useEffect, useRef, useState } from 'react'
import { engine } from '../core/engine'
import type { MidiCCEvent } from '../types'
import { MixerSimpleWindow } from '../plugins/mixers/simple-mixer/MixerSimpleWindow'
import { MacroKnobPanel } from './panels/macro-knob/MacroKnobPanel'
import { FxSimpleWindow } from './FxSimpleWindow'
import { CameraSimpleWindow } from './CameraSimpleWindow'
import { GeometrySimpleWindow } from './GeometrySimpleWindow'
import { PreferencesPanel } from './panels/preferences/PreferencesPanel'
import { useAutosave } from './useAutosave'
import type { GeoGraphyProject } from '../types'
import { createInitialRegistry } from '../types/midi-registry'
import { registerParams, clearParams } from '../core/midiRegistry'
import type { MIDIRegistry } from '../types/midi-registry'

export default function App() {
  const mountRef = useRef<HTMLDivElement>(null)
  const [uiVisible, setUiVisible] = useState({ macro: true, fx: true, mixer: true, camera: true, geometry: true })
  const [prefsOpen, setPrefsOpen] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const currentFilePathRef = useRef<string | null>(null)

  // MIDI Registry state（Day53 新設）
  const [midiRegistry, setMidiRegistry] = useState<MIDIRegistry>(createInitialRegistry)

  /** Plugin Apply 時に Registry を更新するヘルパー（Day55 接続）*/
  const applyPluginToRegistry = useCallback((layerId: string, pluginId: string) => {
    const plugin = engine.getGeometryPlugin(layerId)
    if (!plugin) return
    const enriched = plugin.getParameters().map((p) => ({ ...p, layerId, pluginId }))
    setMidiRegistry((prev) => registerParams(prev, enriched, layerId))
  }, [])

  /** Plugin をレイヤーから外した時に Registry をクリアするヘルパー（Day55 接続）*/
  const removePluginFromRegistry = useCallback((layerId: string) => {
    setMidiRegistry((prev) => clearParams(prev, layerId))
  }, [])

  // midiRegistry は将来 WindowPlugin に渡す（Phase B）
  void midiRegistry

  useAutosave()

  useEffect(() => {
    if (!navigator.requestMIDIAccess) return
    let midiAccess: MIDIAccess | null = null
    const onMidiMessage = (event: MIDIMessageEvent) => {
      const data = event.data
      if (!data || data.length < 3) return
      const statusType = data[0] & 0xf0
      if (statusType !== 0xb0) return
      const cc = data[1]
      const rawValue = data[2]
      const midiEvent: MidiCCEvent = { cc, value: rawValue / 127, protocol: 'midi1', resolution: 128 }
      engine.handleMidiCC(midiEvent)
    }
    const setupMidi = (access: MIDIAccess) => {
      midiAccess = access
      access.inputs.forEach((input) => { input.onmidimessage = onMidiMessage })
      access.onstatechange = () => {
        access.inputs.forEach((input) => { input.onmidimessage = onMidiMessage })
      }
    }
    navigator.requestMIDIAccess({ sysex: false }).then(setupMidi).catch((err) => {
      console.warn('[GeoGraphy] Web MIDI API アクセス失敗:', err)
    })
    return () => {
      if (midiAccess) {
        midiAccess.inputs.forEach((input) => { input.onmidimessage = null })
      }
    }
  }, [])

  useEffect(() => {
    if (!mountRef.current) return
    const container = mountRef.current
    engine.initialize(container).then(() => {
      engine.start()
      // 起動時に全レイヤーを一括登録（Day53 新設）
      engine.getAllLayerPlugins().forEach(({ layerId, plugin }) => {
        const enriched = plugin.getParameters().map((p) => ({
          ...p, layerId, pluginId: plugin.id,
        }))
        setMidiRegistry((prev) => registerParams(prev, enriched, layerId))
      })
    })
    return () => { engine.dispose() }
  }, [])

  useEffect(() => {
    if (!window.geoAPI) return
    window.geoAPI.onMenuEvents({
      onNew: () => {
        engine.restoreProject({
          version: '1.0.0', name: 'untitled', savedAt: '',
          setup: { geometry: [], fx: [] }, sceneState: { layers: [] },
          macroKnobAssigns: [], presetRefs: {},
        })
        currentFilePathRef.current = null
      },
      onOpen: (filePath: string, data: string) => {
        try {
          const project = JSON.parse(data) as GeoGraphyProject
          engine.restoreProject(project)
          currentFilePathRef.current = filePath
        } catch (e) {
          console.warn('[GeoGraphy] プロジェクトの読み込みに失敗:', e)
        }
      },
      onSave: async () => {
        if (!window.geoAPI) return
        const filePath = currentFilePathRef.current
        if (!filePath) { window.geoAPI.onMenuEvents({ onSaveAs: handleSaveAs }); return }
        const project = engine.buildProject(filePath.split('/').pop()?.replace(/\.geography$/, '') ?? 'untitled')
        await window.geoAPI.saveProjectFile(filePath, JSON.stringify(project, null, 2))
      },
      onSaveAs: handleSaveAs,
      onPreferences: () => setPrefsOpen((o) => !o),
      onToggleMixerWindow: () => setUiVisible((v) => ({ ...v, mixer: !v.mixer })),
      onToggleFxWindow: () => setUiVisible((v) => ({ ...v, fx: !v.fx })),
      onToggleMacroKnobWindow: () => setUiVisible((v) => ({ ...v, macro: !v.macro })),
      onHideAllWindows: () => setUiVisible({ macro: false, fx: false, mixer: false, camera: false, geometry: false }),
      onShowAllWindows: () => setUiVisible({ macro: true, fx: true, mixer: true, camera: true, geometry: true }),
      onStartRecording: () => { engine.startRecording(); setIsRecording(true) },
      onStopRecording: async () => {
        const blob = await engine.stopRecording()
        setIsRecording(false)
        if (!blob || !window.geoAPI) return
        const arrayBuffer = await blob.arrayBuffer()
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)
        await window.geoAPI.saveRecording(arrayBuffer, `recording-${timestamp}.webm`)
      },
    })
    return () => { window.geoAPI?.removeMenuListeners() }
  }, [])

  async function handleSaveAs(filePath: string) {
    if (!window.geoAPI) return
    const name = filePath.split('/').pop()?.replace(/\.geography$/, '') ?? 'untitled'
    const project = engine.buildProject(name)
    await window.geoAPI.saveProjectFile(filePath, JSON.stringify(project, null, 2))
    currentFilePathRef.current = filePath
  }

  // キーボードショートカット
  // 1:MacroKnob 2:FX 3:Mixer 4:Camera 5:Geometry P:Prefs H:Hide S:Show F:全画面
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName
      if (tag === 'INPUT' || tag === 'SELECT' || tag === 'TEXTAREA') return

      if (e.key === '1') setUiVisible((v) => ({ ...v, macro: !v.macro }))
      if (e.key === '2') setUiVisible((v) => ({ ...v, fx: !v.fx }))
      if (e.key === '3') setUiVisible((v) => ({ ...v, mixer: !v.mixer }))
      if (e.key === '4') setUiVisible((v) => ({ ...v, camera: !v.camera }))
      if (e.key === '5') setUiVisible((v) => ({ ...v, geometry: !v.geometry }))
      if (e.key === 'p' || e.key === 'P') setPrefsOpen((o) => !o)
      if (e.key === 'f' || e.key === 'F') {
        setUiVisible({ macro: false, fx: false, mixer: false, camera: false, geometry: false })
        setPrefsOpen(false)
        document.documentElement.requestFullscreen?.().catch(() => {})
      }
      if (e.key === 'h' || e.key === 'H') {
        setUiVisible({ macro: false, fx: false, mixer: false, camera: false, geometry: false })
      }
      if (e.key === 's' || e.key === 'S') {
        setUiVisible({ macro: true, fx: true, mixer: true, camera: true, geometry: true })
      }
    }
    const handleFullscreenChange = () => {
      if (!document.fullscreenElement) {
        setUiVisible({ macro: true, fx: true, mixer: true, camera: true, geometry: true })
      }
    }
    window.addEventListener('keydown', handleKey)
    document.addEventListener('fullscreenchange', handleFullscreenChange)
    return () => {
      window.removeEventListener('keydown', handleKey)
      document.removeEventListener('fullscreenchange', handleFullscreenChange)
    }
  }, [])

  return (
    <>
      <div
        ref={mountRef}
        style={{ width: '100vw', height: '100vh', background: '#000', position: 'relative' }}
      />

      <div
        style={{
          position: 'fixed', top: 0, left: 0, right: 0, height: 28,
          // @ts-expect-error Electron 専用 CSS プロパティ
          WebkitAppRegion: 'drag', zIndex: 400,
        }}
      />

      <PreferencesPanel open={prefsOpen} onClose={() => setPrefsOpen(false)} />

      {uiVisible.macro && <MacroKnobPanel />}
      {uiVisible.fx && <FxSimpleWindow />}
      {uiVisible.mixer && <MixerSimpleWindow />}
      {uiVisible.camera && <CameraSimpleWindow />}
      {uiVisible.geometry && (
        <GeometrySimpleWindow
          onPluginApply={applyPluginToRegistry}
          onPluginRemove={removePluginFromRegistry}
        />
      )}

      {isRecording && (
        <div
          className="fixed top-2 left-1/2 -translate-x-1/2 flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-mono select-none pointer-events-none"
          style={{ zIndex: 500, background: 'rgba(180,0,0,0.85)', color: '#fff' }}
        >
          <span style={{ animation: 'pulse 1s infinite' }}>●</span> REC
        </div>
      )}

      <div
        className="fixed bottom-1 right-2 text-[9px] text-[#3a3a5e] select-none pointer-events-none"
        style={{ zIndex: 100 }}
      >
        P:Prefs 1:MacroKnob 2:FX 3:Mixer 4:Camera 5:Geometry | H:Hide S:Show F:全非表示+全画面
      </div>
    </>
  )
}
