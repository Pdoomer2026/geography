# GeoGraphy 引き継ぎメモ｜Day24｜2026-03-24

## プロジェクト概要
- **アプリ名**: GeoGraphy（Geometry×地形×Graph のダブルミーニング）
- **目的**: No-Texture・Plugin駆動・マルチライブラリ対応のブラウザベース映像制作プラットフォーム
- **スタック**: Vite / React 18 / TypeScript / Three.js r160+ / pnpm v10.32+ / **Electron 41**（Day24追加）
- **開発スタイル**: SDD × CDD（仕様駆動 × コンパイラ駆動）
- **GitHub**: https://github.com/Pdoomer2026/geography
- **ブラウザ起動**: `pnpm dev`（port 5173）
- **Electron 起動**: `pnpm dev:electron`
- **プロジェクトルート**: `/Users/shinbigan/geography`

## 重要ファイルパス

| ファイル | パス |
|---|---|
| CLAUDE.md（全体方針） | `CLAUDE.md` |
| HANDOVER.md（最新） | `HANDOVER.md` |
| 型定義 | `src/types/index.ts` |
| geoAPI 型定義（新規） | `src/types/geoAPI.d.ts` |
| Electron メインプロセス | `electron/main.js` |
| Electron preload | `electron/preload.js` |
| Electron CJS 設定 | `electron/package.json` |
| Preferences パネル | `src/ui/PreferencesPanel.tsx` |
| Electron spec | `docs/spec/electron.spec.md` |
| Project File spec | `docs/spec/project-file.spec.md` |
| Day24進捗ログ | `docs/progress/day24-electron.log.md` |

## 今回のセッションで完了したこと

### Electron 化 Phase 1
- `electron/main.js` 作成（BrowserWindow・IPC ハンドラー・ディレクトリ自動作成）
- `electron/preload.js` 作成（contextBridge で `window.geoAPI` を公開）
- `electron/package.json` 追加（`{ "type": "commonjs" }` でルートの ESM と共存）
- `src/types/geoAPI.d.ts` 作成（`window.geoAPI` の TypeScript 型定義）
- `package.json` 更新（`"main"` / `"dev:electron"` / `"build:electron"` / electron-builder 設定）
- `vite.config.ts` に `base: './'` 追加
- `PreferencesPanel.tsx` の Project タブを geoAPI 対応に（Electron/ブラウザ両対応）

### セキュリティ設定（Xポスト知見を反映）
```js
webPreferences: {
  nodeIntegration: false,   // レンダラーから Node.js を直接触れない
  contextIsolation: true,   // preload との境界を明確に
  sandbox: true,            // OS レベルで隔離
}
```

### 動作確認済み
- `pnpm dev:electron` → Electron ウィンドウ起動 ✅
- DevTools Console で `typeof window.geoAPI === 'object'` ✅

## 現在の状態（重要）

- **ブランチ**: `main`
- **最新コミット**: `e697ef3` docs: HANDOVER.md Day24完了
- **テスト**: 90 tests グリーン
- **tsc**: PASS（型エラーゼロ）
- **geoAPI**: IPC 経由で save / load / showSaveDialog / showOpenDialog / getDataDir が使える状態

## 発生した問題と解決策

| 問題 | 解決策 |
|---|---|
| Electron バイナリ破損（初回インストール） | `rm -rf node_modules/electron node_modules/.pnpm/electron@41.0.3 && pnpm install` |
| `preload.js` で `import` → SyntaxError | `require()` に変更 + `electron/package.json` で `"type": "commonjs"` を追加 |
| DevTools Console に貼り付け不可 | `allow pasting` と入力して Enter で許可 |

## 次回やること（Day25）

1. **Electron Phase 2: プロジェクトファイルの実装**（最優先）
   - `GeoGraphyProject` 型を `src/types/index.ts` に追加（spec: project-file.spec.md §3）
   - `engine.serializeScene()` / `engine.loadProject()` を実装
   - `PreferencesPanel` の Save / Load が実際に `.geography` ファイルを読み書きする
   - 自動保存: アプリ終了時に `~/Documents/GeoGraphy/autosave.geography` へ保存

2. **Setup タブ: Geometry 選択の反映**
   - チェックリストは UI のみ → APPLY 時に実際のレイヤーに割り当て直す

3. **`pnpm build:electron` で .dmg ビルド確認**

## 環境メモ

- `electron/` ディレクトリは `"type": "commonjs"` → `require()` を使うこと（`import` 不可）
- `src/` 配下は ESM → `import` を使うこと
- `window.geoAPI` は Electron 環境のみ存在（ブラウザでは `undefined`）→ 使用前に `if (window.geoAPI)` チェック必須
- `unsafe-eval` の警告は開発時 Vite HMR が原因・本番ビルドでは出ない・無害
- `IMKCFRunLoopWakeUpReliable` ログは macOS の無害なシステムログ

---

## 始業時スタートプロンプト

```
GeoGraphy Day25を開始します。
まずHANDOVER.mdとCLAUDE.mdを読んで現状を把握してください。
その後、以下の手順で進めてください：
1. 下記コマンドの結果を貼り付けます（90 tests グリーン確認）
   cd /Users/shinbigan/geography && pnpm tsc --noEmit && pnpm test --run
2. pnpm dev:electron でElectronウィンドウ起動確認済みです
3. HANDOVER.md の「次回やること」セクションを読んでDay25実装を開始してください
開発スタイル：SDD × CDD
- 実装前に必ず対応する docs/spec/ ファイルを読むこと
- 完了条件は pnpm tsc --noEmit（型エラーゼロ）+ pnpm test --run（全テストグリーン）両方通過
- any は使わない・型エラーは自律修正
- 各ステップ完了ごとに docs/progress/day25-[機能名].log.md に追記すること
- プランを提示してから実装を開始すること
```
