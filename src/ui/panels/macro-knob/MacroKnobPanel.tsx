/**
 * MacroKnobPanel — Macro Knob Manager のデフォルト UI
 *
 * 旧名称: MacroKnobSimpleWindow（src/ui/MacroKnobSimpleWindow.tsx）
 * spec: docs/spec/macro-knob.spec.md
 *
 * View メニュー（⌘1）またはキーボード「1」で表示/非表示を切り替えられる。
 * コア固定・Plugin 化しない・コントリビューターが触れない。
 *
 * 32ノブ（8×4）固定パネル。
 * MIDI CC番号・現在値（0.0〜1.0）・名前を表示。
 * ノブをクリックすると名前・MIDI CC編集ダイアログを開く（v1簡易版）。
 */

import { useEffect, useState, useCallback } from 'react'
import { macroKnobManager } from '../../../core/macroKnob'
import { useDraggable } from '../../useDraggable'
import type { MacroKnobConfig } from '../../../types'

// 8列 × 4行 = 32ノブ
const COLS = 8
const ROWS = 4

// ============================================================
// KnobCell — 1ノブのUI
// ============================================================

interface KnobCellProps {
  config: MacroKnobConfig
  value: number  // 0.0〜1.0
  onEdit: (id: string) => void
}

function KnobCell({ config, value, onEdit }: KnobCellProps) {
  const angle = -135 + value * 270
  const isAssigned = config.assigns.length > 0
  const hasMidi = config.midiCC >= 0

  const cx = 16
  const cy = 16
  const r = 11
  const startRad = (-135 * Math.PI) / 180
  const endRad = (angle * Math.PI) / 180
  const x1 = cx + r * Math.cos(startRad)
  const y1 = cy + r * Math.sin(startRad)
  const x2 = cx + r * Math.cos(endRad)
  const y2 = cy + r * Math.sin(endRad)
  const largeArc = value > 0.5 ? 1 : 0

  return (
    <button
      onClick={() => onEdit(config.id)}
      className="group flex flex-col items-center gap-0.5 p-1 rounded
                 hover:bg-[#1e1e3e] transition-colors duration-100 cursor-pointer
                 border border-transparent hover:border-[#3a3a5e]"
      style={{ width: 48, minHeight: 64 }}
      title={`${config.id}${config.name ? ` — ${config.name}` : ''}${hasMidi ? ` | CC${config.midiCC}` : ''}`}
    >
      <svg width={32} height={32} viewBox="0 0 32 32">
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
        {value > 0.001 && (
          <path
            d={`M ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2}`}
            fill="none"
            stroke={isAssigned ? '#7878ff' : '#4a4a7e'}
            strokeWidth={2.5}
            strokeLinecap="round"
          />
        )}
        <circle
          cx={cx} cy={cy} r={2.5}
          fill={isAssigned ? '#9898ff' : '#4a4a6e'}
        />
        {hasMidi && (
          <circle cx={26} cy={6} r={2} fill="#ff7878" />
        )}
      </svg>

      <span className="text-[8px] text-[#8888bb] group-hover:text-[#aaaaf0]
                       truncate w-full text-center leading-tight tracking-widest">
        {config.name || config.id.replace('macro-', '#')}
      </span>

      <span className="text-[7px] text-[#5a5a7e] group-hover:text-[#7a7aaa]">
        {value.toFixed(2)}
      </span>
    </button>
  )
}

// ============================================================
// EditDialog — ノブ名・MIDI CC 編集（v1簡易版）
// ============================================================

interface EditDialogProps {
  config: MacroKnobConfig
  onSave: (name: string, midiCC: number) => void
  onClose: () => void
}

function EditDialog({ config, onSave, onClose }: EditDialogProps) {
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
        className="bg-[#0f0f1e] border border-[#3a3a6e] rounded-lg p-5
                   text-white font-mono text-xs"
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
              <div key={i} className="text-[#5555aa] text-[9px] py-0.5">
                {a.paramId} [{a.min}…{a.max}]
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
// MacroKnobPanel — メインコンポーネント
// ============================================================

export function MacroKnobPanel() {
  const [knobs, setKnobs] = useState<MacroKnobConfig[]>([])
  const [values, setValues] = useState<number[]>(new Array(32).fill(0))
  const [editingId, setEditingId] = useState<string | null>(null)
  const { pos, handleMouseDown } = useDraggable({ x: window.innerWidth / 2 - 200, y: 16 })

  useEffect(() => {
    const sync = () => {
      const configs = macroKnobManager.getKnobs()
      setKnobs([...configs])
      setValues(configs.map((k) => macroKnobManager.getValue(k.id)))
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
    const current = macroKnobManager.getKnobs().find((k) => k.id === editingId)
    if (!current) return
    macroKnobManager.setKnob(editingId, { ...current, name, midiCC })
    setEditingId(null)
  }, [editingId])

  const handleClose = useCallback(() => {
    setEditingId(null)
  }, [])

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
        {/* ヘッダー（ドラッグハンドル） */}
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
                />
              )
            })
          )}
        </div>
      </div>

      {editingConfig && (
        <EditDialog
          config={editingConfig}
          onSave={handleSave}
          onClose={handleClose}
        />
      )}
    </>
  )
}
