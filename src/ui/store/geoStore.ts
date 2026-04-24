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
import type { MacroKnobConfig } from '../../application/schema'

// ============================================================
// State 定義
// ============================================================

interface GeoState {
  /** MacroKnob の設定一覧（32ノブ） */
  macroKnobs: MacroKnobConfig[]
  /** MacroKnob の現在値（0.0〜1.0・index は macroKnobs と一致） */
  macroValues: number[]

  /** engine から MacroKnob 状態を同期する */
  syncMacroKnobs: () => void
}

// ============================================================
// Store
// ============================================================

export const useGeoStore = create<GeoState>((set) => ({
  macroKnobs: [],
  macroValues: [],

  syncMacroKnobs: () => {
    const configs = engine.getMacroKnobs()
    set({
      macroKnobs: [...configs],
      macroValues: configs.map((k) => engine.getMacroKnobValue(k.id)),
    })
  },
}))
