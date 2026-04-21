import type { GeometryPlugin, LightPlugin, ParticlePlugin } from '../schema'
import { paramCatalogRegistry } from '../catalog/paramCatalogRegistry'

type AnyPlugin = GeometryPlugin | LightPlugin | ParticlePlugin

class PluginRegistry {
  private plugins = new Map<string, AnyPlugin>()

  register(plugin: AnyPlugin): void {
    this.plugins.set(plugin.id, plugin)
    // catalog が存在すれば自動的に paramCatalogRegistry にも登録
    // コントリビューターは config.ts に catalog を書くだけでよい
    if (plugin.catalog) {
      paramCatalogRegistry.register(plugin.id, plugin.catalog)
    }
  }

  get(id: string): AnyPlugin | undefined {
    return this.plugins.get(id)
  }

  list(): AnyPlugin[] {
    return Array.from(this.plugins.values())
  }
}

export const registry = new PluginRegistry()
