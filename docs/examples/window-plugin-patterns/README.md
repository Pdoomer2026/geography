# Window Plugin パターン集

> **Note**: これらのファイルは Day86 に `src/ui/components/window/` から移動したアーカイブです。
> Inspector Panel（`src/ui/components/inspector/`）への移行により src から廃止されましたが、
> Window Plugin を新規作成するコントリビューター向けの参考実装として保存しています。

---

## ディレクトリ構成

```
window-plugin-patterns/
├── simple-window/          ← 最小構成。min〜max フルレンジのスライダー
│   ├── GeometrySimpleWindow.tsx
│   ├── CameraSimpleWindow.tsx
│   └── FxSimpleWindow.tsx
├── standard-window/        ← lo/hi RangeSlider で稼働幅を制限できる上位版
│   ├── GeometryStandardWindow.tsx
│   ├── CameraStandardWindow.tsx
│   └── FxStandardWindow.tsx
├── simple-dnd-window/      ← Simple + D&D ハンドル（MacroKnob アサイン対応）
│   ├── GeometrySimpleDnDWindow.tsx
│   ├── CameraSimpleDnDWindow.tsx
│   └── FxSimpleDnDWindow.tsx
└── standard-dnd-window/    ← Standard + D&D ハンドル（最多機能）
    ├── GeometryStandardDnDWindow.tsx
    ├── CameraStandardDnDWindow.tsx
    └── FxStandardDnDWindow.tsx
```

---

## Window 分類の進化

| 分類 | 機能 | 対応する現役コンポーネント |
|---|---|---|
| Simple | スライダーのみ | Inspector の GeometryPanel / CameraPanel / FxPanel |
| Standard | lo/hi RangeSlider | 同上（RangeSlider は `src/ui/components/common/RangeSlider.tsx` に昇格） |
| Simple D&D | D&D ハンドル付き | `DnDHandleWithMenu` + `useStandardDnDParamRow` |
| Standard D&D | lo/hi + D&D | 同上（Inspector パネルが統合済み） |

---

## 新規 Window Plugin を作る場合の参考パターン

### 1. Simple Window（最小構成）

```
GeometrySimpleWindow.tsx を参考に：
- useDraggable でウィンドウドラッグ
- engine.onRegistryChanged() でパラメーター変化を購読
- engine.handleMidiCC() で値を書き込む
- L1/L2/L3 タブで activeLayer を切り替える
```

### 2. Standard Window（RangeSlider 付き）

```
GeometryStandardWindow.tsx を参考に：
- Simple に加え、useStandardParamRow hook を使用
- RangeSlider は src/ui/components/common/RangeSlider.tsx を import する
  （このアーカイブ内の相対パスは動作しません）
```

### 3. Standard D&D Window（最多機能）

```
GeometryStandardDnDWindow.tsx を参考に：
- useStandardDnDParamRow hook を使用
- DragPayload に proposal: { lo, hi } を乗せて MacroWindow にドロップ
- MacroWindow の AssignDialog が MIN/MAX ダイアログを表示する
```

---

## 重要な注意事項

- **このディレクトリのファイルは tsc の対象外**です。そのままでは動作しません。
- import パスは元の `src/` からの相対パスのままです。実際に使う場合はパスを修正してください。
- `RangeSlider` の import は `src/ui/components/common/RangeSlider.tsx` を使ってください。
- イベントフロー設計の原則は `docs/architecture/ui-event-flow.md` を参照してください。
