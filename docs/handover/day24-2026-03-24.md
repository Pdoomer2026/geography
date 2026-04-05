# GeoGraphy 引き継ぎメモ｜Day24完了｜2026-03-24

## プロジェクト概要
- **アプリ名**: GeoGraphy（Geometry×地形×Graph のダブルミーニング）
- **目的**: No-Texture・Plugin駆動・マルチライブラリ対応のブラウザベース映像制作プラットフォーム
- **スタック**: Vite / React 18 / TypeScript / Three.js r160+ / pnpm v10.32+ / Electron 41
- **開発スタイル**: SDD × CDD（仕様駆動 × コンパイラ駆動）
- **GitHub**: https://github.com/Pdoomer2026/geography
- **開発サーバー（ブラウザ）**: `pnpm dev`（ポート5173）
- **開発サーバー（Electron）**: `pnpm dev:electron`
- **プロジェクトルート**: `/Users/shinbigan/geography`

## 重要ファイルパス

| ファイル | パス |
|---|---|
| CLAUDE.md（全体方針） | `CLAUDE.md` |
| 引き継ぎメモ（最新） | `HANDOVER.md` |
| 型定義 | `src/types/index.ts` |
| geoAPI 型定義 | `src/types/geoAPI.d.ts` |
| エンジン本体 | `src/core/engine.ts` |
| Preferences パネル | `src/ui/PreferencesPanel.tsx` |
| Electron メインプロセス | `electron/main.js` |
| Electron preload | `electron/preload.js` |
| Electron spec | `docs/spec/electron.spec.md` |
| Project File spec | `docs/spec/project-file.spec.md` |
| Day24進捗ログ | `docs/progress/day24-electron.log.md` |

## 今回のセッション（Day24）で完了したこと

### Electron 化 Phase 1（spec: electron.spec.md Phase 1）

#### セキュリティ方針（Xポスト知見を反映）
- `nodeIntegration: false` → レンダラーから Node.js を直接触れない
- `contextIsolation: true` → preload との境界を明確に保つ
- `sandbox: true` → OS レベルでレンダラーを隔離
- `geoAPI` 経由のみファイル操作を許可（最小権限の原則）

#### 追加ファイル
- `electron/main.js`: BrowserWindow 生成・IPC ハンドラー・ディレクトリ自動作成
- `electron/preload.js`: contextBridge 経由で `window.geoAPI` を公開（CommonJS）
- `electron/package.json`: `{ "type": "commonjs" }` でルートの ESM と共存
- `src/types/geoAPI.d.ts`: `window.geoAPI` の TypeScript 型定義

#### 更新ファイル
- `package.json`: `"main"` / `"dev:electron"` / `"build:electron"` / electron-builder 設定
- `vite.config.ts`: `base: './'` 追加（Electron の dist/index.html ロード用）
- `src/ui/PreferencesPanel.tsx`: Project タブを geoAPI 対応に（Electron/ブラウザ両対応）

#### 動作確認
- `pnpm dev:electron` で Electron ウィンドウ起動 ✅
- DevTools Console で `typeof window.geoAPI === 'object'` 確認 ✅
- ブラウザ（`pnpm dev`）でも従来通り動作 ✅

#### トラブルシューティング記録
- `electron@41.0.3` の初回インストール後バイナリ破損 → `rm -rf` + 再インストールで解決
- `preload.js` で `import` を使うと `SyntaxError` → CommonJS (`require`) に変更 + `electron/package.json` で `"type": "commonjs"` を設定

## 現在の状態

- **ブランチ**: `main`
- **コミット**: `f3f7104` feat: Electron 化 Phase 1（main.js / preload.js / geoAPI）Day24
- **テスト**: 90 tests グリーン（変化なし）
- **tsc**: PASS（型エラーゼロ）

## GeoGraphy アーキテクチャ（Electron 化後）

```
pnpm dev:electron
  └─ [0] Vite dev server（http://localhost:5173）
  └─ [1] Electron（wait-on で Vite 起動待ち → ウィンドウ生成）
          ├─ main.js（メインプロセス・IPC・ファイル操作）
          ├─ preload.js（contextBridge → window.geoAPI）
          └─ renderer（React / Three.js・geoAPI 経由でファイル操作）
```

## geoAPI（IPC 経由のファイル操作 API）

```typescript
window.geoAPI?.saveFile(path, data)      // ファイル保存
window.geoAPI?.loadFile(path)            // ファイル読み込み
window.geoAPI?.showSaveDialog()          // 名前を付けて保存ダイアログ
window.geoAPI?.showOpenDialog()          // ファイルを開くダイアログ
window.geoAPI?.getDataDir()              // ~/Documents/GeoGraphy/ のパス取得
```

## GeoGraphy データディレクトリ（自動作成済み）

```
~/Documents/GeoGraphy/
  projects/    ← .geography プロジェクトファイル
  presets/     ← プラグインプリセット（v2〜）
```

## 次回やること（Day25候補）

1. **Electron Phase 2: プロジェクトファイルの実装**（最優先）
   - `GeoGraphyProject` 型の実装（spec: project-file.spec.md §3）
   - SceneState の serialize / deserialize
   - Project タブの Save / Load が実際にファイルを読み書きする
   - 自動保存（アプリ終了時 → `autosave.geography`）

2. **Setup タブ: Geometry 選択の反映**
   - 現状: チェックリストは UI のみ
   - 今後: チェックしたものだけレイヤーに割り当て直す

3. **`pnpm build:electron` で .dmg ビルド確認**

## 次回セッション開始時の確認コマンド

```bash
cd /Users/shinbigan/geography && pnpm tsc --noEmit && pnpm test --run
```

## 次回チャット用スタートプロンプト

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
