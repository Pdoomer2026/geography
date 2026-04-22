/**
 * Macro8Window — 8ノブ版 MacroWindow
 *
 * MacroWindow の8ノブ・大型版（96px）。
 * 可動域（lo/hi）は将来実装。現在はシンプルなノブのみ。
 *
 * MacroWindow との差分:
 *   - 8ノブのみ（macro-1 〜 macro-8）
 *   - ノブサイズ 96px（MacroWindow は 48px）
 *   - 1行横並び
 */

import { useEffect, useRef, useState, useCallback } from 'react'
import { engine } from '../../../../application/orchestrator/engine'
import { useDraggable } from '../../../../ui/useDraggable'
import type { DragPayload, MacroAssign, MacroKnobConfig } from '../../../../application/schema'
import { toGeoParamAddress, parseGeoParamAddress } from '../../../../application/schema'

const KNOB_COUNT = 8
const KNOB_SIZE = 70
const COLS = 4

// ============================================================
// KnobCell — 大型ノブ UI（ドロップ受け口付き）
// ============================================================

interface KnobCellProps {
  config: MacroKnobConfig
  value: number
  assignValues: number[]  // 各アサインの正規化済みリング値（0〜1）
  onEdit: (id: string) => void
  onDrop: (knobId: string, payload: DragPayload) => void
  onKnobChange: (knobId: string, value: number) => void
}

function KnobCell({ config, value, assignValues, onEdit, onDrop, onKnobChange }: KnobCellProps) {
  const [isDragOver, setIsDragOver] = useState(false)
  const [localValue, setLocalValue] = useState(value)

  const isDraggingRef = useRef(false)
  const dragStartYRef = useRef(0)
  const dragStartValueRef = useRef(0)
  const movedRef = useRef(false)

  useEffect(() => {
    if (!isDraggingRef.current) setLocalValue(value)
  }, [value])

  const isAssigned = config.assigns.length > 0
  const hasMidi = config.midiCC >= 0
  const isFull = config.assigns.length >= 3

  const displayValue = localValue
  const cx = KNOB_SIZE / 2
  const cy = KNOB_SIZE / 2

  // 3重リング設定（外→内の順にアサイン1・2・3）
  const rings = [
    { r: KNOB_SIZE / 2 - 6,  assignIndex: 0 },
    { r: KNOB_SIZE / 2 - 14, assignIndex: 1 },
    { r: KNOB_SIZE / 2 - 22, assignIndex: 2 },
  ]

  // 隙間を下側に（270度アーク、隙間が真下）
  // startAngle = 135deg（左下）, endAngle = 45deg（右下）
  function arcPath(r: number, value: number) {
    const startDeg = 135
    const totalDeg = 270
    const clampedValue = Math.min(Math.max(value, 0.0001), 0.9999)
    const sweepDeg = totalDeg * clampedValue
    const endDeg = startDeg + sweepDeg
    const startRad = (startDeg * Math.PI) / 180
    const endRad = (endDeg * Math.PI) / 180
    const x1 = cx + r * Math.cos(startRad)
    const y1 = cy + r * Math.sin(startRad)
    const x2 = cx + r * Math.cos(endRad)
    const y2 = cy + r * Math.sin(endRad)
    // sweepDeg > 180 のとき large-arc-flag=1（SVG arc の正しい判定）
    const largeArc = sweepDeg > 180 ? 1 : 0
    return { x1, y1, x2, y2, largeArc }
  }

  function trackPath(r: number) {
    // 270度のベーストラック（隙間下側）
    const startDeg = 135
    const endDeg = 135 + 270
    const startRad = (startDeg * Math.PI) / 180
    const endRad = (endDeg * Math.PI) / 180
    const x1 = cx + r * Math.cos(startRad)
    const y1 = cy + r * Math.sin(startRad)
    const x2 = cx + r * Math.cos(endRad)
    const y2 = cy + r * Math.sin(endRad)
    return `M ${x1} ${y1} A ${r} ${r} 0 1 1 ${x2} ${y2}`
  }

  function handleMouseDown(e: React.MouseEvent) {
    if (e.button !== 0) return
    e.preventDefault()
    e.stopPropagation()
    isDraggingRef.current = true
    movedRef.current = false
    dragStartYRef.current = e.clientY
    dragStartValueRef.current = localValue

    function onMouseMove(ev: MouseEvent) {
      const deltaY = dragStartYRef.current - ev.clientY
      const sensitivity = 300
      const delta = deltaY / sensitivity
      if (Math.abs(deltaY) >= 1) movedRef.current = true
      const next = Math.min(1, Math.max(0, dragStartValueRef.current + delta))
      setLocalValue(next)
      if (movedRef.current) onKnobChange(config.id, next)
    }

    function onMouseUp() {
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mouseup', onMouseUp)
      isDraggingRef.current = false
      if (!movedRef.current) onEdit(config.id)
    }

    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseup', onMouseUp)
  }

  function handleDragOver(e: React.DragEvent) {
    if (isFull) return
    if (!e.dataTransfer.types.includes('application/geography-param')) return
    e.preventDefault()
    e.dataTransfer.dropEffect = 'copy'
    setIsDragOver(true)
  }

  function handleDragLeave() { setIsDragOver(false) }

  function handleDrop(e: React.DragEvent) {
    setIsDragOver(false)
    if (isFull) return
    const raw = e.dataTransfer.getData('application/geography-param')
    if (!raw) return
    try {
      const payload = JSON.parse(raw) as DragPayload
      onDrop(config.id, payload)
    } catch { /* malformed payload は無視 */ }
  }

  return (
    <div
      onMouseDown={handleMouseDown}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className="group flex flex-col items-center gap-1 p-2 rounded
                 hover:bg-[#1e1e3e] transition-colors duration-100
                 border border-transparent hover:border-[#3a3a5e]"
      style={{
        width: KNOB_SIZE + 16,
        cursor: 'ns-resize',
        borderColor: isDragOver ? '#7878ff' : isFull ? '#3a3a5e' : undefined,
        background: isDragOver ? '#1a1a4e' : undefined,
        userSelect: 'none',
      }}
      title={`${config.id}${config.name ? ` — ${config.name}` : ''}${hasMidi ? ` | CC${config.midiCC}` : ''}${isFull ? ' (FULL)' : ''} | 上下ドラッグで操作`}
    >
      <svg width={KNOB_SIZE} height={KNOB_SIZE} viewBox={`0 0 ${KNOB_SIZE} ${KNOB_SIZE}`}>
        {/* 3重リング */}
        {rings.map(({ r, assignIndex }) => {
          const assign = config.assigns[assignIndex]
          const ringValue = assign ? (assignValues[assignIndex] ?? 0) : (assignIndex === 0 ? displayValue : 0)
          const arc = arcPath(r, ringValue)
          const hasAssign = !!assign
          const strokeColor =
            assignIndex === 0 ? (isAssigned ? '#9090ff' : '#4a4a7e')
            : assignIndex === 1 ? '#70d0aa'
            : '#ffaa55'
          return (
            <g key={assignIndex}>
              {/* ベーストラック */}
              <path
                d={trackPath(r)}
                fill="none"
                stroke="#1e1e3e"
                strokeWidth={assignIndex === 0 ? 3.5 : 2.5}
                strokeLinecap="round"
              />
              {/* 値アーク */}
              {(hasAssign || assignIndex === 0) && ringValue > 0.001 && (
                <path
                  d={`M ${arc.x1} ${arc.y1} A ${r} ${r} 0 ${arc.largeArc} 1 ${arc.x2} ${arc.y2}`}
                  fill="none"
                  stroke={strokeColor}
                  strokeWidth={assignIndex === 0 ? 3.5 : 2.5}
                  strokeLinecap="round"
                />
              )}
            </g>
          )
        })}
        {/* 中心点 */}
        <circle cx={cx} cy={cy} r={4} fill={isAssigned ? '#b0b0ff' : '#4a4a6e'} />
        {/* MIDI インジケーター */}
        {hasMidi && <circle cx={KNOB_SIZE - 8} cy={8} r={4} fill="#ff7878" />}
        {/* ドラッグオーバー枠 */}
        {isDragOver && (
          <circle cx={cx} cy={cy} r={KNOB_SIZE / 2 - 2} fill="none" stroke="#7878ff" strokeWidth={1.5} strokeDasharray="4 3" />
        )}
      </svg>

      {/* 名前 */}
      <span className="text-[10px] text-[#8888bb] group-hover:text-[#aaaaf0]
                       truncate w-full text-center leading-tight tracking-widest">
        {config.name || config.id.replace('macro-', '#')}
      </span>

      {/* 値 */}
      <span className="text-[10px] text-[#5a5a7e] group-hover:text-[#7a7aaa] tabular-nums">
        {displayValue.toFixed(2)}
      </span>

      {/* アサイン一覧（ホバー時） */}
      {isAssigned && (
        <div className="w-full mt-0.5">
          {config.assigns.map((a, i) => (
            <div key={i} className="text-[8px] text-[#4a4a7e] truncate text-center">
              {a.layerId} · {parseGeoParamAddress(a.geoParamAddress)?.paramId ?? a.geoParamAddress}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ============================================================
// EditDialog（MacroWindow と同じ）
// ============================================================

interface EditDialogProps {
  config: MacroKnobConfig
  onSave: (name: string, midiCC: number) => void
  onRemoveAssign: (geoParamAddress: string) => void
  onClose: () => void
}

function EditDialog({ config, onSave, onRemoveAssign, onClose }: EditDialogProps) {
  const [name, setName] = useState(config.name)
  const [cc, setCc] = useState(String(config.midiCC >= 0 ? config.midiCC : ''))

  function handleSave() {
    const midiCC = cc === '' ? -1 : Math.max(0, Math.min(127, parseInt(cc, 10)))
    onSave(name, isNaN(midiCC) ? -1 : midiCC)
  }

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.6)' }}
      onClick={onClose}
    >
      <div
        className="bg-[#0f0f1e] border border-[#3a3a6e] rounded-lg p-5 text-white font-mono text-xs"
        style={{ minWidth: 260 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="text-[10px] text-[#7878aa] mb-4 tracking-widest">
          EDIT — {config.id.toUpperCase()}
        </div>

        <label className="block mb-3">
          <span className="text-[#6666aa] text-[9px] tracking-wider block mb-1">NAME</span>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value.toUpperCase())}
            maxLength={8}
            placeholder="CHAOS"
            className="w-full bg-[#1a1a2e] border border-[#2a2a4e] rounded px-2 py-1.5
                       text-[#aaaaf0] text-xs outline-none focus:border-[#5555aa]
                       tracking-widest uppercase"
          />
        </label>

        <label className="block mb-4">
          <span className="text-[#6666aa] text-[9px] tracking-wider block mb-1">MIDI CC (0–127)</span>
          <input
            type="number"
            value={cc}
            onChange={(e) => setCc(e.target.value)}
            min={0} max={127} placeholder="—"
            className="w-full bg-[#1a1a2e] border border-[#2a2a4e] rounded px-2 py-1.5
                       text-[#aaaaf0] text-xs outline-none focus:border-[#5555aa]"
          />
        </label>

        {config.assigns.length > 0 && (
          <div className="mb-4">
            <span className="text-[#6666aa] text-[9px] tracking-wider block mb-1">ASSIGNS</span>
            {config.assigns.map((a, i) => (
              <div key={i} className="flex items-center justify-between py-0.5 group">
                <span className="text-[#5555aa] text-[9px]">
                  {a.layerId} · CC{a.ccNumber} · {parseGeoParamAddress(a.geoParamAddress)?.paramId ?? a.geoParamAddress}
                </span>
                <button
                  onClick={() => onRemoveAssign(a.geoParamAddress)}
                  className="text-[8px] text-[#3a3a5e] hover:text-[#cc4444]
                             transition-colors ml-2 px-1 opacity-0 group-hover:opacity-100"
                >×</button>
              </div>
            ))}
          </div>
        )}

        <div className="flex gap-2 justify-end">
          <button onClick={onClose} className="px-3 py-1 text-[10px] text-[#6666aa] border border-[#2a2a4e] rounded hover:border-[#4a4a7e] transition-colors">CANCEL</button>
          <button onClick={handleSave} className="px-3 py-1 text-[10px] text-[#aaaaf0] border border-[#4a4a8e] rounded hover:bg-[#1a1a4e] transition-colors">SAVE</button>
        </div>
      </div>
    </div>
  )
}

// ============================================================
// AssignDialog（MacroWindow と同じ）
// ============================================================

interface AssignDialogProps {
  knobId: string
  payload: DragPayload
  onAssign: (assign: MacroAssign) => void
  onClose: () => void
}

function AssignDialog({ knobId, payload, onAssign, onClose }: AssignDialogProps) {
  const [minVal, setMinVal] = useState(payload.proposal?.lo ?? payload.min)
  const [maxVal, setMaxVal] = useState(payload.proposal?.hi ?? payload.max)
  const [error, setError] = useState<string | null>(null)

  function handleAssign() {
    if (minVal >= maxVal) { setError('min は max より小さくしてください'); return }
    const fullRange = payload.max - payload.min || 1
    const assign: MacroAssign = {
      geoParamAddress: toGeoParamAddress(payload.layerId, payload.pluginId, payload.id),
      ccNumber: payload.ccNumber,
      layerId: payload.layerId,
      min: (minVal - payload.min) / fullRange,
      max: (maxVal - payload.min) / fullRange,
      curve: 'linear',
    }
    try {
      onAssign(assign)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'アサインに失敗しました')
    }
  }

  const step = (payload.max - payload.min) / 200

  return (
    <div
      className="fixed inset-0 z-[300] flex items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.7)' }}
      onClick={onClose}
    >
      <div
        className="bg-[#0f0f1e] border border-[#3a3a6e] rounded-lg p-5 text-white font-mono text-xs"
        style={{ minWidth: 280 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="text-[10px] text-[#7878aa] mb-1 tracking-widest">ASSIGN</div>
        <div className="text-[9px] text-[#5555aa] mb-4">
          <span className="text-[#7878cc]">{payload.layerId}</span>
          <span className="text-[#3a3a6e] mx-1">·</span>
          <span className="text-[#6666aa]">{payload.pluginId}</span>
          <span className="text-[#3a3a6e] mx-1">·</span>
          {payload.id} → {knobId}
          <span className="ml-2 text-[#3a3a6e]">CC{payload.ccNumber}</span>
        </div>

        <label className="block mb-3">
          <span className="text-[#6666aa] text-[9px] tracking-wider block mb-1">MIN <span className="text-[#4a4a6e]">({payload.min})</span></span>
          <div className="flex items-center gap-2">
            <input type="range" min={payload.min} max={payload.max} step={step} value={minVal}
              onChange={(e) => setMinVal(parseFloat(e.target.value))}
              className="flex-1 accent-[#5a5aff] h-1" />
            <span className="w-12 text-right text-[#aaaaf0] tabular-nums">{minVal.toFixed(2)}</span>
          </div>
        </label>

        <label className="block mb-4">
          <span className="text-[#6666aa] text-[9px] tracking-wider block mb-1">MAX <span className="text-[#4a4a6e]">({payload.max})</span></span>
          <div className="flex items-center gap-2">
            <input type="range" min={payload.min} max={payload.max} step={step} value={maxVal}
              onChange={(e) => setMaxVal(parseFloat(e.target.value))}
              className="flex-1 accent-[#5a5aff] h-1" />
            <span className="w-12 text-right text-[#aaaaf0] tabular-nums">{maxVal.toFixed(2)}</span>
          </div>
        </label>

        {error && <div className="text-[#cc4444] text-[9px] mb-3">{error}</div>}

        <div className="flex gap-2 justify-end">
          <button onClick={onClose} className="px-3 py-1 text-[10px] text-[#6666aa] border border-[#2a2a4e] rounded hover:border-[#4a4a7e] transition-colors">CANCEL</button>
          <button onClick={handleAssign} className="px-3 py-1 text-[10px] text-[#aaaaf0] border border-[#4a4a8e] rounded hover:bg-[#1a1a4e] transition-colors">ASSIGN</button>
        </div>
      </div>
    </div>
  )
}

// ============================================================
// Macro8Window — メインコンポーネント
// ============================================================

export function Macro8Window() {
  const [knobs, setKnobs] = useState<MacroKnobConfig[]>([])
  const [values, setValues] = useState<number[]>(new Array(KNOB_COUNT).fill(0))
  const [assignValuesList, setAssignValuesList] = useState<number[][]>(new Array(KNOB_COUNT).fill([]))
  const [editingId, setEditingId] = useState<string | null>(null)
  const [assignTarget, setAssignTarget] = useState<{ knobId: string; payload: DragPayload } | null>(null)

  const { pos, handleMouseDown } = useDraggable({ x: window.innerWidth / 2 - 440, y: 16 })

  useEffect(() => {
    const sync = () => {
      const configs = engine.getMacroKnobs().slice(0, KNOB_COUNT)
      setKnobs([...configs])
      setValues(configs.map((k) => engine.getMacroKnobValue(k.id)))
      // 各ノブの各アサインのリング値を計算
      const liveParams = engine.getParametersLive()
      const newAssignValuesList = configs.map((k) =>
        k.assigns.map((assign) => {
          const entry = liveParams.find(
            (p) => p.ccNumber === assign.ccNumber && p.layerId === assign.layerId
          )
          if (!entry) return 0
          const entryRange = entry.max - entry.min || 1
          const normalized = (entry.value - entry.min) / entryRange
          const assignRange = assign.max - assign.min || 1
          return Math.min(1, Math.max(0, (normalized - assign.min) / assignRange))
        })
      )
      setAssignValuesList(newAssignValuesList)
    }
    sync()
    const timer = window.setInterval(sync, 200)
    return () => window.clearInterval(timer)
  }, [])

  const handleEdit = useCallback((id: string) => setEditingId(id), [])

  const handleSave = useCallback((name: string, midiCC: number) => {
    if (!editingId) return
    const current = engine.getMacroKnobs().find((k) => k.id === editingId)
    if (!current) return
    engine.setMacroKnob(editingId, { ...current, name, midiCC })
    setEditingId(null)
  }, [editingId])

  const handleRemoveAssign = useCallback((geoParamAddress: string) => {
    if (!editingId) return
    engine.removeMacroAssign(editingId, geoParamAddress)
    setKnobs([...engine.getMacroKnobs().slice(0, KNOB_COUNT)])
  }, [editingId])

  const handleClose = useCallback(() => setEditingId(null), [])

  const handleDrop = useCallback((knobId: string, payload: DragPayload) => {
    setAssignTarget({ knobId, payload })
  }, [])

  const handleAssign = useCallback((assign: MacroAssign) => {
    if (!assignTarget) return
    engine.addMacroAssign(assignTarget.knobId, assign)
    setAssignTarget(null)
  }, [assignTarget])

  const editingConfig = editingId
    ? knobs.find((k) => k.id === editingId) ?? null
    : null

  return (
    <>
      <div
        className="fixed z-50 bg-[#0a0a18] border border-[#2a2a4e] rounded-lg
                   text-white font-mono select-none"
        style={{ left: pos.x, top: pos.y, padding: '10px 12px' }}
      >
        <div
          onMouseDown={handleMouseDown}
          className="text-[9px] text-[#5a5a88] mb-3 tracking-widest flex items-center gap-2"
          style={{ cursor: 'grab' }}
        >
          <span>MACRO 8</span>
          <span className="text-[#3a3a5e]">8 × MIDI</span>
          <span className="ml-auto text-[#3a3a5e]">
            {knobs.filter(k => k.assigns.length > 0).length} ASSIGNED
          </span>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: `repeat(${COLS}, ${KNOB_SIZE + 16}px)`,
            gap: '4px',
          }}
        >
          {knobs.map((knob, index) => (
            <KnobCell
              key={knob.id}
              config={knob}
              value={values[index] ?? 0}
              assignValues={assignValuesList[index] ?? []}
              onEdit={handleEdit}
              onDrop={handleDrop}
              onKnobChange={(knobId, val) => {
                engine.setMacroKnobValue(knobId, val)
                engine.receiveMidiModulation(knobId, val)
              }}
            />
          ))}
        </div>
      </div>

      {editingConfig && (
        <EditDialog
          config={editingConfig}
          onSave={handleSave}
          onRemoveAssign={handleRemoveAssign}
          onClose={handleClose}
        />
      )}

      {assignTarget && (
        <AssignDialog
          knobId={assignTarget.knobId}
          payload={assignTarget.payload}
          onAssign={handleAssign}
          onClose={() => setAssignTarget(null)}
        />
      )}
    </>
  )
}
