/**
 * ClipGrid — 3列（L1/L2/L3）× 5行の Clip グリッド
 *
 * - 空セル [ + ]: クリックで現在のレイヤー状態を Preset として保存
 * - 有りセル: クリックで replaceLayerPreset を発火
 * - [▶]: 行全体（Scene）を同時起動
 * - グリッドデータは localStorage: geography:clip-grid-v1 に保存
 *
 * spec: docs/spec/layer-window.spec.md §3
 */

import { useEffect, useRef, useState } from 'react'
import { engine } from '../../../../application/orchestrator/engine'
import { parseLayerPresetSafe } from '../../../../application/schema/zod/layerPreset.schema'
import type { LayerPreset } from '../../../../application/schema'
import { loadLayerPresetFolders } from '../../../../application/adapter/storage/layerPresetStore'
import type { PresetFolder } from '../../../../application/adapter/storage/layerPresetStore'
import { readJson, writeJson } from '../../../../application/adapter/storage/fileStore'
import { useGeoStore } from '../../../store/geoStore'
import { ClipCell } from './ClipCell'
const LAYER_IDS    = ['layer-1', 'layer-2', 'layer-3'] as const
const LAYER_COLORS = ['#5a5aff', '#5affaa', '#ffaa5a'] as const
const ROW_COUNT    = 5
const CLIP_FILE    = 'clip-grid.json'
const LS_CLIP_KEY  = 'geography:clip-grid-v1' // 移行元（旧 localStorage キー）

// grid[layerIndex][rowIndex] = LayerPreset | null
type Grid = (LayerPreset | null)[][]

function emptyGrid(): Grid {
  return Array.from({ length: 3 }, () => Array(ROW_COUNT).fill(null))
}

async function loadGrid(): Promise<Grid> {
  try {
    const data = await readJson(CLIP_FILE)
    if (!data || !Array.isArray(data)) return emptyGrid()
    return (data as unknown[][]).map((col) =>
      col.map((cell) => parseLayerPresetSafe(cell))
    )
  } catch {
    return emptyGrid()
  }
}

async function saveGrid(grid: Grid): Promise<void> {
  try {
    await writeJson(CLIP_FILE, grid)
  } catch { /* ignore */ }
}

export function ClipGrid() {
  const [grid, setGrid] = useState<Grid>(emptyGrid)
  const [activeCells, setActiveCells] = useState<number[]>([-1, -1, -1])
  const [presetFolders, setPresetFolders] = useState<PresetFolder[]>([])
  const [dragSource, setDragSource] = useState<{ li: number; ri: number } | null>(null)
  const [dropTarget, setDropTarget] = useState<{ li: number; ri: number } | null>(null)
  const isCopyModeRef = useRef(false)
  const fileStoreReady = useGeoStore((s) => s.fileStoreReady)

  // fileStore が ready になってから読み込む（タイミング問題の解決）
  useEffect(() => {
    if (!fileStoreReady) return
    loadGrid().then(async (grid) => {
      // fileStore が空 & localStorage に旧データがあれば移行
      const hasData = grid.some((col) => col.some((cell) => cell !== null))
      if (!hasData) {
        const raw = localStorage.getItem(LS_CLIP_KEY)
        if (raw) {
          try {
            const migrated = (JSON.parse(raw) as unknown[][]).map((col) =>
              col.map((cell) => parseLayerPresetSafe(cell))
            )
            setGrid(migrated)
            await saveGrid(migrated)
            localStorage.removeItem(LS_CLIP_KEY)
            console.info('[ClipGrid] localStorage → fileStore 移行完了')
            return
          } catch { /* ignore */ }
        }
      }
      setGrid(grid)
    })
    loadPresetFolders()
  }, [fileStoreReady])

  async function loadPresetFolders() {
    const folders = await loadLayerPresetFolders()
    setPresetFolders(folders)
  }

  // セルクリック
  function handleCellClick(layerIndex: number, rowIndex: number) {
    const preset = grid[layerIndex]?.[rowIndex] ?? null
    const layerId = LAYER_IDS[layerIndex]

    if (!preset) {
      // 空セル → 現在の状態を保存
      const geom = engine.getGeometryPlugin(layerId)
      const name = geom?.name ?? `Preset ${rowIndex + 1}`
      const captured = engine.captureLayerPreset(layerId, name)

      const next = grid.map((col, li) =>
        li === layerIndex
          ? col.map((cell, ri) => (ri === rowIndex ? captured : cell))
          : col
      )
      setGrid(next)
      void saveGrid(next)
    } else {
      // 有りセル → replaceLayerPreset
      engine.replaceLayerPreset(layerId, preset)
      setActiveCells((prev) =>
        prev.map((v, i) => (i === layerIndex ? rowIndex : v))
      )
    }
  }

  // ============================================================
  // D&D ハンドラ：Clip の move / swap
  // ============================================================

  function handleClipDragStart(e: React.DragEvent, li: number, ri: number) {
    e.dataTransfer.setData('application/geography-clip', JSON.stringify({ li, ri }))
    e.dataTransfer.effectAllowed = 'copyMove'
    setDragSource({ li, ri })
  }

  function handleClipDragEnd() {
    setDragSource(null)
    setDropTarget(null)
    isCopyModeRef.current = false  // ドラッグ終了時にリセット
  }

  function handleClipDragOver(e: React.DragEvent, li: number, ri: number) {
    if (!e.dataTransfer.types.includes('application/geography-clip')) return
    e.preventDefault()
    isCopyModeRef.current = e.altKey   // Option+D&D = Copy
    e.dataTransfer.dropEffect = e.altKey ? 'copy' : 'move'
    setDropTarget({ li, ri })
  }

  function handleClipDrop(e: React.DragEvent, dstLi: number, dstRi: number) {
    e.preventDefault()
    setDragSource(null)
    setDropTarget(null)
    const raw = e.dataTransfer.getData('application/geography-clip')
    if (!raw) return
    try {
      const { li: srcLi, ri: srcRi } = JSON.parse(raw) as { li: number; ri: number }
      if (srcLi === dstLi && srcRi === dstRi) return
      const srcPreset = grid[srcLi]?.[srcRi] ?? null
      if (!srcPreset) return
      const isCopy = e.altKey || isCopyModeRef.current
      const dstPreset = grid[dstLi]?.[dstRi] ?? null
      const next = grid.map((col, li) =>
        col.map((cell, ri) => {
          if (li === dstLi && ri === dstRi) return srcPreset
          if (!isCopy && li === srcLi && ri === srcRi) return dstPreset  // move/swap: 元セルに dst を入れる
          return cell
        })
      )
      setGrid(next)
      void saveGrid(next)
      // move/swap 時のみ active リセット（copy は src の active を保持）
      if (!isCopy) {
        setActiveCells((prev) => {
          const updated = [...prev]
          if (prev[srcLi] === srcRi) updated[srcLi] = -1
          if (prev[dstLi] === dstRi) updated[dstLi] = -1
          return updated
        })
      } else {
        setActiveCells((prev) => {
          const updated = [...prev]
          if (prev[dstLi] === dstRi) updated[dstLi] = -1
          return updated
        })
      }
    } catch { /* malformed payload は無視 */ }
  }

  // Scene [▶] クリック：行全体を同時起動
  function handleSceneLaunch(rowIndex: number) {
    LAYER_IDS.forEach((layerId, layerIndex) => {
      const preset = grid[layerIndex]?.[rowIndex] ?? null
      if (!preset) return
      engine.replaceLayerPreset(layerId, preset)
    })
    setActiveCells([-1, -1, -1].map((_, i) => {
      const preset = grid[i]?.[rowIndex] ?? null
      return preset ? rowIndex : -1
    }))
  }

  return (
    <div style={{ width: '100%' }}>
      {/* ヘッダー：L1 / L2 / L3 */}
      <div className="flex mb-1" style={{ gap: 3 }}>
        {LAYER_IDS.map((id, i) => (
          <div
            key={id}
            className="flex-1 text-center font-mono tracking-widest"
            style={{ fontSize: 9, color: LAYER_COLORS[i], paddingLeft: 4 }}
          >
            {id.replace('layer-', 'L')}
          </div>
        ))}
        <div style={{ width: 24 }} />
      </div>

      {/* グリッド行 */}
      {Array.from({ length: ROW_COUNT }, (_, rowIndex) => (
        <div key={rowIndex} className="flex items-center mb-1" style={{ gap: 3 }}>
          {/* 3セル */}
          {LAYER_IDS.map((layerId, layerIndex) => {
            const preset = grid[layerIndex]?.[rowIndex] ?? null
            const isDragging = dragSource?.li === layerIndex && dragSource?.ri === rowIndex
            const isDragOver = dropTarget?.li === layerIndex && dropTarget?.ri === rowIndex && !isDragging
            return (
            <div
              key={layerId}
              className="flex-1"
              style={{
                minWidth: 0,
                overflow: 'hidden',
                opacity: isDragging ? 0.35 : 1,
                outline: isDragOver ? '1px solid #ffffff66' : 'none',
                borderRadius: 4,
                transition: 'opacity 0.1s',
              }}
              draggable={!!preset && dragSource === null}
              onDragStart={(e) => handleClipDragStart(e, layerIndex, rowIndex)}
              onDragEnd={handleClipDragEnd}
              onDragOver={(e) => handleClipDragOver(e, layerIndex, rowIndex)}
              onDrop={(e) => handleClipDrop(e, layerIndex, rowIndex)}
            >
              <ClipCell
                preset={grid[layerIndex]?.[rowIndex] ?? null}
                isActive={activeCells[layerIndex] === rowIndex}
                color={LAYER_COLORS[layerIndex] as string}
                onClick={() => handleCellClick(layerIndex, rowIndex)}
                presetFolders={presetFolders}
                onAssign={(preset) => {
                  const next = grid.map((col, li) =>
                    li === layerIndex
                      ? col.map((cell, ri) => (ri === rowIndex ? preset : cell))
                      : col
                  )
                  setGrid(next)
                  void saveGrid(next)
                }}
                onClear={() => {
                  const next = grid.map((col, li) =>
                    li === layerIndex
                      ? col.map((cell, ri) => (ri === rowIndex ? null : cell))
                      : col
                  )
                  setGrid(next)
                  void saveGrid(next)
                }}
              />
            </div>
            )
          })}

          {/* Scene Launch [▶] */}
          <button
            onClick={() => handleSceneLaunch(rowIndex)}
            className="flex items-center justify-center rounded font-mono
                       transition-colors hover:bg-[#1a1a3e]"
            style={{
              width: 24,
              height: 36,
              flexShrink: 0,
              background: '#0d0d1a',
              border: '1px solid #1e1e3a',
              color: '#3a3a6e',
              fontSize: 10,
              cursor: 'pointer',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = '#aaaaff'
              e.currentTarget.style.borderColor = '#3a3a6e'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = '#3a3a6e'
              e.currentTarget.style.borderColor = '#1e1e3a'
            }}
            title={`Scene ${rowIndex + 1} を起動`}
          >
            ▶
          </button>
        </div>
      ))}
    </div>
  )
}
