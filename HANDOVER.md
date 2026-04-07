# GeoGraphy 引き継ぎメモ｜Day45（Camera Plugin 実装完了）｜2026-04-07

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
| types | `src/types/index.ts`（CameraPlugin インターフェース追加済み） |
| LayerManager | `src/core/layerManager.ts`（Camera Plugin 機構に全面移行済み） |
| engine.ts | `src/core/engine.ts`（setCameraPlugin / getCameraPlugin / setCameraParam 追加済み） |

---

## 現在の状態

- **ブランチ**: `main`
- **タグ**: `day44`（Day45 はセッション終了後に打つ）
- **テスト**: 112 tests グリーン・tsc エラーゼロ

---

## Day45 で完了したこと

### Camera Plugin 実装（Phase 14 完全移行）

`cameraPreset` ベースの仮実装を廃止し、Camera Plugin アーキテクチャに完全移行した。

#### 変更ファイル一覧

| ファイル | 変更内容 |
|---|---|
| `src/types/index.ts` | `CameraMode` / `CameraPreset` 削除・`CameraPlugin extends ModulatablePlugin` 追加・`GeometryPlugin` に `defaultCameraPluginId?` / `defaultCameraParams?` 追加・`Layer` に `cameraPlugin` / `isCameraUserOverridden` 追加 |
| `src/plugins/cameras/orbit/index.ts` | OrbitCameraPlugin 新規実装（autoRotate=1 で自動周回・0 で OrbitControls 手動） |
| `src/plugins/cameras/aerial/index.ts` | AerialCameraPlugin 新規実装（真上俯瞰・OrbitControls 回転ロック） |
| `src/plugins/cameras/static/index.ts` | StaticCameraPlugin 新規実装（position/lookAt 固定・毎フレーム追従） |
| `src/plugins/cameras/index.ts` | import.meta.glob 自動登録・`getCameraPlugin()` / `listCameraPlugins()` 公開 |
| `src/core/config.ts` | `DEFAULT_CAMERA_PRESET` 削除→ `DEFAULT_CAMERA_PLUGIN_ID = 'static-camera'` |
| `src/core/layerManager.ts` | Camera Plugin 機構に全面移行・`setCameraPlugin()` / `getCameraPlugin()` 追加・`isCameraUserOverridden` フラグ管理・`setAutoRotate()` 削除 |
| `src/core/engine.ts` | `setCameraPlugin()` / `getCameraPlugin()` / `setCameraParam()` / `listCameraPlugins()` 追加・`setAutoRotate()` 削除 |
| `solid/icosphere/index.ts` | `cameraPreset` → `defaultCameraPluginId: 'orbit-camera'` + `defaultCameraParams` |
| `solid/torus/index.ts` | 同上（radius:12, height:4, speed:0.4） |
| `solid/torusknot/index.ts` | 同上（radius:10, height:3, speed:0.6） |
| `terrain/hex-grid/index.ts` | `cameraPreset` → `defaultCameraPluginId: 'aerial-camera'` + `defaultCameraParams` |
| `terrain/contour/index.ts` | `cameraPreset` → `defaultCameraPluginId: 'static-camera'` + `defaultCameraParams` |
| `tunnel/grid-tunnel/index.ts` | 同上 |
| `wave/grid-wave/index.ts` | `cameraPreset` 削除（DEFAULT = static-camera を使用） |
| `tests/core/cameraSystem.test.ts` | Camera Plugin ベースの新テスト 9 件に全面書き換え |
| `tests/core/engine.test.ts` | `setAutoRotate` テスト → Camera Plugin API テストに置き換え |

#### 設計の核心

- **Camera Plugin はレイヤーごとに独立したインスタンス**（`cloneCameraPlugin()` で params を structuredClone）
- **`isCameraUserOverridden` フラグ**: Geometry 切り替え時の自動連動とユーザー意図を両立
- **`defaultCameraParams`**: Geometry Plugin ごとに Camera Plugin の初期値を調整可能

---

## 確立した新ルール（Day45）

- **Camera Plugin はレイヤーごとに独立したインスタンスを持つ**: `cloneCameraPlugin()` でレイヤー間の params 汚染を防ぐ
- **`setAutoRotate()` は廃止**: `setCameraParam(layerId, 'autoRotate', 0/1)` で代替

---

## 次回やること（Day46）

### 優先度 ★★★（UI）
| 作業 |
|---|
| `camera-system.spec.md` をアーカイブ（`camera-plugin.spec.md` に統合） |
| `CameraSimpleWindow` 新設（`src/ui/panels/camera/CameraSimpleWindow.tsx`） |
| Camera Plugin 切り替えドロップダウン + params スライダー + `[≡]` ハンドル |
| Preferences Setup タブに Camera セクション追加（レイヤーごとのドロップダウン） |
| View メニューに Camera Simple Window（Cmd+5）追加 |
| `GeometrySimpleWindow` 新設（全 Geometry の params スライダー） |

### 優先度 ★★（実動確認）
| 作業 |
|---|
| `pnpm dev` で起動して Orbit / Aerial / Static カメラが実際に動作することを確認 |
| Geometry 切り替えで Camera が自動連動することを確認 |

### 優先度 ★
| 作業 |
|---|
| Day42〜Day45 の Obsidian dev-log 作成 |
| `CLAUDE.md` の spec 一覧に `camera-plugin.spec.md` を追記（`camera-system.spec.md` はアーカイブ済みと記載） |

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
- **create_file は filesystem MCP には存在しない**: `write_file` を使う
- **spec アーカイブ**（Day41確立）: `docs/archive/spec/YYYY-MM-DD_DayN_[name].spec.md`
- **cc-mapping.md 更新後は pnpm gen:cc-map 必須**（Day42確立）
- **MIDI 受信は App.tsx で直接**（Day44確立）: IPC 経路不要
- **Camera は独立 Plugin**（Day44確立→Day45実装完了）: `cameraPreset` は完全廃止
- **Camera Plugin はレイヤーごとに独立インスタンス**（Day45確立）: `cloneCameraPlugin()` で params 汚染防止
- **Linus スタイルコミット**（Day39確立）: `git commit -m "タイトル" -m "ボディ（なぜ変えたか）"`
- **Obsidian dev-log**（Day39確立）: 毎セッション終了時に `GeoGraphy Vault/dev-log/YYYY-MM-DD_DayN.md` を作成
- **終業時の必須手順**: dev-log 作成 → NFC 正規化 → git commit → git tag dayN → git push origin main --tags
- **git タグは commit 後に打つこと**
- **tsc が反映ズレで失敗する場合**: 2回実行すると解消する

---

## 次回チャット用スタートプロンプト

```
Day46開始
引き継ぎスキル
```
