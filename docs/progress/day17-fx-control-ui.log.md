# Day17 - FX コントロール UI ログ

> 対応 spec: `docs/spec/fx-control-ui.spec.md`
> ブランチ: `main`

---

## Step 1: `docs/spec/fx-control-ui.spec.md` 作成 ✅

- SDD 原則に従い実装前に spec を作成
- Engine API（getFxPlugins / setFxEnabled / setFxParam）を定義
- UI 仕様・状態管理・テストケースを記述

---

## Step 2: `src/core/engine.ts` FX API 追加 ✅

追加メソッド 3 件：

```typescript
getFxPlugins(): FXPlugin[]
// → layerManager.getLayers()[0].fxStack.getOrdered() を返す

setFxEnabled(fxId: string, enabled: boolean): void
// → layerManager.getLayers()[0].fxStack.setEnabled(fxId, enabled) を呼ぶ

setFxParam(fxId: string, paramKey: string, value: number): void
// → plugin.params[paramKey].value = value で直接更新
```

- `FXPlugin` 型を `types` から import 追加

---

## Step 3: `src/ui/FxControlPanel.tsx` 新規作成 ✅

- 200ms ポーリングで `engine.getFxPlugins()` を同期
- `FxRow` サブコンポーネント：トグル + パラメータースライダー群
- ON の FX のみスライダーを展開表示
- 折りたたみボタン（＋/－）で `collapsed` state を toggle
- 位置: `fixed right-4 top-4 z-50`・幅 280px
- スタイル: SimpleMixer と同系統（`bg-[#0f0f1e] border border-[#2a2a4e]`）
- 小数点桁数: `param.max <= 0.01` なら 4 桁、それ以外は 2 桁

---

## Step 4: `src/ui/App.tsx` に `FxControlPanel` 追加 ✅

```tsx
import { FxControlPanel } from './FxControlPanel'
// ...
<FxControlPanel />
```

---

## Step 5: `tests/core/engine.test.ts` 新規作成 ✅

7 テスト追加：

- TC-1: `getOrdered()` が FX_STACK_ORDER 順で返る（逆順登録でも正しい）
- TC-1: 10 FX 全登録時に 10 件・先頭 after-image・末尾 color-grading
- TC-2: `setEnabled(false)` で enabled が false になる
- TC-2: `setEnabled(true)` で enabled が true に戻る
- TC-2: 存在しない fxId を setEnabled() しても例外を投げない
- TC-3: params.value を更新すると getPlugin() から参照できる
- TC-3: 複数パラメーターを独立して更新できる

---

## 完了条件 ✅

```
pnpm tsc --noEmit   → エラーゼロ
pnpm test --run     → 71 tests グリーン（64 → +7）
```

ブラウザ確認: `pnpm dev` 起動後に目視確認予定

---

## 設計メモ

- `setFxParam` は Command パターン非経由で直接 `params[key].value` を更新
  → v1 では許容（リアルタイム性優先）。v2 で Command 化を検討
- ポーリング間隔 200ms は SimpleMixer と統一（負荷対策）
- `any` は一切使用していない（`FXPlugin` 型で完全型付け）
