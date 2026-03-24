import { useEffect, useRef, useState } from 'react'
import { engine } from '../core/engine'
import { SimpleMixer } from '../plugins/windows/simple-mixer/SimpleMixer'
import { MacroKnobPanel } from './MacroKnobPanel'
import { FxControlPanel } from './FxControlPanel'
import { PreferencesPanel } from './PreferencesPanel'
import { useAutosave } from './useAutosave'
import type { GeoGraphyProject } from '../types'

export default function App() {
  const mountRef = useRef<HTMLDivElement>(null)
  const [uiVisible, setUiVisible] = useState({ macro: true, fx: true, mixer: true })
  const [prefsOpen, setPrefsOpen] = useState(false)
  // 現在開いているファイルパス（Save 時に使用）
  const currentFilePathRef = useRef<string | null>(null)

  // Electron 自動保存（起動時復元 + 終了時保存）
  useAutosave()

  useEffect(() => {
    if (!mountRef.current) return
    const container = mountRef.current
    engine.initialize(container).then(() => {
      engine.start()
    })
    return () => {
      engine.dispose()
    }
  }, [])

  // ── メニューバーイベント受信 ────────────────────────────────────
  useEffect(() => {
    if (!window.geoAPI) return

    window.geoAPI.onMenuEvents({
      // File > New
      onNew: () => {
        engine.restoreProject({
          version: '1.0.0',
          name: 'untitled',
          savedAt: '',
          setup: { geometry: [], fx: [] },
          sceneState: { layers: [] },
          presetRefs: {},
        })
        currentFilePathRef.current = null
      },

      // File > Open / Open Recent
      onOpen: (filePath: string, data: string) => {
        try {
          const project = JSON.parse(data) as GeoGraphyProject
          engine.restoreProject(project)
          currentFilePathRef.current = filePath
        } catch (e) {
          console.warn('[GeoGraphy] プロジェクトの読み込みに失敗:', e)
        }
      },

      // File > Save
      onSave: async () => {
        if (!window.geoAPI) return
        const filePath = currentFilePathRef.current
        if (!filePath) {
          // 未保存の場合は Save As... にフォールバック
          window.geoAPI.onMenuEvents({ onSaveAs: handleSaveAs })
          return
        }
        const project = engine.buildProject(
          filePath.split('/').pop()?.replace(/\.geography$/, '') ?? 'untitled'
        )
        await window.geoAPI.saveProjectFile(filePath, JSON.stringify(project, null, 2))
      },

      // File > Save As...
      onSaveAs: handleSaveAs,

      // GeoGraphy > Preferences...
      onPreferences: () => setPrefsOpen((o) => !o),
    })

    return () => {
      window.geoAPI?.removeMenuListeners()
    }
  }, [])

  async function handleSaveAs(filePath: string) {
    if (!window.geoAPI) return
    const name = filePath.split('/').pop()?.replace(/\.geography$/, '') ?? 'untitled'
    const project = engine.buildProject(name)
    await window.geoAPI.saveProjectFile(filePath, JSON.stringify(project, null, 2))
    currentFilePathRef.current = filePath
  }

  // 1 キー → Macro トグル
  // 2 キー → FX トグル
  // 3 キー → Mixer トグル
  // P キー → Preferences パネル開閉
  // F キー → 全UI非表示 + フルスクリーン（本番モード）
  // H キー → 全UI非表示のみ（Hide）※ ⚙ ボタンは維持
  // S キー → 全UI表示（Show）
  // ESC  → フルスクリーン解除のみ（ブラウザ標準）
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName
      if (tag === 'INPUT' || tag === 'SELECT' || tag === 'TEXTAREA') return

      if (e.key === '1') setUiVisible((v) => ({ ...v, macro: !v.macro }))
      if (e.key === '2') setUiVisible((v) => ({ ...v, fx: !v.fx }))
      if (e.key === '3') setUiVisible((v) => ({ ...v, mixer: !v.mixer }))
      if (e.key === 'p' || e.key === 'P') setPrefsOpen((o) => !o)
      if (e.key === 'f' || e.key === 'F') {
        setUiVisible({ macro: false, fx: false, mixer: false })
        setPrefsOpen(false)
        document.documentElement.requestFullscreen?.().catch(() => {})
      }
      if (e.key === 'h' || e.key === 'H') {
        setUiVisible({ macro: false, fx: false, mixer: false })
      }
      if (e.key === 's' || e.key === 'S') {
        setUiVisible({ macro: true, fx: true, mixer: true })
      }
    }

    const handleFullscreenChange = () => {
      if (!document.fullscreenElement) {
        setUiVisible({ macro: true, fx: true, mixer: true })
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

      {/* ウィンドウドラッグ領域（titleBarStyle: hiddenInset 対応）
          上部 28px をドラッグ可能に。ボタン類は z-index を高くして no-drag で上書き。 */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          height: 28,
          // @ts-expect-error Electron 専用 CSS プロパティ（型定義なし）
          WebkitAppRegion: 'drag',
          zIndex: 400,
        }}
      />

      {/* Preferences パネル */}
      <PreferencesPanel open={prefsOpen} onClose={() => setPrefsOpen(false)} />

      {uiVisible.macro && <MacroKnobPanel />}
      {uiVisible.fx && <FxControlPanel />}
      {uiVisible.mixer && <SimpleMixer />}

      {/* 操作ヒント */}
      <div
        className="fixed bottom-1 right-2 text-[9px] text-[#3a3a5e] select-none pointer-events-none"
        style={{ zIndex: 100 }}
      >
        P:Prefs 1:Macro 2:FX 3:Mixer | H:Hide S:Show F:全非表示+全画面
      </div>
    </>
  )
}
