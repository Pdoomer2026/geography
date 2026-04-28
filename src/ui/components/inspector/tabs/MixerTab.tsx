/**
 * MixerTab — Inspector の Mixer タブ
 *
 * 上部: ClipGrid（3×5 Clip グリッド + Scene Launch）
 * 下部: Opacity フェーダー × 3 + BlendMode（MixerSimpleWindow から流用）
 *
 * spec: docs/spec/layer-window.spec.md §3
 */

import { useEffect } from 'react'
import { engine } from '../../../../application/orchestrator/engine'
import { useGeoStore } from '../../../../ui/store/geoStore'
import type { CSSBlendMode } from '../../../../application/schema'
import { ClipGrid } from '../mixer/ClipGrid'

const LAYER_COLORS = ['#5a5aff', '#5affaa', '#ffaa5a'] as const
const BLEND_MODES: CSSBlendMode[] = ['normal', 'add', 'multiply', 'screen', 'overlay']

// ============================================================
// 縦フェーダー
// ============================================================

function VerticalFader({
  label, color, value, onChange,
}: {
  label: string
  color: string
  value: number
  onChange: (v: number) => void
}) {
  return (
    <div className="flex flex-col items-center gap-1" style={{ flex: 1 }}>
      <div className="font-mono" style={{ fontSize: 9, color }}>{label}</div>
      <input
        type="range"
        min={0} max={1} step={0.01}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        onClick={(e) => e.stopPropagation()}
        className="cursor-pointer"
        style={{
          writingMode: 'vertical-lr',
          direction: 'rtl',
          height: 80,
          width: 20,
          accentColor: color,
        }}
      />
      <div className="font-mono tabular-nums" style={{ fontSize: 9, color: '#4a4a6e' }}>
        {Math.round(value * 100)}%
      </div>
    </div>
  )
}

// ============================================================
// MixerTab
// ============================================================

export function MixerTab() {
  const { layers, routings, syncLayers } = useGeoStore()

  // 初回同期 + Registry 変化時に再同期
  useEffect(() => {
    syncLayers()
    return engine.onRegistryChanged(syncLayers)
  }, [syncLayers])

  function handleOpacity(layerId: string, value: number) {
    const r = routings.find((r) => r.layerId === layerId)
    if (!r) return
    engine.setLayerRouting(layerId, value, r.editOpacity)
    syncLayers()
  }

  function handleBlend(layerId: string, mode: CSSBlendMode) {
    engine.setLayerBlendMode(layerId, mode)
    syncLayers()
  }

  return (
    <div className="flex flex-col gap-4">

      {/* Clip グリッド */}
      <ClipGrid />

      {/* セパレーター */}
      <div style={{ borderTop: '1px solid #1a1a2e' }} />

      {/* OUTPUT フェーダー */}
      <div>
        <div className="font-mono tracking-widest mb-2"
             style={{ fontSize: 9, color: '#3a3a6e' }}>
          OUTPUT
        </div>
        <div className="flex gap-2" style={{ height: 110 }}>
          {layers.map((layer, i) => {
            const r = routings.find((r) => r.layerId === layer.id)
            return (
              <VerticalFader
                key={layer.id}
                label={`L${i + 1}`}
                color={LAYER_COLORS[i] as string}
                value={r?.outputOpacity ?? 1}
                onChange={(v) => handleOpacity(layer.id, v)}
              />
            )
          })}
        </div>
      </div>

      {/* BlendMode */}
      <div>
        <div className="font-mono tracking-widest mb-2"
             style={{ fontSize: 9, color: '#3a3a6e' }}>
          BLEND
        </div>
        <div className="flex flex-col gap-1">
          {layers.map((layer, i) => {
            return (
              <div key={layer.id} className="flex items-center gap-2">
                <span className="font-mono" style={{ fontSize: 9, color: LAYER_COLORS[i], width: 20 }}>
                  L{i + 1}
                </span>
                <select
                  value={layers.find((l) => l.id === layer.id)?.blendMode ?? 'normal'}
                  onChange={(e) => handleBlend(layer.id, e.target.value as CSSBlendMode)}
                  className="flex-1 font-mono rounded"
                  style={{
                    fontSize: 9,
                    background: '#0d0d1a',
                    border: '1px solid #2a2a4e',
                    color: '#7a7aaa',
                    padding: '2px 4px',
                  }}
                >
                  {BLEND_MODES.map((m) => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </div>
            )
          })}
        </div>
      </div>

    </div>
  )
}
