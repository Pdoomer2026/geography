# FX Control UI Spec

> SSoT: このファイル
> 対応実装: `src/ui/FxSimpleWindow.tsx` / `src/core/engine.ts`
> 担当エージェント: Claude Code
> 状態: ✅ 実装済み

---

## 1. Purpose（目的）

各レイヤーに統合済みの FX スタック（10 FX）を、
ブラウザ上でリアルタイムに ON/OFF 切り替え・パラメーター調整できる Simple Window を提供する。

---

## 2. Constraints（不変条件・MUSTルール）

- MUST: `engine.ts` 経由でのみ FX を操作すること（`fxStack` を UI から直接触らない）
- MUST: ON の FX はパラメータースライダーを展開表示する
- MUST: OFF の FX はトグルのみ表示（スライダー非表示）
- MUST: FX の順序は `FX_STACK_ORDER` に従って表示する（変更禁止）
- MUST: `any` を使わない
- MUST: View メニュー（⌘2）またはキーボード「2」で表示/非表示を切り替えられること
- MUST: Mixer Simple Window とは異なり折りたたみ可能（collapsed state を持つ）

---

## 3. Engine API

```typescript
/** 指定レイヤーの FX プラグイン一覧を返す（表示用） */
engine.getFxPlugins(layerId: string): FXPlugin[]

/** 指定レイヤーの指定 FX の enabled を切り替える */
engine.setFxEnabled(fxId: string, enabled: boolean, layerId: string): void

/** 指定レイヤーの指定 FX の指定パラメーター値を更新する */
engine.setFxParam(fxId: string, paramKey: string, value: number, layerId: string): void
```

---

## 4. Component Interface

```typescript
// src/ui/FxSimpleWindow.tsx
export function FxSimpleWindow(): JSX.Element
```

- props なし（engine シングルトンから直接取得）
- 200ms ポーリングで FX 状態を同期
- [L1][L2][L3] タブで対象レイヤーを切り替え

---

## 5. UI 仕様

```
┌───────────────────────────────────┐
│  FX SIMPLE WINDOW  [L1][L2][L3] [−]│  ← レイヤータブ・折りたたみボタン
├───────────────────────────────────┤
│  AfterImage  [●ON ]               │
│    damp      ──●──────  0.85      │
│  Bloom       [●ON ]               │
│    strength  ──●──────  0.80      │
│    radius    ───●─────  0.40      │
│    threshold ────●────  0.10      │
│  Feedback    [ OFF]               │
│  Kaleidoscope[ OFF]               │
│  Mirror      [ OFF]               │
│  ZoomBlur    [ OFF]               │
│  RGBShift    [●ON ]               │
│    amount    ──●──────  0.001     │
│  CRT         [ OFF]               │
│  Glitch      [ OFF]               │
│  ColorGrading[●ON ]               │
│    saturation ─●─────  1.00      │
│    contrast   ──●────  1.00      │
│    brightness ───●───  1.00      │
└───────────────────────────────────┘
```

- 位置: 画面右側（useDraggable.ts でドラッグ可能）
- 幅: 280px
- スタイル: `bg-[#0f0f1e] border border-[#2a2a4e]`
- z-index: 50

---

## 6. 状態管理

- `collapsed: boolean` — パネルの折りたたみ状態（useState）
- `activeLayer: LayerId` — 表示中のレイヤー（useState）
- `fxPlugins: FXPlugin[]` — 200ms ポーリングで engine から取得（useState + useEffect）
- パラメーター変更は即時 engine に反映（onChange → `engine.setFxParam()`）
- ON/OFF 切り替えは即時反映（onChange → `engine.setFxEnabled()`）

---

## 7. Test Cases

```typescript
// TC-1: engine.getFxPlugins() が FX_STACK_ORDER 順で 10 件返す
const plugins = engine.getFxPlugins('layer-1')
expect(plugins).toHaveLength(10)
expect(plugins[0].id).toBe('after-image')
expect(plugins[9].id).toBe('color-grading')

// TC-2: engine.setFxEnabled() で fxStack の enabled が変わる
engine.setFxEnabled('bloom', false, 'layer-1')
expect(engine.getFxPlugins('layer-1').find(p => p.id === 'bloom')?.enabled).toBe(false)

// TC-3: engine.setFxParam() で params の value が変わる
engine.setFxParam('bloom', 'strength', 1.5, 'layer-1')
expect(engine.getFxPlugins('layer-1').find(p => p.id === 'bloom')?.params.strength.value).toBe(1.5)
```

---

## 8. References

- `docs/spec/fx-stack.spec.md`（FX 順序・Interface）
- `docs/spec/simple-window.spec.md`（Simple Window の概念）
- `src/core/fxStack.ts`（setEnabled / getPlugin / getOrdered）
- `src/core/engine.ts`（getLayers で各レイヤーの fxStack にアクセス）
- `src/plugins/mixers/simple-mixer/MixerSimpleWindow.tsx`（スタイル・ポーリングパターンの参考）
