/**
 * FxWindowPlugin
 * spec: docs/spec/plugin-manager.spec.md §4-2
 *
 * FX Plugin 専用 UI。
 * v1 最小実装:
 *   ① FX ON/OFF トグル（props で enabled を受け取る・engine を直接知らない）
 *   ② params → ParamRow 動的生成（MIDIRegistry 経由・SimpleWindowPlugin と統一）
 *   ③ engine.handleMidiCC() でパラメータ変更
 *
 * コントリビューター向け設計原則:
 *   - params は props から受け取るだけ（ccMapService を知らない）
 *   - enabled / onToggle は props から受け取るだけ（engine を直接呼ばない）
 *   - SimpleWindowPlugin と同じパターンで実装できる
 *
 * v1 に含めないもの:
 *   - RangeSlider（可動域制約）
 *   - D&D ハンドル（MacroKnob アサイン）
 */

import { useState } from 'react'
import { engine } from '../../../core/engine'
import { useDraggable } from '../../../ui/useDraggable'
import type { RegisteredParameterWithCC } from '../../../types/midi-registry'

// ============================================================
// Props
// ============================================================

export interface FxGroup {
  pluginId: string
  pluginName: string
  enabled: boolean
  params: RegisteredParameterWithCC[]
}

export interface FxWindowPluginProps {
  layerId: string
  fxGroups: FxGroup[]
  onToggle: (fxId: string, enabled: boolean) => void
}

// ============================================================
// FxWindowPlugin
// ============================================================

export function FxWindowPlugin({ layerId, fxGroups, onToggle }: FxWindowPluginProps) {
  const [collapsed, setCollapsed] = useState(false)
  const { pos, handleMouseDown } = useDraggable({ x: window.innerWidth - 300, y: 16 })

  return (
    <div className="fixed z-50 font-mono text-xs select-none" style={{ left: pos.x, top: pos.y, width: 280 }}>
      <div className="bg-[#0f0f1e] border border-[#2a2a4e] rounded-lg overflow-hidden" style={{ padding: '10px 14px' }}>

        {/* ヘッダー */}
        <div onMouseDown={handleMouseDown} className="flex items-center justify-between mb-2" style={{ cursor: 'grab' }}>
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-[#7878aa] tracking-widest">FX WINDOW</span>
            <span className="text-[9px] text-[#3a3a6e]">{layerId}</span>
          </div>
          <button
            onClick={() => setCollapsed((c) => !c)}
            className="text-[#4a4a6e] hover:text-[#aaaacc] transition-colors text-[11px] leading-none"
          >
            {collapsed ? '＋' : '－'}
          </button>
        </div>

        {/* FX グループ一覧 */}
        {!collapsed && (
          <div className="flex flex-col gap-3">
            {fxGroups.length === 0 && (
              <div className="text-[#3a3a5e] text-[10px] py-2 text-center">— no fx —</div>
            )}
            {fxGroups.map((group) => (
              <FxGroupRow
                key={`${layerId}-${group.pluginId}`}
                group={group}
                onToggle={onToggle}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// ============================================================
// FxGroupRow：1 FX Plugin の行（トグル + ParamRow 群）
// ============================================================

interface FxGroupRowProps {
  group: FxGroup
  onToggle: (fxId: string, enabled: boolean) => void
}

function FxGroupRow({ group, onToggle }: FxGroupRowProps) {
  return (
    <div>
      {/* FX 名 + ON/OFF トグル */}
      <div className="flex items-center justify-between mb-1">
        <span
          className="text-[11px]"
          style={{ color: group.enabled ? '#aaaacc' : '#4a4a6e' }}
        >
          {group.pluginName}
        </span>
        <button
          onClick={() => onToggle(group.pluginId, !group.enabled)}
          className="text-[10px] rounded px-2 py-0.5 border transition-colors"
          style={{
            background: group.enabled ? '#2a2a6e' : '#1a1a2e',
            borderColor: group.enabled ? '#5a5aaa' : '#2a2a4e',
            color: group.enabled ? '#aaaaee' : '#4a4a6e',
          }}
        >
          {group.enabled ? 'ON' : 'OFF'}
        </button>
      </div>

      {/* パラメータ一覧（ON のときのみ表示） */}
      {group.enabled && group.params.length > 0 && (
        <div className="ml-2 flex flex-col gap-1">
          {group.params.map((param) => (
            <ParamRow
              key={`${group.pluginId}-${param.id}`}
              param={param}
            />
          ))}
        </div>
      )}
    </div>
  )
}

// ============================================================
// ParamRow
// ============================================================

interface ParamRowProps {
  param: RegisteredParameterWithCC
}

function ParamRow({ param }: ParamRowProps) {
  const { name, min, max, step, ccNumber } = param
  const [value, setValue] = useState(min)

  const isBinary = min === 0 && max === 1 && step === 1

  function handleChange(raw: number) {
    setValue(raw)
    const normalized = max > min ? (raw - min) / (max - min) : 0
    engine.handleMidiCC({
      cc: ccNumber,
      value: Math.min(1, Math.max(0, normalized)),
      protocol: 'midi2',
      resolution: 4294967296,
    })
  }

  return (
    <div className="flex items-center gap-1.5">
      {/* CC番号 */}
      <span className="text-[8px] text-[#4a4a7e] w-10 shrink-0 tabular-nums">
        CC{ccNumber}
      </span>

      {/* ラベル */}
      <span className="text-[9px] text-[#5a5a8e] w-16 truncate shrink-0">{name}</span>

      {isBinary ? (
        <button
          onClick={() => handleChange(value >= 0.5 ? 0 : 1)}
          className="text-[10px] rounded px-2 py-0.5 border transition-colors"
          style={{
            background: value >= 0.5 ? '#2a2a6e' : '#1a1a2e',
            borderColor: value >= 0.5 ? '#5a5aaa' : '#2a2a4e',
            color: value >= 0.5 ? '#aaaaee' : '#4a4a6e',
          }}
        >
          {value >= 0.5 ? 'ON' : 'OFF'}
        </button>
      ) : (
        <>
          <input
            type="range"
            min={min}
            max={max}
            step={step}
            value={value}
            onChange={(e) => handleChange(parseFloat(e.target.value))}
            className="flex-1 accent-[#5a5aff] h-1 cursor-pointer"
          />
          <span className="text-[9px] text-[#5a5a8e] w-10 text-right tabular-nums shrink-0">
            {value.toFixed(max <= 0.1 ? 4 : 2)}
          </span>
        </>
      )}
    </div>
  )
}
