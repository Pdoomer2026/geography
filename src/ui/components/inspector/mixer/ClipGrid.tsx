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

import { useEffect, useState } from 'react'
import { engine } from '../../../../application/orchestrator/engine'
import { parseLayerPresetSafe } from '../../../../application/schema/zod/layerPreset.schema'
import type { LayerPreset } from '../../../../application/schema'
import { loadLayerPresetFolders } from '../../../../application/adapter/storage/layerPresetStore'
import type { PresetFolder } from '../../../../application/adapter/storage/layerPresetStore'
import { ClipCell } from './ClipCell'
const LAYER_IDS    = ['layer-1', 'layer-2', 'layer-3'] as const
const LAYER_COLORS = ['#5a5aff', '#5affaa', '#ffaa5a'] as const
const ROW_COUNT    = 5
const STORAGE_KEY  = 'geography:clip-grid-v1'

// grid[layerIndex][rowIndex] = LayerPreset | null
type Grid = (LayerPreset | null)[][]

function emptyGrid(): Grid {
  return Array.from({ length: 3 }, () => Array(ROW_COUNT).fill(null))
}

function loadGrid(): Grid {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return emptyGrid()
    const parsed = JSON.parse(raw) as unknown[][]
    return parsed.map((col) =>
      col.map((cell) => parseLayerPresetSafe(cell))
    )
  } catch {
    return emptyGrid()
  }
}

function saveGrid(grid: Grid): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(grid))
  } catch { /* ignore */ }
}

export function ClipGrid() {
  const [grid, setGrid] = useState<Grid>(emptyGrid)
  const [activeCells, setActiveCells] = useState<number[]>([-1, -1, -1])
  const [presetFolders, setPresetFolders] = useState<PresetFolder[]>([])

  // 初回ロード
  useEffect(() => {
    setGrid(loadGrid())
    loadPresetFolders()
  }, [])

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
      saveGrid(next)
    } else {
      // 有りセル → replaceLayerPreset
      engine.replaceLayerPreset(layerId, preset)
      setActiveCells((prev) =>
        prev.map((v, i) => (i === layerIndex ? rowIndex : v))
      )
    }
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
          {LAYER_IDS.map((layerId, layerIndex) => (
            <div key={layerId} className="flex-1">
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
                  saveGrid(next)
                }}
                onClear={() => {
                  const next = grid.map((col, li) =>
                    li === layerIndex
                      ? col.map((cell, ri) => (ri === rowIndex ? null : cell))
                      : col
                  )
                  setGrid(next)
                  saveGrid(next)
                }}
              />
            </div>
          ))}

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
