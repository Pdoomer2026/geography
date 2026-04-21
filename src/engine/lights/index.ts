/**
 * Light Plugin 自動登録
 *
 * import.meta.glob を使って plugins/lights/ 配下の全 index.ts を自動スキャンし、
 * Plugin Registry に登録する。
 */
import { registry } from '../../core/registry'
import type { LightPlugin } from '../../application/schema'

const modules = import.meta.glob<{ default: LightPlugin }>(
  './**/index.ts',
  { eager: false }
)

/**
 * Light Plugin を全て非同期で読み込み Registry に登録する。
 * engine.ts の初期化フローから呼ぶこと。
 */
export async function registerLightPlugins(): Promise<void> {
  const entries = Object.entries(modules)

  await Promise.all(
    entries.map(async ([path, loader]) => {
      try {
        const mod = await loader()
        const plugin = mod.default

        if (!plugin?.id) {
          console.warn(`[LightPlugin] id が見つかりません: ${path}`)
          return
        }

        registry.register(plugin)
        console.debug(`[LightPlugin] 登録: ${plugin.id} (${plugin.name})`)
      } catch (err) {
        console.error(`[LightPlugin] 読み込みエラー: ${path}`, err)
      }
    })
  )
}
