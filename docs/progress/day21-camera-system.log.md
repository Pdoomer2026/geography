# Day21 Camera System 進捗ログ

## 概要
Geometry Plugin ごとに推奨カメラ位置を宣言できる仕組みを実装した。

## 実装内容

### 1. `docs/spec/camera-system.spec.md` 新規作成（SDD原則）
- CameraPreset 型定義
- DEFAULT_CAMERA_PRESET 定数の仕様
- LayerManager の変更点
- テストケース TC-1〜TC-3 定義

### 2. `src/types/index.ts`
- `CameraPreset` インターフェース追加
- `GeometryPlugin.cameraPreset?: CameraPreset` フィールド追加（optional）

### 3. `src/core/config.ts`
- `DEFAULT_CAMERA_PRESET` 定数追加（position: 0,8,12 / lookAt: 0,0,0）
- 旧デフォルト `z=5` の正面視点から斜め上俯瞰視点に変更

### 4. `src/core/layerManager.ts`
- `initialize()`: カメラ初期位置を DEFAULT_CAMERA_PRESET に変更
- `setPlugin()`: plugin セット時にカメラプリセットを自動適用
  - plugin.cameraPreset があればそれを使用
  - なければ DEFAULT_CAMERA_PRESET にフォールバック
  - null セット時も DEFAULT_CAMERA_PRESET を適用

### 5. 各 Geometry Plugin に `cameraPreset` 追加
| Plugin | position | lookAt |
|---|---|---|
| grid-wave | (0, 8, 12) | (0, 0, 0) |
| contour | (0, 10, 14) | (0, 0, 0) |
| grid-tunnel | (0, 0, 5) | (0, 0, 0) |

### 6. `tests/core/cameraSystem.test.ts` 新規作成（5 tests）
- TC-1: 初期化時に DEFAULT_CAMERA_PRESET 位置がセットされる
- TC-2: cameraPreset を持つ Plugin をセットするとそのプリセットが適用される
- TC-3: cameraPreset を持たない Plugin は DEFAULT_CAMERA_PRESET が適用される
- TC-4: null をセットしても DEFAULT_CAMERA_PRESET が適用される
- TC-5: grid-tunnel の cameraPreset は z=5 の正面視点

### 7. `tests/core/layerManager.test.ts` モック修正
- `PerspectiveCamera.position` を plain object から `set()` メソッド付きオブジェクトに更新
- `lookAt` を `vi.fn()` として追加

## 完了確認

- `pnpm tsc --noEmit`: PASS
- `pnpm test --run`: 90 tests グリーン（85 → 90、+5）
