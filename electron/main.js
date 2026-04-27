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

const { app, BrowserWindow, ipcMain, dialog, Menu, screen } = require('electron')
const { join } = require('path')
const { readFile, writeFile, mkdir } = require('fs/promises')
const { existsSync } = require('fs')
const { homedir } = require('os')

const isDev = !app.isPackaged

// GeoGraphy データディレクトリ（spec: project-file.spec.md §6）
const GEO_DIR        = join(homedir(), 'Documents', 'GeoGraphy')
const PROJECTS_DIR   = join(GEO_DIR, 'projects')
const PRESETS_DIR    = join(GEO_DIR, 'presets')
const RECORDINGS_DIR = join(GEO_DIR, 'recordings')
const AUTOSAVE_PATH  = join(GEO_DIR, 'autosave.geography')
const RECENT_PATH    = join(GEO_DIR, 'recent.json')

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
 * Day78: 薄い鏡化→ sendToRenderer のみ
 */
async function menuSave() {
  sendToRenderer('menu:save')
}

/**
 * メニューから呼び出す Save As... 処理
 * Day78: 薄い鏡化→ dialog は renderer 側が持つ。sendToRenderer のみに変更
 */
async function menuSaveAs() {
  sendToRenderer('menu:save-as')
}

/**
 * メニューから呼び出す Open... 処理
 * Day78: 薄い鏡化→ dialog + readFile は renderer 側が持つ。sendToRenderer のみに変更
 */
async function menuOpen() {
  sendToRenderer('menu:open')
}

/**
 * Recent エントリからファイルを開く
 * Day78: 薄い鏡化→ readFile + addRecent は renderer 側が持つ。
 *        filePath だけを renderer に渡す
 */
async function menuOpenRecent(filePath) {
  sendToRenderer('menu:open-recent', filePath)
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
    // ── GeoGraphy メニュー ──────────────────────────────────────
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

    // ── File メニュー ───────────────────────────────────────────
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
        {
          label: 'Start Recording',
          accelerator: 'Cmd+R',
          click: () => sendToRenderer('menu:start-recording'),
        },
        {
          label: 'Stop Recording',
          accelerator: 'Cmd+Shift+R',
          click: () => sendToRenderer('menu:stop-recording'),
        },
        { type: 'separator' },
        { label: 'Close Window', role: 'close' },
      ],
    },

    // ── Edit メニュー ───────────────────────────────────────────
    {
      label: 'Edit',
      role: 'editMenu',
    },

    // ── View メニュー（Day29 新設）──────────────────────────────
    // Simple Window の表示/非表示を切り替える。
    // spec: docs/spec/electron.spec.md §3 / docs/spec/simple-window.spec.md §5
    {
      label: 'View',
      submenu: [
        {
          label: 'Mixer Simple Window',
          accelerator: 'Cmd+3',
          click: () => sendToRenderer('menu:toggle-mixer-window'),
        },
        {
          label: 'FX Simple Window',
          accelerator: 'Cmd+2',
          click: () => sendToRenderer('menu:toggle-fx-window'),
        },
        {
          label: 'Macro Knob Simple Window',
          accelerator: 'Cmd+1',
          click: () => sendToRenderer('menu:toggle-macro-knob-window'),
        },
        { type: 'separator' },
        {
          label: 'Hide All Windows',
          accelerator: 'H',
          click: () => sendToRenderer('menu:hide-all-windows'),
        },
        {
          label: 'Show All Windows',
          accelerator: 'S',
          click: () => sendToRenderer('menu:show-all-windows'),
        },
        { type: 'separator' },
        {
          label: 'Output Window',
          accelerator: 'Cmd+Shift+O',
          click: () => sendToRenderer('menu:toggle-output'),
        },
        { type: 'separator' },
        ...(isDev
          ? [
              { label: 'Reload', role: 'reload' },
              { label: 'Force Reload', role: 'forceReload' },
              { label: 'Toggle Developer Tools', role: 'toggleDevTools' },
              { type: 'separator' },
            ]
          : []),
        { label: 'Toggle Full Screen', role: 'togglefullscreen' },
      ],
    },

    // ── Window メニュー ─────────────────────────────────────────
    {
      label: 'Window',
      role: 'windowMenu',
    },

    // ── Help メニュー ───────────────────────────────────────────
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
  for (const dir of [GEO_DIR, PROJECTS_DIR, PRESETS_DIR, RECORDINGS_DIR]) {
    if (!existsSync(dir)) {
      await mkdir(dir, { recursive: true })
    }
  }
}

// before-quit で使う終了フラグ
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
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
    },
  })

  if (isDev) {
    win.loadURL('http://localhost:5173')
    win.webContents.openDevTools({ mode: 'detach' })
  } else {
    win.loadFile(join(__dirname, '../dist/index.html'))
  }

  // ── 案C: Output Window のフレームレス化（Day80確立）────────────────────
  // outputManager が window.open('about:blank', 'GeoGraphy Output', ...) を呼ぶとき
  // Electron がここで interceptして frame:false の BrowserWindow として作成する。
  // これにより VJ 本番用の完全なウィンドウ chrome なし出力を実現する。
  // setFullScreen(true) は move-output-window IPC ハンドラー側で行う。
  win.webContents.setWindowOpenHandler(({ frameName }) => {
    if (frameName === 'GeoGraphy Output') {
      return {
        action: 'allow',
        overrideBrowserWindowOptions: {
          frame: false,
          titleBarStyle: 'hidden',
          alwaysOnTop: true,
          backgroundColor: '#000000',
        },
      }
    }
    // その他の window.open() はすべて拒否する
    return { action: 'deny' }
  })

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

/**
 * 録画データ（ArrayBuffer）を recordings/ に WebM として保存する。
 * 保存先ダイアログを表示してユーザーがファイル名を決める。
 */
ipcMain.handle('save-recording', async (_event, buffer, defaultName) => {
  const win = BrowserWindow.getAllWindows()[0]
  if (!win) return { canceled: true }

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)
  const fileName = defaultName ?? `recording-${timestamp}.webm`

  const result = await dialog.showSaveDialog(win, {
    title: '録画を保存',
    defaultPath: join(RECORDINGS_DIR, fileName),
    filters: [{ name: 'WebM Video', extensions: ['webm'] }],
  })

  if (result.canceled || !result.filePath) return { canceled: true }

  const nodeBuffer = Buffer.from(buffer)
  await writeFile(result.filePath, nodeBuffer)
  return { filePath: result.filePath, canceled: false }
})

/** autosave.geography を読み込む（なければ null） */
ipcMain.handle('get-autosave', async () => {
  if (!existsSync(AUTOSAVE_PATH)) return null
  return await readFile(AUTOSAVE_PATH, 'utf-8')
})

/** settings/cc-map.json を読み込む（なければ null） */
ipcMain.handle('load-cc-map', async () => {
  const ccMapPath = join(__dirname, '..', 'settings', 'cc-map.json')
  if (!existsSync(ccMapPath)) return null
  return await readFile(ccMapPath, 'utf-8')
})

/** cc-overrides.json を読み込む（なければ null） */
ipcMain.handle('load-cc-overrides', async () => {
  const overridesPath = join(GEO_DIR, 'cc-overrides.json')
  if (!existsSync(overridesPath)) return null
  return await readFile(overridesPath, 'utf-8')
})

/** cc-overrides.json を保存する */
ipcMain.handle('save-cc-overrides', async (_event, data) => {
  const overridesPath = join(GEO_DIR, 'cc-overrides.json')
  await writeFile(overridesPath, data, 'utf-8')
  return { success: true }
})


// ── Recent ファイル管理 IPC（Day78新設）────────────────────────────

/**
 * filePath を Recent に追加して recent.json を更新する。
 * 更新後に buildMenu() を呼び直してメニューを再構築する。
 */
ipcMain.handle('add-recent', async (_event, filePath) => {
  await addRecent(filePath)
  return { success: true }
})

/** Recent リストを返す（最大5件） */
ipcMain.handle('get-recent', async () => {
  return await loadRecent()
})

/** Recent リストをクリアしてメニューを再構築する */
ipcMain.handle('clear-recent', async () => {
  await writeFile(RECENT_PATH, '[]', 'utf-8')
  buildMenu([])
  return { success: true }
})

// ── Output 機能（spec: docs/spec/output-manager.spec.md）──────────────────

/**
 * 接続中の全ディスプレイ情報を返す。
 * outputManager がセカンダリディスプレイを特定するために使用する。
 */
ipcMain.handle('get-displays', () => {
  return screen.getAllDisplays().map((d) => ({
    id: d.id,
    label: d.label ?? `Display ${d.id}`,
    bounds: d.bounds,
    isPrimary: d.id === screen.getPrimaryDisplay().id,
  }))
})

/**
 * output popup ウィンドウを指定座標に移動する。
 * renderer 側の outputManager が openOutput() 内で呼び出す。
 *
 * 注意: popup（output window）は renderer が window.open() で開くため、
 * Electron からは "GeoGraphy Output" タイトルを持つ BrowserWindow として識別する。
 */
ipcMain.handle('move-output-window', (_event, x, y, w, h) => {
  const wins = BrowserWindow.getAllWindows()
  const outputWin = wins.find((win) => win.getTitle() === 'GeoGraphy Output')
  if (!outputWin) return
  outputWin.setBounds({ x: Math.round(x), y: Math.round(y), width: Math.round(w), height: Math.round(h) })
  outputWin.setFullScreen(true)
})

// ── アプリライフサイクル ────────────────────────────────────────────

app.whenReady().then(async () => {
  await ensureDirectories()
  const recentItems = await loadRecent()
  buildMenu(recentItems)
  createWindow()

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

    ipcMain.once('autosave-complete', finish)

    timeoutId = setTimeout(() => {
      ipcMain.removeListener('autosave-complete', finish)
      autosaveDone = true
      app.quit()
    }, 3000)

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
