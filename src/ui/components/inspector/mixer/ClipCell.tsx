/**
 * ClipCell — Mixer グリッドの個別セル
 *
 * 状態:
 *   空セル   → [ + ]（クリックで現在の Layer 状態を Preset として保存）
 *   有りセル → Preset 名ブロック（クリックで replaceLayerPreset）
 *   再生中   → ハイライト枠 + ● インジケーター
 *
 * spec: docs/spec/layer-window.spec.md §3
 */

import type { LayerPreset } from '../../../../application/schema'

interface ClipCellProps {
  preset:   LayerPreset | null
  isActive: boolean
  color:    string   // レイヤーカラー（L1:#5a5aff / L2:#5affaa / L3:#ffaa5a）
  onClick:  () => void
}

export function ClipCell({ preset, isActive, color, onClick }: ClipCellProps) {
  // 空セル
  if (!preset) {
    return (
      <button
        onClick={onClick}
        className="flex items-center justify-center rounded transition-colors"
        style={{
          width: '100%',
          height: 36,
          background: '#0d0d1a',
          border: '1px dashed #1e1e3a',
          color: '#2a2a4e',
          fontSize: 14,
          cursor: 'pointer',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = color
          e.currentTarget.style.color = color
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = '#1e1e3a'
          e.currentTarget.style.color = '#2a2a4e'
        }}
      >
        +
      </button>
    )
  }

  // Preset あり（再生中 or 未再生）
  return (
    <button
      onClick={onClick}
      className="relative flex items-center rounded overflow-hidden transition-all"
      style={{
        width: '100%',
        height: 36,
        background: isActive
          ? `${color}22`
          : '#111122',
        border: `1px solid ${isActive ? color : '#2a2a4e'}`,
        cursor: 'pointer',
        padding: '0 8px',
        boxShadow: isActive ? `0 0 8px ${color}44` : 'none',
      }}
    >
      {/* 左端のカラーバー */}
      <div
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          bottom: 0,
          width: 3,
          background: isActive ? color : `${color}55`,
          borderRadius: '2px 0 0 2px',
        }}
      />

      {/* Preset 名 */}
      <span
        className="font-mono tracking-wider truncate"
        style={{
          fontSize: 9,
          color: isActive ? color : '#5a5a8e',
          marginLeft: 8,
          flex: 1,
          textAlign: 'left',
        }}
      >
        {preset.name}
      </span>

      {/* 再生中インジケーター */}
      {isActive && (
        <span
          style={{
            width: 6,
            height: 6,
            borderRadius: '50%',
            background: color,
            flexShrink: 0,
            boxShadow: `0 0 4px ${color}`,
          }}
        />
      )}
    </button>
  )
}
