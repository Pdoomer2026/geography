/**
 * GeoGraphy Electron preload スクリプト
 * spec: docs/spec/electron.spec.md §6
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
  // ── ファイル操作 ────────────────────────────────────────────────

  saveFile: (filePath, data) =>
    ipcRenderer.invoke('save-file', filePath, data),

  loadFile: (filePath) =>
    ipcRenderer.invoke('load-file', filePath),

  showSaveDialog: () =>
    ipcRenderer.invoke('show-save-dialog'),

  showOpenDialog: () =>
    ipcRenderer.invoke('show-open-dialog'),

  getDataDir: () =>
    ipcRenderer.invoke('get-data-dir'),

  saveProjectFile: (filePath, data) =>
    ipcRenderer.invoke('save-file', filePath, data),

  // ── autosave ────────────────────────────────────────────────────

  autosave: (data) =>
    ipcRenderer.invoke('autosave', data),

  getAutosave: () =>
    ipcRenderer.invoke('get-autosave'),

  onRequestAutosave: (callback) =>
    ipcRenderer.on('request-autosave-data', (_event) => {
      callback((json) => ipcRenderer.invoke('autosave', json))
    }),

  removeAutosaveListener: () =>
    ipcRenderer.removeAllListeners('request-autosave-data'),

  // ── メニューイベント ─────────────────────────────────────────────
  // spec: docs/spec/electron.spec.md §6

  /**
   * メニューバーからの操作イベントをまとめて登録する。
   * File メニュー・GeoGraphy メニュー・View メニューのイベントを一括受信する。
   */
  onMenuEvents: (handlers) => {
    // File / GeoGraphy メニュー
    if (handlers.onNew)          ipcRenderer.on('menu:new',          () => handlers.onNew())
    if (handlers.onOpen)         ipcRenderer.on('menu:open',         (_e, filePath, data) => handlers.onOpen(filePath, data))
    if (handlers.onSave)         ipcRenderer.on('menu:save',         () => handlers.onSave())
    if (handlers.onSaveAs)       ipcRenderer.on('menu:save-as',      (_e, filePath) => handlers.onSaveAs(filePath))
    if (handlers.onPreferences)  ipcRenderer.on('menu:preferences',  () => handlers.onPreferences())

    // View メニュー（Day29追加）
    if (handlers.onToggleMixerWindow)    ipcRenderer.on('menu:toggle-mixer-window',     () => handlers.onToggleMixerWindow())
    if (handlers.onToggleFxWindow)       ipcRenderer.on('menu:toggle-fx-window',        () => handlers.onToggleFxWindow())
    if (handlers.onToggleMacroKnobWindow) ipcRenderer.on('menu:toggle-macro-knob-window', () => handlers.onToggleMacroKnobWindow())
    if (handlers.onHideAllWindows)        ipcRenderer.on('menu:hide-all-windows',        () => handlers.onHideAllWindows())
    if (handlers.onShowAllWindows)        ipcRenderer.on('menu:show-all-windows',        () => handlers.onShowAllWindows())
    if (handlers.onStartRecording)        ipcRenderer.on('menu:start-recording',         () => handlers.onStartRecording())
    if (handlers.onStopRecording)         ipcRenderer.on('menu:stop-recording',          () => handlers.onStopRecording())
  },

  // ── 録画 ──────────────────────────────────────────────────

  saveRecording: (buffer, defaultName) =>
    ipcRenderer.invoke('save-recording', buffer, defaultName),

  // ── CC Map / CC Overrides ────────────────────────────────────────

  loadCcMap: () =>
    ipcRenderer.invoke('load-cc-map'),

  loadCcOverrides: () =>
    ipcRenderer.invoke('load-cc-overrides'),

  saveCcOverrides: (data) =>
    ipcRenderer.invoke('save-cc-overrides', data),

  /**
   * onMenuEvents で登録したリスナーをすべて解除する
   */
  removeMenuListeners: () => {
    ipcRenderer.removeAllListeners('menu:new')
    ipcRenderer.removeAllListeners('menu:open')
    ipcRenderer.removeAllListeners('menu:save')
    ipcRenderer.removeAllListeners('menu:save-as')
    ipcRenderer.removeAllListeners('menu:preferences')
    ipcRenderer.removeAllListeners('menu:toggle-mixer-window')
    ipcRenderer.removeAllListeners('menu:toggle-fx-window')
    ipcRenderer.removeAllListeners('menu:toggle-macro-knob-window')
    ipcRenderer.removeAllListeners('menu:hide-all-windows')
    ipcRenderer.removeAllListeners('menu:show-all-windows')
    ipcRenderer.removeAllListeners('menu:start-recording')
    ipcRenderer.removeAllListeners('menu:stop-recording')
  },
})
