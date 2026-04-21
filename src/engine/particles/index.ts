/**
 * Particle Plugin 自動登録
 *
 * import.meta.glob を使って plugins/particles/ 配下の全 index.ts を自動スキャンし、
 * Plugin Registry に登録する。
 */
import { registry } from '../../core/registry'
import type { ParticlePlugin } from '../../application/schema'

const modules = import.meta.glob<{ default: ParticlePlugin }>(
  './**/index.ts',
  { eager: false }
)

/**
 * Particle Plugin を全て非同期で読み込み Registry に登録する。
 * engine.ts の初期化フローから呼ぶこと。
 */
export async function registerParticlePlugins(): Promise<void> {
  const entries = Object.entries(modules)

  await Promise.all(
    entries.map(async ([path, loader]) => {
      try {
        const mod = await loader()
        const plugin = mod.default

        if (!plugin?.id) {
          console.warn(`[ParticlePlugin] id が見つかりません: ${path}`)
          return
        }

        registry.register(plugin)
        console.debug(`[ParticlePlugin] 登録: ${plugin.id} (${plugin.name})`)
      } catch (err) {
        console.error(`[ParticlePlugin] 読み込みエラー: ${path}`, err)
      }
    })
  )
}
