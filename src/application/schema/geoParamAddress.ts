/**
 * GeoParamAddress
 *
 * GeoGraphy 固有のパラメーター一意識別子。
 * layerId / pluginId / paramId を束ねた単一の文字列で、
 * ParameterStore のキー・MacroAssign の参照・Sequencer の target に使う。
 *
 * spec: docs/spec/geo-param-address.spec.md
 *
 * フォーマット: geo://{layerId}/{pluginId}/{paramId}
 * 例:
 *   geo://layer-1/icosphere/scale
 *   geo://layer-2/bloom/strength
 *   geo://layer-1/static-camera/posY
 */

/** GeoGraphy 固有のパラメーター一意識別子 */
export type GeoParamAddress = string

/**
 * GeoParamAddress を生成する。
 * 変換が起きる唯一の場所は engine.ts の initTransportRegistry()。
 */
export const toGeoParamAddress = (
  layerId: string,
  pluginId: string,
  paramId: string,
): GeoParamAddress => `geo://${layerId}/${pluginId}/${paramId}`

/**
 * GeoParamAddress を分解する。
 * 不正な入力の場合は null を返す。
 */
export const parseGeoParamAddress = (
  addr: GeoParamAddress,
): { layerId: string; pluginId: string; paramId: string } | null => {
  if (!addr.startsWith('geo://')) return null
  const parts = addr.slice(6).split('/')
  if (parts.length !== 3) return null
  const [layerId, pluginId, paramId] = parts
  if (!layerId || !pluginId || !paramId) return null
  return { layerId, pluginId, paramId }
}

/**
 * GeoParamAddress かどうかを判定する型ガード。
 */
export const isGeoParamAddress = (value: string): value is GeoParamAddress =>
  value.startsWith('geo://')
