import type { TransitionPlugin, SceneState } from '../../../../application/schema'

/**
 * CrossFade Transition Plugin
 *
 * progress に応じて各 LayerState の opacity を線形補間する。
 * from のレイヤーが opacity フェードアウトし、to のレイヤーがフェードインする。
 *
 * progress = 0.0 → from の SceneState そのまま（to は opacity = 0）
 * progress = 1.0 → to の SceneState そのまま（from は opacity = 0）
 * 中間値         → 両方の opacity を線形補間して重ね合わせ
 *
 * カテゴリ: parameter（opacity というパラメーター値を補間する）
 * 実装コスト: 低（シェーダー不要・純粋関数）
 * v1 実装対象
 */
const crossfadePlugin: TransitionPlugin = {
  id: 'crossfade',
  name: 'CrossFade',
  renderer: 'threejs',
  enabled: true,
  duration: 1000,           // 1秒（ミリ秒単位）
  category: 'parameter',
  preview: 'opacity を線形補間してなめらかに切り替え',

  execute(from: SceneState, to: SceneState, progress: number): SceneState {
    const fromLayers = from.layers.map((layer) => ({
      ...layer,
      opacity: layer.opacity * (1 - progress),
    }))

    const toLayers = to.layers.map((layer) => ({
      ...layer,
      opacity: layer.opacity * progress,
    }))

    return { layers: [...fromLayers, ...toLayers] }
  },
}

export default crossfadePlugin
