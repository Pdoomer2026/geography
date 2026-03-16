# src/drivers - CLAUDE.md

## このフォルダの役割

Driver を管理します。エンジンと外部デバイス・サービスを繋ぐ抽象化レイヤーです。
エンジンは Driver の種類を知らない。Interface を通じてのみ通信します。

---

## Driver の種類

```
drivers/tempo/      ← どこからテンポを取るか
drivers/input/      ← どのデバイスで操作するか
drivers/output/     ← どこに出力するか
drivers/modulator/  ← どこからパラメーター値が来るか
```

---

## Interface 定義

```typescript
interface TempoDriver {
  start(): void
  getTempo(): number    // 現在の BPM
  getBeat(): number     // 0.0〜1.0 ビート位相
  stop(): void
}

interface InputDriver {
  start(): void
  getInput(param: string): number
  stop(): void
}

interface OutputDriver {
  start(): void
  render(renderer: THREE.WebGLRenderer): void
  stop(): void
}

interface ModulatorDriver {
  id: string
  name: string
  getValue(paramId: string): number | null
}
```

---

## Modulator Driver の優先順位

パラメーター値の入力源は以下の優先順位で適用されます：

| 優先順位 | Driver | 説明 |
|---|---|---|
| 1位 | MidiModulator | MIDI CC 値（人間の操作が最優先） |
| 2位 | AudioModulator（v2） | Web Audio API + FFT → Bass / Mid / Treble |
| 3位 | AutoModulator | BPM 同期・LFO 波形 |
| 4位 | GuiModulator | ノブの GUI 値（フォールバック） |

---

## Modulator Driver の実装一覧

| Driver | バージョン | 実装方法 |
|---|---|---|
| MidiModulator | v1 | MIDI CC 値を 0.0〜1.0 に正規化して返す |
| AutoModulator | v1 | BPM 同期・Math.sin / Math.random |
| GuiModulator | v1 | ノブの GUI 値をそのまま返す |
| AudioModulator | v2 | Web Audio API + FFT |
| OscModulator | v3 | WebSocket 経由で OSC を受信 |

---

## 実装ルール

1. Driver は独立して動作する（他の Driver に依存しない）
2. `stop()` では必ずリソースを解放する
3. エラーハンドリングを必ず実装する（デバイスが見つからない場合など）
4. 各 Driver フォルダに CLAUDE.md を必ず作成する

---

## コントリビューターが追加できる Driver

- Tempo Driver: 新しいテンポソース（DAW 連携など）
- Input Driver: 新しい入力デバイス（トラックボール・ゲームパッド等）
- Output Driver: 新しい出力先（NDI / Spout など）
- Modulator Driver: 新しいパラメーター入力源
