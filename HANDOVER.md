# GeoGraphy 引き継ぎメモ｜Day45（Camera Plugin 実装・SimpleWindow 2種追加）｜2026-04-07

## プロジェクト概要
- **アプリ名**: GeoGraphy（Geometry×地形×Graph のダブルミーニング）
- **目的**: No-Texture・Plugin駆動・マルチライブラリ対応の映像制作プラットフォーム
- **スタック**: Vite / React 18 / TypeScript / Three.js r160+ / pnpm v10.32+ / Electron 41
- **開発スタイル**: SDD × CDD（仕様駆動 × コンパイラ駆動）
- **GitHub**: https://github.com/Pdoomer2026/geography
- **プロジェクトルート**: `/Users/shinbigan/geography`

---

## 重要ファイルパス

| ファイル | パス |
|---|---|
| CLAUDE.md（全体方針） | `CLAUDE.md`（v11） |
| Camera Plugin spec | `docs/spec/camera-plugin.spec.md` |
| Camera Plugin 実装 | `src/plugins/cameras/`（orbit / aerial / static / index.ts） |
| CameraSimpleWindow | `src/ui/CameraSimpleWindow.tsx` |
| GeometrySimpleWindow | `src/ui/GeometrySimpleWindow.tsx` |
| types | `src/types/index.ts`（CameraPlugin インターフェース追加済み） |
| LayerManager | `src/core/layerManager.ts`（Camera Plugin 機構に全面移行済み） |
| engine.ts | `src/core/engine.ts`（setCameraPlugin / getCameraPlugin / setCameraParam / getGeometryPlugin / setGeometryParam 追加済み） |

---

## 現在の状態

- **ブランチ**: `main`
- **タグ**: `day45`（完了）
- **テスト**: 112 tests グリーン・tsc エラーゼロ

---

## Day45 で完了したこと

### A. Camera Plugin 実装（Phase 14 完全移行）

`cameraPreset` ベースの仮実装を廃止し Camera Plugin アーキテクチャに完全移行。

**重要バグと解決**: モジュールレベル変数（`let camera = null` 等）を使っていたため複数レイヤーが同じ変数を共有し L1 のカメラ操作が効かなかった。**ファクトリ関数パターン**（`export default createOrbitCameraPlugin` → `getCameraPlugin()` が毎回新インスタンスを生成）で解決。

| ファイル | 変更内容 |
|---|---|
| `src/types/index.ts` | `CameraMode` / `CameraPreset` 削除・`CameraPlugin` 追加・`GeometryPlugin` に `defaultCameraPluginId?` / `defaultCameraParams?` 追加 |
| `src/plugins/cameras/*/index.ts` | ファクトリ関数パターン（`() => CameraPlugin` を default export） |
| `src/plugins/cameras/index.ts` | ファクトリ呼び出しで毎回新インスタンスを返す `getCameraPlugin()` |
| `src/core/config.ts` | `DEFAULT_CAMERA_PRESET` → `DEFAULT_CAMERA_PLUGIN_ID = 'static-camera'` |
| `src/core/layerManager.ts` | Camera Plugin 機構に全面移行・`setCameraPlugin()` / `getCameraPlugin()` 追加 |
| `src/core/engine.ts` | `setCameraPlugin()` / `getCameraPlugin()` / `setCameraParam()` / `listCameraPlugins()` 追加 |
| Geometry Plugin 6ファイル | `cameraPreset` → `defaultCameraPluginId` / `defaultCameraParams` |
| `tests/core/cameraSystem.test.ts` | Camera Plugin ベースの新テスト 9 件（モックもファクトリ方式に） |

### B. CameraSimpleWindow 新設

`src/ui/CameraSimpleWindow.tsx`
- キー `4` でトグル
- L1/L2/L3 タブでレイヤー切り替え
- Camera Plugin ドロップダウンで切り替え（`isCameraUserOverridden=true` が立つ）
- params スライダー（Radius / Height / Speed / Auto Rotate）
- **設計**: ポーリングは Plugin ID 変化のみ検知・params はローカル state 管理（ポーリングに上書きさせない）
- 目視確認済み（L1〜L3 全レイヤー・全パラメーター・カメラ切り替え動作）

### C. GeometrySimpleWindow 新設

`src/ui/GeometrySimpleWindow.tsx`
- キー `5` でトグル
- L1/L2/L3 タブでレイヤー切り替え
- Geometry 名表示 + 全 params スライダー
- `engine.getGeometryPlugin()` / `engine.setGeometryParam()` を新設して接続
- **注意**: `speed` / `hue` 系はリアルタイム反映。`segments` / `p` / `q` 等のメッシュ再構築が必要なパラメーターは現状変化なし（Day46 課題）

---

## 確立した新ルール（Day45）

- **Camera Plugin はファクトリ関数パターン**: `() => CameraPlugin` を export し、`getCameraPlugin()` が毎回新インスタンスを生成。モジュールレベル変数は禁止
- **新 Plugin 追加時のルール**: `src/plugins/cameras/` 以下にディレクトリを作り、ファクトリ関数を `export default` するだけで自動登録される
- **SimpleWindow の params 管理**: ポーリングは Plugin ID 変化の検知のみ。params の値はローカル state で管理し `onChange` で直接 engine に書き込む（ポーリングによる上書きを防ぐ）
- **`setAutoRotate()` は廃止**: `setCameraParam(layerId, 'autoRotate', 0/1)` で代替

---

## 次回やること（Day46）

### 優先度 ★★★
| 作業 |
|---|
| Geometry Plugin のメッシュ再構築対応（`segments` / `p` / `q` 等のスライダーを動かした時に `destroy→create` を呼ぶ） |
| `camera-system.spec.md` をアーカイブ（`camera-plugin.spec.md` に統合済み） |

### 優先度 ★★
| 作業 |
|---|
| Preferences Setup タブに Camera セクション追加（レイヤーごとのドロップダウン） |
| Day42〜Day45 の Obsidian dev-log 作成 |

---

## 次回セッション開始時の確認コマンド

```bash
cd /Users/shinbigan/geography && pnpm tsc --noEmit && pnpm test --run
```

---

## 環境メモ（累積）

- **NFC 正規化**（Day39確立）: 日本語ファイル作成後は python3 で NFC 正規化を実行
- **大幅更新フロー**（Day41確立）: `move_file → write_file → NFC 正規化`
- **write_file は新規ファイルのみ**: 既存ファイルへの使用は禁止（move_file でバックアップしてから write_file）
- **spec アーカイブ**（Day41確立）: `docs/archive/spec/YYYY-MM-DD_DayN_[name].spec.md`
- **MIDI 受信は App.tsx で直接**（Day44確立）: IPC 経路不要
- **Camera は独立 Plugin・ファクトリパターン**（Day45確立）: `cameraPreset` 完全廃止・モジュールレベル変数禁止
- **SimpleWindow の params はローカル state 管理**（Day45確立）: ポーリングに上書きさせない
- **Linus スタイルコミット**（Day39確立）: `git commit -m "タイトル" -m "ボディ"`
- **git タグは commit 後に打つこと**
- **tsc が反映ズレで失敗する場合**: 2回実行すると解消する

---

## 次回チャット用スタートプロンプト

```
Day46開始
引き継ぎスキル
```
