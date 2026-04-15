/**
 * WindowMode 型定義
 * App.tsx / PreferencesPanel で共有する Window 表示状態の型
 */

export type GeoWindowMode = 'none' | 'simple' | 'simple-dnd' | 'standard' | 'standard-dnd'
export type MacroWindowMode = 'none' | 'macro-window' | 'macro-8-window'
export type MixerWindowMode = 'none' | 'mixer-simple'

export interface WindowMode {
  geometry: GeoWindowMode
  camera:   GeoWindowMode
  fx:       GeoWindowMode
  macro:    MacroWindowMode
  mixer:    MixerWindowMode
  monitor:  boolean
}

export const LAYER_IDS = ['layer-1', 'layer-2', 'layer-3'] as const
export type LayerId = typeof LAYER_IDS[number]

export const DEFAULT_WINDOW_MODE: WindowMode = {
  geometry: 'standard',
  camera:   'standard',
  fx:       'standard',
  macro:    'macro-window',
  mixer:    'mixer-simple',
  monitor:  false,
}
