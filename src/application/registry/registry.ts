import type { GeometryPlugin, LightPlugin, ParticlePlugin } from '../schema'
import { paramCatalogRegistry } from '../catalog/paramCatalogRegistry'

type AnyPlugin = GeometryPlugin | LightPlugin | ParticlePlugin
export type GeometryPluginFactory = () => GeometryPlugin

class PluginRegistry {
  private plugins = new Map<string, AnyPlugin>()
  private geometryFactories = new Map<string, GeometryPluginFactory>()

  register(plugin: AnyPlugin): void {
    this.plugins.set(plugin.id, plugin)
    if (plugin.catalog) {
      paramCatalogRegistry.register(plugin.id, plugin.catalog)
    }
  }

  registerFactory(id: string, factory: GeometryPluginFactory, catalog?: AnyPlugin['catalog']): void {
    this.geometryFactories.set(id, factory)
    if (catalog) {
      paramCatalogRegistry.register(id, catalog)
    }
  }

  getFactory(id: string): GeometryPluginFactory | undefined {
    return this.geometryFactories.get(id)
  }

  get(id: string): AnyPlugin | undefined {
    return this.plugins.get(id)
  }

  list(): AnyPlugin[] {
    return Array.from(this.plugins.values())
  }

  /** factory 登録済みの Geometry Plugin ID 一覧を返す */
  listGeometryIds(): string[] {
    return Array.from(this.geometryFactories.keys())
  }
}

export const registry = new PluginRegistry()
