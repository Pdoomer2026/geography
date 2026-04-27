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
       *
       * Day78: 薄い鏡化により onOpen / onSaveAs は引数なしに変更。
       *   - onOpen: renderer 側が showOpenDialog() + loadFile() + addRecent() を実行
       *   - onSaveAs: renderer 側が showSaveDialog() + saveAs() を実行
       *   - onOpenRecent: renderer 側が loadFile() + openProject() + addRecent() を実行
       */
      onMenuEvents(handlers: {
        // File / GeoGraphy メニュー
        onNew?: () => void
        onOpen?: () => void
        onSave?: () => void
        onSaveAs?: () => void
        onOpenRecent?: (filePath: string) => void
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

        // Output イベント（spec: docs/spec/output-manager.spec.md）
        onToggleOutput?: () => void
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

      // ── Preset ファイル管理（spec: docs/spec/layer-window.spec.md §5）──────

      /** Preset を JSON ファイルとして保存する */
      presetSave(type: 'layer' | 'scene', name: string, data: string): Promise<{ success: boolean; filePath: string }>

      /** Preset ファイル一覧を返す */
      presetList(type: 'layer' | 'scene'): Promise<Array<{ name: string; data: string }>>

      /** Preset ファイルを削除する */
      presetDelete(type: 'layer' | 'scene', name: string): Promise<{ success: boolean }>

      // ── Recent ファイル管理（Day78追加）─────────────────────────
      // spec: docs/spec/electron.spec.md §4

      /** filePath を Recent に追加する。main.js が recent.json を更新してメニューを再構築する */
      addRecent(filePath: string): Promise<{ success: boolean }>

      /** Recent リストを取得する（最大5件） */
      getRecent(): Promise<Array<{ name: string; filePath: string; savedAt: string }>>

      /** Recent リストをクリアする */
      clearRecent(): Promise<{ success: boolean }>

      // ── Output（spec: docs/spec/output-manager.spec.md）─────────

      /**
       * 接続中のディスプレイ一覧を返す。
       * outputManager が getDisplays() を呼んでセカンダリを特定する。
       */
      getDisplays(): Promise<Array<{
        id: number
        label: string
        bounds: { x: number; y: number; width: number; height: number }
        isPrimary: boolean
      }>>

      /**
       * output popup ウィンドウをセカンダリディスプレイに移動する。
       * Electron の BrowserWindow.setBounds() を使用。
       */
      moveOutputWindow(x: number, y: number, width: number, height: number): Promise<void>

      // ── CC Map / CC Overrides ─────────────────────────────────
      // spec: docs/spec/cc-mapping.spec.md §6

      loadCcMap(): Promise<string | null>
      loadCcOverrides(): Promise<string | null>
      saveCcOverrides(data: string): Promise<{ success: boolean }>
    }
  }
}
