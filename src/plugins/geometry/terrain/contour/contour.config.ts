import type { PluginParam } from '../../../../types'

export const defaultParams: Record<string, PluginParam> = {
  speed:     { value: 0.3,  min: 0.0, max: 2.0,  label: 'Speed' },
  scale:     { value: 0.4,  min: 0.1, max: 2.0,  label: 'Scale' },
  amplitude: { value: 3.0,  min: 0.1, max: 8.0,  label: 'Amplitude' },
  segments:  { value: 80,   min: 10,  max: 150,   label: 'Segments' },
  size:      { value: 100,  min: 10,  max: 500,   label: 'Size' },
  hue:       { value: 160,  min: 0,   max: 360,   label: 'Hue' },
}
