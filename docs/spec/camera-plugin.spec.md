# Camera Plugin Spec v1.0

> SSoT: このファイル
> 対応実装: `src/plugins/cameras/` / `src/core/layerManager.ts` / `src/types/index.ts`
> 担当エージェント: Claude Code
> 状態: Day45 実装完了・Day58 engine API 更新

---

## 1. 設計思想

### なぜ Camera Plugin が必要か

GeoGraphy は Plugin 駆動のアーキテクチャである。

```
Geometry Plugin  → 「何を描くか」
Camera Plugin    → 「どこから見るか」← 独立した Plugin であるべき
FX Plugin        → 「どう加工するか」
```

初期実装では動作確認のために `cameraPreset` を Geometry Plugin に埋め込んでいたが、
これは以下の問題を持つ仮実装だった：

- Camera の制御パラメーターが `params` として公開されていない
  → MacroKnob / D&D アサインの対象にできない
- Camera が Geometry Plugin と密結合している
  → 関心の分離違反
- ユーザーが実行時にカメラを切り替える手段がない
- 複数の Camera Plugin（Orbit / Aerial / Static / Fly 等）を並立できない

**Day45 で `cameraPreset` を廃止し、Camera Plugin 機構に完全移行する。**

---

## 2. CameraPlugin インターフェース

```typescript
/**
 * CameraPlugin（spec: docs/spec/camera-plugin.spec.md）
 *
 * ModulatablePlugin を継承し params を持つ。
 * MacroKnob / D&D アサイン / CC Standard の制御対象になる。
 * レイヤーごとに1つアサインされ、LayerManager が管理する。
 */
export interface CameraPlugin extends ModulatablePlugin {
  /**
   * カメラの初期配置と OrbitControls の生成を行う。
   * LayerManager.setCameraPlugin() から呼ばれる。
   */
  mount(camera: THREE.PerspectiveCamera, renderer: THREE.WebGLRenderer): void

  /**
   * フレームごとのカメラ更新。
   * LayerManager.update() 内で呼ばれる。
   */
  update(delta: number): void

  /**
   * OrbitControls の dispose など後処理。
   * LayerManager.setCameraPlugin() で旧 Plugin を差し替える際に呼ばれる。
   */
  dispose(): void
}
```

---

## 3. Camera Plugin 一覧（v1）

```
src/plugins/cameras/
  orbit/    → OrbitCameraPlugin
  aerial/   → AerialCameraPlugin
  static/   → StaticCameraPlugin
```

### 3-A. OrbitCameraPlugin

```typescript
// id: 'orbit-camera'
params: {
  radius:     { value: 10,  min: 1,   max: 50,  label: 'Radius' },     // CC101
  height:     { value: 3,   min: -20, max: 30,  label: 'Height' },     // CC501
  speed:      { value: 0.5, min: 0.0, max: 3.0, label: 'Speed' },      // CC300
  autoRotate: { value: 1,   min: 0,   max: 1,   label: 'Auto Rotate' } // CC100（0=手動 / 1=自動）
}
```

- `autoRotate = 1`（デフォルト）: フレームごとに angle += speed × delta を計算してカメラを周回
- `autoRotate = 0`: OrbitControls を有効化して手動操作に切り替え
- `mount()` 時に OrbitControls を生成し `enabled = false` で待機

### 3-B. AerialCameraPlugin

```typescript
// id: 'aerial-camera'
params: {
  height: { value: 20, min: 1, max: 100, label: 'Height' } // CC501
}
```

- 真上俯瞰の固定視点
- OrbitControls: `enableRotate = false` / `enableZoom = true` / `enablePan = true`
- `mount()` 時に `camera.position.set(0, height, 0)` / `lookAt(0, 0, 0)`

### 3-C. StaticCameraPlugin

```typescript
// id: 'static-camera'
params: {
  posX:    { value: 0,  min: -50, max: 50, label: 'Pos X' },   // CC500
  posY:    { value: 8,  min: -50, max: 50, label: 'Pos Y' },   // CC501
  posZ:    { value: 12, min: -50, max: 50, label: 'Pos Z' },   // CC502
  lookAtX: { value: 0,  min: -50, max: 50, label: 'LookAt X' },
  lookAtY: { value: 0,  min: -50, max: 50, label: 'LookAt Y' },
  lookAtZ: { value: 0,  min: -50, max: 50, label: 'LookAt Z' },
}
```

- OrbitControls を生成しない
- `update()` 内で毎フレーム `camera.position.set(posX, posY, posZ)` / `lookAt()` を適用
  （params がリアルタイムに変化した場合に追従するため）

---

## 4. CC Standard マッピング

| paramId    | CC#  | Block     | 意味 |
|------------|------|-----------|------|
| radius     | CC101 | EXISTENCE | カメラ距離（Orbit） |
| height     | CC501 | SPACE     | カメラ高さ |
| speed      | CC300 | MOTION    | 自動周回速度 |
| autoRotate | CC100 | EXISTENCE | 自動周回 ON/OFF |
| posX       | CC500 | SPACE     | カメラ X 位置 |
| posY       | CC501 | SPACE     | カメラ Y 位置 |
| posZ       | CC502 | SPACE     | カメラ Z 位置 |

---

## 5. LayerManager の変更

### 5-A. Layer 型への追加

```typescript
interface Layer {
  // 既存フィールド（省略）
  cameraPlugin: CameraPlugin        // 現在アサインされている Camera Plugin
  // 削除: cameraMode / cameraAngle / controls（CameraPlugin 内部で管理）
}
```

### 5-B. 新規メソッド

```typescript
// Camera Plugin をレイヤーにアサインする
setCameraPlugin(layerId: string, plugin: CameraPlugin): void
  // 1. 旧 cameraPlugin.dispose() を呼ぶ
  // 2. layer.cameraPlugin = plugin を代入
  // 3. plugin.mount(layer.camera, layer.renderer) を呼ぶ

// レイヤーの Camera Plugin を取得する
getCameraPlugin(layerId: string): CameraPlugin | null
```

### 5-C. update() の変更

```typescript
// 旧: mode に応じた分岐
// 新: cameraPlugin.update(delta) を呼ぶだけ
layer.cameraPlugin.update(delta)
```

### 5-D. setPlugin()（Geometry）の変更

```typescript
// 旧: plugin.cameraPreset を読んでカメラを設定していた
// 新: cameraPreset は参照しない
//     代わりに plugin.defaultCameraPluginId があれば Camera Plugin を自動アサインする

setPlugin(layerId, geometryPlugin)
  // defaultCameraPluginId が指定されていれば
  //   → cameraRegistry から該当 Camera Plugin を取得して setCameraPlugin() を呼ぶ
  // 未指定または取得できなければ
  //   → StaticCameraPlugin（デフォルト）をアサイン
```

---

## 6. Geometry Plugin からの変更

### 6-A. `cameraPreset` を廃止・`defaultCameraPluginId` に置き換え

```typescript
// 旧
interface GeometryPlugin extends ModulatablePlugin {
  cameraPreset?: CameraPreset  // ← 廃止
}

// 新
interface GeometryPlugin extends ModulatablePlugin {
  /**
   * Geometry をアサインしたときに自動適用する Camera Plugin の ID。
   * 省略時は 'static-camera'（DEFAULT_CAMERA_PLUGIN_ID）が使われる。
   * ユーザーが後から Camera Plugin を変更した場合はこの値は無視される。
   */
  defaultCameraPluginId?: string
}
```

### 6-B. 各 Geometry Plugin の `defaultCameraPluginId`

| Plugin      | defaultCameraPluginId |
|-------------|----------------------|
| Icosphere   | 'orbit-camera'       |
| Torus       | 'orbit-camera'       |
| TorusKnot   | 'orbit-camera'       |
| HexGrid     | 'aerial-camera'      |
| GridWave    | 'static-camera'      |
| Contour     | 'static-camera'      |
| GridTunnel  | 'static-camera'      |

### 6-C. Geometry 切り替え時の Camera 自動連動ルール（Day44確定）

Geometry を変えたとき Camera を自動連動させるが、**ユーザーが手動で Camera を変えていた場合は追従しない**。

```
Geometry を選択
  → isCameraUserOverridden = false（デフォルトのまま）
    → defaultCameraPluginId に従って Camera を自動連動する
  → isCameraUserOverridden = true（ユーザーが手動変更済み）
    → Geometry を変えても Camera は変えない（ユーザーの意図を尊重）
```

`Layer` に `isCameraUserOverridden: boolean` フラグを追加して管理する：

```typescript
interface Layer {
  // ...
  cameraPlugin: CameraPlugin
  isCameraUserOverridden: boolean  // true = ユーザーが手動で Camera を選んだ
}
```

```typescript
// setPlugin()（Geometry 切り替え時）内
if (!layer.isCameraUserOverridden) {
  const cameraId = plugin.defaultCameraPluginId ?? DEFAULT_CAMERA_PLUGIN_ID
  setCameraPlugin(layerId, cameraId, plugin.defaultCameraParams)
  // isCameraUserOverridden は false のまま維持
}

// setCameraPlugin() が UI（Preferences / Camera Simple Window）から
// 明示的に呼ばれたとき
layer.isCameraUserOverridden = true
```

**「Geometry と Camera の相性」についての方針：**
- アプリ内では `defaultCameraPluginId` による自動連動のみ行う
- 「Orbit はオブジェクト系 Geometry と相性が良い」等の説明は
  ユーザー向けマニュアルに記載する（アプリ内で強制はしない）
- ユーザーは Preferences の Setup タブまたは Camera Simple Window から
  いつでも自由に Camera Plugin を変更できる

---

### 6-D. OrbitCameraPlugin のデフォルト params を Plugin ごとに調整する方法

Geometry Plugin ごとに orbit の radius / height / speed が異なる問題は、
**Geometry Plugin がデフォルト params のオーバーライドを渡せる**形で解決する：

```typescript
interface GeometryPlugin extends ModulatablePlugin {
  defaultCameraPluginId?: string
  defaultCameraParams?: Record<string, number>  // Camera Plugin の params 初期値を上書き
}

// 例: Icosphere
defaultCameraPluginId: 'orbit-camera',
defaultCameraParams: { radius: 10, height: 3, speed: 0.5, autoRotate: 1 }

// 例: HexGrid
defaultCameraPluginId: 'aerial-camera',
defaultCameraParams: { height: 20 }
```

`setCameraPlugin()` 内で `defaultCameraParams` を `plugin.params` に適用する。

---

## 7. Camera Plugin Registry

Camera Plugin は Geometry / FX と同様に自動登録する。

```typescript
// src/plugins/cameras/index.ts
import type { CameraPlugin } from '../../types'

const modules = import.meta.glob('./*/index.ts', { eager: true })

const cameraPlugins: Map<string, CameraPlugin> = new Map()

for (const mod of Object.values(modules)) {
  const plugin = (mod as { default: CameraPlugin }).default
  cameraPlugins.set(plugin.id, plugin)
}

export function getCameraPlugin(id: string): CameraPlugin | undefined {
  return cameraPlugins.get(id)
}

export function registerCameraPlugins(): void {
  // LayerManager が参照できるよう export するだけでよい
  // import.meta.glob で自動収集済み
}
```

---

## 8. Camera Simple Window（UI）

### 8-A. 表示場所

`src/ui/panels/camera/CameraSimpleWindow.tsx`

View メニューに追加：**Camera Simple Window（⌘4）**

### 8-B. UI レイアウト

```
CAMERA SIMPLE WINDOW                              [－]
[L1][L2][L3]

Layer 1 — orbit-camera

  radius      [━━━━━━●━━━]   10.0   [≡]
  height      [━━━●━━━━━━]    3.0   [≡]
  speed       [━━━━●━━━━━]    0.5   [≡]
  autoRotate  [●━━━━━━━━━]    ON    [≡]

  Camera: [ orbit-camera ▼ ]   ← Camera Plugin 切り替えドロップダウン
```

- 各パラメーター行に `[≡]` ハンドルを表示
- D&D で MacroKnob にアサイン可能（他の Simple Window と同じ仕組み）
- Camera Plugin ドロップダウンでレイヤーの Camera Plugin を切り替え可能

---

## 9. engine.ts の公開 API 変更

```typescript
// 旧（廃止）
engine.setAutoRotate(layerId: string, autoRotate: boolean): void

// 新
engine.setCameraPlugin(layerId: string, pluginId: string): void
engine.getCameraPlugin(layerId: string): CameraPlugin | null
engine.setCameraParam(layerId: string, paramKey: string, value: number): void
```

---

## 10. types/index.ts の変更サマリー

```typescript
// 廃止
type CameraMode      // static / orbit / aerial の union 型
interface CameraPreset

// 追加
interface CameraPlugin extends ModulatablePlugin { ... }

// 変更
interface GeometryPlugin {
  defaultCameraPluginId?: string   // cameraPreset の代替
  defaultCameraParams?: Record<string, number>
}

interface Layer {
  cameraPlugin: CameraPlugin       // cameraMode / cameraAngle / controls を置き換え
  // 削除: cameraMode / cameraAngle / controls
}
```

---

## 11. 実装順序（Day45）

| 順序 | 作業 | ファイル |
|------|------|---------|
| 1 | `CameraPlugin` インターフェースを types/index.ts に追加 | `src/types/index.ts` |
| 2 | `CameraMode` / `CameraPreset` を types から削除 | `src/types/index.ts` |
| 3 | `OrbitCameraPlugin` 実装 | `src/plugins/cameras/orbit/index.ts` |
| 4 | `AerialCameraPlugin` 実装 | `src/plugins/cameras/aerial/index.ts` |
| 5 | `StaticCameraPlugin` 実装 | `src/plugins/cameras/static/index.ts` |
| 6 | Camera Plugin 自動登録 | `src/plugins/cameras/index.ts` |
| 7 | `LayerManager` を Camera Plugin 機構に移行 | `src/core/layerManager.ts` |
| 8 | 各 Geometry Plugin から `cameraPreset` を削除・`defaultCameraPluginId` に置き換え | 各 Plugin |
| 9 | `engine.ts` の API 更新 | `src/core/engine.ts` |
| 10 | テスト更新 | `tests/core/cameraSystem.test.ts` |
| 11 | `CameraSimpleWindow` 新設 | `src/ui/panels/camera/` |
| 12 | App.tsx・View メニューに Camera Window を追加 | `App.tsx` / `electron/main.js` |

---

## 12. 廃止する既存ファイル・仕様

| 対象 | 対応 |
|------|------|
| `docs/spec/camera-system.spec.md` | このファイル（camera-plugin.spec.md）に統合・旧ファイルはアーカイブ |
| `CameraMode` 型（types/index.ts） | 削除（CameraPlugin 内部で管理） |
| `CameraPreset` 型（types/index.ts） | 削除（defaultCameraPluginId + defaultCameraParams に置き換え） |
| `GeometryPlugin.cameraPreset` | 削除（defaultCameraPluginId に置き換え） |
| `Layer.cameraMode / cameraAngle / controls` | 削除（Layer.cameraPlugin に統合） |
| `engine.setAutoRotate()` | 削除（engine.setCameraParam() に統合） |

---

## 13. References

- `docs/spec/transport-architecture.spec.md` — Transport Architecture 全体仕様
- `docs/spec/macro-knob.spec.md` — MacroKnob / D&D アサイン
- `docs/spec/cc-standard.spec.md` — CC Standard（CC100 / CC300 / CC500〜502）
- `docs/spec/layer-system.spec.md` — レイヤーシステム
- `docs/spec/simple-window.spec.md` — Simple Window 規約
- `src/plugins/cameras/` — Camera Plugin 実装群（Day45 新設）
- `src/core/layerManager.ts` — Camera Plugin の mount / update / dispose を呼ぶ
- `src/types/index.ts` — CameraPlugin インターフェース定義
