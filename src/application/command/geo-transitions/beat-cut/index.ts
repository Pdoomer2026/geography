import type { TransitionPlugin, SceneState } from '../../../../types'

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

  execute(from: SceneState, to: SceneState, progress: number): SceneState {
    // Beat Cut は progress >= 1.0 の瞬間に to へ即時切り替え
    return progress >= 1 ? to : from
  },
}

export default beatCutPlugin
