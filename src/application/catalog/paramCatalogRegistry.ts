/**
 * ParamCatalogRegistry
 * spec: docs/spec/param-catalog.spec.md
 *
 * Plugin の静的パラメーター定義（catalog）を収集・提供するレジストリ。
 * UI / SDK はここを読むだけでスライダーを自動生成できる。
 *
 * 登録タイミング: registry.register(plugin) 時に catalog が存在すれば自動登録。
 * コントリビューターは catalog を config.ts に書くだけでよい。
 */

import type { PluginCatalog } from '../schema'

class ParamCatalogRegistry {
  private store: Map<string, PluginCatalog> = new Map()

  /**
   * Plugin の catalog を登録する。
   * registry.register(plugin) 内から自動的に呼ばれる。
   */
  register(pluginId: string, catalog: PluginCatalog): void {
    this.store.set(pluginId, catalog)
  }

  /**
   * pluginId に対応する catalog を返す。
   * UI / SDK はここを読んでスライダーを生成する。
   */
  get(pluginId: string): PluginCatalog | null {
    return this.store.get(pluginId) ?? null
  }

  /** 全 catalog を返す（SDK 公開・Plugin 一覧生成用） */
  getAll(): ReadonlyMap<string, PluginCatalog> {
    return this.store
  }

  /** 指定 pluginId の catalog が登録済みかどうか */
  has(pluginId: string): boolean {
    return this.store.has(pluginId)
  }
}

export const paramCatalogRegistry = new ParamCatalogRegistry()
