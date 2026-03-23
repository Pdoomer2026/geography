# Day20 - Layer Mute Toggle 実装ログ

## 日時
2026-03-23

## 概要
SimpleMixer の L1/L2/L3 カードをクリックで MUTE/LIVE 切り替えできるようにした。

## 問題
- `layerManager.setMute()` と `layer.mute` フィールドは既に存在していた
- `engine` に公開 API がなかった
- `SimpleMixer` 側でクリックイベントを受け取る UI が未実装だった

## 実装内容

### Step 1: `src/core/engine.ts`
`setLayerMute(layerId, mute)` メソッドを追加。

```typescript
setLayerMute(layerId: string, mute: boolean): void {
  layerManager.setMute(layerId, mute)
}
```

### Step 2: `src/plugins/windows/simple-mixer/SimpleMixer.tsx`
L1/L2/L3 カードに以下を追加：
- `onClick` → `engine.setLayerMute(layer.id, !layer.mute)`
- `cursor-pointer` スタイル
- MUTE 時: 赤文字 `#ff4444` + 背景・ボーダー暗く + opacity 0.5
- LIVE 時: 緑文字 `#44ff88` + 通常表示

## 動作確認
- L1 クリック → MUTE（赤）→ grid-wave 非表示、星空のみ表示 ✅
- L1 再クリック → LIVE（緑）→ grid-wave 復活 ✅
- L2 (add合成) も同様に toggle 動作 ✅

## 完了条件
- [x] `pnpm tsc --noEmit` 型エラーゼロ
- [x] `pnpm test --run` 71 tests グリーン

---

# Day20 - Layer Plugin Selector 実装ログ

## 概要
SimpleMixer の各レイヤーカード（L1/L2/L3）にプルダウンを追加し、
Registry に登録された任意の Plugin を動的に割り当てられるようにした。

## 実装内容

### `src/core/layerManager.ts`
`setPlugin()` の引数を `GeometryPlugin | null` に拡張。
null のとき plugin フィールドをクリアし `create()` を呼ばない。

### `src/core/engine.ts`
- `getRegisteredPlugins()` 追加 — Registry 全 Plugin の id/name 一覧を返す
- `setLayerPlugin(layerId, pluginId | null)` 追加
  - null → `setPlugin(null)` + `setMute(true)`（None）
  - pluginId → Registry から取得して `setPlugin()` + `setMute(false)`

### `src/plugins/windows/simple-mixer/SimpleMixer.tsx`
- `registeredPlugins` state 追加
- `syncLayers()` 内で `getRegisteredPlugins()` を毎回取得（初回確定後はキャッシュ）
- 各レイヤーカードに `<select>` プルダウン追加
  - 選択肢: None + 全登録 Plugin
  - onChange → `engine.setLayerPlugin()`
- カードの高さを 80px → 110px に拡大

## 動作確認
- L1: Grid Wave / L2: Starfield / L3: None がデフォルト表示 ✅
- プルダウンで Plugin を切り替えると即座にキャンバスに反映 ✅
- None を選択するとレイヤーが MUTE になる ✅

## 完了条件
- [x] `pnpm tsc --noEmit` 型エラーゼロ
- [x] `pnpm test --run` 71 tests グリーン
