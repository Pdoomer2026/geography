# src/drivers - CLAUDE.md

## このフォルダの役割

Driver を管理します。エンジンと外部デバイス・サービスを繋ぐ抽象化レイヤーです。
エンジンは Driver の種類を知らない。Interface を通じてのみ通信します。

---

## Driver の種類

```
drivers/tempo/    ← どこからテンポを取るか
drivers/input/    ← どのデバイスで操作するか
drivers/output/   ← どこに出力するか
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
```

---

## 実装ルール

1. Driver は独立して動作する（他の Driver に依存しない）
2. `stop()` では必ずリソースを解放する
3. エラーハンドリングを必ず実装する（デバイスが見つからない場合など）
4. 各 Driver フォルダに CLAUDE.md を必ず作成する

---

## コントリビューターが追加できる Driver

- Tempo Driver: 新しいテンポソース（DAW 連携など）
- Input Driver: 新しい入力デバイス
- Output Driver: 新しい出力先（NDI / Spout など）
