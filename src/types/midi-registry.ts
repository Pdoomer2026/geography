/**
 * MIDI Registry の型定義
 *
 * ParameterSchema    : Plugin が getParameters() で返す型（layerId/pluginId なし）
 * RegisteredParameter: Registry に登録される型（layerId/pluginId あり）
 */

export interface ParameterSchema {
  id: string
  name: string
  min: number
  max: number
  step: number
}

/** Registry に登録される型。呼び出し側（App.tsx）が layerId/pluginId を付与する */
export interface RegisteredParameter extends ParameterSchema {
  layerId: string
  pluginId: string
}

export interface MIDIRegistry {
  availableParameters: RegisteredParameter[]
  bindings: Map<number, string>
}

export const createInitialRegistry = (): MIDIRegistry => ({
  availableParameters: [],
  bindings: new Map<number, string>(),
})
