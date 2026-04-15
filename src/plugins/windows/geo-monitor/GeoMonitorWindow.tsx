/**
 * GeoMonitorWindow
 * spec: SDK v2.2 §4.1 GeoMonitor (Essential Debugger)
 *
 * TransportRegistry の状態をリアルタイムに監視するデバッグ用 Window。
 *
 * 目的:
 *   1. 開発者に「目」を与え、値が正しく流れているかを確認する
 *   2. WASM 化後もエンジン内部に触れず、Registry の入出力だけで開発を完結させる
 *   3. Sequencer / LFO 開発時に「どの CC に値が流れているか」を即座に確認できる
 *
 * Day62: useAllParams Hook + engine ファサード確定に伴い新設。
 *
 * 含めないもの:
 *   - 値の編集機能（読み取り専用）
 *   - Plugin の設定変更
 */

import { useState } from 'react'
import { useAllParams } from '../../../ui/hooks/useParam'
import { useDraggable } from '../../../ui/useDraggable'
import type { RegisteredParameterWithCC } from '../../../types/midi-registry'

const LAYER_TABS = ['all', 'layer-1', 'layer-2', 'layer-3'] as const
type LayerFilter = (typeof LAYER_TABS)[number]

// ============================================================
// GeoMonitorWindow
// ============================================================

export function GeoMonitorWindow() {
  const [collapsed, setCollapsed] = useState(false)
  const [layerFilter, setLayerFilter] = useState<LayerFilter>('all')
  const [search, setSearch] = useState('')
  const { pos, handleMouseDown } = useDraggable({ x: 16, y: 16 })

  const all = useAllParams(layerFilter === 'all' ? undefined : layerFilter)

  const filtered = all.filter((p: RegisteredParameterWithCC) => {
    if (!search) return true
    const q = search.toLowerCase()
    return (
      p.pluginId.toLowerCase().includes(q) ||
      p.id.toLowerCase().includes(q) ||
      p.name.toLowerCase().includes(q) ||
      String(p.ccNumber).includes(q)
    )
  })

  // layerId 別にグループ化
  const groups = filtered.reduce<Record<string, RegisteredParameterWithCC[]>>((acc, p) => {
    const key = `${p.layerId} · ${p.pluginId}`
    if (!acc[key]) acc[key] = []
    acc[key].push(p)
    return acc
  }, {})

  return (
    <div
      className="fixed z-[90] font-mono text-xs select-none"
      style={{ left: pos.x, top: pos.y, width: 420 }}
    >
      <div
        className="bg-[#080810] border border-[#2a2a4e] rounded-lg overflow-hidden"
        style={{ padding: '10px 14px' }}
      >
        {/* ヘッダー */}
        <div
          onMouseDown={handleMouseDown}
          className="flex items-center justify-between mb-2"
          style={{ cursor: 'grab' }}
        >
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-[#55ff99] tracking-widest">GEO MONITOR</span>
            <span className="text-[9px] text-[#3a5a3e]">
              {filtered.length} params
            </span>
            {/* レイヤーフィルタ */}
            <div className="flex gap-1">
              {LAYER_TABS.map((id) => (
                <button
                  key={id}
                  onClick={() => setLayerFilter(id)}
                  className="text-[8px] rounded px-1.5 py-0.5 border transition-colors"
                  style={{
                    background: layerFilter === id ? '#0a2a1a' : '#0a0a18',
                    borderColor: layerFilter === id ? '#33aa66' : '#1a2a2e',
                    color: layerFilter === id ? '#55ff99' : '#3a5a4e',
                  }}
                >
                  {id === 'all' ? 'ALL' : id.replace('layer-', 'L')}
                </button>
              ))}
            </div>
          </div>
          <button
            onClick={() => setCollapsed((c) => !c)}
            className="text-[#3a5a4e] hover:text-[#55ff99] transition-colors text-[11px] leading-none"
          >
            {collapsed ? '＋' : '－'}
          </button>
        </div>

        {!collapsed && (
          <>
            {/* 検索 */}
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="search pluginId / paramId / CC..."
              className="w-full mb-2 px-2 py-1 text-[9px] rounded border outline-none"
              style={{
                background: '#0a0a18',
                borderColor: '#1a2a2e',
                color: '#55ff99',
              }}
            />

            {/* パラメータ一覧 */}
            <div
              className="overflow-y-auto"
              style={{ maxHeight: 400 }}
            >
              {Object.keys(groups).length === 0 && (
                <div className="text-[#3a5a4e] text-[10px] py-4 text-center">
                  — no params registered —
                </div>
              )}
              {Object.entries(groups).map(([groupKey, params]) => (
                <div key={groupKey} className="mb-3">
                  {/* グループヘッダー */}
                  <div
                    className="text-[9px] mb-1 pb-0.5 border-b"
                    style={{ color: '#33aa66', borderColor: '#1a2a3e' }}
                  >
                    {groupKey}
                  </div>
                  {/* パラメータ行 */}
                  {params.map((p) => {
                    const pct = p.max > p.min
                      ? ((p.value - p.min) / (p.max - p.min)) * 100
                      : 0
                    return (
                      <div
                        key={`${p.layerId}-${p.ccNumber}`}
                        className="flex items-center gap-2 py-0.5"
                      >
                        {/* CC番号 */}
                        <span
                          className="text-[8px] tabular-nums shrink-0"
                          style={{ color: '#2a6a4e', width: 28 }}
                        >
                          CC{p.ccNumber}
                        </span>
                        {/* param名 */}
                        <span
                          className="text-[9px] truncate shrink-0"
                          style={{ color: '#4a8a6e', width: 96 }}
                        >
                          {p.name}
                        </span>
                        {/* バー */}
                        <div
                          className="flex-1 rounded-full overflow-hidden"
                          style={{ height: 3, background: '#0a1a0e' }}
                        >
                          <div
                            style={{
                              width: `${pct}%`,
                              height: '100%',
                              background: '#33aa66',
                              transition: 'width 0.05s linear',
                            }}
                          />
                        </div>
                        {/* 値 */}
                        <span
                          className="text-[9px] tabular-nums shrink-0 text-right"
                          style={{ color: '#55ff99', width: 44 }}
                        >
                          {p.value.toFixed(p.max <= 0.1 ? 4 : 2)}
                        </span>
                      </div>
                    )
                  })}
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
