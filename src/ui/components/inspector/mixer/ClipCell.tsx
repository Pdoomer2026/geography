/**
 * ClipCell — Mixer グリッドの個別セル
 *
 * 状態:
 *   空セル   → [ + ]（クリックで現在の Layer 状態を Preset として保存）
 *   有りセル → Preset 名ブロック（クリックで replaceLayerPreset）
 *   再生中   → ハイライト枠 + ● インジケーター
 *
 * 右クリック → コンテキストメニュー（Load →L1/L2/L3 / Clear Clip）
 *
 * spec: docs/spec/layer-window.spec.md §3
 */

import { useEffect, useRef, useState } from 'react'
import type { LayerPreset } from '../../../../application/schema'

interface PresetFolder {
  folder: string
  presets: LayerPreset[]
}

interface ClipCellProps {
  preset:        LayerPreset | null
  isActive:      boolean
  color:         string
  presetFolders: PresetFolder[]
  onClick:       () => void
  onAssign:      (preset: LayerPreset) => void
  onClear:       () => void
}

export function ClipCell({ preset, isActive, color, presetFolders, onClick, onAssign, onClear }: ClipCellProps) {
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null)
  const [hoveredFolder, setHoveredFolder] = useState<string | null>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  // メニュー外クリックで閉じる
  useEffect(() => {
    if (!contextMenu) return
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setContextMenu(null)
      }
    }
    window.addEventListener('mousedown', handleClick)
    return () => window.removeEventListener('mousedown', handleClick)
  }, [contextMenu])

  function handleContextMenu(e: React.MouseEvent) {
    if (!preset) return  // 空セルは右クリックメニューなし
    e.preventDefault()
    e.stopPropagation()
    setContextMenu({ x: e.clientX, y: e.clientY })
  }

  // 空セル
  if (!preset) {
    return (
      <button
        onClick={onClick}
        className="flex items-center justify-center rounded transition-colors"
        style={{
          width: '100%', height: 36,
          background: '#0d0d1a', border: '1px dashed #1e1e3a',
          color: '#2a2a4e', fontSize: 14, cursor: 'pointer',
        }}
        onMouseEnter={(e) => { e.currentTarget.style.borderColor = color; e.currentTarget.style.color = color }}
        onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#1e1e3a'; e.currentTarget.style.color = '#2a2a4e' }}
      >
        +
      </button>
    )
  }

  return (
    <>
      <button
        onClick={onClick}
        onContextMenu={handleContextMenu}
        className="relative flex items-center rounded overflow-hidden transition-all"
        style={{
          width: '100%', height: 36,
          background: isActive ? `${color}22` : '#111122',
          border: `1px solid ${isActive ? color : '#2a2a4e'}`,
          cursor: 'pointer', padding: '0 8px',
          boxShadow: isActive ? `0 0 8px ${color}44` : 'none',
        }}
      >
        {/* 左端カラーバー */}
        <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 3,
          background: isActive ? color : `${color}55`, borderRadius: '2px 0 0 2px' }} />

        {/* Preset 名 */}
        <span className="font-mono tracking-wider truncate"
          style={{ fontSize: 9, color: isActive ? color : '#5a5a8e', marginLeft: 8, flex: 1, textAlign: 'left' }}>
          {preset.name}
        </span>

        {/* 再生中インジケーター */}
        {isActive && (
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: color,
            flexShrink: 0, boxShadow: `0 0 4px ${color}` }} />
        )}
      </button>

      {/* コンテキストメニュー */}
      {contextMenu && (
        <div
          ref={menuRef}
          className="fixed z-[600] bg-[#0f0f1e] border border-[#3a3a6e] rounded shadow-lg font-mono"
          style={{ left: contextMenu.x, top: contextMenu.y, minWidth: 180 }}
          onMouseDown={(e) => e.stopPropagation()}
        >
          {/* ASSIGN PRESET */}
          {presetFolders.length > 0 && (
            <div style={{ padding: '4px 0', borderBottom: '1px solid #1a1a2e', position: 'relative' }}>
              <div style={{ fontSize: 8, color: '#3a3a6e', padding: '2px 12px', letterSpacing: '0.1em' }}>ASSIGN PRESET</div>
              {presetFolders.map((folder) => (
                <div key={folder.folder} style={{ position: 'relative' }}
                  onMouseEnter={() => setHoveredFolder(folder.folder)}
                  onMouseLeave={() => setHoveredFolder(null)}>
                  <div
                    className="flex items-center justify-between px-3 py-1.5 hover:bg-[#1a1a3e] transition-colors cursor-default"
                    style={{ fontSize: 10, color: '#8888bb' }}
                  >
                    <span>{folder.folder}</span>
                    <span style={{ fontSize: 8, color: '#4a4a6e' }}>▶</span>
                  </div>

                  {/* サブメニュー */}
                  {hoveredFolder === folder.folder && (
                    <div
                      className="fixed bg-[#0f0f1e] border border-[#3a3a6e] rounded shadow-lg"
                      style={{ left: contextMenu.x + 180, top: contextMenu.y, minWidth: 160, zIndex: 700 }}
                    >
                      {folder.presets.map((p) => (
                        <button
                          key={p.id}
                          onClick={() => { onAssign(p); setContextMenu(null); setHoveredFolder(null) }}
                          className="w-full text-left px-3 py-1.5 hover:bg-[#1a1a3e] transition-colors"
                          style={{ fontSize: 10, color: '#aaaacc' }}
                        >
                          {p.name}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Clear */}
          <div style={{ padding: '4px 0' }}>
            <button
              onClick={() => { onClear(); setContextMenu(null) }}
              className="w-full text-left px-3 py-1.5 hover:bg-[#1a1a3e] transition-colors flex items-center gap-2"
              style={{ fontSize: 10, color: '#aa5a5a' }}
            >
              <span>✕</span> Clear Clip
            </button>
          </div>
        </div>
      )}
    </>
  )
}

