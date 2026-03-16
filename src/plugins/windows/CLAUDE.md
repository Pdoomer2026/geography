# src/plugins/windows - CLAUDE.md

## 役割

フローティングウィンドウを React コンポーネントとして実装する。

**「React が書ける = Window Plugin が作れる」**
コントリビューターが参加しやすい設計。

---

## Window Plugin の定義

```typescript
interface WindowPlugin extends PluginBase {
  component: React.FC  // React コンポーネントとして実装
}
```

---

## Mixer Plugin ルール（Window Plugin の特殊ケース）

SimpleMixer は Window Plugin の一種として実装するが、以下の制約がある：

- **閉じることができない**（常時表示・全 Mixer Plugin 共通）
- Transition Plugin の選択 UI（プルダウン）を必ず持つ
- クロスフェーダーを必ず持つ
- **v1 の時点から MixerPlugin Interface に準拠した実装にすること**（v2 で Plugin 化するとき設計変更ゼロにするため）

```typescript
interface MixerPlugin {
  id: string
  name: string
  renderer: string
  enabled: boolean
  component: React.FC  // 閉じられない Window Plugin
}
```

---

## v1 実装 Window Plugin 一覧

| ウィンドウ | 主なセクション |
|---|---|
| **SimpleMixer** | Program/Preview バス・縦フェーダー・Transition プルダウン・クロスフェーダー（閉じられない） |
| GeometryWindow | SHAPE / COLOR（Hue・Alpha）/ RECOMMENDED FX / RECOMMENDED PARTICLES / LIGHT / AUTO / MIDI MAPPING |
| CameraWindow | POSITION / ROTATION / AUTO / MIDI MAPPING |
| FXWindow | 全 FX リスト + ColorGrading + AUTO + MIDI MAPPING |
| ColorGradingWindow | Saturation / Contrast / Brightness（v2：Curves / LUT） |
| LayerWindow | レイヤー追加削除・opacity・blendMode・GPU 使用率・FPS |
| PresetWindow | プリセット一覧・New / Import / Export |
| TempoWindow | BPM・Ableton Link 状態・Tap / Reset |
| PreferencesWindow | MIDI / Output / Tempo / Camera / Visual Defaults / Modulator |

---

## SimpleMixer の UI 構成

```
┌─────────────────────────────────────┐
│  PROGRAM          PREVIEW           │
│  ┌────┐┌────┐┌────┐  ┌──────────┐  │
│  │    ││    ││    │  │ サムネイル│  │
│  │ L1 ││ L2 ││ L3 │  │ 320×180  │  │
│  │ ▓▓ ││ ▓▓ ││ ▓▓ │  └──────────┘  │
│  └────┘└────┘└────┘                │
│  Transition: [ CrossFade       ▼ ] │
│  ════════════╪════════ CROSSFADER  │
└─────────────────────────────────────┘
```

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
- SimpleMixer だけは閉じるボタンを表示しない
