/**
 * GeoGraphy Electron メインプロセス
 * spec: docs/spec/electron.spec.md
 *
 * セキュリティ方針（権限最小化）:
 *   - nodeIntegration: false   → レンダラーから Node.js を直接触れない
 *   - contextIsolation: true   → preload との境界を明確に保つ（IPC 経由のみ）
 *   - sandbox: true            → OS レベルでレンダラーを隔離
 *   - geoAPI 経由のみファイル操作を許可（最小権限の原則）
 *
 * IMPORTANT: electron/ ディレクトリは CommonJS モード（electron/package.json で指定）
 */

const { app, BrowserWindow, ipcMain, dialog, Menu } = require('electron')
const { join } = require('path')
const { readFile, writeFile, mkdir } = require('fs/promises')
const { existsSync } = require('fs')
const { homedir } = require('os')

const isDev = !app.isPackaged

// GeoGraphy データディレクトリ（spec: project-file.spec.md §6）
const GEO_DIR = join(homedir(), 'Documents', 'GeoGraphy')
const PROJECTS_DIR = join(GEO_DIR, 'projects')
const PRESETS_DIR = join(GEO_DIR, 'presets')
const AUTOSAVE_PATH = join(GEO_DIR, 'autosave.geography')
const RECENT_PATH   = join(GEO_DIR, 'recent.json')

// ── Recent ファイル管理 ────────────────────────────────────────────

/** recent.json を読み込む（最大5件） */
async function loadRecent() {
  if (!existsSync(RECENT_PATH)) return []
  try {
    const raw = await readFile(RECENT_PATH, 'utf-8')
    return JSON.parse(raw)
  } catch {
    return []
  }
}

/** recent.json にエントリを追加して保存し、メニューを再構築する */
async function addRecent(filePath) {
  const name = filePath.split('/').pop()?.replace(/\.geography$/, '') ?? 'unknown'
  const savedAt = new Date().toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' })
  const prev = await loadRecent()
  const next = [
    { name, filePath, savedAt },
    ...prev.filter((r) => r.filePath !== filePath),
  ].slice(0, 5)
  await writeFile(RECENT_PATH, JSON.stringify(next, null, 2), 'utf-8')
  buildMenu(next)
}

// ── メニューバー ────────────────────────────────────────────────────

/**
 * レンダラーに IPC イベントを送信するヘルパー
 */
function sendToRenderer(channel, ...args) {
  const wins = BrowserWindow.getAllWindows()
  if (wins.length > 0) wins[0].webContents.send(channel, ...args)
}

/**
 * メニューから呼び出す Save 処理
 * renderer に 'menu:save' を送信 → App.tsx が engine.buildProject() して IPC で返送
 */
async function menuSave() {
  sendToRenderer('menu:save')
}

/**
 * メニューから呼び出す Save As... 処理
 */
async function menuSaveAs() {
  const win = BrowserWindow.getAllWindows()[0]
  if (!win) return
  const result = await dialog.showSaveDialog(win, {
    title: 'プロジェクトを保存',
    defaultPath: join(PROJECTS_DIR, 'my-scene.geography'),
    filters: [{ name: 'GeoGraphy Project', extensions: ['geography'] }],
  })
  if (result.canceled || !result.filePath) return
  sendToRenderer('menu:save-as', result.filePath)
}

/**
 * メニューから呼び出す Open... 処理
 */
async function menuOpen() {
  const win = BrowserWindow.getAllWindows()[0]
  if (!win) return
  const result = await dialog.showOpenDialog(win, {
    title: 'プロジェクトを開く',
    defaultPath: PROJECTS_DIR,
    filters: [{ name: 'GeoGraphy Project', extensions: ['geography'] }],
    properties: ['openFile'],
  })
  if (result.canceled || result.filePaths.length === 0) return
  const filePath = result.filePaths[0]
  const data = await readFile(filePath, 'utf-8')
  sendToRenderer('menu:open', filePath, data)
  await addRecent(filePath)
}

/**
 * Recent エントリからファイルを開く
 */
async function menuOpenRecent(filePath) {
  try {
    const data = await readFile(filePath, 'utf-8')
    sendToRenderer('menu:open', filePath, data)
    await addRecent(filePath)
  } catch {
    // ファイルが見つからない場合はインフォダイアログを表示
    const win = BrowserWindow.getAllWindows()[0]
    if (win) {
      dialog.showMessageBox(win, {
        type: 'info',
        message: 'ファイルが見つかりません',
        detail: filePath,
      })
    }
  }
}

/**
 * アプリケーションメニューを構築・適用する
 * Recent リストが変わるたびに再呼び出す
 */
function buildMenu(recentItems = []) {
  const recentSubmenu = recentItems.length > 0
    ? [
        ...recentItems.map((r) => ({
          label: r.name,
          click: () => menuOpenRecent(r.filePath),
        })),
        { type: 'separator' },
        {
          label: 'Clear Menu',
          click: async () => {
            await writeFile(RECENT_PATH, '[]', 'utf-8')
            buildMenu([])
          },
        },
      ]
    : [{ label: '(なし)', enabled: false }]

  const template = [
    {
      label: app.name,
      submenu: [
        { label: `About ${app.name}`, role: 'about' },
        { type: 'separator' },
        {
          label: 'Preferences...',
          accelerator: 'Cmd+,',
          click: () => sendToRenderer('menu:preferences'),
        },
        { type: 'separator' },
        { label: 'Services', role: 'services' },
        { type: 'separator' },
        { label: `Hide ${app.name}`, role: 'hide' },
        { label: 'Hide Others', role: 'hideOthers' },
        { label: 'Show All', role: 'unhide' },
        { type: 'separator' },
        { label: `Quit ${app.name}`, role: 'quit' },
      ],
    },
    {
      label: 'File',
      submenu: [
        {
          label: 'New',
          accelerator: 'Cmd+N',
          click: () => sendToRenderer('menu:new'),
        },
        {
          label: 'Open...',
          accelerator: 'Cmd+O',
          click: () => menuOpen(),
        },
        {
          label: 'Open Recent',
          submenu: recentSubmenu,
        },
        { type: 'separator' },
        {
          label: 'Save',
          accelerator: 'Cmd+S',
          click: () => menuSave(),
        },
        {
          label: 'Save As...',
          accelerator: 'Cmd+Shift+S',
          click: () => menuSaveAs(),
        },
        { type: 'separator' },
        { label: 'Close Window', role: 'close' },
      ],
    },
    {
      label: 'Edit',
      role: 'editMenu',
    },
    {
      label: 'View',
      submenu: [
        { label: 'Reload', role: 'reload' },
        { label: 'Force Reload', role: 'forceReload' },
        ...(isDev ? [{ label: 'Toggle Developer Tools', role: 'toggleDevTools' }] : []),
        { type: 'separator' },
        { label: 'Toggle Full Screen', role: 'togglefullscreen' },
      ],
    },
    {
      label: 'Window',
      role: 'windowMenu',
    },
    {
      label: 'Help',
      role: 'help',
    },
  ]

  const menu = Menu.buildFromTemplate(template)
  Menu.setApplicationMenu(menu)
}

/** アプリ起動時に必要なディレクトリを作成 */
async function ensureDirectories() {
  for (const dir of [GEO_DIR, PROJECTS_DIR, PRESETS_DIR]) {
    if (!existsSync(dir)) {
      await mkdir(dir, { recursive: true })
    }
  }
}

// before-quit で使う終了フラグ（グローバル変数を避けクロージャで管理）
let autosaveDone = false

function createWindow() {
  const win = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1024,
    minHeight: 600,
    backgroundColor: '#000000',
    titleBarStyle: 'hiddenInset',
    webPreferences: {
      preload: join(__dirname, 'preload.js'),

      // ── セキュリティ設定（権限最小化）──────────────────────────
      nodeIntegration: false,   // レンダラーから Node.js を直接使わせない
      contextIsolation: true,   // preload との境界を明確に保つ
      sandbox: true,            // OS レベルでレンダラーを隔離
      // ────────────────────────────────────────────────────────
    },
  })

  if (isDev) {
    // 開発時: Vite dev server をロード
    win.loadURL('http://localhost:5173')
    win.webContents.openDevTools({ mode: 'detach' })
  } else {
    // 本番時: ビルド済み index.html をロード
    win.loadFile(join(__dirname, '../dist/index.html'))
  }

  return win
}

// ── IPC ハンドラー（geoAPI の実装）────────────────────────────────

ipcMain.handle('save-file', async (_event, filePath, data) => {
  await writeFile(filePath, data, 'utf-8')
  return { success: true }
})

ipcMain.handle('load-file', async (_event, filePath) => {
  const data = await readFile(filePath, 'utf-8')
  return data
})

ipcMain.handle('show-save-dialog', async () => {
  const result = await dialog.showSaveDialog({
    title: 'プロジェクトを保存',
    defaultPath: join(PROJECTS_DIR, 'my-scene.geography'),
    filters: [{ name: 'GeoGraphy Project', extensions: ['geography'] }],
  })
  return result
})

ipcMain.handle('show-open-dialog', async () => {
  const result = await dialog.showOpenDialog({
    title: 'プロジェクトを開く',
    defaultPath: PROJECTS_DIR,
    filters: [{ name: 'GeoGraphy Project', extensions: ['geography'] }],
    properties: ['openFile'],
  })
  return result
})

ipcMain.handle('get-data-dir', () => {
  return { geoDir: GEO_DIR, projectsDir: PROJECTS_DIR, presetsDir: PRESETS_DIR }
})

/**
 * autosave.geography に書き込む。
 * 書き込み完了後に 'autosave-complete' イベントを emit して
 * before-quit ハンドラーに通知する。
 */
ipcMain.handle('autosave', async (_event, data) => {
  await writeFile(AUTOSAVE_PATH, data, 'utf-8')
  ipcMain.emit('autosave-complete')
  return { success: true }
})

/** autosave.geography を読み込む（なければ null） */
ipcMain.handle('get-autosave', async () => {
  if (!existsSync(AUTOSAVE_PATH)) return null
  return await readFile(AUTOSAVE_PATH, 'utf-8')
})

// ── アプリライフサイクル ────────────────────────────────────────────

app.whenReady().then(async () => {
  await ensureDirectories()
  const recentItems = await loadRecent()
  buildMenu(recentItems)
  createWindow()

  /**
   * before-quit: renderer に自動保存データを要求し、
   * autosave IPC 完了後に再度 quit() する。
   *
   * フロー:
   *   1. before-quit イベント → event.preventDefault() で終了を一時停止
   *   2. renderer に 'request-autosave-data' を送信
   *   3. renderer が engine.buildProject() → geoAPI.autosave(json) を実行
   *   4. autosave IPC ハンドラーが完了 → 'autosave-complete' イベントを emit
   *   5. ここで autosaveDone=true にして app.quit() を再呼び出し
   *   6. タイムアウト（3秒）: renderer が応答しなくても強制終了
   */
  app.on('before-quit', (event) => {
    if (autosaveDone) return

    event.preventDefault()

    const allWindows = BrowserWindow.getAllWindows()
    if (allWindows.length === 0) {
      autosaveDone = true
      app.quit()
      return
    }

    let timeoutId = null

    const finish = () => {
      if (timeoutId) clearTimeout(timeoutId)
      autosaveDone = true
      app.quit()
    }

    // autosave 完了通知を一度だけ受け取る
    ipcMain.once('autosave-complete', finish)

    // 3秒タイムアウト（renderer が応答しない場合の安全弁）
    timeoutId = setTimeout(() => {
      ipcMain.removeListener('autosave-complete', finish)
      autosaveDone = true
      app.quit()
    }, 3000)

    // renderer に自動保存を依頼
    allWindows[0].webContents.send('request-autosave-data')
  })

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
