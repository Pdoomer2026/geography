/**
 * GeoGraphy Electron preload スクリプト
 * spec: docs/spec/electron.spec.md §4
 *
 * IMPORTANT: preload は CommonJS (require) で書く必要がある。
 *            ES Module (import) は使えない。
 *
 * contextBridge を使って renderer（React）に geoAPI を安全に公開する。
 * renderer は Node.js / Electron API に直接アクセスできない（contextIsolation: true）。
 * 全てのファイル操作は window.geoAPI 経由で IPC を通じて main プロセスが実行する。
 */

const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('geoAPI', {
  /**
   * ファイルを保存する
   * @param {string} filePath 保存先の絶対パス
   * @param {string} data 保存するテキストデータ（JSON 文字列など）
   */
  saveFile: (filePath, data) =>
    ipcRenderer.invoke('save-file', filePath, data),

  /**
   * ファイルを読み込む
   * @param {string} filePath 読み込む絶対パス
   * @returns {Promise<string>} ファイルの内容
   */
  loadFile: (filePath) =>
    ipcRenderer.invoke('load-file', filePath),

  /**
   * 名前を付けて保存ダイアログを表示する
   * @returns {Promise<{canceled: boolean, filePath?: string}>}
   */
  showSaveDialog: () =>
    ipcRenderer.invoke('show-save-dialog'),

  /**
   * ファイルを開くダイアログを表示する
   * @returns {Promise<{canceled: boolean, filePaths: string[]}>}
   */
  showOpenDialog: () =>
    ipcRenderer.invoke('show-open-dialog'),

  /**
   * GeoGraphy データディレクトリのパスを取得する
   * @returns {Promise<{geoDir: string, projectsDir: string, presetsDir: string}>}
   */
  getDataDir: () =>
    ipcRenderer.invoke('get-data-dir'),
})
