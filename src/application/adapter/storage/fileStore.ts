/**
 * fileStore — ファイル I/O の薄い橋
 *
 * Application 層が Mac のファイルシステムに読み書きするための抽象レイヤー。
 * UI 層・Electron・ブラウザはこのモジュールを経由してファイルにアクセスする。
 *
 * Electron 環境: window.geoAPI.saveFile / loadFile を使用
 * ブラウザ環境: File System Access API を使用（初回のみユーザーがフォルダを選択）
 *
 * 正式な保存先: ~/Documents/GeoGraphy/
 * ブラウザで初回アクセス時に「~/Documents/GeoGraphy/ を選択してください」
 * というダイアログが表示される。一度許可すれば以降は自動。
 *
 * Day88 設計原則:
 *   - localStorage は使用しない（ブラウザ・Electron の内部DBに預けない）
 *   - geoAPI の役割はプロジェクトファイルのダイアログのみ（Preset には使わない）
 *   - Application 層が直接ファイルシステムを管理する
 */

// ============================================================
// IndexedDB ヘルパー（ブラウザ: ディレクトリハンドルの永続化）
// ============================================================

const IDB_NAME = 'geography-filestore'
const IDB_STORE = 'handles'
const IDB_KEY = 'geo-dir-handle'

function openIDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(IDB_NAME, 1)
    req.onupgradeneeded = () => req.result.createObjectStore(IDB_STORE)
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

async function saveHandleToIDB(handle: FileSystemDirectoryHandle): Promise<void> {
  try {
    const db = await openIDB()
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(IDB_STORE, 'readwrite')
      tx.objectStore(IDB_STORE).put(handle, IDB_KEY)
      tx.oncomplete = () => resolve()
      tx.onerror = () => reject(tx.error)
    })
  } catch {
    // IndexedDB が使えない環境では無視
  }
}

async function loadHandleFromIDB(): Promise<FileSystemDirectoryHandle | null> {
  try {
    const db = await openIDB()
    return await new Promise((resolve) => {
      const tx = db.transaction(IDB_STORE, 'readonly')
      const req = tx.objectStore(IDB_STORE).get(IDB_KEY)
      req.onsuccess = () => resolve((req.result as FileSystemDirectoryHandle) ?? null)
      req.onerror = () => resolve(null)
    })
  } catch {
    return null
  }
}

// ============================================================
// 内部状態
// ============================================================

/** ブラウザ環境のディレクトリハンドル（~/Documents/GeoGraphy/） */
let _dirHandle: FileSystemDirectoryHandle | null = null

/** Electron のベースディレクトリパス */
let _geoDir: string | null = null

// ============================================================
// 初期化・アクセス確認
// ============================================================

/**
 * Electron 環境かどうかを返す。
 */
export function isElectron(): boolean {
  return typeof window !== 'undefined' && !!window.geoAPI
}

/**
 * File System Access API がブラウザで使えるかどうかを返す。
 */
function hasFSA(): boolean {
  return typeof window !== 'undefined' && 'showDirectoryPicker' in window
}

/**
 * fileStore を初期化する。
 *
 * Electron: geoAPI.getDataDir() でベースパスを取得
 * ブラウザ: IndexedDB に保存済みのハンドルを復元し、権限を確認する
 *
 * @returns true = 利用可能 / false = 未許可または非対応
 */
export async function initFileStore(): Promise<boolean> {
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

  // ブラウザ: 保存済みハンドルを復元
  if (!hasFSA()) return false

  const saved = await loadHandleFromIDB()
  if (saved) {
    try {
      // File System Access API の権限確認（TypeScript の型定義が古いため any 経由）
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const handle = saved as any
      const perm = await handle.queryPermission({ mode: 'readwrite' })
      if (perm === 'granted') {
        _dirHandle = saved
        return true
      }
      // 権限が失効していた場合は再要求
      const req = await handle.requestPermission({ mode: 'readwrite' })
      if (req === 'granted') {
        _dirHandle = saved
        return true
      }
    } catch {
      // ハンドルが無効になった場合
    }
  }
  return false
}

/**
 * ブラウザ環境でユーザーに GeoGraphy フォルダの選択を求める。
 * 初回のみ呼ぶ。「~/Documents/GeoGraphy/」を選択してもらう。
 *
 * @returns true = 許可された / false = キャンセルされた
 */
export async function requestFolderAccess(): Promise<boolean> {
  if (isElectron()) return true
  if (!hasFSA()) return false

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handle = await (window as any).showDirectoryPicker({ mode: 'readwrite' }) as FileSystemDirectoryHandle
    _dirHandle = handle
    await saveHandleToIDB(handle)
    return true
  } catch {
    // ユーザーがキャンセル
    return false
  }
}

/**
 * fileStore が使用可能な状態かどうかを返す。
 */
export function isFileStoreReady(): boolean {
  if (isElectron()) return !!_geoDir
  return !!_dirHandle
}

// ============================================================
// ファイル操作（内部）
// ============================================================

/**
 * パスを分割してディレクトリとファイル名を返す。
 * 例: 'presets/clip-grid.json' → { dirs: ['presets'], name: 'clip-grid.json' }
 */
function parsePath(relativePath: string): { dirs: string[]; name: string } {
  const parts = relativePath.split('/')
  return {
    dirs: parts.slice(0, -1),
    name: parts[parts.length - 1],
  }
}

/**
 * ブラウザ: ディレクトリハンドルをたどってファイルハンドルを取得する。
 */
async function getFileHandle(
  relativePath: string,
  create: boolean
): Promise<FileSystemFileHandle | null> {
  if (!_dirHandle) return null
  const { dirs, name } = parsePath(relativePath)
  let dir = _dirHandle
  for (const d of dirs) {
    try {
      dir = await dir.getDirectoryHandle(d, { create })
    } catch {
      return null
    }
  }
  try {
    return await dir.getFileHandle(name, { create })
  } catch {
    return null
  }
}

// ============================================================
// Public API
// ============================================================

/**
 * JSON ファイルを読み込む。
 *
 * @param relativePath ~/Documents/GeoGraphy/ からの相対パス（例: 'clip-grid.json'）
 * @returns パースされたオブジェクト、ファイルが存在しない場合は null
 */
export async function readJson(relativePath: string): Promise<unknown | null> {
  try {
    if (isElectron() && _geoDir) {
      const fullPath = `${_geoDir}/${relativePath}`
      const raw = await window.geoAPI!.loadFile(fullPath)
      return JSON.parse(raw)
    }

    if (_dirHandle) {
      const fh = await getFileHandle(relativePath, false)
      if (!fh) return null
      const file = await fh.getFile()
      const text = await file.text()
      return JSON.parse(text)
    }

    return null
  } catch {
    return null
  }
}

/**
 * JSON ファイルに書き込む。
 *
 * @param relativePath ~/Documents/GeoGraphy/ からの相対パス（例: 'clip-grid.json'）
 * @param data 書き込むオブジェクト
 */
export async function writeJson(relativePath: string, data: unknown): Promise<void> {
  try {
    const json = JSON.stringify(data, null, 2)

    if (isElectron() && _geoDir) {
      const fullPath = `${_geoDir}/${relativePath}`
      await window.geoAPI!.saveFile(fullPath, json)
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

/**
 * ファイルを削除する。
 *
 * @param relativePath ~/Documents/GeoGraphy/ からの相対パス
 */
export async function deleteFile(relativePath: string): Promise<void> {
  try {
    if (_dirHandle) {
      const { dirs, name } = parsePath(relativePath)
      let dir = _dirHandle
      for (const d of dirs) {
        dir = await dir.getDirectoryHandle(d, { create: false })
      }
      await dir.removeEntry(name)
    }
    // Electron 側は saveFile で空 JSON を書くか、geoAPI に deleteFile がないため現状スキップ
  } catch {
    // ファイルが存在しない場合は無視
  }
}
