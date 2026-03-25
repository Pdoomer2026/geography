# Program / Preview Bus Spec

> SSoT: このファイル  
> 対応実装: `src/core/programBus.ts` / `src/core/previewBus.ts` / `src/core/engine.ts`  
> フェーズ: Phase 7（バス基盤）/ Phase 11（Output/Edit view・ルーティング）
> 状態: ✅ Phase 7 実装済み / 🔴 Phase 11 設計確定・未実装
> 更新: Day30（Output/Edit view・Large/Small screen・レイヤールーティング設計追加）

---

## 1. Purpose（目的）

2系統のビューを持つことで「今出力中の映像（Output view）」と「編集中の映像（Edit view）」を分離する。
GPUメモリーを最小限に抑えながら、本格的な映像ミキシングを実現する。

---

## 2. 用語定義（Day30確定）

| 用語 | 定義 |
|---|---|
| **Large screen** | Electronメインウィンドウ（大画面） |
| **Small screen** | MixerSimpleWindow内の小画面 |
| **Output view** | 出力映像（観客に見せる映像）|
| **Edit view** | 編集映像（次に出す映像を仕込む場所）|

Large screen と Small screen はそれぞれ Output view または Edit view を**アサイン**して表示する。
アサインは MixerSimpleWindow の ⇄ SWAP ボタンで入れ替える。

```
パターンA（デフォルト）        パターンB（SWAP後）
Large screen = Output view    Large screen = Edit view
Small screen = Edit view      Small screen = Output view
```

---

## 3. レイヤールーティング（Phase 11 新設計）

Output view・Edit view はそれぞれ独立して「どのレイヤーを含めるか・どのくらいの Opacity で含めるか」を設定できる。

```
L1のcanvas ──→ Output view（outputOpacity: 1.0）
               Edit view  （editOpacity:   0.0）

L2のcanvas ──→ Output view（outputOpacity: 0.6）
               Edit view  （editOpacity:   0.8）

L3のcanvas ──→ Output view（outputOpacity: 0.0）
               Edit view  （editOpacity:   1.0）
```

- 各レイヤーの canvas は1つだけ存在する（レンダリングは1回・GPU負荷変化なし）
- Output/Edit それぞれへの Opacity は独立して 0〜100% で設定できる
- 同じレイヤーを Output と Edit の両方に含めることができる（ルーティングの問題・重複OK）
- 実装はCSS制御レベルで軽量

### 典型的なVJワークフロー例

```
Output view = L1（100%） + L2（60%）  ← 今出している映像
Edit view   = L3（100%）のみ          ← 新しいGeometryに差し替えて準備中

準備できたら → ⇄ SWAP で Large/Small のアサインを入れ替える
```

### ルーティング state の型

```typescript
interface LayerRouting {
  layerId: string
  outputOpacity: number   // 0.0〜1.0  Output view へのブレンド量
  editOpacity: number     // 0.0〜1.0  Edit view へのブレンド量
}
```

---

## 4. Constraints（不変条件・MUSTルール）

- MUST: Previewバスは `THREE.Scene` / `THREE.WebGLRenderer` を持たない
- MUST: Previewバスは `SceneState`（JSON）+ 小キャンバス（320×180）のみ
- MUST: Three.jsオブジェクトはProgramバスへの昇格時に生成する
- MUST: 旧Programバスは切り替え後に `dispose()` する
- MUST: SceneStateの変更はCommandパターン経由で行う
- MUST: Large screen / Small screen の現在のアサインを常にラベル表示すること
- MUST: Output/Edit それぞれへのレイヤー Opacity は独立して設定できること

---

## 5. Interface（型・APIシグネチャ）

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

interface LayerRouting {
  layerId: string
  outputOpacity: number   // 0.0〜1.0
  editOpacity: number     // 0.0〜1.0
}

// Large/Small のアサイン
type ScreenAssign = 'output' | 'edit'

interface ScreenAssignState {
  large: ScreenAssign   // デフォルト: 'output'
  small: ScreenAssign   // デフォルト: 'edit'
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

## 6. Behavior（振る舞いの定義）

### 6.1 SWAP フロー（Large/Small アサイン入れ替え）

```
MixerSimpleWindow の ⇄ SWAP ボタンを押す
  ↓
screenAssign.large と screenAssign.small を入れ替える
  ↓
Large screen・Small screen の表示ラベルを更新する
  ↓
各画面が新しいアサインに従って Output/Edit view を表示する
```

### 6.2 Beat Cut のラップアラウンド検出（Phase 7 実装済み・v2 で UI 公開）

```typescript
// engine.ts update()内
if (prevBeat > 0.8 && beat < 0.2) {
  engine.swap()
}
```

---

## 7. Test Cases（検証可能な条件）

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

// TC-5: デフォルトのアサインは large=output / small=edit
expect(screenAssign.large).toBe('output')
expect(screenAssign.small).toBe('edit')

// TC-6: SWAP後にアサインが入れ替わる
swap()
expect(screenAssign.large).toBe('edit')
expect(screenAssign.small).toBe('output')
```

---

## 8. References

- 要件定義書 v1.9 §7「Program / Preview バス構造」
- 実装計画書 v3.1 §6「Phase 11」
- `src/core/CLAUDE.md`
- `src/core/programBus.ts`
- `src/core/previewBus.ts`
- `docs/spec/mixer-plugin.spec.md`（MixerSimpleWindow UI構成）
