import { useCallback, useEffect, useRef, useState } from 'react'
import { engine } from '../core/engine'
import { transportRegistry } from '../core/transportRegistry'
import { midiInputWrapper } from '../drivers/input/MidiInputWrapper'
import { MixerSimpleWindow } from '../plugins/mixers/simple-mixer/MixerSimpleWindow'
import { MacroKnobPanel } from './panels/macro-knob/MacroKnobPanel'
import { SimpleWindowPlugin } from '../plugins/windows/simple-window'
import { FxWindowPlugin } from '../plugins/windows/fx-window'
import { CameraWindowPlugin } from '../plugins/windows/camera-window'
import { PreferencesPanel } from './panels/preferences/PreferencesPanel'
import { useAutosave } from './useAutosave'
import type { GeoGraphyProject } from '../types'

export default function App() {
  const mountRef = useRef<HTMLDivElement>(null)
  const [uiVisible, setUiVisible] = useState({ macro: true, fx: true, mixer: true, camera: true, geometry: true })
  const [prefsOpen, setPrefsOpen] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const currentFilePathRef = useRef<string | null>(null)

  // FxWindowPlugin は自律動作するため App.tsx での fxGroups 組み立ては不要（Day59）
  // transportRegistry.onChanged() と engine.onFxChanged() を FxWindowPlugin が直接購読する

  /** Plugin Apply 時に transportRegistry を更新するヘルパー（SimpleWindowPlugin に渡す） */
  const applyPluginToRegistry = useCallback((layerId: string, pluginId: string) => {
    engine.registerPluginToTransportRegistry(layerId, pluginId)
  }, [])

  /** Plugin Remove 時に transportRegistry をクリアするヘルパー（SimpleWindowPlugin に渡す） */
  const removePluginFromRegistry = useCallback((layerId: string) => {
    transportRegistry.clear(`${layerId}:geometry`)
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

      {uiVisible.fx && <FxWindowPlugin />}

      {uiVisible.mixer && <MixerSimpleWindow />}

      {uiVisible.geometry && (
        <SimpleWindowPlugin
          onPluginApply={applyPluginToRegistry}
          onPluginRemove={removePluginFromRegistry}
        />
      )}

      {uiVisible.camera && <CameraWindowPlugin />}

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
