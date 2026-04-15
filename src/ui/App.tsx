import { useCallback, useEffect, useRef, useState } from 'react'
import { engine } from '../core/engine'
import { midiInputWrapper } from '../drivers/input/MidiInputWrapper'
import { projectManager } from '../core/projectManager'
import { MixerSimpleWindow } from '../plugins/mixers/simple-mixer/MixerSimpleWindow'
import { MacroWindow } from '../plugins/windows/macro-window'
import { GeometrySimpleWindow, CameraSimpleWindow, FxSimpleWindow } from '../plugins/windows/simple-window'
import { GeoMonitorWindow } from '../plugins/windows/geo-monitor'
import { PreferencesPanel } from './panels/preferences/PreferencesPanel'
import { useAutosave } from './useAutosave'

export default function App() {
  const mountRef = useRef<HTMLDivElement>(null)
  const [uiVisible, setUiVisible] = useState({ macro: true, fx: true, mixer: true, camera: true, geometry: true, monitor: false })
  const [prefsOpen, setPrefsOpen] = useState(false)
  const [isRecording, setIsRecording] = useState(false)

  /** Plugin Apply 時に transportRegistry を更新するヘルパー（GeometrySimpleWindow に渡す） */
  const applyPluginToRegistry = useCallback((layerId: string, pluginId: string) => {
    engine.registerPluginToTransportRegistry(layerId, pluginId)
  }, [])

  /** Plugin Remove 時に transportRegistry をクリアするヘルパー（GeometrySimpleWindow に渡す） */
  const removePluginFromRegistry = useCallback((layerId: string) => {
    engine.removePluginFromRegistry(layerId)
  }, [])

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
      // 初期化完了後に FxWindowPlugin に通知して fxGroups を描画させる
      engine.setFxEnabled('after-image', engine.getFxPlugins('layer-1').find(f => f.id === 'after-image')?.enabled ?? false, 'layer-1')
    })
    return () => { engine.dispose() }
  }, [])

  useEffect(() => {
    if (!window.geoAPI) return
    window.geoAPI.onMenuEvents({
      onNew:        () => projectManager.newProject(),
      onOpen:       (filePath: string, data: string) => projectManager.openProject(filePath, data),
      onSave:       () => projectManager.save(),
      onSaveAs:     (filePath: string) => projectManager.saveAs(filePath),
      onPreferences: () => setPrefsOpen((o) => !o),
      onToggleMixerWindow: () => setUiVisible((v) => ({ ...v, mixer: !v.mixer })),
      onToggleFxWindow: () => setUiVisible((v) => ({ ...v, fx: !v.fx })),
      onToggleMacroKnobWindow: () => setUiVisible((v) => ({ ...v, macro: !v.macro })),
      onHideAllWindows: () => setUiVisible({ macro: false, fx: false, mixer: false, camera: false, geometry: false, monitor: false }),
      onShowAllWindows: () => setUiVisible({ macro: true, fx: true, mixer: true, camera: true, geometry: true, monitor: false }),
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

  // キーボードショートカット
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName
      if (tag === 'INPUT' || tag === 'SELECT' || tag === 'TEXTAREA') return

      if (e.key === '1') setUiVisible((v) => ({ ...v, macro: !v.macro }))
      if (e.key === '2') setUiVisible((v) => ({ ...v, fx: !v.fx }))
      if (e.key === '3') setUiVisible((v) => ({ ...v, mixer: !v.mixer }))
      if (e.key === '4') setUiVisible((v) => ({ ...v, camera: !v.camera }))
      if (e.key === '5') setUiVisible((v) => ({ ...v, geometry: !v.geometry }))
      if (e.key === '6') setUiVisible((v) => ({ ...v, monitor: !v.monitor }))
      if (e.key === 'p' || e.key === 'P') setPrefsOpen((o) => !o)
      if (e.key === 'f' || e.key === 'F') {
        setUiVisible({ macro: false, fx: false, mixer: false, camera: false, geometry: false, monitor: false })
        setPrefsOpen(false)
        document.documentElement.requestFullscreen?.().catch(() => {})
      }
      if (e.key === 'h' || e.key === 'H') {
        setUiVisible({ macro: false, fx: false, mixer: false, camera: false, geometry: false, monitor: false })
      }
      if (e.key === 's' || e.key === 'S') {
        setUiVisible({ macro: true, fx: true, mixer: true, camera: true, geometry: true, monitor: false })
      }
    }
    const handleFullscreenChange = () => {
      if (!document.fullscreenElement) {
        setUiVisible({ macro: true, fx: true, mixer: true, camera: true, geometry: true, monitor: false })
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

      {uiVisible.macro && <MacroWindow />}

      {uiVisible.fx && <FxSimpleWindow />}

      {uiVisible.mixer && <MixerSimpleWindow />}

      {uiVisible.geometry && (
        <GeometrySimpleWindow
          onPluginApply={applyPluginToRegistry}
          onPluginRemove={removePluginFromRegistry}
        />
      )}

      {uiVisible.camera && <CameraSimpleWindow />}

      {uiVisible.monitor && <GeoMonitorWindow />}

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
        P:Prefs 1:MacroKnob 2:FX 3:Mixer 4:Camera 5:Geometry 6:Monitor | H:Hide S:Show F:全非表示+全画面
      </div>
    </>
  )
}
