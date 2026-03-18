import type { MixerPlugin } from '../../../types'
import { SimpleMixer } from './SimpleMixer'

/**
 * SimpleMixer — v1 固定実装の MixerPlugin
 *
 * v2 で Plugin として動的登録するとき設計変更ゼロにするため、
 * v1 の時点から MixerPlugin Interface に完全準拠する。
 */
export const simpleMixerPlugin: MixerPlugin = {
  id: 'simple-mixer',
  name: 'SimpleMixer',
  renderer: 'threejs',
  enabled: true,
  component: SimpleMixer,
}

export { SimpleMixer }
