import type { MIDIRegistry, RegisteredParameterWithCC } from '../types/midi-registry'

/**
 * Registry の更新は常に新しいオブジェクトを返す純粋関数で行う（不変性）
 */

/**
 * 指定 layerId のパラメータを Registry に登録する（Apply 時に呼ばれる）
 * 他のレイヤーのパラメータはそのまま保持する
 */
export function registerParams(
  registry: MIDIRegistry,
  params: RegisteredParameterWithCC[],
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
 * engine の現在値を Registry の value に同期する（純粋関数）
 * App.tsx が 200ms ポーリングで呼び出す。
 * getEngineValue: (pluginId, paramId) => 現在値 | undefined
 */
export function syncValues(
  registry: MIDIRegistry,
  getEngineValue: (pluginId: string, paramId: string) => number | undefined
): MIDIRegistry {
  let changed = false
  const next = registry.availableParameters.map((p) => {
    const engineValue = getEngineValue(p.pluginId, p.id)
    if (engineValue === undefined) return p
    if (Math.abs(p.value - engineValue) < 0.0001) return p
    changed = true
    return { ...p, value: engineValue }
  })
  if (!changed) return registry
  return {
    ...registry,
    availableParameters: next,
    bindings: new Map(registry.bindings),
  }
}

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
