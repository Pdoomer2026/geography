import type { GeometryPlugin, LightPlugin, ParticlePlugin } from '../application/schema'

type AnyPlugin = GeometryPlugin | LightPlugin | ParticlePlugin

class PluginRegistry {
  private plugins = new Map<string, AnyPlugin>()

  register(plugin: AnyPlugin): void {
    this.plugins.set(plugin.id, plugin)
  }

  get(id: string): AnyPlugin | undefined {
    return this.plugins.get(id)
  }

  list(): AnyPlugin[] {
    return Array.from(this.plugins.values())
  }
}

export const registry = new PluginRegistry()
