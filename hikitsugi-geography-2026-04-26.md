# GeoGraphy 引き継ぎメモ｜Day 65｜2026-04-26

## プロジェクト概要
- アプリ名：GeoGraphy（TypeScript / React / Three.js による VJ ビジュアルミキサー）
- 技術スタック：React + Vite + Three.js + RxJS + Zustand + pnpm
- 開発スタイル：Claude Desktop（MCP）で設計・計画、Claude Code（ターミナル）で実装
- 開発サーバー：`cd ~/geography && pnpm dev` → `http://localhost:5173`
- 現在のブランチ：`refactor/day53-design`

## 重要ファイルパス
| ファイル | パス |
|---|---|
| メイン UI | `src/ui/App.tsx` |
| エンジン | `src/application/orchestrator/engine.ts` |
| レイヤー管理 | `src/application/orchestrator/layerManager.ts` |
| 出力管理 | `src/application/orchestrator/outputManager.ts` |
| エントリーポイント | `src/main.tsx` |
| 不要ファイル（削除待ち） | `src/ui/OutputPage.tsx` |
| 不要コード（削除待ち） | `src/application/sync/outputSync.ts` |

## 今回のセッションで完了したこと

- GeoGraphy 起動トラブルを解決（全角スペースが `pnpm dev` コマンドに混入していた）
- HDMI 外部出力の設計方針を確定
  - 開発用：案B（`captureStream` × 3 + CSS blend + `postMessage` 同期）
  - 本番用：案C（Electron BrowserWindow による直接レンダリング・未実装）
- `outputManager.ts` を案B で実装
  - L1〜L3 の canvas それぞれから `captureStream(60)` で MediaStream を生成
  - popup の `<video>` × 3 を CSS `mixBlendMode` で重ねて合成映像を再現
  - `O` キーで popup を開閉
- `layerManager.ts` に `onStyleChanged` リスナーを追加
  - `setOpacity` / `setBlendMode` / `setMute` の変更時に通知
  - `outputManager` が `postMessage({ type: 'STYLE_UPDATE' })` で popup にリアルタイム同期
- popup の `<video>` スタイル（opacity / blendMode / mute）が Mixer 操作に追従することを確認

## 現在の状態（重要）

- Output は `O` キーで popup を開き、TV 側にドラッグ → フルスクリーンで使用
- L1〜L3 の合成映像・Mixer の opacity / blendMode がリアルタイムで出力に反映される
- Mac の Dock が TV 側に移動してしまう場合はシステム設定 → ディスプレイ → 主ディスプレイを Mac 側に設定
- ブラウザ版はポップアップ許可が必要（Chrome の設定で `localhost:5173` を許可済み）

## 発生した問題と解決策

- 問題：`pnpm dev` が `ERR_PNPM_RECURSIVE_EXEC_FIRST_FAIL` で起動しない
  → 解決：コマンドに全角スペースが混入していた。ターミナルで半角で打ち直し
- 問題：デスクトップ環境で Cursor のターミナルが使えない
  → 解決：Mac 標準ターミナル（Spotlight → ターミナル）で `cd ~/geography && pnpm dev`
- 問題：`O` キーで popup が開かない
  → 解決：DevTools が開いているとキー入力がコンソールに取られる。DevTools を閉じてから操作
- 問題：Output popup に L1 映像しか出ない
  → 解決：`engine.getOutputCanvas()` が L1 のみ返していた。`layerManager.getLayers()` で全レイヤーを取得し `captureStream` × 3 に変更
- 問題：Mixer の opacity / blendMode 変更が popup に反映されない
  → 解決：`layerManager.onStyleChanged` + `postMessage` でリアルタイム同期を実装

## 次回やること

### 優先度：高
1. **不要コードの削除**
   - `src/ui/OutputPage.tsx` を削除
   - `src/application/sync/outputSync.ts` を削除
   - `src/main.tsx` の BroadcastChannel 関連コードを削除（OutputPage 分岐を除去）
   - `src/ui/App.tsx` の BroadcastChannel 関連 useEffect を削除

2. **案C（Electron 本番出力）の実装**
   - `window.geoAPI` 判定で `openOutput()` を分岐
   - Electron 側：`BrowserWindow` を新規作成し `layerManager` の canvas を直接渡す
   - セカンダリモニターへの自動配置（`_moveToSecondaryDisplay()` はすでに実装済み）
   - Chrome ヘッダーが出ないネイティブウィンドウで VJ 現場対応

### 優先度：中
3. **Output の aspect ratio 対応**
   - 現状 `object-fit: contain` で黒帯が出る場合あり。`cover` との選択を検討

## 環境メモ
- デスクトップ環境では Cursor が起動しないので Mac 標準ターミナルで `pnpm dev` を実行
- Chrome の `F12` は Mac では `Cmd + Option + I`
- コンソールにコードをペーストするには最初に `allow pasting` と入力して Enter が必要
- ポップアップブロックは `localhost:5173` を許可済み（再設定不要）
- `pnpm dev` 起動後は Chrome で `http://localhost:5173` を開く（ブックマーク済み）
