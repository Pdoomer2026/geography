# Day18 - FX ON/OFF バグ修正ログ

> ブランチ: `main`
> 対応ファイル: `src/core/fxStack.ts`, `src/core/engine.ts`, `tests/core/fxStack.test.ts`

---

## 発見した不具合（慎太郎さんのブラウザ確認から）

FX CONTROLSパネルのON/OFFボタンを押しても映像が変化しない。

### 根本原因その1: `fxStack.update()` の skip バグ

```typescript
// ❌ 修正前
update(delta: number, beat: number): void {
  for (const plugin of this.getOrdered()) {
    if (!plugin.enabled) continue   // ← enabled=false のとき update() をスキップ
    plugin.update(delta, beat)
  }
}
```

各FXプラグインの `update()` 内で `this.pass.enabled = this.enabled` を設定しているが、
`fxStack.update()` でスキップされるため `pass.enabled` が `true` のまま残り続ける。

```typescript
// ✅ 修正後: enabled に関わらず常に update() を呼ぶ
update(delta: number, beat: number): void {
  for (const plugin of this.getOrdered()) {
    plugin.update(delta, beat)
  }
}
```

### 根本原因その2: レイヤー構成によるFX出力の遮蔽

- layer-1: grid-wave（geometry） + FX
- layer-2: starfield（particle）+ FXなし → `blendMode: 'normal'` で上から覆う

starfield（背景）が layer-2 に配置されており、layer-1 の EffectComposer 出力を覆い隠していた。

**修正**: `engine.initialize()` でFXを geometry レイヤー（layer-2）のみに適用するよう変更。
particle は背景（layer-1）としてFXなしで描画。

---

## 切り分け方法（慎太郎さんの提案）

`MAX_LAYERS = 1` に一時変更してlayer-1のみで検証 → シアンのBloomが正常表示され、
Brightness=0で真っ黒になることを確認 → FX自体は機能していた。

---

## 変更ファイル

| ファイル | 変更内容 |
|---|---|
| `src/core/fxStack.ts` | `update()` の `if (!plugin.enabled) continue` を削除 |
| `src/core/engine.ts` | FXをgeometryレイヤーのみに適用・particle→layer-1（背景）に固定 |
| `tests/core/fxStack.test.ts` | TC-2を新仕様（pass.enabledが反映される）に書き換え |

---

## 完了条件 ✅

- [x] `pnpm tsc --noEmit` → エラーゼロ
- [x] `pnpm test --run` → 71 tests グリーン
- [x] ブラウザ確認: Bloom ON/OFF で映像が変化する
- [x] ブラウザ確認: Brightness=0 で画面が真っ黒になる
