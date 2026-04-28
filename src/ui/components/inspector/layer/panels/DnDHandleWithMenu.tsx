/**
 * DnDHandleWithMenu
 *
 * Inspector Panel の ParamRow 用 D&D ハンドル（≡）。
 *
 * ## 責務
 *   - draggable な ≡ ハンドルの描画
 *   - アサイン済みのとき右上にオレンジドット表示
 *   - 右クリックでコンテキストメニュー（左方向展開）
 *   - メニューから「{Knob名} を解除」操作
 *
 * ## アーキテクチャ
 *   UI はこのコンポーネントを通じて onRemoveAssign を呼ぶだけ。
 *   engine への直接アクセスは行わない（geoStore 経由を useStandardDnDParamRow が担う）。
 *
 * ## メニュー位置
 *   Inspector は画面右寄せのため左方向に展開する。
 *   ClipCell.tsx の ContextMenuWrapper と同じ設計思想。
 *   right: window.innerWidth - e.clientX でメニューの右端をクリック位置に固定し、
 *   メニューは左へ伸びる。
 */

import { useEffect, useRef, useState } from 'react'

// ============================================================
// Props
// ============================================================

export interface DnDHandleWithMenuProps {
  /** パラメーター名（tooltip 用）*/
  paramName: string
  /** ドラッグ中フラグ */
  isDragging: boolean
  /** proposal の lo/hi を逆転させるフラグ */
  inverted: boolean
  /** ドラッグ開始 */
  onDragStart: (e: React.DragEvent) => void
  /** ドラッグ終了 */
  onDragEnd: () => void
  /** inverted フラグをトグル */
  onToggleInverted: () => void
  /** アサイン済みノブ一覧（空 = 未アサイン）*/
  assignedKnobs: { knobId: string; name: string }[]
  /** アサイン削除コールバック */
  onRemoveAssign: (knobId: string) => void
}

// ============================================================
// Component
// ============================================================

export function DnDHandleWithMenu({
  paramName,
  isDragging,
  inverted,
  onDragStart,
  onDragEnd,
  onToggleInverted,
  assignedKnobs,
  onRemoveAssign,
}: DnDHandleWithMenuProps) {
  const [menu, setMenu] = useState<{ rightOffset: number; top: number } | null>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const isAssigned = assignedKnobs.length > 0

  // メニュー外クリックで閉じる（ClipCell と同じパターン）
  useEffect(() => {
    if (!menu) return
    function handleMouseDown(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenu(null)
      }
    }
    window.addEventListener('mousedown', handleMouseDown)
    return () => window.removeEventListener('mousedown', handleMouseDown)
  }, [menu])

  function handleContextMenu(e: React.MouseEvent) {
    if (!isAssigned) return
    e.preventDefault()
    e.stopPropagation()
    // Inspector は右寄せなのでメニューを左方向に展開する
    // right: window.innerWidth - e.clientX でメニューの右端 = クリック位置
    setMenu({ rightOffset: window.innerWidth - e.clientX, top: e.clientY })
  }

  function handleRemove(knobId: string) {
    onRemoveAssign(knobId)
    setMenu(null)
  }

  return (
    <>
      {/* ≡ ハンドル + ⇅ 逆転トグル */}
      <div className="flex items-center gap-0.5 shrink-0">
        <div
          draggable
          onDragStart={onDragStart}
          onDragEnd={onDragEnd}
          onContextMenu={handleContextMenu}
          className="relative flex items-center justify-center rounded cursor-grab"
          style={{
            width: 14,
            height: 14,
            fontSize: 9,
            color: isDragging ? '#9090ff' : isAssigned ? '#a0c4ff' : '#3a3a6e',
            background: isDragging ? '#1a1a4e' : 'transparent',
            userSelect: 'none',
          }}
          title={
            isAssigned
              ? `${paramName}：アサイン済み（右クリックで解除）`
              : `${paramName} をドラッグして MacroKnob にアサイン`
          }
        >
          ≡
          {/* アサイン済みドット */}
          {isAssigned && (
            <span
              style={{
                position: 'absolute',
                top: 0,
                right: 0,
                width: 4,
                height: 4,
                borderRadius: '50%',
                background: '#ff9944',
                boxShadow: '0 0 3px #ff9944aa',
                pointerEvents: 'none',
              }}
            />
          )}
        </div>

        {/* ⇅ 逆転トグル */}
        <button
          onClick={(e) => { e.stopPropagation(); onToggleInverted() }}
          style={{
            width: 12,
            height: 14,
            fontSize: 8,
            border: `1px solid ${inverted ? '#ff9944' : '#3a3a5e'}`,
            borderRadius: 2,
            cursor: 'pointer',
            background: inverted ? '#ff9944' : 'transparent',
            color: inverted ? '#fff' : '#6666aa',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 0,
            flexShrink: 0,
          }}
          title={inverted ? '逆転ON（Knob↑でparam↓）' : '逆転OFF（クリックで逆転）'}
        >
          ⇅
        </button>
      </div>

      {/* コンテキストメニュー（左方向展開）*/}
      {menu && (
        <div
          ref={menuRef}
          className="fixed z-[600] bg-[#0f0f1e] border border-[#3a3a6e] rounded shadow-lg font-mono"
          style={{ right: menu.rightOffset, top: menu.top, minWidth: 160 }}
          onMouseDown={(e) => e.stopPropagation()}
        >
          <div style={{ fontSize: 8, color: '#3a3a6e', padding: '4px 10px 2px', letterSpacing: '0.1em' }}>
            MACRO ASSIGN
          </div>
          {assignedKnobs.map((knob) => (
            <button
              key={knob.knobId}
              onClick={() => handleRemove(knob.knobId)}
              className="w-full text-left px-3 py-1.5 hover:bg-[#1a1a3e] transition-colors flex items-center gap-2"
              style={{ fontSize: 10, color: '#aa5a5a' }}
            >
              <span>✕</span>
              <span className="truncate">{knob.name} を解除</span>
            </button>
          ))}
        </div>
      )}
    </>
  )
}
