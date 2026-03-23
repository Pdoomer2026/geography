import type { PluginParam } from '../../../../types'

export const defaultParams: Record<string, PluginParam> = {
  speed:    { value: 0.8,  min: 0.0, max: 3.0,  label: 'Speed' },
  radius:   { value: 4.0,  min: 1.0, max: 10.0, label: 'Radius' },
  segments: { value: 8,    min: 3,   max: 24,   label: 'Segments' },
  rings:    { value: 20,   min: 5,   max: 40,   label: 'Rings' },
  length:   { value: 40,   min: 10,  max: 100,  label: 'Length' },
  hue:      { value: 280,  min: 0,   max: 360,  label: 'Hue' },
}
