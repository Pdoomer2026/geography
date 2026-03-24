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

  /**
   * autosave.geography に現在の状態を書き込む（アプリ終了時に呼ぶ）
   * @param {string} data JSON 文字列
   */
  autosave: (data) =>
    ipcRenderer.invoke('autosave', data),

  /**
   * autosave.geography の内容を読み込む（起動時に呼ぶ）
   * ファイルが存在しない場合は null を返す。
   * @returns {Promise<string | null>}
   */
  getAutosave: () =>
    ipcRenderer.invoke('get-autosave'),

  /**
   * renderer → main への自動保存データ送信チャンネルを登録する。
   * main が 'request-autosave-data' を送ったとき callback が呼ばれる。
   * @param {(sendData: (json: string) => void) => void} callback
   */
  onRequestAutosave: (callback) =>
    ipcRenderer.on('request-autosave-data', (_event) => {
      callback((json) => ipcRenderer.invoke('autosave', json))
    }),

  /**
   * onRequestAutosave で登録したリスナーを解除する
   */
  removeAutosaveListener: () =>
    ipcRenderer.removeAllListeners('request-autosave-data'),
})
