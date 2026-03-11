# src/ui - CLAUDE.md

## 役割

React + shadcn/ui + Framer Motion で GeoGraphy の UI を実装する。
Three.js Canvas の上に React UI をオーバーレイする。

---

## コンポーネント一覧

```
src/ui/
├── App.tsx               ← Canvas（全レイヤー重ね）+ UI のルートレイアウト
├── MenuBar.tsx           ← File / View / Plugins / Help
├── MacroPanel.tsx        ← 32ノブ・4列アコーディオン・[L1][L2][L3][+][ALL] ← NEW
├── MacroKnob.tsx         ← LED ノブ + 割り当て表示・右クリックで AssignDialog ← NEW
├── AssignDialog.tsx      ← パラメーター割り当てダイアログ（shadcn/ui Dialog）← NEW
├── BpmDisplay.tsx        ← 常時表示・ビート位相点滅・Ableton Link 状態
├── FloatingWindow.tsx    ← フローティングウィンドウ基底・ドラッグ・最小化
├── WindowManager.tsx     ← 全 Window の開閉状態管理
└── LedKnob.tsx           ← 円形ノブ + LED インジケーター（BCR2000 モチーフ）
```

---

## マクロノブの設計

```typescript
// MacroKnob.tsx
interface MacroAssign {
  paramId: string
  min: number
  max: number
  curve: 'linear'  // v2 で exp / log / s-curve を追加
}

interface MacroKnobConfig {
  id: string
  name: string      // ユーザーが自由に命名（例：CHAOS）
  midiCC: number    // MIDI CC 番号
  assigns: MacroAssign[]  // 最大3つ
}

// MIDI 0〜127 → 任意の範囲にマッピング
const map = (midi: number, min: number, max: number) =>
  min + (midi / 127) * (max - min)
```

---

## レイアウト構造

```
┌─────────────────────────────────────┐
│ MenuBar（最上部・常時表示）             │
├─────────────────────────────────────┤
│                                     │
│  Canvas エリア（Three.js 全レイヤー）  │
│  フローティングウィンドウ（重なる）      │
│                                     │
├─────────────────────────────────────┤
│ MacroPanel（32ノブ・4列アコーディオン） │
│ [L1][L2][L3][+][ALL]   BPM ● 128.0  │
└─────────────────────────────────────┘
```

---

## デザインルール

- **カラーパレット**: 暗背景（#0a0a14）+ 発光ライン（#a0c4ff）
- **フォント**: monospace 系（UI）/ sans-serif（ラベル）
- **アニメーション**: Framer Motion で統一
- **ノブ**: LedKnob.tsx（BCR2000 モチーフ）
- **アコーディオン**: Framer Motion の AnimatePresence + height アニメーション
- **状態保存**: アコーディオンの開閉状態は preferences.md に保存

---

## shadcn/ui コンポーネントの使い方

```typescript
// Dialog（AssignDialog で使用）
import { Dialog, DialogContent, DialogHeader } from '@/components/ui/dialog'

// ContextMenu（ノブ右クリックで使用）
import { ContextMenu, ContextMenuTrigger, ContextMenuContent } from '@/components/ui/context-menu'

// Toast（レイヤー上限到達時）
import { useToast } from '@/components/ui/use-toast'
```

---

## 注意事項

- `<form>` タグは使用しない。onClick / onChange で代替
- localStorage は使用しない（Claude.ai 環境では動作しない）
- React state（useState / useReducer）でセッション内状態を管理
- 永続化は preferences.md への書き出しで行う
