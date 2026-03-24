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

      /**
       * autosave.geography に現在の状態を書き込む（アプリ終了時に呼ぶ）
       * renderer → main の IPC 経由で ~/Documents/GeoGraphy/autosave.geography に保存する。
       */
      autosave(data: string): Promise<{ success: boolean }>

      /**
       * autosave.geography の内容を読み込む（起動時に呼ぶ）
       * ファイルが存在しない場合は null を返す。
       */
      getAutosave(): Promise<string | null>

      /**
       * main からの自動保存リクエストを受信するリスナーを登録する。
       * main が 'request-autosave-data' を送ったとき callback が呼ばれる。
       * callback の引数 sendData に JSON 文字列を渡すと autosave IPC が実行される。
       */
      onRequestAutosave(
        callback: (sendData: (json: string) => void) => void
      ): void

      /** onRequestAutosave で登録したリスナーを解除する */
      removeAutosaveListener(): void

      /** メニューバーからの操作イベントをまとめて登録する */
      onMenuEvents(handlers: {
        onNew?: () => void
        onOpen?: (filePath: string, data: string) => void
        onSave?: () => void
        onSaveAs?: (filePath: string) => void
        onPreferences?: () => void
      }): void

      /** onMenuEvents で登録したリスナーをすべて解除する */
      removeMenuListeners(): void

      /** Save 完了後に main へファイルを書き込む */
      saveProjectFile(filePath: string, data: string): Promise<{ success: boolean }>
    }
  }
}
