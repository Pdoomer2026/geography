/**
 * Geometry Plugin 自動登録
 *
 * import.meta.glob を使って plugins/geometry/ 配下の全 index.ts を自動スキャンし、
 * Plugin Registry に登録する。
 *
 * 新しい Geometry Plugin を追加したときは、フォルダを作るだけで自動認識される。
 * 手動でのインポート追加は不要。
 */
import { registry } from '../../application/registry/registry'
import type { GeometryPlugin } from '../../application/schema'

// Vite の import.meta.glob で plugins/geometry/ 以下の全 index.ts を取得
// eager: false → 遅延インポート（初期ロードを軽量に保つ）
const modules = import.meta.glob<{ default: GeometryPlugin }>(
  './**/index.ts',
  { eager: false }
)

/**
 * Geometry Plugin を全て非同期で読み込み Registry に登録する。
 * engine.ts の初期化フローから呼ぶこと。
 */
export async function registerGeometryPlugins(): Promise<void> {
  const entries = Object.entries(modules)

  await Promise.all(
    entries.map(async ([path, loader]) => {
      try {
        const mod = await loader()
        const plugin = mod.default

        if (!plugin?.id) {
          console.warn(`[GeometryPlugin] id が見つかりません: ${path}`)
          return
        }

        registry.register(plugin)
        console.debug(`[GeometryPlugin] 登録: ${plugin.id} (${plugin.name})`)
      } catch (err) {
        console.error(`[GeometryPlugin] 読み込みエラー: ${path}`, err)
      }
    })
  )
}
