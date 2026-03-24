# Day24 Electron 化 Phase 1 実装ログ

## 2026-03-24

### Step 1: パッケージ追加
- `electron@41.0.3` / `electron-builder@26.8.1` / `concurrently@9.2.1` / `wait-on@9.0.4`
- `pnpm approve-builds` で electron / electron-winstaller のビルドスクリプトを許可

### Step 2: `electron/main.js` 作成（CommonJS）
- `BrowserWindow` でウィンドウ生成（1440×900）
- dev 時: `http://localhost:5173` をロード + DevTools を detach モードで開く
- prod 時: `dist/index.html` をロード
- セキュリティ設定（Xポスト知見を反映）:
  - `nodeIntegration: false`
  - `contextIsolation: true`
  - `sandbox: true`
- IPC ハンドラー: `save-file` / `load-file` / `show-save-dialog` / `show-open-dialog` / `get-data-dir`
- GeoGraphy データディレクトリの自動作成（`~/Documents/GeoGraphy/`）

### Step 3: `electron/preload.js` 作成（CommonJS）
- `contextBridge.exposeInMainWorld('geoAPI', ...)` で renderer に安全に公開
- IMPORTANT: ES Module (import) ではなく CommonJS (require) で記述

### Step 4: `electron/package.json` 追加
- `{ "type": "commonjs" }` で electron/ ディレクトリを CommonJS モードに
- ルートの `"type": "module"` と共存させるための対応

### Step 5: `src/types/geoAPI.d.ts` 作成
- `window.geoAPI` の型定義
- Electron 環境のみ存在（`?` でオプショナル）

### Step 6: `vite.config.ts` に `base: './'` 追加
- Electron の `dist/index.html` ロードに必要な相対パス

### Step 7: `package.json` 更新
- `"main": "electron/main.js"` 追加
- `"dev:electron"` / `"build:electron"` スクリプト追加
- `"build"` セクション（electron-builder 設定）追加
- `pnpm.onlyBuiltDependencies` に `electron` / `electron-winstaller` を追加

### Step 8: `PreferencesPanel.tsx` の Project タブを geoAPI 対応に更新
- `isElectron = !!window.geoAPI` で環境を判定
- Electron 環境: OS ネイティブダイアログ（`showSaveDialog` / `showOpenDialog`）
- ブラウザ環境: LocalStorage フォールバック（既存動作を維持）
- Project タブに `ELECTRON` バッジ表示（Electron 環境のみ）

### トラブルシューティング
- `SyntaxError: Cannot use import statement outside a module`
  → preload.js は CommonJS が必須。`electron/package.json` で `"type": "commonjs"` を追加して解決

### 完了条件
- [x] pnpm tsc --noEmit PASS（型エラーゼロ）
- [x] pnpm test --run 90 tests グリーン
- [x] `pnpm dev:electron` で Electron ウィンドウ起動
- [x] `typeof window.geoAPI === 'object'` 確認（preload 正常動作）
- [x] セキュリティ設定: `nodeIntegration: false` / `contextIsolation: true` / `sandbox: true`
