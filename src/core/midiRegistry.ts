import type { MIDIRegistry, RegisteredParameter } from '../types/midi-registry'

/**
 * Registry の更新は常に新しいオブジェクトを返す純粋関数で行う（不変性）
 */

/**
 * 指定 layerId のパラメータを Registry に登録する（Apply 時に呼ばれる）
 * 他のレイヤーのパラメータはそのまま保持する
 */
export function registerParams(
  registry: MIDIRegistry,
  params: RegisteredParameter[],
  layerId: string
): MIDIRegistry {
  const others = registry.availableParameters.filter(
    (p) => p.layerId !== layerId
  )
  return {
    ...registry,
    availableParameters: [...others, ...params],
    bindings: new Map(registry.bindings),
  }
}

/**
 * 指定 layerId のパラメータを Registry から除去する（Plugin アンロード時に呼ばれる）
 */
export function clearParams(
  registry: MIDIRegistry,
  layerId: string
): MIDIRegistry {
  return {
    ...registry,
    availableParameters: registry.availableParameters.filter(
      (p) => p.layerId !== layerId
    ),
    bindings: new Map(registry.bindings),
  }
}
