import { useEffect, useRef } from 'react'
import { engine } from '../core/engine'
import { SimpleMixer } from '../plugins/windows/simple-mixer/SimpleMixer'
import { MacroKnobPanel } from './MacroKnobPanel'
import { FxControlPanel } from './FxControlPanel'

export default function App() {
  const mountRef = useRef<HTMLDivElement>(null)

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

  return (
    <>
      <div
        ref={mountRef}
        style={{ width: '100vw', height: '100vh', background: '#000', position: 'relative' }}
      />
      {/* マクロノブパネル（固定・閉じ不可） */}
      <MacroKnobPanel />
      {/* FX コントロールパネル（折りたたみ可） */}
      <FxControlPanel />
      {/* ミキサー（固定・閉じ不可） */}
      <SimpleMixer />
    </>
  )
}
