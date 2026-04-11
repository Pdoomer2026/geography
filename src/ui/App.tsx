import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { engine } from '../core/engine'
import { transportRegistry } from '../core/transportRegistry'
import { midiInputWrapper } from '../drivers/input/MidiInputWrapper'
import { MixerSimpleWindow } from '../plugins/mixers/simple-mixer/MixerSimpleWindow'
import { MacroKnobPanel } from './panels/macro-knob/MacroKnobPanel'
import { CameraSimpleWindow } from './CameraSimpleWindow'
import { GeometrySimpleWindow } from './GeometrySimpleWindow'
import { SimpleWindowPlugin } from '../plugins/windows/simple-window'
import { FxWindowPlugin } from '../plugins/windows/fx-window'
import type { FxGroup } from '../plugins/windows/fx-window'
import { PreferencesPanel } from './panels/preferences/PreferencesPanel'
import { useAutosave } from './useAutosave'
import type { GeoGraphyProject } from '../types'
import type { MIDIRegistry } from '../types/midi-registry'

export default function App() {
  const mountRef = useRef<HTMLDivElement>(null)
  const [uiVisible, setUiVisible] = useState({ macro: true, fx: true, mixer: true, camera: true, geometry: true })
  const [prefsOpen, setPrefsOpen] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const currentFilePathRef = useRef<string | null>(null)

  // MIDI Registry state — transportRegistry の「鏡」（Day58 Step4）
  const [midiRegistry, setMidiRegistry] = useState<MIDIRegistry>(() => ({
    availableParameters: transportRegistry.getAll(),
    bindings: new Map(),
  }))

  /** Plugin Apply 時に transportRegistry を更新するヘルパー */
  const applyPluginToRegistry = useCallback((layerId: string, pluginId: string) => {
    // engine.initTransportRegistry パターンで登録する
    // GeometrySimpleWindow から Plugin 切り替え時に呼ばれる
    engine.registerPluginToTransportRegistry(layerId, pluginId)
  }, [])

  /** Plugin をレイヤーから外した時に transportRegistry をクリアするヘルパー */
  const removePluginFromRegistry = useCallback((layerId: string) => {
    transportRegistry.clear(layerId)
  }, [])

  // transportRegistry の変化を購読して React state を更新（鏡）
  useEffect(() => {
    transportRegistry.onChanged(() => {
      setMidiRegistry({
        availableParameters: [...transportRegistry.getAll()],
        bindings: new Map(),
      })
    })
  }, [])

  // Plugin → Window 逆流：engine.onParamChanged（Day58 Step3）
  // flushParameterStore が syncValue を呼ぶので onChanged が発火 → UI 更新
  useEffect(() => {
    engine.onParamChanged(() => {
      setMidiRegistry({
        availableParameters: [...transportRegistry.getAll()],
        bindings: new Map(),
      })
    })
  }, [])

  // FxGroup を組み立てる（layer-1 固定・v1）
  // enabled は engine から取得・params は MIDIRegistry から取得（疎結合統一）
  const fxGroups: FxGroup[] = useMemo(() =>
    engine.getFxPlugins('layer-1').map((fx) => ({
      pluginId: fx.id,
      pluginName: fx.name,
      enabled: fx.enabled,
      params: midiRegistry.availableParameters.filter(
        (p) => p.pluginId === fx.id && p.layerId === 'layer-1'
      ),
    })),
  [midiRegistry])

  // Geometry params を組み立てる（layer-1 固定・v1）
  const geoPlugin = engine.getGeometryPlugin('layer-1')
  const geoParams = useMemo(() =>
    midiRegistry.availableParameters.filter(
      (p) => p.layerId === 'layer-1' && geoPlugin && p.pluginId === geoPlugin.id
    ),
  [midiRegistry, geoPlugin])

  useAutosave()

  // MIDI 受信：MidiInputWrapper に委譲（Day58 Step 2）
  useEffect(() => {
    midiInputWrapper.init((event) => engine.handleMidiCC(event))
    return () => midiInputWrapper.dispose()
  }, [])

  useEffect(() => {
    if (!mountRef.current) return
    const container = mountRef.current
    engine.initialize(container).then(() => {
      engine.start()
      // Registry 登録は engine.initialize() 内の initTransportRegistry() が担当
      // App.tsx は ccMapService を知らない（Day58 Step4）
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
      {/* FxSimpleWindow → FxWindowPlugin に移行（Day56 Phase B）*/}
      {uiVisible.fx && (
        <FxWindowPlugin
          layerId="layer-1"
          fxGroups={fxGroups}
          onToggle={(fxId, enabled) => engine.setFxEnabled(fxId, enabled, 'layer-1')}
        />
      )}
      {uiVisible.mixer && <MixerSimpleWindow />}
      {uiVisible.camera && <CameraSimpleWindow />}
      {uiVisible.geometry && (
        <GeometrySimpleWindow
          onPluginApply={applyPluginToRegistry}
          onPluginRemove={removePluginFromRegistry}
        />
      )}
      {/* SimpleWindowPlugin: layer-1 の Geometry 表示（Day56 Phase B）*/}
      {uiVisible.geometry && geoPlugin && (
        <SimpleWindowPlugin
          layerId="layer-1"
          pluginId={geoPlugin.id}
          pluginName={geoPlugin.name}
          params={geoParams}
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
