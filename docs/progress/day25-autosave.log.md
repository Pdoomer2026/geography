# Day25 — 自動保存（autosave）実装ログ
> spec: docs/spec/project-file.spec.md §2
> 担当: Claude Desktop
> 日付: 2026-03-24

---

## 目標

Electron アプリ終了時に `~/Documents/GeoGraphy/autosave.geography` へ自動保存。
次回起動時に autosave が存在すれば自動復元する。

---

## 実装フロー

```
終了時:
  app.before-quit
    → event.preventDefault()
    → renderer に 'request-autosave-data' を送信
    → useAutosave hook が受信
    → engine.buildProject('autosave') → geoAPI.autosave(json)
    → main.js: autosave IPC ハンドラー → fs.writeFile → 'autosave-complete' emit
    → before-quit: autosaveDone=true → app.quit()
    ※ 3秒タイムアウトで強制終了（安全弁）

起動時:
  useAutosave hook のマウント時
    → geoAPI.getAutosave()
    → autosave.geography が存在すれば engine.restoreProject()
```

---

## ステップ記録

### Step 1: `electron/preload.js` に autosave API を追加 ✅

追加 API:
- `geoAPI.autosave(data)`: autosave IPC を叩く
- `geoAPI.getAutosave()`: autosave.geography を読み込む（なければ null）
- `geoAPI.onRequestAutosave(callback)`: main からのリクエストを受信
- `geoAPI.removeAutosaveListener()`: リスナー解除

---

### Step 2: `electron/main.js` を更新 ✅

追加:
- `AUTOSAVE_PATH = ~/Documents/GeoGraphy/autosave.geography`
- `ipcMain.handle('autosave')`: fs.writeFile → 'autosave-complete' emit
- `ipcMain.handle('get-autosave')`: existsSync → readFile or null
- `app.on('before-quit')`: renderer に request → autosave-complete 待機 → quit
  - タイムアウト 3秒で強制終了（安全弁）
  - `autosaveDone` フラグで二重防止

---

### Step 3: `src/types/geoAPI.d.ts` に型定義を追加 ✅

追加:
- `autosave(data: string): Promise<{ success: boolean }>`
- `getAutosave(): Promise<string | null>`
- `onRequestAutosave(callback): void`
- `removeAutosaveListener(): void`

---

### Step 4: `src/ui/useAutosave.ts` を新規作成 ✅

- 起動時: `getAutosave()` → `engine.restoreProject()`
- 終了時: `onRequestAutosave()` → `engine.buildProject('autosave')` → `sendData(json)`
- アンマウント時: `removeAutosaveListener()` でリスナー解除

---

### Step 5: `src/ui/App.tsx` に `useAutosave()` を追加 ✅

1行追加するだけ（hook の責務分離）。

---

## 完了条件確認（実行待ち）

```bash
cd /Users/shinbigan/geography && pnpm tsc --noEmit && pnpm test --run
```

期待結果:
- tsc: PASS（型エラーゼロ）
- tests: 104 passed（変化なし・新規テストなし）
  ※ useAutosave は Electron IPC に依存するため vitest 環境では検証不可
  ※ 動作確認は pnpm dev:electron で手動実施

---

## 動作確認手順（Electron）

```
1. pnpm dev:electron でウィンドウ起動
2. Setup タブで Geometry を変更して APPLY
3. ウィンドウを閉じる（Cmd+Q）
4. ~/Documents/GeoGraphy/autosave.geography が生成されていることを確認
5. pnpm dev:electron で再起動 → 前回の状態が復元されていることを確認
```
