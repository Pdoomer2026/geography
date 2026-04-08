# Camera System Spec v1.0

## 1. 概要

GeoGraphy のカメラシステムは、Geometry Plugin ごとに最適な視点を提供する。
Plugin は `cameraPreset` フィールドで推奨カメラ設定を宣言し、
LayerManager がそれを解釈してカメラを制御する。

カメラモードは3種類。UI（Camera WindowPlugin）は v2 以降に実装する。
今バージョン（v1）では LayerManager 内部でモードを管理し、
`engine.setAutoRotate()` を将来の UI 接続口として公開する。

---

## 2. CameraMode 型定義

```typescript
export type CameraMode =
  | { type: 'static' }
  | {
      type: 'orbit'
      radius: number       // 周回半径（Geometry 中心からの距離）
      height: number       // カメラの高さ（y 座標）
      speed: number        // 自動周回速度（rad/s）
      autoRotate: boolean  // true=自動周回 / false=OrbitControls 手動操作
    }
  | {
      type: 'aerial'
      height: number       // 見下ろす高さ（y 座標）
      // OrbitControls: enableRotate=false / enableZoom=true / enablePan=true
    }
```

---

## 3. CameraPreset 型定義

```typescript
export interface CameraPreset {
  position: { x: number; y: number; z: number }
  lookAt:   { x: number; y: number; z: number }
  mode?: CameraMode  // 省略時は { type: 'static' } として扱う
}
```

`position` / `lookAt` は初期配置に使用する。
`mode` が `orbit` / `aerial` のときも、初期フレームの位置として参照される。

---

## 4. DEFAULT_CAMERA_PRESET

```typescript
export const DEFAULT_CAMERA_PRESET: CameraPreset = {
  position: { x: 0, y: 8, z: 12 },
  lookAt:   { x: 0, y: 0, z: 0  },
  // mode 省略 → static
}
```

`cameraPreset` を持たない Plugin、または `null` をセットしたときに使用する。

---

## 5. 各モードの挙動

### 5-A. static（デフォルト）

- `setPlugin()` 時に `position.set()` / `lookAt()` を呼ぶだけ
- フレームごとのカメラ更新なし
- OrbitControls を生成しない

### 5-B. orbit

- `setPlugin()` 時に OrbitControls を生成し `controls.enabled = false` にする
- `autoRotate: true` のとき
  - `update()` ループ内で `angle += speed * delta` を計算
  - `camera.position.set(cos(angle) * radius, height, sin(angle) * radius)`
  - `camera.lookAt(0, 0, 0)`
  - OrbitControls は使用しない（enabled = false のまま）
- `autoRotate: false` のとき
  - OrbitControls を `enabled = true` にする
  - `update()` ループ内で `controls.update()` を呼ぶ
  - 自動角度計算はしない

### 5-C. aerial

- `setPlugin()` 時に OrbitControls を生成する
- `enableRotate = false`（回転ロック）
- `enableZoom = true`（ズーム有効）
- `enablePan = true`（パン有効）
- `update()` ループ内で `controls.update()` を呼ぶ
- カメラ初期位置: `position: { x: 0, y: height, z: 0 }` / `lookAt: { x: 0, y: 0, z: 0 }`

---

## 6. Plugin ごとのデフォルト cameraPreset

| Plugin      | mode    | radius | height | speed | autoRotate |
|-------------|---------|--------|--------|-------|------------|
| Icosphere   | orbit   | 10     | 3      | 0.5   | true       |
| Torus       | orbit   | 12     | 4      | 0.4   | true       |
| Torus Knot  | orbit   | 10     | 3      | 0.6   | true       |
| Hex Grid    | aerial  | -      | 20     | -     | -          |
| Grid Wave   | static  | -      | -      | -     | -          |
| Contour     | static  | -      | -      | -     | -          |
| Grid Tunnel | static  | -      | -      | -     | -          |

---

## 7. LayerManager の責務

```
setPlugin(layerId, plugin)
  -> 旧 controls を dispose()
  -> mode に応じて OrbitControls を生成または null
  -> 初期カメラ位置を適用

update(delta, beat)
  -> orbit + autoRotate: true  -> 角度計算してカメラ位置を更新
  -> orbit + autoRotate: false -> controls.update()
  -> aerial                   -> controls.update()
  -> static                   -> カメラ更新なし

setAutoRotate(layerId, flag)
  -> orbit モードのレイヤーの autoRotate を切り替える
  -> true  -> controls.enabled = false（手動操作を無効化）
  -> false -> controls.enabled = true（手動操作を有効化）
  -> 将来の Camera WindowPlugin から呼ぶ
```

---

## 8. Layer 型への追加フィールド

```typescript
interface Layer {
  // 既存フィールド（省略）...
  controls: OrbitControls | null  // orbit / aerial モード時に生成
  cameraAngle: number             // orbit モードの現在角度（ラジアン）
  cameraMode: CameraMode          // 現在適用中のモード
}
```

---

## 9. engine.ts の公開 API

```typescript
// 将来の Camera WindowPlugin から呼ぶ接続口
engine.setAutoRotate(layerId: string, autoRotate: boolean): void
```

---

## 10. OrbitControls の DOM イベントターゲット

OrbitControls のコンストラクタ第2引数には `renderer.domElement`（canvas）を渡す。
Electron の `contextIsolation: true` 環境では問題なく動作する。

```typescript
new OrbitControls(camera, renderer.domElement)
```

---

## 11. テストケース

| ID   | 内容 |
|------|------|
| TC-1 | 初期化時に DEFAULT_CAMERA_PRESET 位置がセットされる |
| TC-2 | cameraPreset を持つ Plugin をセットするとそのプリセットが適用される |
| TC-3 | cameraPreset を持たない Plugin には DEFAULT_CAMERA_PRESET が適用される |
| TC-4 | null をセットしたときも DEFAULT_CAMERA_PRESET が適用される |
| TC-5 | grid-tunnel の cameraPreset は z=5 の正面視点 |
| TC-6 | orbit モードの Plugin をセットすると cameraMode が orbit になる |
| TC-7 | orbit + autoRotate:true で update() を呼ぶとカメラ position が変化する |
| TC-8 | aerial モードは enableRotate=false が設定される |
| TC-9 | setAutoRotate(layerId, false) で autoRotate フラグが切り替わる |
