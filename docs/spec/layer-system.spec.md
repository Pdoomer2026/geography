# Layer System Spec

> SSoT: このファイル  
> 対応実装: `src/core/layerManager.ts` / `engine.ts` / `SimpleMixer.tsx`  
> フェーズ: Phase 8  
> 状態: 🔴 Day12実装対象

---

## 1. Purpose（目的）

複数のGeometry Pluginを独立したキャンバスに描画し、CSSのmixBlendModeで合成する。
WebGL RenderTargetを使わず、DOMレイヤーの重ね合わせだけで実現する。

---

## 2. Constraints（不変条件・MUSTルール）

- MUST: `MAX_LAYERS = 3`（`src/core/config.ts` の値を参照・直接ハードコードしない）
- MUST: 各レイヤーは `position: absolute` で重ねる（z-indexで順序管理）
- MUST: 合成は CSS `mixBlendMode` のみ（WebGL RenderTarget禁止）
- MUST: 各レイヤーは独立した `THREE.WebGLRenderer` と `THREE.Scene` を持つ
- MUST: 各レイヤーは独立したFXスタックを持つ
- MUST: LayerManagerは `engine.ts` からのみ操作する（React直接操作禁止）
- MUST: `mute: true` のレイヤーは描画しない（`canvas.style.display = 'none'`）

---

## 3. Interface（型・APIシグネチャ）

```typescript
// src/types/index.ts に追加
type CSSBlendMode =
  | 'normal' | 'add' | 'multiply' | 'screen' | 'overlay'

interface Layer {
  id: string                    // 'layer-1' | 'layer-2' | 'layer-3'
  canvas: HTMLCanvasElement
  renderer: THREE.WebGLRenderer
  scene: THREE.Scene
  plugin: GeometryPlugin | null // null = 未割り当て
  opacity: number               // 0.0 〜 1.0
  blendMode: CSSBlendMode
  fx: FXPlugin[]
  mute: boolean
}

// LayerManager公開API
interface LayerManager {
  initialize(container: HTMLElement): void
  getLayers(): Layer[]
  setPlugin(layerId: string, plugin: GeometryPlugin): void
  setOpacity(layerId: string, opacity: number): void
  setBlendMode(layerId: string, mode: CSSBlendMode): void
  setMute(layerId: string, mute: boolean): void
  update(delta: number, beat: number): void
  dispose(): void
}
```

---

## 4. Behavior（振る舞いの定義）

### 4.1 初期化

`initialize(container)` が呼ばれたとき：
- `MAX_LAYERS` 個のキャンバスを生成
- 各キャンバスを `position: absolute; top: 0; left: 0; width: 100%; height: 100%` に設定
- z-index は layer-1=1, layer-2=2, layer-3=3
- デフォルト: opacity=1.0, blendMode='normal', mute=false, plugin=null

### 4.2 更新ループ

`update(delta, beat)` が呼ばれたとき：
- `mute: false` のレイヤーのみ `plugin.update(delta, beat)` を呼ぶ
- `mute: false` のレイヤーのみ `renderer.render(scene, camera)` を呼ぶ

### 4.3 CSSスタイル適用

`setOpacity` / `setBlendMode` が呼ばれたとき：
```typescript
canvas.style.opacity = String(opacity)
canvas.style.mixBlendMode = blendMode
```

### 4.4 破棄

`dispose()` が呼ばれたとき：
- 全レイヤーの `renderer.dispose()` を呼ぶ
- 全レイヤーの `plugin?.destroy(scene)` を呼ぶ
- DOMからキャンバスを除去

---

## 5. Test Cases（検証可能な条件）

> ファイル: `tests/core/layerManager.test.ts`

```typescript
// TC-1: 初期化でMAX_LAYERS個のレイヤーが生成される
expect(layerManager.getLayers()).toHaveLength(MAX_LAYERS)

// TC-2: 初期状態でpluginはnull
layerManager.getLayers().forEach(layer => {
  expect(layer.plugin).toBeNull()
})

// TC-3: setOpacity後にcanvas.style.opacityが更新される
layerManager.setOpacity('layer-1', 0.5)
expect(getLayer('layer-1').canvas.style.opacity).toBe('0.5')

// TC-4: setMute(true)のレイヤーはupdate時にpluginを呼ばない
const mockPlugin = { update: vi.fn(), ... }
layerManager.setPlugin('layer-1', mockPlugin)
layerManager.setMute('layer-1', true)
layerManager.update(0.016, 0.5)
expect(mockPlugin.update).not.toHaveBeenCalled()

// TC-5: dispose後にrenderer.dispose()が呼ばれる
const spy = vi.spyOn(renderer, 'dispose')
layerManager.dispose()
expect(spy).toHaveBeenCalled()
```

---

## 6. References（関連ドキュメント）

- 要件定義書 v1.7 §14「レイヤーシステム」
- 実装計画書 v2.5 §10.2「レイヤーシステム」
- `src/core/config.ts` — MAX_LAYERS定数
- `src/types/index.ts` — Layer型定義
- `src/core/CLAUDE.md` — engine.tsとの接続方法
