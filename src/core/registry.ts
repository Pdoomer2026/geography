import type { GeometryPlugin } from '../types'

class PluginRegistry {
  private plugins = new Map<string, GeometryPlugin>()

  register(plugin: GeometryPlugin): void {
    this.plugins.set(plugin.id, plugin)
  }

  get(id: string): GeometryPlugin | undefined {
    return this.plugins.get(id)
  }

  list(): GeometryPlugin[] {
    return Array.from(this.plugins.values())
  }
}

export const registry = new PluginRegistry()
