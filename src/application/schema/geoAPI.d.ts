/**
 * GeoGraphy Electron geoAPI 型定義
 * spec: docs/spec/electron.spec.md §6
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
      // ── ファイル操作 ──────────────────────────────────────────────

      saveFile(filePath: string, data: string): Promise<{ success: boolean }>
      loadFile(filePath: string): Promise<string>
      showSaveDialog(): Promise<{ canceled: boolean; filePath?: string }>
      showOpenDialog(): Promise<{ canceled: boolean; filePaths: string[] }>
      getDataDir(): Promise<{
        geoDir: string
        projectsDir: string
        presetsDir: string
      }>
      saveProjectFile(filePath: string, data: string): Promise<{ success: boolean }>

      // ── autosave ────────────────────────────────────────────────

      autosave(data: string): Promise<{ success: boolean }>
      getAutosave(): Promise<string | null>
      onRequestAutosave(
        callback: (sendData: (json: string) => void) => void
      ): void
      removeAutosaveListener(): void

      // ── メニューイベント ───────────────────────────────────────────
      // spec: docs/spec/electron.spec.md §6

      /**
       * メニューバーからの操作イベントをまとめて登録する。
       * File / GeoGraphy / View メニューのイベントを一括受信する。
       */
      onMenuEvents(handlers: {
        // File / GeoGraphy メニュー
        onNew?: () => void
        onOpen?: (filePath: string, data: string) => void
        onSave?: () => void
        onSaveAs?: (filePath: string) => void
        onPreferences?: () => void

        // View メニュー（Day29追加）
        onToggleMixerWindow?: () => void
        onToggleFxWindow?: () => void
        onToggleMacroKnobWindow?: () => void
        onHideAllWindows?: () => void
        onShowAllWindows?: () => void

        // 録画イベント
        onStartRecording?: () => void
        onStopRecording?: () => void
      }): void

      /** onMenuEvents で登録したリスナーをすべて解除する */
      removeMenuListeners(): void

      // ── 録画 ─────────────────────────────────────────────

      /**
       * 録画データ（ArrayBuffer）を recordings/ に WebM として保存する。
       * 保存先パスを返す。
       */
      saveRecording(buffer: ArrayBuffer, defaultName: string): Promise<{ filePath?: string; canceled: boolean }>

      // ── CC Map / CC Overrides ─────────────────────────────────
      // spec: docs/spec/cc-mapping.spec.md §6

      loadCcMap(): Promise<string | null>
      loadCcOverrides(): Promise<string | null>
      saveCcOverrides(data: string): Promise<{ success: boolean }>
    }
  }
}
