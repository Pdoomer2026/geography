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

const { app, BrowserWindow, ipcMain, dialog } = require('electron')
const { join } = require('path')
const { readFile, writeFile, mkdir } = require('fs/promises')
const { existsSync } = require('fs')
const { homedir } = require('os')

const isDev = process.env.NODE_ENV !== 'production'

// GeoGraphy データディレクトリ（spec: project-file.spec.md §6）
const GEO_DIR = join(homedir(), 'Documents', 'GeoGraphy')
const PROJECTS_DIR = join(GEO_DIR, 'projects')
const PRESETS_DIR = join(GEO_DIR, 'presets')
const AUTOSAVE_PATH = join(GEO_DIR, 'autosave.geography')

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
