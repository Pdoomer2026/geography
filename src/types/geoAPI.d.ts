/**
 * GeoGraphy Electron geoAPI 型定義
 * spec: docs/spec/electron.spec.md §4
 *
 * window.geoAPI は Electron 環境でのみ存在する。
 * ブラウザ環境では undefined になるため、使用前に必ず存在チェックが必要。
 *
 * 使用例:
 *   if (window.geoAPI) {
 *     const result = await window.geoAPI.showSaveDialog()
 *   }
 */

export {}

declare global {
  interface Window {
    geoAPI?: {
      /** ファイルを保存する */
      saveFile(filePath: string, data: string): Promise<{ success: boolean }>

      /** ファイルを読み込む */
      loadFile(filePath: string): Promise<string>

      /** 名前を付けて保存ダイアログを表示する */
      showSaveDialog(): Promise<{ canceled: boolean; filePath?: string }>

      /** ファイルを開くダイアログを表示する */
      showOpenDialog(): Promise<{ canceled: boolean; filePaths: string[] }>

      /** GeoGraphy データディレクトリのパスを取得する */
      getDataDir(): Promise<{
        geoDir: string
        projectsDir: string
        presetsDir: string
      }>
    }
  }
}
