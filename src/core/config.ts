import type { CameraPreset } from '../types'

export const MAX_LAYERS = 3
export const MAX_UNDO_HISTORY = 50
export const DEFAULT_BPM = 128
export const LERP_FACTOR = 0.05
export const MACRO_KNOB_COUNT = 32
export const MACRO_KNOB_MAX_ASSIGNS = 3

/** 各 Geometry Plugin のデフォルトカメラプリセット（spec: camera-system.spec.md） */
export const DEFAULT_CAMERA_PRESET: CameraPreset = {
  position: { x: 0, y: 8, z: 12 },
  lookAt: { x: 0, y: 0, z: 0 },
}
