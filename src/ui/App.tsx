import { useCallback, useEffect, useRef, useState } from 'react'
import { throttleTime } from 'rxjs/operators'
import { engine } from '../application/orchestrator/engine'
import { midiInputWrapper } from '../application/adapter/input/MidiInputWrapper'
import { projectManager } from '../application/adapter/storage/projectManager'
import { paramCommand$ } from '../application/command/commandStream'
import { useGeoStore } from './store/geoStore'
import { MixerSimpleWindow } from './components/mixers/simple-mixer/MixerSimpleWindow'
import { Macro8Window } from './components/window/macro-8-window'
import { Macro8MidiWindow } from './components/window/macro-8-window/Macro8MidiWindow'
import { GeometrySimpleWindow, CameraSimpleWindow, FxSimpleWindow } from './components/window/simple-window'
import { GeometryStandardWindow, CameraStandardWindow, FxStandardWindow } from './components/window/standard-window'
import { GeometrySimpleDnDWindow, CameraSimpleDnDWindow, FxSimpleDnDWindow } from './components/window/simple-dnd-window'
import { GeometryStandardDnDWindow, CameraStandardDnDWindow, FxStandardDnDWindow } from './components/window/standard-dnd-window'
import { GeoMonitorWindow } from './components/window/geo-monitor'
import { MidiMonitorWindow } from './components/window/midi-monitor'
import { PreferencesPanel } from './panels/preferences/PreferencesPanel'
import { useAutosave } from './useAutosave'
import { DEFAULT_WINDOW_MODE } from '../application/schema/windowMode'
import type { WindowMode } from '../application/schema/windowMode'
import type { MidiMonitorEvent } from '../application/schema'

const HIDE_ALL: WindowMode = {
  geometry:    'none',
  camera:      'none',
  fx:          'none',
  macro:       'none',
  mixer:       'none',
  monitor:     false,
  midiMonitor: false,
}

export default function App() {
  const mountRef = useRef<HTMLDivElement>(null)
  const [windowMode, setWindowMode] = useState<WindowMode>(DEFAULT_WINDOW_MODE)
  const [prefsOpen, setPrefsOpen] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const midiMonitorCallbackRef = useRef<((event: MidiMonitorEvent) => void) | null>(null)

  const applyPluginToRegistry = useCallback((layerId: string, pluginId: string) => {
    engine.registerPluginToTransportRegistry(layerId, pluginId)
  }, [])

  const removePluginFromRegistry = useCallback((layerId: string) => {
    engine.removePluginFromRegistry(layerId)
  }, [])

  useAutosave()

  useEffect(() => {
    midiInputWrapper.init(
      (event) => engine.handleMidiCC(event),
      (event) => midiMonitorCallbackRef.current?.(event),
    )
    return () => midiInputWrapper.dispose()
  }, [])

  useEffect(() => {
    if (!mountRef.current) return
    const container = mountRef.current
    engine.initialize(container).then(() => {
      engine.start()
      engine.setFxEnabled('after-image', engine.getFxPlugins('layer-1').find(f => f.id === 'after-image')?.enabled ?? false, 'layer-1')

      // engine → Zustand store を接続（unsubscribe を cleanup で返す）
      const syncMacroKnobs = () => useGeoStore.getState().syncMacroKnobs()
      const unsubParam = engine.onParamChanged(syncMacroKnobs)
      syncMacroKnobs()

      // commandStream → engine（throttle 16ms = 60fps 相当）
      const sub = paramCommand$.pipe(
        throttleTime(16, undefined, { leading: true, trailing: true })
      ).subscribe((event) => engine.handleMidiCC(event))

      return () => { sub.unsubscribe(); unsubParam() }
    })
    return () => { engine.dispose() }
  }, [])

  useEffect(() => {
    if (!window.geoAPI) return
    window.geoAPI.onMenuEvents({
      onNew:        () => projectManager.newProject(),
      // Day78: 薄い鏡化→ renderer 側が dialog + fs 操作を実行する
      onOpen: async () => {
        if (!window.geoAPI) return
        const result = await window.geoAPI.showOpenDialog()
        if (result.canceled || result.filePaths.length === 0) return
        const filePath = result.filePaths[0]
        const data = await window.geoAPI.loadFile(filePath)
        projectManager.openProject(filePath, data)
        await window.geoAPI.addRecent(filePath)
      },
      onSave:       () => projectManager.save(),
      // Day78: 薄い鏡化→ renderer 側が showSaveDialog を実行する
      onSaveAs: async () => {
        if (!window.geoAPI) return
        const result = await window.geoAPI.showSaveDialog()
        if (result.canceled || !result.filePath) return
        await projectManager.saveAs(result.filePath)
      },
      // Day78: 新規→ renderer 側が loadFile + addRecent を実行する
      onOpenRecent: async (filePath: string) => {
        if (!window.geoAPI) return
        try {
          const data = await window.geoAPI.loadFile(filePath)
          projectManager.openProject(filePath, data)
          await window.geoAPI.addRecent(filePath)
        } catch {
          console.warn('[GeoGraphy] ファイルが見つかりません:', filePath)
        }
      },
      onPreferences: () => setPrefsOpen((o) => !o),
      onToggleMixerWindow: () => setWindowMode((v) => ({ ...v, mixer: v.mixer === 'none' ? 'mixer-simple' : 'none' })),
      onToggleFxWindow: () => setWindowMode((v) => ({ ...v, fx: v.fx === 'none' ? 'standard' : 'none' })),
      onToggleMacroKnobWindow: () => setWindowMode((v) => ({ ...v, macro: v.macro === 'none' ? 'macro-8-window' : 'none' })),
      onHideAllWindows: () => setWindowMode(HIDE_ALL),
      onShowAllWindows: () => setWindowMode(DEFAULT_WINDOW_MODE),
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

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName
      if (tag === 'INPUT' || tag === 'SELECT' || tag === 'TEXTAREA') return

      if (e.key === '1') setWindowMode((v) => ({ ...v, macro: v.macro === 'none' ? 'macro-8-window' : 'none' }))
      if (e.key === '3') setWindowMode((v) => ({ ...v, mixer: v.mixer === 'none' ? 'mixer-simple' : 'none' }))
      if (e.key === '6') setWindowMode((v) => ({ ...v, monitor: !v.monitor }))
      if (e.key === 'm' || e.key === 'M') setWindowMode((v) => ({ ...v, midiMonitor: !v.midiMonitor }))
      if (e.key === 'p' || e.key === 'P') setPrefsOpen((o) => !o)
      if (e.key === 'f' || e.key === 'F') {
        setWindowMode(HIDE_ALL)
        setPrefsOpen(false)
        document.documentElement.requestFullscreen?.().catch(() => {})
      }
      if (e.key === 'h' || e.key === 'H') setWindowMode(HIDE_ALL)
      if (e.key === 's' || e.key === 'S') setWindowMode(DEFAULT_WINDOW_MODE)
    }
    const handleFullscreenChange = () => {
      if (!document.fullscreenElement) setWindowMode(DEFAULT_WINDOW_MODE)
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

      <PreferencesPanel
        open={prefsOpen}
        onClose={() => setPrefsOpen(false)}
        windowMode={windowMode}
        onWindowModeChange={setWindowMode}
      />

      {/* Macro */}
      {windowMode.macro === 'macro-8-window' && <Macro8Window />}
      {windowMode.macro === 'macro-8-window' && <Macro8MidiWindow />}

      {/* Mixer */}
      {windowMode.mixer === 'mixer-simple' && <MixerSimpleWindow />}

      {/* Geometry */}
      {windowMode.geometry === 'simple' && (
        <GeometrySimpleWindow onPluginApply={applyPluginToRegistry} onPluginRemove={removePluginFromRegistry} />
      )}
      {windowMode.geometry === 'standard' && (
        <GeometryStandardWindow onPluginApply={applyPluginToRegistry} onPluginRemove={removePluginFromRegistry} />
      )}
      {windowMode.geometry === 'simple-dnd' && (
        <GeometrySimpleDnDWindow onPluginApply={applyPluginToRegistry} onPluginRemove={removePluginFromRegistry} />
      )}
      {windowMode.geometry === 'standard-dnd' && (
        <GeometryStandardDnDWindow onPluginApply={applyPluginToRegistry} onPluginRemove={removePluginFromRegistry} />
      )}

      {/* Camera */}
      {windowMode.camera === 'simple'      && <CameraSimpleWindow />}
      {windowMode.camera === 'standard'    && <CameraStandardWindow />}
      {windowMode.camera === 'simple-dnd'  && <CameraSimpleDnDWindow />}
      {windowMode.camera === 'standard-dnd' && <CameraStandardDnDWindow />}

      {/* FX */}
      {windowMode.fx === 'simple'      && <FxSimpleWindow />}
      {windowMode.fx === 'standard'    && <FxStandardWindow />}
      {windowMode.fx === 'simple-dnd'  && <FxSimpleDnDWindow />}
      {windowMode.fx === 'standard-dnd' && <FxStandardDnDWindow />}

      {/* Monitor */}
      {windowMode.monitor && <GeoMonitorWindow />}
      {windowMode.midiMonitor && (
        <MidiMonitorWindow
          onMount={(cb) => { midiMonitorCallbackRef.current = cb }}
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
        P:Prefs 1:Macro 3:Mixer M:MIDI Monitor 6:GeoMonitor | H:Hide S:Show F:全非表示+全画面
      </div>
    </>
  )
}
