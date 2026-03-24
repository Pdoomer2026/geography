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

/** アプリ起動時に必要なディレクトリを作成 */
async function ensureDirectories() {
  for (const dir of [GEO_DIR, PROJECTS_DIR, PRESETS_DIR]) {
    if (!existsSync(dir)) {
      await mkdir(dir, { recursive: true })
    }
  }
}

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

// ── アプリライフサイクル ────────────────────────────────────────────

app.whenReady().then(async () => {
  await ensureDirectories()
  createWindow()

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
