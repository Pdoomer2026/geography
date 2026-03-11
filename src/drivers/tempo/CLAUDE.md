# src/drivers/tempo - CLAUDE.md

## このフォルダの役割

テンポ（BPM）の入力ソースを管理します。

---

## Tempo Driver 一覧と優先順位

| 優先順位 | Driver | 説明 |
|---|---|---|
| 1 | AbletonLinkDriver | Ableton Live / Resolume と自動同期 |
| 2 | MidiKnobDriver | Endless ノブの相対値変化で BPM を増減 |
| 3 | TapTempoDriver | MIDI パッド / Space キーのタップ間隔から算出 |
| 4 | ManualDriver | Preferences の数値入力 |

---

## AbletonLinkDriver の実装

```
Node.js サーバー（link-server.js）
└── abletonlink-node でリンクセッションに参加
└── WebSocket でブラウザに BPM・ビート位相を送信

ブラウザ側
└── WebSocket で受信
└── BPMClock に反映
```

**Ableton Link はマスター・スレーブの概念がない。全員が対等に同期。**

---

## TapTempoDriver の実装

```typescript
tap(): void {
  const now = performance.now();
  if (this.lastTap) {
    const interval = now - this.lastTap;
    this.bpm = 60000 / interval;
  }
  this.lastTap = now;
}
```

---

## MIDI ノブ（相対値方式）

Endless ノブは相対値方式で BPM を操作：
- 右に回す → BPM +1
- 左に回す → BPM -1
- 早く回す → BPM ±5（加速係数あり）

BCR2000 の Endless ノブと相性が良い。
