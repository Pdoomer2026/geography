import { useEffect, useRef, useState } from 'react'
import { engine } from '../core/engine'
import { SimpleMixer } from '../plugins/windows/simple-mixer/SimpleMixer'
import { MacroKnobPanel } from './MacroKnobPanel'
import { FxControlPanel } from './FxControlPanel'
import { PreferencesPanel } from './PreferencesPanel'
import { useAutosave } from './useAutosave'

export default function App() {
  const mountRef = useRef<HTMLDivElement>(null)
  const [uiVisible, setUiVisible] = useState({ macro: true, fx: true, mixer: true })
  const [prefsOpen, setPrefsOpen] = useState(false)

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

      {/* ⚙ ボタン（常時表示・H キーでも消えない）
          top: 40 → 赤黄緑ボタン（~28px）の下に配置 */}
      <button
        onClick={() => setPrefsOpen((o) => !o)}
        className="fixed z-[500] font-mono text-xs transition-colors"
        style={{
          top: 40,
          left: 8,
          width: 32,
          height: 32,
          background: prefsOpen ? '#2a2a6e' : '#1a1a2e',
          border: `1px solid ${prefsOpen ? '#5a5aaa' : '#2a2a4e'}`,
          borderRadius: 6,
          color: prefsOpen ? '#aaaaee' : '#4a4a6e',
          cursor: 'pointer',
          // @ts-expect-error Electron 専用 CSS プロパティ（型定義なし）
          WebkitAppRegion: 'no-drag',
        }}
        aria-label="Preferences"
      >
        ⚙
      </button>

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
