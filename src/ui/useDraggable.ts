/**
 * useDraggable — フローティングパネル用ドラッグ移動フック
 *
 * 使い方:
 *   const { pos, handleMouseDown } = useDraggable({ x: 100, y: 20 })
 *
 *   // パネルの style に pos を適用
 *   <div style={{ position: 'fixed', left: pos.x, top: pos.y }}>
 *     // ヘッダー（ドラッグハンドル）
 *     <div onMouseDown={handleMouseDown} style={{ cursor: 'grab' }}>...</div>
 *   </div>
 */

import { useState, useCallback, useRef } from 'react'

interface Position {
  x: number
  y: number
}

export function useDraggable(initialPos: Position) {
  const [pos, setPos] = useState<Position>(initialPos)
  const dragging = useRef(false)
  const offset = useRef<Position>({ x: 0, y: 0 })

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    // 子要素のボタン・input 上ではドラッグを起動しない
    const target = e.target as HTMLElement
    if (target.closest('button, input, select, textarea')) return

    dragging.current = true
    offset.current = {
      x: e.clientX - pos.x,
      y: e.clientY - pos.y,
    }
    e.preventDefault()

    const onMouseMove = (ev: MouseEvent) => {
      if (!dragging.current) return
      setPos({
        x: Math.max(0, ev.clientX - offset.current.x),
        y: Math.max(0, ev.clientY - offset.current.y),
      })
    }

    const onMouseUp = () => {
      dragging.current = false
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mouseup', onMouseUp)
    }

    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseup', onMouseUp)
  }, [pos.x, pos.y])

  return { pos, handleMouseDown }
}
