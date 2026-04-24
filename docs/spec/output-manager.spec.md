# Output Manager Spec

> SSoT: このファイル
> 担当エージェント: Claude Desktop
> 状態: Day79 設計確定・実装中
> 更新: 2026-04-25（Day79 新規作成）

---

## 1. 概要・目的

GeoGraphy の Three.js 出力映像を外部モニター／プロジェクターに
リアルタイムで送出するための Output Manager を定義する。

### 要件

- `pnpm dev`（ブラウザ開発環境）でも動作すること
- Electron 本番環境でも動作すること
- 両環境で outputManager.ts のコードは共通。差分は「ウィンドウ配置」だけ

---

## 2. 核心技術

```
canvas.captureStream(60)     <- Three.js renderer の canvas
  -> MediaStream
    -> popup window の <video>.srcObject = stream
      -> 外部モニターに表示
```

- `canvas.captureStream()` はブラウザ標準 API（Web API）
- Electron でも React dev（Chrome）でも同じコードで動作する
- **Electron 固有になる部分は「ウィンドウの自動配置」だけ**

---

## 3. アーキテクチャ（3ゾーン構造への配置）

```
【engine 層】
  engine.getOutputCanvas()
    -> layerManager から Program 側（最初の非ミュート）レイヤーの canvas を返す

【Application 層】
  src/application/orchestrator/outputManager.ts
    openOutput()   -> popup 開く + MediaStream 注入 + 配置依頼
    closeOutput()  -> popup を閉じる
    isOpen()       -> boolean

【UI 層 / 薄い鏡】
  Electron 環境: window.geoAPI.getDisplays() / moveOutputWindow() 経由
                 -> IPC -> main.js が外部モニターに自動配置
  React dev 環境: window.open() のみ -> 手動で外部モニターにドラッグ
```

---

## 4. outputManager.ts インターフェース

```typescript
// src/application/orchestrator/outputManager.ts

class OutputManager {
  openOutput(): Promise<void>
  closeOutput(): void
  isOpen(): boolean
}

export const outputManager: OutputManager
```

### openOutput() の処理フロー

```
1. engine.getOutputCanvas() で canvas を取得
2. canvas.captureStream(60) で MediaStream を生成
3. window.open() で popup を開く（about:blank）
4. popup の document に <video> を書き込む
5. popup の <video>.srcObject = stream をセット
6. window.geoAPI が存在する場合（Electron）:
   -> getDisplays() でセカンダリディスプレイを取得
   -> moveOutputWindow(x, y, w, h) で外部モニターに移動
   -> popup 内で video.requestFullscreen()
7. window.geoAPI がない場合（React dev）:
   -> popup を開くだけ（手動でドラッグして外部モニターへ）
```

---

## 5. engine.getOutputCanvas() の定義

```typescript
// engine.ts に追加

getOutputCanvas(): HTMLCanvasElement | null
  // layerManager から最初の非ミュートレイヤーの canvas を返す
  // 存在しない場合は null
```

---

## 6. geoAPI 拡張（Electron 薄い鏡）

```typescript
// geoAPI.d.ts に追加

/** 接続中のディスプレイ一覧を返す */
getDisplays(): Promise<Array<{
  id: number
  label: string
  bounds: { x: number; y: number; width: number; height: number }
  isPrimary: boolean
}>>

/** output popup ウィンドウをセカンダリディスプレイに移動する */
moveOutputWindow(x: number, y: number, width: number, height: number): Promise<void>
```

---

## 7. Electron IPC ハンドラー（main.js に追加）

| チャンネル | 処理 |
|---|---|
| `get-displays` | `screen.getAllDisplays()` を返す |
| `move-output-window` | popup の `BrowserWindow` を `setBounds()` で移動 |

### 注意点

- `move-output-window` で操作する対象は「output popup」の `BrowserWindow` インスタンス
- main.js 内でグローバル変数 `outputWin` として保持する
- Electron の `screen` モジュールを `require('electron')` から追加で import する

---

## 8. preload.js 拡張

```javascript
// contextBridge.exposeInMainWorld('geoAPI', { ... }) に追加

getDisplays: () => ipcRenderer.invoke('get-displays'),
moveOutputWindow: (x, y, w, h) => ipcRenderer.invoke('move-output-window', x, y, w, h),
```

---

## 9. App.tsx への接続

### メニューイベント（onMenuEvents に追加）

```typescript
onOpenOutput?:  () => void   // Output ウィンドウを開く
onCloseOutput?: () => void   // Output ウィンドウを閉じる
```

### キーボードショートカット

| キー | 動作 |
|---|---|
| `o` / `O` | Output ウィンドウのトグル（open / close） |

### ショートカット表示バー追記

```
O:Output
```

---

## 10. Electron main.js メニュー追加（View メニュー）

```javascript
{
  label: 'Output Window',
  accelerator: 'Cmd+Shift+O',
  click: () => sendToRenderer('menu:toggle-output'),
}
```

---

## 11. 環境差分まとめ

| 機能 | Electron | React dev（ブラウザ） |
|---|---|---|
| popup 開く | `window.open()` | `window.open()` |
| stream 注入 | `video.srcObject = stream` | `video.srcObject = stream` |
| ディスプレイ取得 | `geoAPI.getDisplays()` | 手動ドラッグ |
| ウィンドウ配置 | `geoAPI.moveOutputWindow()` | 手動ドラッグ |
| 全画面化 | popup 内で `video.requestFullscreen()` | 同じ |

---

## 12. 制約・注意事項

- `canvas.captureStream()` は `preserveDrawingBuffer: true` が必須
  -> `layerManager.ts` の WebGLRenderer 設定を確認すること（既に設定済みの可能性が高い）
- popup がブロックされる場合はユーザージェスチャー（クリック）から呼ぶこと
- popup は `window.open('about:blank')` + `document.write()` で同一オリジン扱いになる
  -> `srcObject` への代入が可能

---

## 13. References

- `src/application/orchestrator/engine.ts`
- `src/application/orchestrator/outputManager.ts`（新規）
- `src/application/schema/geoAPI.d.ts`
- `electron/main.js`
- `electron/preload.js`
- `docs/spec/electron.spec.md`
