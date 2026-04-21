import type { MixerPlugin } from '../../../../types'
import { MixerSimpleWindow } from './MixerSimpleWindow'

/**
 * MixerSimpleWindow — v1 固定実装の Mixer Simple Window
 *
 * MixerPlugin のデフォルト最小 UI。
 * v2 で Plugin として動的登録するとき設計変更ゼロにするため、
 * v1 の時点から MixerPlugin Interface に完全準拠する。
 */
export const simpleMixerPlugin: MixerPlugin = {
  id: 'simple-mixer',
  name: 'Mixer Simple Window',
  renderer: 'threejs',
  enabled: true,
  component: MixerSimpleWindow,
}

export { MixerSimpleWindow }
