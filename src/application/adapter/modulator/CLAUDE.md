# src/drivers/modulator - CLAUDE.md

## 役割

「どこからパラメーターの値が来るか」を抽象化する Modulator Driver。
パラメーターの入力ソースを Plugin 化することで、将来の Audio・OSC 対応がスムーズになる。

---

## Modulator Driver Interface

```typescript
interface ModulatorDriver {
  id: string
  name: string
  priority: number          // 優先順位（低いほど高優先）
  getValue(paramId: string): number | null  // null なら次の優先順位に委譲
}
```

---

## 優先順位（デフォルト）

| 優先順位 | Driver | 説明 |
|---|---|---|
| 1位 | MidiModulator | MIDI CC 値を 0.0〜1.0 に正規化 |
| 2位 | AutoModulator | BPM 同期・LFO・Math.sin |
| 3位 | GuiModulator | GUI ノブの値（フォールバック） |

Preferences → Modulator タブでドラッグして優先順位を変更できる（v2）。

---

## v1 実装 Driver

### MidiModulator
```typescript
getValue(paramId: string): number | null {
  const cc = this.midiMapping[paramId]
  if (cc === undefined) return null
  return this.midiValues[cc] / 127  // 0〜127 → 0.0〜1.0
}
```

### AutoModulator
```typescript
getValue(paramId: string): number | null {
  const config = this.autoConfig[paramId]
  if (!config || !config.enabled) return null
  // LFO: Math.sin(beat * Math.PI * 2 * config.rate)
  return (Math.sin(this.clock.getBeat() * Math.PI * 2 * config.rate) + 1) / 2
}
```

### GuiModulator（フォールバック）
```typescript
getValue(paramId: string): number | null {
  return this.guiValues[paramId] ?? null
}
```

---

## 将来の拡張

| Driver | バージョン | 説明 |
|---|---|---|
| AudioModulator | v2 | Web Audio API + FFT → Bass / Mid / Treble |
| OscModulator | v3 | WebSocket 経由で OSC を受信 |
