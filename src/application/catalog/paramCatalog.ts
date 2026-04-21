/**
 * ParamCatalog
 * spec: docs/spec/param-catalog.spec.md
 *
 * Plugin パラメーターの「静的定義」を管理するカタログシステム。
 * - ParamCatalogEntry: 静的定義（何が存在するか・変わらない）
 * - PluginParam:       実行時状態（現在値・UI 可動域）
 *
 * UI はカタログを読むだけでスライダーを自動生成できる（将来目標）。
 */

import type { PluginParam, PluginCatalog, ParamCatalogEntry } from '../schema'

// ============================================================
// ヘルパー関数
// ============================================================

/**
 * カタログエントリから PluginParam の初期値を生成する。
 * Plugin 初期化時に defaultParams を生成するために使う。
 */
export function catalogEntryToPluginParam(entry: ParamCatalogEntry): PluginParam {
  return {
    value: entry.default,
    min: entry.min,
    max: entry.max,
    label: entry.label,
    requiresRebuild: entry.requiresRebuild,
  }
}

/**
 * PluginCatalog 全体から defaultParams を一括生成する。
 * Plugin の config.ts でこれを呼ぶことで defaultParams の重複定義がなくなる。
 *
 * @example
 * export const defaultParams = catalogToPluginParams(catalog)
 */
export function catalogToPluginParams(
  catalog: PluginCatalog
): Record<string, PluginParam> {
  return Object.fromEntries(
    Object.entries(catalog).map(([key, entry]) => [
      key,
      catalogEntryToPluginParam(entry),
    ])
  )
}
