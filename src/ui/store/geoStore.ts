/**
 * GeoStore（Zustand）
 *
 * Application 層の Registry を UI 向けにミラーする薄いキャッシュ。
 * UI はここを読むだけ。engine を直接ポーリングしない。
 *
 * 更新タイミング:
 *   - engine.onParamChanged → syncMacroKnobs()（値の変化）
 *   - setMacroKnob / addMacroAssign 等の mutation 後 → 同上（設定の変化）
 *
 * 将来拡張:
 *   - paramsByLayer: layerId → RegisteredParameterWithCC[]
 *   - fxPlugins:     layerId → FXPlugin[]
 */

import { create } from 'zustand'
import { engine } from '../../application/orchestrator/engine'
import type { MacroKnobConfig, Layer, LayerRouting } from '../../application/schema'

// ============================================================
// State 定義
// ============================================================

interface GeoState {
  /** MacroKnob の設定一覧（32ノブ） */
  macroKnobs: MacroKnobConfig[]
  /** MacroKnob の現在値（0.0〜1.0・index は macroKnobs と一致） */
  macroValues: number[]
  /** レイヤー一覧 */
  layers: Layer[]
  /** レイヤールーティング一覧 */
  routings: LayerRouting[]

  /** engine から MacroKnob 状態を同期する */
  syncMacroKnobs: () => void
  /** engine から Layer / LayerRouting 状態を同期する */
  syncLayers: () => void
  /**
   * MacroKnob アサインを削除し macroKnobs を即時同期する。
   * UI は engine を直接呼ばずここ経由でのみ操作する。
   */
  removeAssign: (knobId: string, geoParamAddress: string) => void
}

// ============================================================
// Store
// ============================================================

export const useGeoStore = create<GeoState>((set) => ({
  macroKnobs: [],
  macroValues: [],
  layers: [],
  routings: [],

  syncMacroKnobs: () => {
    const configs = engine.getMacroKnobs()
    set({
      macroKnobs: [...configs],
      macroValues: configs.map((k) => engine.getMacroKnobValue(k.id)),
    })
  },

  syncLayers: () => {
    set({
      layers: [...engine.getLayers()],
      routings: [...engine.getLayerRoutings()],
    })
  },

  removeAssign: (knobId: string, geoParamAddress: string) => {
    engine.removeMacroAssign(knobId, geoParamAddress)
    const configs = engine.getMacroKnobs()
    set({
      macroKnobs: [...configs],
      macroValues: configs.map((k) => engine.getMacroKnobValue(k.id)),
    })
  },
}))
