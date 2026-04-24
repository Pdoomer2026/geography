/**
 * RecentManager
 * Day78: Electron 薄い鏡化の一環として新設
 *
 * 責務:
 *   - geoAPI.addRecent / getRecent / clearRecent の薄いラッパー
 *   - Electron 環境でのみ動作する（ブラウザ開発環境では no-op）
 *
 * 責務外:
 *   - recent.json の実際の読み書き（main.js の IPC ハンドラーが担当）
 *   - メニューの再構築（main.js の buildMenu() が担当）
 */

export type RecentEntry = {
  name: string
  filePath: string
  savedAt: string
}

export const recentManager = {
  /** filePath を Recent に追加する。main.js が recent.json を更新してメニューを再構築する */
  async add(filePath: string): Promise<void> {
    if (!window.geoAPI) return
    await window.geoAPI.addRecent(filePath)
  },

  /** Recent リストを取得する */
  async get(): Promise<RecentEntry[]> {
    if (!window.geoAPI) return []
    return window.geoAPI.getRecent()
  },

  /** Recent リストをクリアする */
  async clear(): Promise<void> {
    if (!window.geoAPI) return
    await window.geoAPI.clearRecent()
  },
}
