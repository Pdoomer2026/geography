/**
 * Geometry Plugin 自動登録（Factory Function パターン）
 *
 * import.meta.glob で plugins/geometry/ 配下の全 index.ts を自動スキャンし、
 * default export が関数（factory）なら registerFactory、
 * オブジェクトなら register（後方互換）として登録する。
 *
 * 新しい Geometry Plugin を追加したときは、フォルダを作るだけで自動認識される。
 */
import { registry } from '../../application/registry/registry'
import type { GeometryPluginFactory } from '../../application/registry/registry'
import type { GeometryPlugin } from '../../application/schema'

type GeometryModule = { default: GeometryPlugin | GeometryPluginFactory }

const modules = import.meta.glob<GeometryModule>(
  './**/index.ts',
  { eager: false }
)

export async function registerGeometryPlugins(): Promise<void> {
  const entries = Object.entries(modules)

  await Promise.all(
    entries.map(async ([path, loader]) => {
      try {
        const mod = await loader()
        const exported = mod.default

        if (typeof exported === 'function') {
          // Factory function パターン: インスタンスを生成して ID / catalog を取得
          const factory = exported as GeometryPluginFactory
          const sample = factory()
          if (!sample?.id) {
            console.warn(`[GeometryPlugin] id が見つかりません: ${path}`)
            return
          }
          registry.registerFactory(sample.id, factory, sample.catalog)
          console.debug(`[GeometryPlugin] factory 登録: ${sample.id} (${sample.name})`)
        } else {
          // 後方互換: オブジェクトとして登録
          const plugin = exported as GeometryPlugin
          if (!plugin?.id) {
            console.warn(`[GeometryPlugin] id が見つかりません: ${path}`)
            return
          }
          registry.register(plugin)
          console.debug(`[GeometryPlugin] 登録: ${plugin.id} (${plugin.name})`)
        }
      } catch (err) {
        console.error(`[GeometryPlugin] 読み込みエラー: ${path}`, err)
      }
    })
  )
}
