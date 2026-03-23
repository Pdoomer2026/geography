# Day16 - engine FX 統合ログ

> 対応 spec: `docs/spec/fx-stack.spec.md`
> ブランチ: `main`

---

## Step 1: `src/types/index.ts` ✅

- `Layer.fx: FXPlugin[]` → `Layer.fxStack: IFxStack` に変更
- 循環参照回避のため `FxStack` クラスの直接 import を排除
- `IFxStack` インターフェースを `types/index.ts` 内に定義（register / getOrdered / buildComposer / update / dispose / setEnabled / getPlugin）

---

## Step 2: `src/core/fxStack.ts` ✅

- `FxStack implements IFxStack` に変更
- `setEnabled(fxId: FxId)` → `setEnabled(fxId: string)` に変更（IFxStack との整合性）
- `getPlugin(fxId: FxId)` → `getPlugin(fxId: string)` に変更

---

## Step 3: `src/core/layerManager.ts` ✅

- `EffectComposer` + `RenderPass` を import して各レイヤーに紐付け
- `initialize()` 内で各レイヤーの `FxStack` インスタンスを生成
- `buildFxComposer(layerId)` メソッド追加：RenderPass を保持して FX passes を再構築
- `update()` で `plugin.update()` → `fxStack.update()` → `composer.render()` の順に実行
- `resize()` で `composer.setSize()` を呼ぶ
- `dispose()` で `fxStack.dispose()` と `composer.dispose()` を呼ぶ

---

## Step 4: `src/plugins/fx/index.ts` ✅

- 全 10 クラスを named export 追加（`AfterImagePlugin` 等）
- `createFxPlugins()` ファクトリ関数追加：毎回 **新しいインスタンス** を返す
  - 理由：レイヤーごとに独立した EffectComposer + Pass が必要なため
  - シングルトンを共有すると 3 レイヤー分の `addPass` が同一 Pass に走りクラッシュする

---

## Step 5: `src/core/engine.ts` ✅

- `getAllFxPlugins()` → `createFxPlugins()` に切り替え
- レイヤーごとに `createFxPlugins()` を呼んで独立したインスタンスを登録
- `layerManager.buildFxComposer(layer.id)` を各レイヤーで呼ぶ
- SceneState の fxStack は `layer-1` の fxStack から取得

---

## Step 6: `tests/core/layerManager.test.ts` ✅

- `EffectComposer` モック追加（`addPass` / `render` / `dispose` / `setSize`）
- `RenderPass` モック追加
- `fxStack` の存在確認テスト追加（`layer.fxStack` が defined）
- `composer.dispose` 呼び出しテスト追加

---

## Step 7: App.tsx を engine 経由に切り替え ✅

- 旧: 独自 Scene / Renderer / OrbitControls を直接 new して管理（engine を引れていなかった）
- 新: `engine.initialize(container)` → `engine.start()` のみ

---

## 完了条件 ✅

```
pnpm tsc --noEmit   → エラーゼロ
pnpm test --run     → 64 tests グリーン
```

ブラウザ確認:
- canvas 3枚（position:absolute / zIndex:1,2,3）が正常生成されることを確認
- コンソールエラーゼロ確認
- Starfield + SimpleMixer(L1/L2/L3) 正常表示確認

---

## ハマりポイント

- `getAllFxPlugins()` はシングルトンを返すため複数レイヤーに渡すとクラッシュ → `createFxPlugins()` ファクトリで解決
- `types/index.ts` から `core/fxStack.ts` を import すると循環参照 → `IFxStack` インターフェースで回避
- `buildFxComposer` の `composer.passes` への splice が EffectComposer 内部状態を破壊 → `setupFx()` に切り替え（register + create を直接呼び出す）
- App.tsx が engine を一度も呼んでいなかったのが全バグの根本原因だった
