/**
 * WindowMode 型定義
 * App.tsx / PreferencesPanel で共有する Window 表示状態の型
 */

export type GeoWindowMode = 'none'
export type MacroWindowMode = 'none' | 'macro-8-window'
export type MixerWindowMode = 'none' | 'mixer-simple'

export interface WindowMode {
  inspector:   boolean      // Inspector パネル（右固定・Phase 18〜）
  geometry:    GeoWindowMode
  camera:      GeoWindowMode
  fx:          GeoWindowMode
  macro:       MacroWindowMode
  mixer:       MixerWindowMode
  monitor:     boolean  // GeoMonitorWindow（キー6）
  midiMonitor: boolean  // MidiMonitorWindow（キーM）
}

export const LAYER_IDS = ['layer-1', 'layer-2', 'layer-3'] as const
export type LayerId = typeof LAYER_IDS[number]

export const DEFAULT_WINDOW_MODE: WindowMode = {
  inspector:   true,    // Inspector デフォルト開
  geometry:    'none',  // 旧 Window は Inspector が代替（Phase 18〜）
  camera:      'none',
  fx:          'none',
  macro:       'none',
  mixer:       'none',
  monitor:     false,
  midiMonitor: false,
}
