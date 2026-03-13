import type { TransitionPlugin, SceneState } from '../../../types'

/**
 * Beat Cut Transition Plugin
 *
 * 拍の頭でスパッと切り替える最もシンプルな Transition。
 * Tempo Driver の beat イベントと連携して即座に SceneState を切り替える。
 *
 * カテゴリ: bpm
 * 実装コスト: 低（フェードなし・即時切り替えのみ）
 * v1 実装対象
 */
const beatCutPlugin: TransitionPlugin = {
  id: 'beat-cut',
  name: 'Beat Cut',
  renderer: 'threejs',
  enabled: true,
  duration: 0,                  // 即時切り替えのため 0
  category: 'bpm',
  preview: '拍の頭でスパッと切り替え',

  execute(_from: SceneState, _to: SceneState, progress: number): void {
    // Beat Cut は progress が 1.0 になった瞬間に切り替わる（即時）
    // 実際のシーン切り替えは SimpleMixer / ProgramBus 側が担当
    // ここでは progress を受け取るだけ（Phase 7 で本実装）
    void progress
  },
}

export default beatCutPlugin
