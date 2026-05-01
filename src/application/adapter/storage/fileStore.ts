/**
 * fileStore — ファイル I/O の薄い橋
 *
 * Application 層が Mac のファイルシステムに読み書きするための抽象レイヤー。
 *
 * Electron 環境: window.geoAPI.saveFile / loadFile を使用
 * ブラウザ環境: File System Access API（初回のみユーザーが ~/Documents/GeoGraphy/ を選択）
 *
 * 正式な保存先: ~/Documents/GeoGraphy/
 *
 * Day88 設計原則:
 *   - localStorage は使用しない
 *   - geoAPI の役割はプロジェクトファイルのダイアログのみ
 *   - Application 層が直接ファイルシステムを管理する
 */

// ============================================================
// IndexedDB ヘルパー（ブラウザ: ディレクトリハンドルの永続化）
// ============================================================

const IDB_NAME  = 'geography-filestore'
const IDB_STORE = 'handles'
const IDB_KEY   = 'geo-dir-handle'

function openIDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(IDB_NAME, 1)
    req.onupgradeneeded = () => req.result.createObjectStore(IDB_STORE)
    req.onsuccess = () => resolve(req.result)
    req.onerror  = () => reject(req.error)
  })
}

async function saveHandleToIDB(handle: FileSystemDirectoryHandle): Promise<void> {
  try {
    const db = await openIDB()
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(IDB_STORE, 'readwrite')
      tx.objectStore(IDB_STORE).put(handle, IDB_KEY)
      tx.oncomplete = () => resolve()
      tx.onerror    = () => reject(tx.error)
    })
  } catch { /* ignore */ }
}

async function loadHandleFromIDB(): Promise<FileSystemDirectoryHandle | null> {
  try {
    const db = await openIDB()
    return await new Promise((resolve) => {
      const tx  = db.transaction(IDB_STORE, 'readonly')
      const req = tx.objectStore(IDB_STORE).get(IDB_KEY)
      req.onsuccess = () => resolve((req.result as FileSystemDirectoryHandle) ?? null)
      req.onerror   = () => resolve(null)
    })
  } catch {
    return null
  }
}

// ============================================================
// 内部状態
// ============================================================

let _dirHandle: FileSystemDirectoryHandle | null = null
let _geoDir:    string | null = null

// ============================================================
// 判定ヘルパー
// ============================================================

export function isElectron(): boolean {
  return typeof window !== 'undefined' && !!window.geoAPI
}

function hasFSA(): boolean {
  return typeof window !== 'undefined' && 'showDirectoryPicker' in window
}

// ============================================================
// 初期化
// ============================================================

/**
 * fileStore を初期化する。
 * Electron: geoAPI.getDataDir() でベースパスを取得（自動）
 * ブラウザ: IndexedDB に保存済みハンドルを復元し権限を確認
 *
 * @returns true = 利用可能 / false = 未許可または非対応
 */
export async function initFileStore(): Promise<boolean> {
  // Electron
  if (isElectron()) {
    if (_geoDir) return true
    try {
      const dirs = await window.geoAPI!.getDataDir()
      _geoDir = dirs.geoDir
      return true
    } catch {
      return false
    }
  }

  // ブラウザ: IndexedDB から保存済みハンドルを復元
  if (!hasFSA()) return false

  const saved = await loadHandleFromIDB()
  if (saved) {
    try {
      // TypeScript の型定義が古いため any 経由で権限確認
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const h    = saved as any
      const perm = await h.queryPermission({ mode: 'readwrite' })
      if (perm === 'granted') { _dirHandle = saved; return true }

      const req = await h.requestPermission({ mode: 'readwrite' })
      if (req === 'granted') { _dirHandle = saved; return true }
    } catch { /* ハンドルが無効 */ }
  }
  return false
}

/**
 * ブラウザ環境でユーザーに GeoGraphy フォルダの選択を求める（初回のみ）。
 * ~/Documents/GeoGraphy/ を選択してもらう。
 *
 * @returns true = 許可 / false = キャンセル
 */
export async function requestFolderAccess(): Promise<boolean> {
  if (isElectron()) return true
  if (!hasFSA())    return false
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handle = await (window as any).showDirectoryPicker({ mode: 'readwrite' }) as FileSystemDirectoryHandle
    _dirHandle = handle
    await saveHandleToIDB(handle)
    return true
  } catch {
    return false
  }
}

// ============================================================
// 内部ユーティリティ
// ============================================================

function parsePath(relativePath: string): { dirs: string[]; name: string } {
  const parts = relativePath.split('/')
  return { dirs: parts.slice(0, -1), name: parts[parts.length - 1] }
}

/** 相対パスのディレクトリハンドルを取得する */
async function getDirHandle(
  relativeDir: string,
  create = false,
): Promise<FileSystemDirectoryHandle | null> {
  if (!_dirHandle) return null
  if (!relativeDir) return _dirHandle
  let dir = _dirHandle
  for (const part of relativeDir.split('/').filter(Boolean)) {
    try { dir = await dir.getDirectoryHandle(part, { create }) }
    catch { return null }
  }
  return dir
}

async function getFileHandle(
  relativePath: string,
  create: boolean,
): Promise<FileSystemFileHandle | null> {
  if (!_dirHandle) return null
  const { dirs, name } = parsePath(relativePath)
  let dir = _dirHandle
  for (const d of dirs) {
    try { dir = await dir.getDirectoryHandle(d, { create }) }
    catch { return null }
  }
  try { return await dir.getFileHandle(name, { create }) }
  catch { return null }
}

// ============================================================
// Public API
// ============================================================

/**
 * ディレクトリ内のファイル名一覧を返す。
 * @param relativeDir ~/Documents/GeoGraphy/ からの相対ディレクトリパス
 */
export async function listFiles(relativeDir: string): Promise<string[]> {
  try {
    if (isElectron() && _geoDir) {
      return await window.geoAPI!.listFiles(`${_geoDir}/${relativeDir}`)
    }
    if (_dirHandle) {
      const dir = await getDirHandle(relativeDir)
      if (!dir) return []
      const names: string[] = []
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      for await (const [name, handle] of (dir as any).entries()) {
        if ((handle as FileSystemHandle).kind === 'file') names.push(name)
      }
      return names
    }
    return []
  } catch {
    return []
  }
}

/**
 * ファイルを削除する。
 * @param relativePath ~/Documents/GeoGraphy/ からの相対パス
 */
export async function deleteFile(relativePath: string): Promise<void> {
  try {
    if (isElectron() && _geoDir) {
      await window.geoAPI!.deleteFile(`${_geoDir}/${relativePath}`)
      return
    }
    if (_dirHandle) {
      const { dirs, name } = parsePath(relativePath)
      const dir = await getDirHandle(dirs.join('/'))
      if (!dir) return
      await dir.removeEntry(name)
    }
  } catch { /* ファイルが存在しない場合は無視 */ }
}

/**
 * JSON ファイルを読み込む。
 * @param relativePath ~/Documents/GeoGraphy/ からの相対パス
 */
export async function readJson(relativePath: string): Promise<unknown | null> {
  try {
    if (isElectron() && _geoDir) {
      const raw = await window.geoAPI!.loadFile(`${_geoDir}/${relativePath}`)
      return JSON.parse(raw)
    }
    if (_dirHandle) {
      const fh = await getFileHandle(relativePath, false)
      if (!fh) return null
      const text = await (await fh.getFile()).text()
      return JSON.parse(text)
    }
    return null
  } catch {
    return null
  }
}

/**
 * JSON ファイルに書き込む。
 * @param relativePath ~/Documents/GeoGraphy/ からの相対パス
 */
export async function writeJson(relativePath: string, data: unknown): Promise<void> {
  try {
    const json = JSON.stringify(data, null, 2)
    if (isElectron() && _geoDir) {
      await window.geoAPI!.saveFile(`${_geoDir}/${relativePath}`, json)
      return
    }
    if (_dirHandle) {
      const fh = await getFileHandle(relativePath, true)
      if (!fh) return
      const writable = await fh.createWritable()
      await writable.write(json)
      await writable.close()
    }
  } catch (e) {
    console.warn('[fileStore] writeJson 失敗:', relativePath, e)
  }
}
