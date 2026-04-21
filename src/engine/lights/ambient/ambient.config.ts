import type { PluginParam } from '../../../types'

// color は PluginParam が number 型のため省略
// ColorGrading FX に委譲
export const defaultParams: Record<string, PluginParam> = {
  intensity: { value: 0.3, min: 0.0, max: 2.0, label: 'Intensity' },
}
