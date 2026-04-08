/**
 * MacroKnobPanel — Macro Knob Manager のデフォルト UI
 *
 * spec: docs/spec/macro-knob.spec.md
 *
 * Day52 追加:
 * - KnobCell に onDrop 受け口（DragPayload を受け取る）
 * - AssignDialog（min/max 設定 → engine.addMacroAssign()）
 * - アサイン済みノブは弧が紫で点灯（簡易版）
 */

import { useEffect, useRef, useState, useCallback } from 'react'
import { engine } from '../../../core/engine'
import { useDraggable } from '../../useDraggable'
import type { DragPayload, MacroAssign, MacroKnobConfig } from '../../../types'

const COLS = 8
const ROWS = 4

// ============================================================
// KnobCell — 1ノブのUI（ドロップ受け口付き）
// ============================================================

interface KnobCellProps {
  config: MacroKnobConfig
  value: number
  onEdit: (id: string) => void
  onDrop: (knobId: string, payload: DragPayload) => void
  onKnobChange: (knobId: string, value: number) => void
}

function KnobCell({ config, value, onEdit, onDrop, onKnobChange }: KnobCellProps) {
  const [isDragOver, setIsDragOver] = useState(false)
  // ローカル表示値（ドラッグ中にリアルタイムで動かすため）
  const [localValue, setLocalValue] = useState(value)

  // 200ms ポーリングで来る value を、ドラッグ中でなければ追従させる
  const isDraggingRef = useRef(false)
  const dragStartYRef = useRef(0)
  const dragStartValueRef = useRef(0)
  const movedRef = useRef(false)  // クリック判定用

  useEffect(() => {
    if (!isDraggingRef.current) {
      setLocalValue(value)
    }
  }, [value])

  const isAssigned = config.assigns.length > 0
  const hasMidi = config.midiCC >= 0
  const isFull = config.assigns.length >= 3

  const displayValue = localValue
  const angle = -135 + displayValue * 270
  const cx = 16
  const cy = 16
  const r = 11
  const startRad = (-135 * Math.PI) / 180
  const endRad = (angle * Math.PI) / 180
  const x1 = cx + r * Math.cos(startRad)
  const y1 = cy + r * Math.sin(startRad)
  const x2 = cx + r * Math.cos(endRad)
  const y2 = cy + r * Math.sin(endRad)
  const largeArc = displayValue > 0.5 ? 1 : 0

  // ── ノブドラッグ操作 ──────────────────────────────────────
  function handleMouseDown(e: React.MouseEvent) {
    if (e.button !== 0) return
    e.preventDefault()
    e.stopPropagation()  // useDraggable（パネルヘッダー）へのバブリングを止める
    isDraggingRef.current = true
    movedRef.current = false
    dragStartYRef.current = e.clientY
    dragStartValueRef.current = localValue

    function onMouseMove(ev: MouseEvent) {
      const deltaY = dragStartYRef.current - ev.clientY  // 上が正
      const sensitivity = 200  // 200px で 0.0〜1.0
      const delta = deltaY / sensitivity
      if (Math.abs(deltaY) >= 1) movedRef.current = true  // 1px で移動判定
      const next = Math.min(1, Math.max(0, dragStartValueRef.current + delta))
      setLocalValue(next)
      // assigns がある場合は移動中もリアルタイムに engine へ流す
      if (movedRef.current) {
        onKnobChange(config.id, next)
      }
    }

    function onMouseUp() {
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mouseup', onMouseUp)
      isDraggingRef.current = false

      if (!movedRef.current) {
        // 移動量ゼロ = クリック → EditDialog を開く
        onEdit(config.id)
      }
      // ドラッグ確定時は onMouseMove 内で既に流している
    }

    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseup', onMouseUp)
  }

  // ── HTML D&D ドロップ受け口 ───────────────────────────────
  function handleDragOver(e: React.DragEvent) {
    if (isFull) return
    if (!e.dataTransfer.types.includes('application/geography-param')) return
    e.preventDefault()
    e.dataTransfer.dropEffect = 'copy'
    setIsDragOver(true)
  }

  function handleDragLeave() {
    setIsDragOver(false)
  }

  function handleDrop(e: React.DragEvent) {
    setIsDragOver(false)
    if (isFull) return
    const raw = e.dataTransfer.getData('application/geography-param')
    if (!raw) return
    try {
      const payload = JSON.parse(raw) as DragPayload
      onDrop(config.id, payload)
    } catch {
      // malformed payload は無視
    }
  }

  return (
    <div
      onMouseDown={handleMouseDown}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className="group flex flex-col items-center gap-0.5 p-1 rounded
                 hover:bg-[#1e1e3e] transition-colors duration-100
                 border border-transparent hover:border-[#3a3a5e]"
      style={{
        width: 48,
        minHeight: 64,
        cursor: isDraggingRef.current ? 'ns-resize' : 'ns-resize',
        borderColor: isDragOver ? '#7878ff' : isFull ? '#3a3a5e' : undefined,
        background: isDragOver ? '#1a1a4e' : undefined,
        userSelect: 'none',
      }}
      title={`${config.id}${config.name ? ` — ${config.name}` : ''}${hasMidi ? ` | CC${config.midiCC}` : ''}${isFull ? ' (FULL)' : ''} | 上下ドラッグで操作`}
    >
      <svg width={32} height={32} viewBox="0 0 32 32">
        {/* ベース弧（暗い） */}
        <circle
          cx={cx} cy={cy} r={r}
          fill="none"
          stroke="#2a2a4e"
          strokeWidth={2.5}
          strokeDasharray={`${(270 / 360) * 2 * Math.PI * r} ${2 * Math.PI * r}`}
          strokeDashoffset={`${-(45 / 360) * 2 * Math.PI * r}`}
          strokeLinecap="round"
          transform={`rotate(-90 ${cx} ${cy})`}
        />
        {/* 値に応じた弧（アサイン済みは紫・未アサインは暗い青紫） */}
        {displayValue > 0.001 && (
          <path
            d={`M ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2}`}
            fill="none"
            stroke={isAssigned ? '#9090ff' : '#4a4a7e'}
            strokeWidth={2.5}
            strokeLinecap="round"
          />
        )}
        {/* 中心点 */}
        <circle
          cx={cx} cy={cy} r={2.5}
          fill={isAssigned ? '#b0b0ff' : '#4a4a6e'}
        />
        {/* MIDI CC 割り当て済みインジケーター */}
        {hasMidi && (
          <circle cx={26} cy={6} r={2} fill="#ff7878" />
        )}
        {/* アサイン数バッジ */}
        {isAssigned && (
          <text
            x={6} y={9}
            fontSize={7}
            fill="#7878cc"
            textAnchor="middle"
          >
            {config.assigns.length}
          </text>
        )}
        {/* ドラッグオーバー時のリング */}
        {isDragOver && (
          <circle
            cx={cx} cy={cy} r={14}
            fill="none"
            stroke="#7878ff"
            strokeWidth={1}
            strokeDasharray="3 2"
          />
        )}
      </svg>

      <span className="text-[8px] text-[#8888bb] group-hover:text-[#aaaaf0]
                       truncate w-full text-center leading-tight tracking-widest">
        {config.name || config.id.replace('macro-', '#')}
      </span>

      <span className="text-[7px] text-[#5a5a7e] group-hover:text-[#7a7aaa]">
        {displayValue.toFixed(2)}
      </span>
    </div>
  )
}

// ============================================================
// EditDialog — ノブ名・MIDI CC 編集（v1簡易版）
// ============================================================

interface EditDialogProps {
  config: MacroKnobConfig
  onSave: (name: string, midiCC: number) => void
  onRemoveAssign: (paramId: string) => void
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
            min={0}
            max={127}
            placeholder="—"
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
                  CC{a.ccNumber} · {a.paramId} [{a.min}…{a.max}]
                </span>
                <button
                  onClick={() => onRemoveAssign(a.paramId)}
                  className="text-[8px] text-[#3a3a5e] hover:text-[#cc4444]
                             transition-colors ml-2 px-1 opacity-0 group-hover:opacity-100"
                  title={`${a.paramId} のアサインを解除`}
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="flex gap-2 justify-end">
          <button
            onClick={onClose}
            className="px-3 py-1 text-[10px] text-[#6666aa] border border-[#2a2a4e]
                       rounded hover:border-[#4a4a7e] transition-colors"
          >
            CANCEL
          </button>
          <button
            onClick={handleSave}
            className="px-3 py-1 text-[10px] text-[#aaaaf0] border border-[#4a4a8e]
                       rounded hover:bg-[#1a1a4e] transition-colors"
          >
            SAVE
          </button>
        </div>
      </div>
    </div>
  )
}

// ============================================================
// AssignDialog — D&D ドロップ後の min/max 設定ダイアログ（Day52 新設）
// ============================================================

interface AssignDialogProps {
  knobId: string
  payload: DragPayload
  onAssign: (assign: MacroAssign) => void
  onClose: () => void
}

function AssignDialog({ knobId, payload, onAssign, onClose }: AssignDialogProps) {
  const [minVal, setMinVal] = useState(payload.min)
  const [maxVal, setMaxVal] = useState(payload.max)
  const [error, setError] = useState<string | null>(null)

  function handleAssign() {
    if (minVal >= maxVal) {
      setError('min は max より小さくしてください')
      return
    }
    const assign: MacroAssign = {
      paramId: payload.id,
      ccNumber: payload.ccNumber,
      min: minVal,
      max: maxVal,
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
          <span className="text-[#6666aa] text-[9px] tracking-wider block mb-1">
            MIN <span className="text-[#4a4a6e]">({payload.min})</span>
          </span>
          <div className="flex items-center gap-2">
            <input
              type="range"
              min={payload.min}
              max={payload.max}
              step={step}
              value={minVal}
              onChange={(e) => setMinVal(parseFloat(e.target.value))}
              className="flex-1 accent-[#5a5aff] h-1"
            />
            <span className="w-12 text-right text-[#aaaaf0] tabular-nums">{minVal.toFixed(2)}</span>
          </div>
        </label>

        <label className="block mb-4">
          <span className="text-[#6666aa] text-[9px] tracking-wider block mb-1">
            MAX <span className="text-[#4a4a6e]">({payload.max})</span>
          </span>
          <div className="flex items-center gap-2">
            <input
              type="range"
              min={payload.min}
              max={payload.max}
              step={step}
              value={maxVal}
              onChange={(e) => setMaxVal(parseFloat(e.target.value))}
              className="flex-1 accent-[#5a5aff] h-1"
            />
            <span className="w-12 text-right text-[#aaaaf0] tabular-nums">{maxVal.toFixed(2)}</span>
          </div>
        </label>

        {error && (
          <div className="text-[#cc4444] text-[9px] mb-3">{error}</div>
        )}

        <div className="flex gap-2 justify-end">
          <button
            onClick={onClose}
            className="px-3 py-1 text-[10px] text-[#6666aa] border border-[#2a2a4e]
                       rounded hover:border-[#4a4a7e] transition-colors"
          >
            CANCEL
          </button>
          <button
            onClick={handleAssign}
            className="px-3 py-1 text-[10px] text-[#aaaaf0] border border-[#4a4a8e]
                       rounded hover:bg-[#1a1a4e] transition-colors"
          >
            ASSIGN
          </button>
        </div>
      </div>
    </div>
  )
}

// ============================================================
// MacroKnobPanel — メインコンポーネント
// ============================================================

export function MacroKnobPanel() {
  const [knobs, setKnobs] = useState<MacroKnobConfig[]>([])
  const [values, setValues] = useState<number[]>(new Array(32).fill(0))
  const [editingId, setEditingId] = useState<string | null>(null)

  // D&D アサイン用 state
  const [assignTarget, setAssignTarget] = useState<{ knobId: string; payload: DragPayload } | null>(null)

  const { pos, handleMouseDown } = useDraggable({ x: window.innerWidth / 2 - 200, y: 16 })

  useEffect(() => {
    const sync = () => {
      const configs = engine.getMacroKnobs()
      setKnobs([...configs])
      setValues(configs.map((k) => engine.getMacroKnobValue(k.id)))
    }
    sync()
    const timer = window.setInterval(sync, 200)
    return () => window.clearInterval(timer)
  }, [])

  const handleEdit = useCallback((id: string) => {
    setEditingId(id)
  }, [])

  const handleSave = useCallback((name: string, midiCC: number) => {
    if (!editingId) return
    const current = engine.getMacroKnobs().find((k) => k.id === editingId)
    if (!current) return
    engine.setMacroKnob(editingId, { ...current, name, midiCC })
    setEditingId(null)
  }, [editingId])

  const handleRemoveAssign = useCallback((paramId: string) => {
    if (!editingId) return
    engine.removeMacroAssign(editingId, paramId)
    // EditDialog 内の表示を即座に更新するため knobs を再取得
    setKnobs([...engine.getMacroKnobs()])
  }, [editingId])

  const handleClose = useCallback(() => setEditingId(null), [])

  // KnobCell にドロップされたとき → AssignDialog を開く
  const handleDrop = useCallback((knobId: string, payload: DragPayload) => {
    setAssignTarget({ knobId, payload })
  }, [])

  // AssignDialog で [ASSIGN] が押されたとき
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
        {/* ヘッダー */}
        <div
          onMouseDown={handleMouseDown}
          className="text-[9px] text-[#5a5a88] mb-2 tracking-widest flex items-center gap-2"
          style={{ cursor: 'grab' }}
        >
          <span>MACRO KNOB PANEL</span>
          <span className="text-[#3a3a5e]">32 × MIDI</span>
          <span className="ml-auto text-[#3a3a5e]">
            {knobs.filter(k => k.assigns.length > 0).length} ASSIGNED
          </span>
        </div>

        {/* 8×4 グリッド */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: `repeat(${COLS}, 48px)`,
            gap: '2px',
          }}
        >
          {Array.from({ length: ROWS }, (_, row) =>
            Array.from({ length: COLS }, (_, col) => {
              const index = row * COLS + col
              const knob = knobs[index]
              if (!knob) return null
              return (
                <KnobCell
                  key={knob.id}
                  config={knob}
                  value={values[index] ?? 0}
                  onEdit={handleEdit}
                  onDrop={handleDrop}
                  onKnobChange={(knobId, val) => {
                    // midiCC（物理コントローラー番号）は関係ない
                    // assigns の ccNumber ごとに直接流す
                    const knob = knobs.find(k => k.id === knobId)
                    if (!knob) return
                    for (const assign of knob.assigns) {
                      engine.handleMidiCC({
                        cc: assign.ccNumber,
                        value: val,
                        protocol: 'midi2',
                        resolution: 4294967296,
                      })
                    }
                  }}
                />
              )
            })
          )}
        </div>
      </div>

      {/* ノブ名・MIDI CC 編集ダイアログ */}
      {editingConfig && (
        <EditDialog
          config={editingConfig}
          onSave={handleSave}
          onRemoveAssign={handleRemoveAssign}
          onClose={handleClose}
        />
      )}

      {/* D&D アサインダイアログ */}
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
