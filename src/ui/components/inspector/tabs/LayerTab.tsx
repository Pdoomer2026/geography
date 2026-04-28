/**
 * LayerTab — Inspector の Layer タブ
 * 上部: MACRO (Global) — L1/L2/L3 共通
 * タブ: L1/L2/L3（右クリックで LayerMacroPreset Save/Load）
 * 下部: MACRO (Layer) / GEOMETRY / CAMERA / FX — activeLayer に追従
 * spec: docs/spec/layer-macro-preset.spec.md
 * spec: docs/spec/layer-window.spec.md §4
 */

import { useState } from 'react'
import { LayerAccordion } from '../layer/LayerAccordion'
import { MacroPanel }    from '../layer/panels/MacroPanel'
import { GeometryPanel } from '../layer/panels/GeometryPanel'
import { CameraPanel }   from '../layer/panels/CameraPanel'
import { FxPanel }       from '../layer/panels/FxPanel'

const LAYER_TABS = [
  { id: 'layer-1', label: 'L1', color: '#5a5aff' },
  { id: 'layer-2', label: 'L2', color: '#5affaa' },
  { id: 'layer-3', label: 'L3', color: '#ffaa5a' },
] as const

type AccordionKey = 'macroGlobal' | 'macroLayer' | 'geometry' | 'camera' | 'fx'

export function LayerTab() {
  const [activeLayer, setActiveLayer] = useState<string>('layer-1')
  const [open, setOpen] = useState<Record<AccordionKey, boolean>>({
    macroGlobal: true, macroLayer: false, geometry: false, camera: false, fx: false,
  })

  function toggle(key: AccordionKey) {
    setOpen((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  return (
    <div className="flex flex-col">

      {/* 上部: MACRO (Global) — L1/L2/L3 共通 */}
      <LayerAccordion title="MACRO (Global)" open={open.macroGlobal} onToggle={() => toggle('macroGlobal')}>
        <MacroPanel />
      </LayerAccordion>

      {/* L1/L2/L3 タブ（右クリックで LayerMacroPreset Save/Load — Phase 8 で実装） */}
      <div className="flex gap-1 my-3">
        {LAYER_TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveLayer(tab.id)}
            className="flex-1 py-1 rounded font-mono tracking-widest transition-colors"
            style={{
              fontSize: 10,
              background: activeLayer === tab.id ? '#1a1a3e' : 'transparent',
              border: `1px solid ${activeLayer === tab.id ? tab.color : '#2a2a4e'}`,
              color: activeLayer === tab.id ? tab.color : '#4a4a6e',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* 下部: activeLayer に追従するパネル群 */}
      <LayerAccordion title="MACRO (Layer)" open={open.macroLayer} onToggle={() => toggle('macroLayer')}>
        <MacroPanel layerId={activeLayer} />
      </LayerAccordion>

      <LayerAccordion title="GEOMETRY" open={open.geometry} onToggle={() => toggle('geometry')}>
        <GeometryPanel layerId={activeLayer} />
      </LayerAccordion>

      <LayerAccordion title="CAMERA" open={open.camera} onToggle={() => toggle('camera')}>
        <CameraPanel layerId={activeLayer} />
      </LayerAccordion>

      <LayerAccordion title="FX" open={open.fx} onToggle={() => toggle('fx')}>
        <FxPanel layerId={activeLayer} />
      </LayerAccordion>
    </div>
  )
}
