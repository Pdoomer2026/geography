# Program / Preview Bus Spec

> SSoT: このファイル  
> 対応実装: `src/core/programBus.ts` / `src/core/previewBus.ts` / `src/core/engine.ts`  
> フェーズ: Phase 7  
> 状態: ✅ 実装済み・仕様化

---

## 1. Purpose（目的）

2系統のバスを持つことで「今出力中の映像（Program）」と「次に出す映像の準備（Preview）」を分離する。
GPUメモリーを最小限に抑えながら、本格的な映像ミキシングを実現する。

---

## 2. Constraints（不変条件・MUSTルール）

- MUST: Previewバスは `THREE.Scene` / `THREE.WebGLRenderer` を持たない
- MUST: Previewバスは `SceneState`（JSON）+ 小キャンバス（320×180）のみ
- MUST: Three.jsオブジェクトはProgramバスへの昇格時に生成する
- MUST: 旧Programバスは切り替え後に `dispose()` する
- MUST: SceneStateの変更はCommandパターン経由で行う

---

## 3. Interface（型・APIシグネチャ）

```typescript
interface SceneState {
  layers: LayerState[]
}

interface LayerState {
  geometryId: string
  geometryParams: Record<string, number>
  fxStack: FxState[]
  opacity: number
  blendMode: string
}

interface ProgramBus {
  getScene(): THREE.Scene
  applyState(state: SceneState): void
  dispose(): void
}

interface PreviewBus {
  getState(): SceneState
  setState(state: SceneState): void
  getCanvas(): HTMLCanvasElement  // 320×180の小キャンバス
}
```

---

## 4. Behavior（振る舞いの定義）

### 4.1 切り替えフロー

```
previewBus.setState(nextScene)
  ↓
crossfaderを操作 or Beat Cutが発火
  ↓
engine.swap()
  ↓
programBus.applyState(previewBus.getState())  // Three.jsオブジェクト生成
旧Sceneをdispose()
previewBus.setState(旧ProgramのSceneState)    // 旧ProgramがPreviewに降格
```

### 4.2 Beat Cutのラップアラウンド検出

```typescript
// engine.ts update()内
if (prevBeat > 0.8 && beat < 0.2) {
  engine.swap()
}
```

---

## 5. Test Cases（検証可能な条件）

```typescript
// TC-1: PreviewBusはWebGLRendererを持たない
const previewBus = new PreviewBus()
expect((previewBus as any).renderer).toBeUndefined()

// TC-2: PreviewBusのキャンバスサイズは320×180
expect(previewBus.getCanvas().width).toBe(320)
expect(previewBus.getCanvas().height).toBe(180)

// TC-3: setState後にgetStateで同じSceneStateが返る
const state: SceneState = { layers: [] }
previewBus.setState(state)
expect(previewBus.getState()).toEqual(state)

// TC-4: swap後に旧ProgramのdisposeはSceneを解放する
const spy = vi.spyOn(oldScene, 'clear')
engine.swap()
expect(spy).toHaveBeenCalled()
```

---

## 6. References

- 要件定義書 v1.7 §7「Program / Preview バス構造」
- 実装計画書 v2.5 §9「Phase 7」
- `src/core/CLAUDE.md`
- `src/core/programBus.ts`
- `src/core/previewBus.ts`
