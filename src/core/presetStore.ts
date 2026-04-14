/**
 * PresetStore
 * Day60: PreferencesPanel.tsx から Preset CRUD ロジックを引き剥がす
 *
 * 責務:
 *   - localStorage への Preset 読み書き
 *   - DEFAULT_PRESETS の管理・補完
 *   - FX 定数（ORDER / DEFAULTS / LABELS）の SSoT
 *
 * 責務外:
 *   - UI 表示（React に残る）
 *   - engine への反映（PreferencesPanel が applyToEngine で行う）
 */

import type { GeoGraphyProject, MacroKnobConfig } from '../types'
import { PROJECT_FILE_VERSION } from '../types'

// ----------------------------------------------------------------
// FX 定数（SSoT をここに集約）
// ----------------------------------------------------------------

export const FX_LABELS: Record<string, string> = {
  'after-image':   'AfterImage',
  'feedback':      'Feedback',
  'bloom':         'Bloom',
  'kaleidoscope':  'Kaleidoscope',
  'mirror':        'Mirror',
  'zoom-blur':     'Zoom Blur',
  'rgb-shift':     'RGB Shift',
  'crt':           'CRT',
  'glitch':        'Glitch',
  'color-grading': 'Color Grading',
}

export const FX_DEFAULTS: Record<string, boolean> = {
  'after-image':   true,
  'feedback':      false,
  'bloom':         true,
  'kaleidoscope':  false,
  'mirror':        false,
  'zoom-blur':     false,
  'rgb-shift':     true,
  'crt':           false,
  'glitch':        false,
  'color-grading': true,
}

export const FX_ORDER: string[] = [
  'after-image', 'feedback', 'bloom', 'kaleidoscope', 'mirror',
  'zoom-blur', 'rgb-shift', 'crt', 'glitch', 'color-grading',
]

// ----------------------------------------------------------------
// Preset 型
// ----------------------------------------------------------------

// GeoPreset は GeoGraphyProject と同一（camera フィールドは型本体に統合済み）
export type GeoPreset = GeoGraphyProject

export type PresetStore = Record<string, GeoPreset>

// ----------------------------------------------------------------
// DEFAULT_PRESETS
// ----------------------------------------------------------------

const DEFAULT_FX: Record<string, string[]> = {
  'layer-1': [],
  'layer-2': [],
  'layer-3': [],
}

const DEFAULT_PRESETS: PresetStore = {
  'Default': {
    version: PROJECT_FILE_VERSION,
    savedAt: '2026-04-08T00:00:00.000Z',
    name: 'Default',
    setup: {
      geometry: ['icosphere', 'torus', 'contour'],
      camera:   ['orbit-camera', 'orbit-camera', 'static-camera'],
      fx:       { ...DEFAULT_FX },
    },
    sceneState: { layers: [] },
    macroKnobAssigns: [] as MacroKnobConfig[],
    presetRefs: {},
  },
  'Orbit Scene': {
    version: PROJECT_FILE_VERSION,
    savedAt: '2026-04-08T00:00:00.000Z',
    name: 'Orbit Scene',
    setup: {
      geometry: ['icosphere', 'torusknot', 'torus'],
      camera:   ['orbit-camera', 'orbit-camera', 'orbit-camera'],
      fx:       { ...DEFAULT_FX },
    },
    sceneState: { layers: [] },
    macroKnobAssigns: [] as MacroKnobConfig[],
    presetRefs: {},
  },
  'Aerial Scene': {
    version: PROJECT_FILE_VERSION,
    savedAt: '2026-04-08T00:00:00.000Z',
    name: 'Aerial Scene',
    setup: {
      geometry: ['hex-grid', 'contour', 'grid-wave'],
      camera:   ['aerial-camera', 'static-camera', 'static-camera'],
      fx:       { ...DEFAULT_FX },
    },
    sceneState: { layers: [] },
    macroKnobAssigns: [] as MacroKnobConfig[],
    presetRefs: {},
  },
  'Tunnel': {
    version: PROJECT_FILE_VERSION,
    savedAt: '2026-04-08T00:00:00.000Z',
    name: 'Tunnel',
    setup: {
      geometry: ['grid-tunnel', 'icosphere', 'grid-wave'],
      camera:   ['static-camera', 'orbit-camera', 'static-camera'],
      fx:       { ...DEFAULT_FX },
    },
    sceneState: { layers: [] },
    macroKnobAssigns: [] as MacroKnobConfig[],
    presetRefs: {},
  },
}

// ----------------------------------------------------------------
// PresetStoreImpl
// ----------------------------------------------------------------

const STORAGE_KEY = 'geography:presets-v1'

class PresetStoreImpl {
  private store: PresetStore = {}

  constructor() {
    this.store = this.loadFromStorage()
  }

  private loadFromStorage(): PresetStore {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (!raw) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_PRESETS))
        return { ...DEFAULT_PRESETS }
      }
      const stored = JSON.parse(raw) as PresetStore
      // デフォルトプリセットが欠けていればマージして補完
      let merged = false
      for (const [name, preset] of Object.entries(DEFAULT_PRESETS)) {
        if (!stored[name]) {
          stored[name] = preset
          merged = true
        }
      }
      if (merged) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(stored))
      }
      return stored
    } catch {
      return { ...DEFAULT_PRESETS }
    }
  }

  private persist(): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.store))
    } catch {
      // ignore
    }
  }

  getAll(): PresetStore {
    return this.store
  }

  getNames(): string[] {
    return Object.keys(this.store).sort()
  }

  get(name: string): GeoPreset | undefined {
    return this.store[name]
  }

  add(name: string, preset: GeoPreset): void {
    this.store = { ...this.store, [name]: preset }
    this.persist()
  }

  remove(name: string): void {
    const next = { ...this.store }
    delete next[name]
    this.store = next
    this.persist()
  }
}

export const presetStore = new PresetStoreImpl()
