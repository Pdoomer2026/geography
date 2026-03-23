import { useEffect, useRef, useState } from 'react'
import { engine } from '../core/engine'
import { SimpleMixer } from '../plugins/windows/simple-mixer/SimpleMixer'
import { MacroKnobPanel } from './MacroKnobPanel'
import { FxControlPanel } from './FxControlPanel'

export default function App() {
  const mountRef = useRef<HTMLDivElement>(null)
  const [uiVisible, setUiVisible] = useState({ macro: true, fx: true, mixer: true })

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
  // F キー → 全UI非表示 + フルスクリーン（本番モード）
  // H キー → 全UI非表示のみ（Hide）
  // S キー → 全UI表示（Show）
  // ESC  → フルスクリーン解除のみ（ブラウザ標準）
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      // input/select にフォーカス中は無視
      const tag = (e.target as HTMLElement).tagName
      if (tag === 'INPUT' || tag === 'SELECT' || tag === 'TEXTAREA') return

      if (e.key === '1') setUiVisible((v) => ({ ...v, macro: !v.macro }))
      if (e.key === '2') setUiVisible((v) => ({ ...v, fx: !v.fx }))
      if (e.key === '3') setUiVisible((v) => ({ ...v, mixer: !v.mixer }))
      if (e.key === 'f' || e.key === 'F') {
        setUiVisible({ macro: false, fx: false, mixer: false })
        document.documentElement.requestFullscreen?.().catch(() => {})
      }
      if (e.key === 'h' || e.key === 'H') {
        setUiVisible({ macro: false, fx: false, mixer: false })
      }
      if (e.key === 's' || e.key === 'S') {
        setUiVisible({ macro: true, fx: true, mixer: true })
      }
    }

    // フルスクリーン解除（ESC・ブラウザ標準）でも UI を戻す
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
      {uiVisible.macro && <MacroKnobPanel />}
      {uiVisible.fx && <FxControlPanel />}
      {uiVisible.mixer && <SimpleMixer />}
      {/* 操作ヒント */}
      <div
        className="fixed bottom-1 right-2 text-[9px] text-[#3a3a5e] select-none pointer-events-none"
        style={{ zIndex: 100 }}
      >
        1:Macro 2:FX 3:Mixer | H:Hide S:Show F:全非表示+全画面
      </div>
    </>
  )
}
