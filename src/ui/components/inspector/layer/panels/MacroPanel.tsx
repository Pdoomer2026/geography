/**
 * MacroPanel — Inspector Layer タブ用 Macro パネル
 * Macro8MidiWindow の KnobCell グリッドを縮小版で Panel 化
 * KNOB_SIZE=50 / COLS=4 / 4×2=8ノブ
 */

import { useCallback, useEffect, useState } from 'react'
import { engine } from '../../../../../application/orchestrator/engine'
import type { DragPayload, MacroAssign, MacroKnobConfig, MidiLearnTarget } from '../../../../../application/schema'
import { toGeoParamAddress } from '../../../../../application/schema'

const KNOB_COUNT = 8
const KNOB_SIZE  = 50  // 縮小（元: 70）
const COLS       = 4

// ============================================================
// KnobCell（縮小版）
// ============================================================

interface KnobCellProps {
  config: MacroKnobConfig
  value: number
  assignValues: number[]
  learnedCC: number
  isLearning: boolean
  onEdit: (id: string) => void
  onLearn: (id: string) => void
  onClearCC: (id: string) => void
  onDrop: (knobId: string, payload: DragPayload) => void
  onKnobChange: (knobId: string, value: number) => void
}

function KnobCell({ config, value, assignValues, learnedCC, isLearning, onEdit, onLearn, onClearCC, onDrop, onKnobChange }: KnobCellProps) {
  const [isDragOver, setIsDragOver] = useState(false)
  const [localValue, setLocalValue] = useState(value)
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null)

  useEffect(() => { setLocalValue(value) }, [value])

  const isAssigned = config.assigns.length > 0
  const hasMidi    = learnedCC >= 0
  const isFull     = config.assigns.length >= 3
  const cx = KNOB_SIZE / 2
  const cy = KNOB_SIZE / 2

  const rings = [
    { r: KNOB_SIZE / 2 - 4,  assignIndex: 0 },
    { r: KNOB_SIZE / 2 - 10, assignIndex: 1 },
    { r: KNOB_SIZE / 2 - 16, assignIndex: 2 },
  ]

  function arcPath(r: number, val: number) {
    const startDeg = 135, totalDeg = 270
    const clampedVal = Math.min(Math.max(val, 0.0001), 0.9999)
    const sweepDeg = totalDeg * clampedVal
    const endDeg = startDeg + sweepDeg
    const startRad = (startDeg * Math.PI) / 180
    const endRad   = (endDeg   * Math.PI) / 180
    const x1 = cx + r * Math.cos(startRad), y1 = cy + r * Math.sin(startRad)
    const x2 = cx + r * Math.cos(endRad),   y2 = cy + r * Math.sin(endRad)
    const largeArc = sweepDeg > 180 ? 1 : 0
    return { x1, y1, x2, y2, largeArc }
  }

  function trackPath(r: number) {
    const s = (135 * Math.PI) / 180, e = ((135 + 270) * Math.PI) / 180
    const x1 = cx + r * Math.cos(s), y1 = cy + r * Math.sin(s)
    const x2 = cx + r * Math.cos(e), y2 = cy + r * Math.sin(e)
    return `M ${x1} ${y1} A ${r} ${r} 0 1 1 ${x2} ${y2}`
  }

  let dragStartY = 0, dragStartValue = 0, movedRef = false

  function handleMouseDown(e: React.MouseEvent) {
    if (e.button !== 0) return
    e.preventDefault(); e.stopPropagation()
    movedRef = false
    dragStartY = e.clientY; dragStartValue = localValue

    function onMouseMove(ev: MouseEvent) {
      const deltaY = dragStartY - ev.clientY
      if (Math.abs(deltaY) >= 1) movedRef = true
      const next = Math.min(1, Math.max(0, dragStartValue + deltaY / 300))
      setLocalValue(next)
      if (movedRef) onKnobChange(config.id, next)
    }
    function onMouseUp() {
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mouseup', onMouseUp)
      if (!movedRef) onEdit(config.id)
    }
    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseup', onMouseUp)
  }

  function handleContextMenu(e: React.MouseEvent) {
    e.preventDefault(); e.stopPropagation()
    setContextMenu({ x: e.clientX, y: e.clientY })
  }

  function handleDragOver(e: React.DragEvent) {
    if (isFull || !e.dataTransfer.types.includes('application/geography-param')) return
    e.preventDefault(); e.dataTransfer.dropEffect = 'copy'; setIsDragOver(true)
  }

  function handleDrop(e: React.DragEvent) {
    setIsDragOver(false)
    if (isFull) return
    const raw = e.dataTransfer.getData('application/geography-param')
    if (!raw) return
    try { onDrop(config.id, JSON.parse(raw) as DragPayload) } catch { /* ignore */ }
  }

  return (
    <>
      <div
        onMouseDown={handleMouseDown}
        onContextMenu={handleContextMenu}
        onDragOver={handleDragOver}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={handleDrop}
        className="flex flex-col items-center gap-0.5 p-1 rounded hover:bg-[#1e1e3e] transition-colors"
        style={{
          width: KNOB_SIZE + 8,
          cursor: 'ns-resize',
          border: `1px solid ${isDragOver ? '#7878ff' : isLearning ? '#ff7878' : 'transparent'}`,
          background: isDragOver ? '#1a1a4e' : isLearning ? '#1a0a0a' : undefined,
          userSelect: 'none',
        }}
      >
        <svg width={KNOB_SIZE} height={KNOB_SIZE} viewBox={`0 0 ${KNOB_SIZE} ${KNOB_SIZE}`}>
          {rings.map(({ r, assignIndex }) => {
            const assign = config.assigns[assignIndex]
            const ringVal = assign ? (assignValues[assignIndex] ?? 0) : (assignIndex === 0 ? localValue : 0)
            const arc = arcPath(r, ringVal)
            const color = assignIndex === 0 ? (isAssigned ? '#9090ff' : '#4a4a7e') : assignIndex === 1 ? '#70d0aa' : '#ffaa55'
            return (
              <g key={assignIndex}>
                <path d={trackPath(r)} fill="none" stroke="#1e1e3e" strokeWidth={assignIndex === 0 ? 2.5 : 2} strokeLinecap="round" />
                {(!!assign || assignIndex === 0) && ringVal > 0.001 && (
                  <path d={`M ${arc.x1} ${arc.y1} A ${r} ${r} 0 ${arc.largeArc} 1 ${arc.x2} ${arc.y2}`}
                    fill="none" stroke={isLearning ? '#ff7878' : color}
                    strokeWidth={assignIndex === 0 ? 2.5 : 2} strokeLinecap="round" />
                )}
              </g>
            )
          })}
          <circle cx={cx} cy={cy} r={3} fill={isAssigned ? '#b0b0ff' : '#4a4a6e'} />
          {hasMidi && <circle cx={KNOB_SIZE - 6} cy={6} r={3} fill={isLearning ? '#ff4444' : '#ff7878'} />}
        </svg>

        <span style={{ fontSize: 8, color: '#8888bb', maxWidth: KNOB_SIZE + 8, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', textAlign: 'center' }}>
          {config.name || config.id.replace('macro-', '#')}
        </span>

        {isLearning
          ? <span style={{ fontSize: 7, color: '#ff7878' }}>wait...</span>
          : <span style={{ fontSize: 8, color: '#5a5a7e' }}>{localValue.toFixed(2)}</span>
        }

        {hasMidi && !isLearning && (
          <span style={{ fontSize: 7, padding: '0 3px', borderRadius: 2, color: '#ff9999', background: '#2a0a0a' }}>CC{learnedCC}</span>
        )}
      </div>

      {/* コンテキストメニュー */}
      {contextMenu && (
        <ContextMenu x={contextMenu.x} y={contextMenu.y} hasCC={hasMidi}
          onLearn={() => { onLearn(config.id); setContextMenu(null) }}
          onClear={() => { onClearCC(config.id); setContextMenu(null) }}
          onClose={() => setContextMenu(null)} />
      )}
    </>
  )
}

// ============================================================
// ContextMenu
// ============================================================

function ContextMenu({ x, y, hasCC, onLearn, onClear, onClose }: {
  x: number; y: number; hasCC: boolean
  onLearn: () => void; onClear: () => void; onClose: () => void
}) {
  useEffect(() => {
    const h = () => onClose()
    window.addEventListener('mousedown', h)
    return () => window.removeEventListener('mousedown', h)
  }, [onClose])

  return (
    <div className="fixed z-[300] bg-[#0f0f1e] border border-[#3a3a6e] rounded font-mono text-xs shadow-lg"
      style={{ left: x, top: y, minWidth: 150 }} onMouseDown={(e) => e.stopPropagation()}>
      <button onClick={onLearn} className="w-full text-left px-3 py-2 hover:bg-[#1a1a3e] transition-colors flex items-center gap-2" style={{ color: '#ff7878' }}>
        <span>●</span> MIDI Learn
      </button>
      {hasCC && (
        <button onClick={onClear} className="w-full text-left px-3 py-2 hover:bg-[#1a1a3e] transition-colors" style={{ color: '#6666aa' }}>
          Clear MIDI CC
        </button>
      )}
    </div>
  )
}

// ============================================================
// MacroPanel
// ============================================================

export function MacroPanel() {
  const [knobs, setKnobs]             = useState<MacroKnobConfig[]>([])
  const [values, setValues]           = useState<number[]>(new Array(KNOB_COUNT).fill(0))
  const [assignValuesList, setAssignValuesList] = useState<number[][]>(new Array(KNOB_COUNT).fill([]))
  const [learnTarget, setLearnTarget] = useState<MidiLearnTarget | null>(null)
  const [learnedCCs, setLearnedCCs]   = useState<number[]>(new Array(KNOB_COUNT).fill(-1))
  const [assignTarget, setAssignTarget] = useState<{ knobId: string; payload: DragPayload } | null>(null)

  const sync = useCallback(() => {
    const configs = engine.getMacroKnobs().slice(0, KNOB_COUNT)
    setKnobs([...configs])
    setValues(configs.map((k) => engine.getMacroKnobValue(k.id)))
    setLearnTarget(engine.getMidiLearnTarget())
    setLearnedCCs(configs.map((k) => engine.getLearnedCC(k.id)))
    const liveParams = engine.getParametersLive()
    setAssignValuesList(configs.map((k) =>
      k.assigns.map((a) => {
        const entry = liveParams.find((p) => p.ccNumber === a.ccNumber && p.layerId === a.layerId)
        if (!entry) return 0
        const range = entry.max - entry.min || 1
        const norm  = (entry.value - entry.min) / range
        const aRange = a.max - a.min || 1
        return Math.min(1, Math.max(0, (norm - a.min) / aRange))
      })
    ))
  }, [])

  useEffect(() => {
    sync()
    const t = window.setInterval(sync, 200)
    return () => window.clearInterval(t)
  }, [sync])

  function handleAssign(assign: MacroAssign) {
    if (!assignTarget) return
    engine.addMacroAssign(assignTarget.knobId, assign)
    setAssignTarget(null)
    sync()
  }

  return (
    <>
      <style>{`@keyframes pulse-border-macro { 0%,100%{border-color:#ff7878}50%{border-color:#ff2222} }`}</style>
      {learnTarget && (
        <div className="flex items-center justify-between mb-2">
          <span style={{ fontSize: 8, color: '#ff7878' }}>● LEARNING {learnTarget.id.toUpperCase()}</span>
          <button onClick={() => engine.stopMidiLearn()}
            style={{ fontSize: 8, padding: '1px 6px', borderRadius: 3,
              border: '1px solid #3a1a1a', color: '#ff7878', background: '#1a0a0a' }}>
            Cancel
          </button>
        </div>
      )}
      <div style={{ display: 'grid', gridTemplateColumns: `repeat(${COLS}, ${KNOB_SIZE + 8}px)`, gap: 2 }}>
        {knobs.map((knob, i) => (
          <KnobCell key={knob.id} config={knob} value={values[i] ?? 0}
            assignValues={assignValuesList[i] ?? []}
            learnedCC={learnedCCs[i] ?? -1}
            isLearning={learnTarget?.id === knob.id}
            onEdit={(id) => {
              const k = engine.getMacroKnobs().find((k) => k.id === id)
              if (k) engine.setMacroKnob(id, { ...k })
            }}
            onLearn={(id) => {
              const k = engine.getMacroKnobs().find((k) => k.id === id)
              engine.startMidiLearn({ id, type: 'macro', label: k?.name || id })
            }}
            onClearCC={(id) => engine.clearLearnedCC(id)}
            onDrop={(knobId, payload) => setAssignTarget({ knobId, payload })}
            onKnobChange={(knobId, val) => {
              engine.setMacroKnobValue(knobId, val)
              engine.receiveMidiModulation(knobId, val)
            }}
          />
        ))}
      </div>

      {assignTarget && (
        <AssignDialog knobId={assignTarget.knobId} payload={assignTarget.payload}
          onAssign={handleAssign} onClose={() => setAssignTarget(null)} />
      )}
    </>
  )
}

// ============================================================
// AssignDialog（Macro8MidiWindow と同一）
// ============================================================

function AssignDialog({ knobId, payload, onAssign, onClose }: {
  knobId: string; payload: DragPayload
  onAssign: (assign: MacroAssign) => void; onClose: () => void
}) {
  const [minVal, setMinVal] = useState(payload.proposal?.lo ?? payload.min)
  const [maxVal, setMaxVal] = useState(payload.proposal?.hi ?? payload.max)
  const [error, setError]   = useState<string | null>(null)
  const step = (payload.max - payload.min) / 200

  function handleAssign() {
    if (minVal >= maxVal) { setError('min は max より小さくしてください'); return }
    const fullRange = payload.max - payload.min || 1
    try {
      onAssign({
        geoParamAddress: toGeoParamAddress(payload.layerId, payload.pluginId, payload.id),
        ccNumber: payload.ccNumber, layerId: payload.layerId,
        min: (minVal - payload.min) / fullRange,
        max: (maxVal - payload.min) / fullRange,
        curve: 'linear',
      })
    } catch (e) { setError(e instanceof Error ? e.message : 'アサインに失敗しました') }
  }

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.7)' }} onClick={onClose}>
      <div className="bg-[#0f0f1e] border border-[#3a3a6e] rounded-lg p-4 font-mono text-xs" style={{ minWidth: 260 }} onClick={(e) => e.stopPropagation()}>
        <div style={{ fontSize: 9, color: '#7878aa', marginBottom: 12, letterSpacing: '0.1em' }}>ASSIGN → {knobId}</div>
        <div style={{ fontSize: 8, color: '#5555aa', marginBottom: 12 }}>
          <span style={{ color: '#7878cc' }}>{payload.layerId}</span> · {payload.pluginId} · {payload.id}
        </div>
        {(['MIN', 'MAX'] as const).map((label, i) => {
          const val = i === 0 ? minVal : maxVal
          const set = i === 0 ? setMinVal : setMaxVal
          return (
            <label key={label} className="block mb-3">
              <span style={{ fontSize: 8, color: '#6666aa', display: 'block', marginBottom: 4 }}>{label}</span>
              <div className="flex items-center gap-2">
                <input type="range" min={payload.min} max={payload.max} step={step} value={val}
                  onChange={(e) => set(parseFloat(e.target.value))} className="flex-1 h-1" style={{ accentColor: '#5a5aff' }} />
                <span style={{ width: 40, textAlign: 'right', color: '#aaaaee' }}>{val.toFixed(2)}</span>
              </div>
            </label>
          )
        })}
        {error && <div style={{ color: '#cc4444', fontSize: 8, marginBottom: 8 }}>{error}</div>}
        <div className="flex gap-2 justify-end">
          <button onClick={onClose} style={{ padding: '2px 10px', fontSize: 9, borderRadius: 3, border: '1px solid #2a2a4e', color: '#6666aa' }}>CANCEL</button>
          <button onClick={handleAssign} style={{ padding: '2px 10px', fontSize: 9, borderRadius: 3, border: '1px solid #4a4a8e', color: '#aaaaf0' }}>ASSIGN</button>
        </div>
      </div>
    </div>
  )
}
