/**
 * ClipCell — Mixer グリッドの個別セル
 *
 * 【空セル】
 *   クリック      → 現在の Layer 状態を Clip 化してセルに保存
 *   右クリック    → ASSIGN PRESET サブメニュー
 *
 * 【有りセル】
 *   クリック      → そのレイヤーに Preset を反映（再生）
 *   右クリック    → ASSIGN PRESET / Save to Presets / Clear Clip
 *
 * spec: docs/spec/layer-window.spec.md §3
 */

import { useEffect, useRef, useState } from 'react'
import type { LayerPreset } from '../../../../application/schema'
import { saveLayerPreset } from '../../../../application/adapter/storage/layerPresetStore'
import type { PresetFolder } from '../../../../application/adapter/storage/layerPresetStore'

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
  const [savingName, setSavingName] = useState<string>('')
  const [showSaveInput, setShowSaveInput] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const saveInputRef = useRef<HTMLInputElement>(null)

  // メニュー外クリックで閉じる
  useEffect(() => {
    if (!contextMenu) return
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        closeMenu()
      }
    }
    window.addEventListener('mousedown', handleClick)
    return () => window.removeEventListener('mousedown', handleClick)
  }, [contextMenu])

  // Save 入力欄が開いたらフォーカス
  useEffect(() => {
    if (showSaveInput) saveInputRef.current?.focus()
  }, [showSaveInput])

  function closeMenu() {
    setContextMenu(null)
    setHoveredFolder(null)
    setShowSaveInput(false)
    setSavingName('')
  }

  function handleContextMenu(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    setContextMenu({ x: e.clientX, y: e.clientY })
  }

  async function handleSaveToPresets() {
    if (!preset || !savingName.trim()) return
    const name = savingName.trim()
    const updated: LayerPreset = { ...preset, name, id: `preset-${Date.now()}`, createdAt: new Date().toISOString() }
    await saveLayerPreset(name, updated)
    closeMenu()
  }

  // ============================================================
  // 空セル
  // ============================================================
  if (!preset) {
    return (
      <>
        <button
          onClick={onClick}
          onContextMenu={handleContextMenu}
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

        {/* 空セルのコンテキストメニュー（ASSIGN PRESET のみ）*/}
        {contextMenu && presetFolders.length > 0 && (
          <ContextMenuWrapper menuRef={menuRef} y={contextMenu.y}>
            <AssignSection
              presetFolders={presetFolders}
              hoveredFolder={hoveredFolder}
              setHoveredFolder={setHoveredFolder}
              contextMenuY={contextMenu.y}
              onAssign={(p) => { onAssign(p); closeMenu() }}
            />
          </ContextMenuWrapper>
        )}
      </>
    )
  }

  // ============================================================
  // 有りセル
  // ============================================================
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
        <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 3,
          background: isActive ? color : `${color}55`, borderRadius: '2px 0 0 2px' }} />
        <span className="font-mono tracking-wider truncate"
          style={{ fontSize: 9, color: isActive ? color : '#5a5a8e', marginLeft: 8, flex: 1, textAlign: 'left', minWidth: 0 }}>
          {preset.name}
        </span>
        {isActive && (
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: color,
            flexShrink: 0, boxShadow: `0 0 4px ${color}` }} />
        )}
      </button>

      {/* 有りセルのコンテキストメニュー */}
      {contextMenu && (
        <ContextMenuWrapper menuRef={menuRef} y={contextMenu.y}>
          {/* ASSIGN PRESET */}
          {presetFolders.length > 0 && (
            <div style={{ borderBottom: '1px solid #1a1a2e' }}>
              <AssignSection
                presetFolders={presetFolders}
                hoveredFolder={hoveredFolder}
                setHoveredFolder={setHoveredFolder}
                contextMenuY={contextMenu.y}
                onAssign={(p) => { onAssign(p); closeMenu() }}
              />
            </div>
          )}

          {/* Save to Presets */}
          <div style={{ borderBottom: '1px solid #1a1a2e', padding: '4px 0' }}>
            {!showSaveInput ? (
              <button
                onClick={() => { setSavingName(preset.name); setShowSaveInput(true) }}
                className="w-full text-left px-3 py-1.5 hover:bg-[#1a1a3e] transition-colors flex items-center gap-2"
                style={{ fontSize: 10, color: '#aaaacc' }}
              >
                <span>💾</span> Save to Presets
              </button>
            ) : (
              <div className="px-3 py-1.5 flex items-center gap-1">
                <input
                  ref={saveInputRef}
                  type="text"
                  value={savingName}
                  onChange={(e) => setSavingName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSaveToPresets()
                    if (e.key === 'Escape') closeMenu()
                    e.stopPropagation()
                  }}
                  className="flex-1 rounded font-mono"
                  style={{ fontSize: 9, background: '#1a1a2e', border: '1px solid #3a3a6e',
                    color: '#ccccee', padding: '2px 6px', outline: 'none', minWidth: 0 }}
                  placeholder="Preset name..."
                />
                <button
                  onClick={handleSaveToPresets}
                  className="px-2 py-0.5 rounded hover:opacity-80"
                  style={{ fontSize: 9, background: '#2a2a6e', border: '1px solid #5a5aaa', color: '#aaaaee', flexShrink: 0 }}
                >
                  Save
                </button>
              </div>
            )}
          </div>

          {/* Clear Clip */}
          <div style={{ padding: '4px 0' }}>
            <button
              onClick={() => { onClear(); closeMenu() }}
              className="w-full text-left px-3 py-1.5 hover:bg-[#1a1a3e] transition-colors flex items-center gap-2"
              style={{ fontSize: 10, color: '#aa5a5a' }}
            >
              <span>✕</span> Clear Clip
            </button>
          </div>
        </ContextMenuWrapper>
      )}
    </>
  )
}

// ============================================================
// ContextMenuWrapper
// ============================================================

function ContextMenuWrapper({ menuRef, y, children }: {
  menuRef: React.RefObject<HTMLDivElement>
  y: number
  children: React.ReactNode
}) {
  return (
    <div
      ref={menuRef}
      className="fixed z-[600] bg-[#0f0f1e] border border-[#3a3a6e] rounded shadow-lg font-mono"
      style={{ right: 280, top: y, minWidth: 180 }}
      onMouseDown={(e) => e.stopPropagation()}
    >
      {children}
    </div>
  )
}

// ============================================================
// AssignSection（ASSIGN PRESET サブメニュー）
// ============================================================

function AssignSection({ presetFolders, hoveredFolder, setHoveredFolder, contextMenuY, onAssign }: {
  presetFolders: PresetFolder[]
  hoveredFolder: string | null
  setHoveredFolder: (f: string | null) => void
  contextMenuY: number
  onAssign: (p: LayerPreset) => void
}) {
  return (
    <div style={{ padding: '4px 0' }}>
      <div style={{ fontSize: 8, color: '#3a3a6e', padding: '2px 12px', letterSpacing: '0.1em' }}>ASSIGN PRESET</div>
      {presetFolders.map((folder) => (
        <div
          key={folder.folder}
          onMouseEnter={() => setHoveredFolder(folder.folder)}
          style={{ position: 'relative' }}
        >
          <div
            className="flex items-center justify-between px-3 py-1.5 hover:bg-[#1a1a3e] transition-colors cursor-default"
            style={{ fontSize: 10, color: '#8888bb' }}
          >
            <span style={{ fontSize: 8, color: '#4a4a6e' }}>◀</span>
            <span>{folder.folder}</span>
          </div>

          {hoveredFolder === folder.folder && (
            <div
              className="fixed bg-[#0f0f1e] border border-[#3a3a6e] rounded shadow-lg overflow-y-auto"
              style={{ right: 460, top: contextMenuY, minWidth: 160, maxHeight: 300, zIndex: 700 }}
              onMouseEnter={() => setHoveredFolder(folder.folder)}
              onMouseLeave={() => setHoveredFolder(null)}
            >
              {folder.presets.map((p) => (
                <button
                  key={p.id}
                  onClick={() => onAssign(p)}
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
  )
}
