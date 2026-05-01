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

  listFiles: (dirPath) =>
    ipcRenderer.invoke('list-files', dirPath),

  deleteFile: (filePath) =>
    ipcRenderer.invoke('delete-file', filePath),

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
    // Day78: onOpen / onSaveAs は引数なしに変更（薄い鏡化）
    //        renderer 側が dialog + fs 操作を担う
    if (handlers.onNew)          ipcRenderer.on('menu:new',          () => handlers.onNew())
    if (handlers.onOpen)         ipcRenderer.on('menu:open',         () => handlers.onOpen())
    if (handlers.onSave)         ipcRenderer.on('menu:save',         () => handlers.onSave())
    if (handlers.onSaveAs)       ipcRenderer.on('menu:save-as',      () => handlers.onSaveAs())
    if (handlers.onOpenRecent)   ipcRenderer.on('menu:open-recent',  (_e, filePath) => handlers.onOpenRecent(filePath))
    if (handlers.onPreferences)  ipcRenderer.on('menu:preferences',  () => handlers.onPreferences())

    // View メニュー（Day29追加）
    if (handlers.onToggleMixerWindow)    ipcRenderer.on('menu:toggle-mixer-window',     () => handlers.onToggleMixerWindow())
    if (handlers.onToggleFxWindow)       ipcRenderer.on('menu:toggle-fx-window',        () => handlers.onToggleFxWindow())
    if (handlers.onToggleMacroKnobWindow) ipcRenderer.on('menu:toggle-macro-knob-window', () => handlers.onToggleMacroKnobWindow())
    if (handlers.onHideAllWindows)        ipcRenderer.on('menu:hide-all-windows',        () => handlers.onHideAllWindows())
    if (handlers.onShowAllWindows)        ipcRenderer.on('menu:show-all-windows',        () => handlers.onShowAllWindows())
    if (handlers.onStartRecording)        ipcRenderer.on('menu:start-recording',         () => handlers.onStartRecording())
    if (handlers.onStopRecording)         ipcRenderer.on('menu:stop-recording',          () => handlers.onStopRecording())
    if (handlers.onToggleOutput)          ipcRenderer.on('menu:toggle-output',           () => handlers.onToggleOutput())
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
  // ── Recent ファイル管理（Day78追加）────────────────────────────

  addRecent: (filePath) =>
    ipcRenderer.invoke('add-recent', filePath),

  getRecent: () =>
    ipcRenderer.invoke('get-recent'),

  clearRecent: () =>
    ipcRenderer.invoke('clear-recent'),

  // ── Output（spec: docs/spec/output-manager.spec.md）──────────────

  getDisplays: () =>
    ipcRenderer.invoke('get-displays'),

  moveOutputWindow: (x, y, w, h) =>
    ipcRenderer.invoke('move-output-window', x, y, w, h),

  removeMenuListeners: () => {
    ipcRenderer.removeAllListeners('menu:new')
    ipcRenderer.removeAllListeners('menu:open')
    ipcRenderer.removeAllListeners('menu:save')
    ipcRenderer.removeAllListeners('menu:save-as')
    ipcRenderer.removeAllListeners('menu:open-recent')
    ipcRenderer.removeAllListeners('menu:preferences')
    ipcRenderer.removeAllListeners('menu:toggle-mixer-window')
    ipcRenderer.removeAllListeners('menu:toggle-fx-window')
    ipcRenderer.removeAllListeners('menu:toggle-macro-knob-window')
    ipcRenderer.removeAllListeners('menu:hide-all-windows')
    ipcRenderer.removeAllListeners('menu:show-all-windows')
    ipcRenderer.removeAllListeners('menu:start-recording')
    ipcRenderer.removeAllListeners('menu:stop-recording')
    ipcRenderer.removeAllListeners('menu:toggle-output')
  },
})
