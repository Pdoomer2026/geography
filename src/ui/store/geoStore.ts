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

  /**
   * Layer Macro ノブ設定（layerId → MacroKnobConfig[8]）
   * spec: docs/spec/layer-macro-preset.spec.md
   */
  macroKnobsByLayer: Record<string, MacroKnobConfig[]>
  /**
   * Layer Macro ノブ現在値（layerId → number[8]）
   * spec: docs/spec/layer-macro-preset.spec.md
   */
  macroValuesByLayer: Record<string, number[]>

  /** engine から MacroKnob 状態を同期する */
  syncMacroKnobs: () => void
  /** engine から Layer / LayerRouting 状態を同期する */
  syncLayers: () => void
  /**
   * 指定レイヤーの Layer Macro 状態を engine から同期する。
   * MacroPanel（Layer）が activeLayer 切替時・値変更後に呼ぶ。
   * spec: docs/spec/layer-macro-preset.spec.md
   */
  syncLayerMacroKnobs: (layerId: string) => void
  /**
   * MacroKnob アサインを削除し macroKnobs を即時同期する。
   * UI は engine を直接呼ばずここ経由でのみ操作する。
   */
  removeAssign: (knobId: string, geoParamAddress: string) => void
  /**
   * Layer Macro アサインを削除し macroKnobsByLayer を即時同期する。
   * spec: docs/spec/layer-macro-preset.spec.md
   */
  removeLayerAssign: (knobId: string, geoParamAddress: string, layerId: string) => void
}

// ============================================================
// Store
// ============================================================

export const useGeoStore = create<GeoState>((set) => ({
  macroKnobs: [],
  macroValues: [],
  layers: [],
  routings: [],
  macroKnobsByLayer: {},
  macroValuesByLayer: {},

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

  syncLayerMacroKnobs: (layerId: string) => {
    const configs = engine.getLayerMacroKnobs(layerId)
    set((state) => ({
      macroKnobsByLayer: {
        ...state.macroKnobsByLayer,
        [layerId]: [...configs],
      },
      macroValuesByLayer: {
        ...state.macroValuesByLayer,
        [layerId]: configs.map((k) => engine.getLayerMacroKnobValue(k.id, layerId)),
      },
    }))
  },

  removeAssign: (knobId: string, geoParamAddress: string) => {
    engine.removeMacroAssign(knobId, geoParamAddress)
    const configs = engine.getMacroKnobs()
    set({
      macroKnobs: [...configs],
      macroValues: configs.map((k) => engine.getMacroKnobValue(k.id)),
    })
  },

  removeLayerAssign: (knobId: string, geoParamAddress: string, layerId: string) => {
    engine.removeLayerMacroAssign(knobId, geoParamAddress, layerId)
    const configs = engine.getLayerMacroKnobs(layerId)
    set((state) => ({
      macroKnobsByLayer: {
        ...state.macroKnobsByLayer,
        [layerId]: [...configs],
      },
      macroValuesByLayer: {
        ...state.macroValuesByLayer,
        [layerId]: configs.map((k) => engine.getLayerMacroKnobValue(k.id, layerId)),
      },
    }))
  },
}))
