import type { GeometryPlugin, LightPlugin, ParticlePlugin } from '../schema'
import { paramCatalogRegistry } from '../catalog/paramCatalogRegistry'

type AnyPlugin = GeometryPlugin | LightPlugin | ParticlePlugin
export type GeometryPluginFactory = () => GeometryPlugin

interface GeometryMeta {
  id: string
  name: string
  enabled: boolean
  catalog?: GeometryPlugin['catalog']
}

class PluginRegistry {
  private plugins = new Map<string, AnyPlugin>()
  private geometryFactories = new Map<string, GeometryPluginFactory>()
  private geometryMeta = new Map<string, GeometryMeta>()

  register(plugin: AnyPlugin): void {
    this.plugins.set(plugin.id, plugin)
    if (plugin.catalog) {
      paramCatalogRegistry.register(plugin.id, plugin.catalog)
    }
  }

  registerFactory(id: string, factory: GeometryPluginFactory, catalog?: GeometryPlugin['catalog']): void {
    this.geometryFactories.set(id, factory)
    // sample を1回生成して meta を保存（以後は factory() で独立インスタンスを生成）
    const sample = factory()
    this.geometryMeta.set(id, {
      id: sample.id,
      name: sample.name,
      enabled: sample.enabled,
      catalog: sample.catalog,
    })
    if (catalog ?? sample.catalog) {
      paramCatalogRegistry.register(id, catalog ?? sample.catalog!)
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

  /** factory 登録済みの Geometry Plugin の ID + name 一覧（インスタンス不要） */
  listGeometryMeta(): GeometryMeta[] {
    return Array.from(this.geometryMeta.values())
  }

  /** factory 登録済みの Geometry Plugin ID 一覧 */
  listGeometryIds(): string[] {
    return Array.from(this.geometryFactories.keys())
  }
}

export const registry = new PluginRegistry()
