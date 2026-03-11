# src/plugins/windows - CLAUDE.md

## 役割

フローティングウィンドウを React コンポーネントとして実装する。

**「React が書ける = Window Plugin が作れる」**  
コントリビューターが参加しやすい設計。

---

## Window Plugin の定義

```typescript
interface WindowPlugin {
  id: string
  name: string
  component: React.FC  // React コンポーネントとして実装
}
```

---

## v1 実装 Window Plugin 一覧

| ウィンドウ | 主なセクション |
|---|---|
| GeometryWindow | SHAPE / COLOR（Hue・Alpha）/ RECOMMENDED FX / RECOMMENDED PARTICLES / LIGHT / AUTO / MIDI MAPPING |
| CameraWindow | POSITION / ROTATION / AUTO / MIDI MAPPING |
| FXWindow | 全 FX リスト + ColorGrading + AUTO + MIDI MAPPING |
| ColorGradingWindow | Saturation / Contrast / Brightness（v2：Curves / LUT） |
| LayerWindow | レイヤー追加削除・opacity・blendMode・GPU 使用率・FPS |
| PresetWindow | プリセット一覧・New / Import / Export |
| TempoWindow | BPM・Ableton Link 状態・Tap / Reset |
| PreferencesWindow | MIDI / Output / Tempo / Camera / Visual Defaults / Modulator |

---

## アコーディオン実装

```typescript
// Framer Motion で開閉アニメーション
import { AnimatePresence, motion } from 'framer-motion'

const AccordionSection: React.FC<{ title: string; defaultOpen?: boolean }> = 
  ({ title, children, defaultOpen = false }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen)

  return (
    <div>
      <button onClick={() => setIsOpen(!isOpen)}>
        {isOpen ? '▼' : '▶'} {title}
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
```

---

## Geometry ウィンドウの構成

```
▼ SHAPE
▶ COLOR（Hue / Alpha のみ）
▼ RECOMMENDED FX（template-basic.md から読む）
▶ RECOMMENDED PARTICLES（template-basic.md から読む）
▶ LIGHT
▶ AUTO
▶ MIDI MAPPING
```

---

## 注意事項

- `<form>` タグは使用しない
- アコーディオンの開閉状態は preferences.md に保存
- FloatingWindow.tsx を基底として使う（ドラッグ・最小化）
