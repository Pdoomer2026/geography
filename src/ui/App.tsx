import { useEffect, useRef, useState } from 'react'
import { engine } from '../core/engine'
import { SimpleMixer } from '../plugins/windows/simple-mixer/SimpleMixer'
import { MacroKnobPanel } from './MacroKnobPanel'
import { FxControlPanel } from './FxControlPanel'

export default function App() {
  const mountRef = useRef<HTMLDivElement>(null)
  const [uiVisible, setUiVisible] = useState(true)

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

  // F キー → 全UI非表示 + フルスクリーン
  // ESC キー → 全UI表示に戻る（フルスクリーン解除は ESC がブラウザ標準で行う）
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      // input/select にフォーカス中は無視
      const tag = (e.target as HTMLElement).tagName
      if (tag === 'INPUT' || tag === 'SELECT' || tag === 'TEXTAREA') return

      if (e.key === 'f' || e.key === 'F') {
        setUiVisible(false)
        document.documentElement.requestFullscreen?.().catch(() => {})
      }
      if (e.key === 'Escape') {
        setUiVisible(true)
      }
    }

    // フルスクリーン解除（ESC・ブラウザ標準）でも UI を戻す
    const handleFullscreenChange = () => {
      if (!document.fullscreenElement) {
        setUiVisible(true)
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
      {/* F キーで全UI非表示・ESC で再表示 */}
      {uiVisible && (
        <>
          <MacroKnobPanel />
          <FxControlPanel />
          <SimpleMixer />
          {/* 操作ヒント */}
          <div
            className="fixed bottom-1 right-2 text-[9px] text-[#3a3a5e] select-none pointer-events-none"
            style={{ zIndex: 100 }}
          >
            F: 全UI非表示（本番モード）
          </div>
        </>
      )}
      {/* 本番モード中のヒント */}
      {!uiVisible && (
        <div
          className="fixed bottom-1 right-2 text-[9px] text-[#2a2a4e] select-none pointer-events-none"
          style={{ zIndex: 100 }}
        >
          ESC: UI表示に戻る
        </div>
      )}
    </>
  )
}
