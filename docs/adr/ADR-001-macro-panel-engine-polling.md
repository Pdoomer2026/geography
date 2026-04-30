# ADR-001: MacroPanel の syncLiveVisual を geoStore に移行しない

- **日付**: 2026-05-01（Day88）
- **ステータス**: 決定済み（スキップ）
- **関連**: `src/ui/components/inspector/layer/panels/MacroPanel.tsx`

---

## 背景

`MacroPanel` の `syncLiveVisual`（100ms ポーリング）は、以下の 3 関数を engine から直接読んでいる。

```ts
engine.getMidiLearnTarget()
engine.getLearnedCC(k.id)
engine.getParametersLive()
```

GeoGraphy の設計方針は「UI は geoStore だけを読み、engine を直接触らない」であるため、
これを geoStore に移行する案が検討された（HANDOVER.md Day88 タスク欄に記載）。

---

## 決定：移行しない

### 理由 1 — 対象データが「揮発的な表示専用」である

`syncLiveVisual` が読んでいるのは：

- ノブのリング弧（現在値の視覚化）
- MIDI Learn 中かどうかの表示状態
- CC 番号バッジ

これらは Preset・Clip・Sequencer に一切関わらない、毎フレーム捨てられる揮発的データである。
アサインデータ（保存・差し替えの対象）とは別物であり、表示コンポーネントが直接取得することは許容範囲。

### 理由 2 — 現状で実害がない

100ms × 2 パネル（Global + Layer）= 20 回/秒の engine 読み出し。
`getParametersLive()` は配列コピーのみで負荷はほぼゼロ。パフォーマンス問題は存在しない。

### 理由 3 — 移行するとリスクが増える

geoStore に `learnTarget` / `learnedCCs` / `liveParams` を追加する場合、
Global 用と Layer 用の分離設計が必要になる。

GeoGraphy では **Global Macro と Layer Macro の完全分離** が最重要設計原則であり
（Global は Preset/Clip/Sequencer に含まない、Layer Macro は含む）、
この分離を geoStore の新フィールド設計でミスるリスクの方が、
engine 直接読みを残すコストより高い。

---

## 現在の分離状態（確認済み・問題なし）

| 項目 | Global Macro | Layer Macro |
|---|---|---|
| geoStore フィールド | `macroKnobs` / `macroValues` | `macroKnobsByLayer` / `macroValuesByLayer` |
| Preset / Clip 保存 | ❌ 含まない | ✅ 含む |
| Sequencer 制御 | ❌ 対象外 | ✅ 対象 |
| engine 構造読み（設定） | `syncMacroKnobs()` 経由 ✅ | `syncLayerMacroKnobs()` 経由 ✅ |
| engine 視覚読み（表示） | `syncLiveVisual` 直接 ← 意図的に残す | 同左 |

---

## 将来の再検討条件

以下のいずれかが発生した場合のみ再検討する：

- MacroPanel のインスタンスが 4 つ以上同時に存在し、ポーリング負荷が実測で問題になった場合
- テスト都合で engine モックが困難になった場合
