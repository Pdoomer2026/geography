import type { PluginParam } from '../../../types'

export const defaultParams: Record<string, PluginParam> = {
  count:   { value: 5000, min: 500,  max: 10000, label: 'Count' },
  depth:   { value: 50,   min: 10,   max: 200,   label: 'Depth' },
  speed:   { value: 0.3,  min: 0.0,  max: 2.0,   label: 'Speed' },
  size:    { value: 0.05, min: 0.01, max: 0.3,   label: 'Size' },
  opacity: { value: 0.6,  min: 0.0,  max: 1.0,   label: 'Opacity' },
}
