# MIDI Learn Spec

> SSoT: このファイル
> 担当エージェント: Claude Desktop（spec）/ Claude Code（実装）
> バージョン: v1.0（Day75・2026-04-22）
> 状態: 設計完了・実装待ち

---

## 1. 目的

MacroKnob と外部 MIDI デバイスのコントロール（CC）を
ユーザーが自由に紐付けられる仕組みを提供する。

デバイスに依存しない汎用設計：
- APC40 mk2 でも Ableton LFO（IAC Driver）でも何でも対応
- ユーザーが「このノブを動かす」だけで自動的に CC 番号を記憶

---

## 2. ユーザー体験（UX）

```
① Macro8Window の対象ノブを右クリック
   → コンテキストメニュー「MIDI Learn」が表示される

② 「MIDI Learn」をクリック
   → ノブが点滅（Learn モード開始）
   → 「Move a controller...」テキストが表示される

③ APC40 などの物理コントローラーを動かす
   → CC が届いた瞬間に自動記録
   → ノブの点滅が止まり CC番号バッジが表示される（例: CC48）

④ キャンセル方法
   → Esc キー / 右クリック → Cancel / 10秒タイムアウト
```

---

## 3. アーキテクチャ

### Learn モードの状態

```
learnTarget: string | null
  null         = 通常モード
  'macro-1'など = そのノブが Learn 待機中
```

### データフロー

```
[Macro8Window]
  右クリック → engine.startMidiLearn('macro-1')
                    ↓
              engine 内部: learnTarget = 'macro-1'

[MidiInputWrapper]
  APC40 から CC48 受信
  → engine.handleMidiCC({ slot: 48, value: 0.5 })
                    ↓
[engine.handleMidiCC()]
  learnTarget が 'macro-1' の場合:
    → engine.setMacroKnob('macro-1', { ...knob, midiCC: 48 })
    → engine.stopMidiLearn()
    ← 通常の TransportManager 処理はスキップ
  learnTarget が null の場合:
    → 従来通り TransportManager.handle() へ

[Macro8Window]
  200ms ポーリングで learnTarget を監視
  → 点滅アニメーション表示 / 停止
  → CC番号バッジを更新
```

---

## 4. engine への追加 API

```typescript
// Learn モード開始（対象ノブを指定）
engine.startMidiLearn(knobId: string): void

// Learn モード終了（キャンセル or 自動終了）
engine.stopMidiLearn(): void

// Learn 待機中のノブ ID を返す（null = 通常モード）
engine.getMidiLearnTarget(): string | null
```

---

## 5. engine.handleMidiCC() の変更

```typescript
handleMidiCC(event: TransportEvent): void {
  // MIDI Learn モード中 → CC を記憶して終了
  const learnTarget = this.getMidiLearnTarget()
  if (learnTarget && event.source === 'midi') {
    const knob = this.getMacroKnobs().find(k => k.id === learnTarget)
    if (knob) {
      this.setMacroKnob(learnTarget, { ...knob, midiCC: event.slot })
    }
    this.stopMidiLearn()
    return  // 通常処理はスキップ
  }

  // 通常処理
  this.transportManager.handle(event)
}
```

---

## 6. タイムアウト

Learn モード開始から **10秒** 経過すると自動的にキャンセル。

```typescript
startMidiLearn(knobId: string): void {
  this.learnTarget = knobId
  this.learnTimeout = setTimeout(() => {
    this.stopMidiLearn()
  }, 10_000)
}

stopMidiLearn(): void {
  this.learnTarget = null
  clearTimeout(this.learnTimeout)
}
```

---

## 7. Macro8Window の UI 変更

### 右クリックコンテキストメニュー

```
┌──────────────────┐
│ MIDI Learn       │  ← クリックで Learn 開始
│ Clear MIDI CC    │  ← midiCC を -1 にリセット
│ Edit...          │  ← 既存の EditDialog を開く
└──────────────────┘
```

### Learn 待機中の表示

```
通常:                Learn 待機中:
  ╭━━━╮               ╭╌╌╌╮  ← 点滅（border が pulse）
  ┃ ● ┃               ┃ ● ┃
  ╰━━━╯               ╰╌╌╌╯
  #1                   #1
  0.00                 Move a controller...
```

### CC 記録後の表示

```
  ╭━━━╮
  ┃ ● ┃  ● ← 赤いドット（既存）
  ╰━━━╯
  #1
  0.00
  [CC48]  ← バッジ追加
```

---

## 8. ポーリングへの統合

Macro8Window は既に 200ms ポーリングを持っている。
`engine.getMidiLearnTarget()` をここで読み込んで状態管理する。

```typescript
// 既存の sync 関数に追加
const sync = () => {
  // ... 既存の処理 ...
  setLearnTarget(engine.getMidiLearnTarget())  // 追加
}
```

---

## 9. MUST ルール

- MUST: Learn モードは `source === 'midi'` のイベントのみ反応する
  （UI からのスライダー操作で誤って記録しない）
- MUST: Learn モード中は通常の TransportManager 処理をスキップする
- MUST: 10秒タイムアウトで自動キャンセルする
- MUST: Learn モード中に別のノブで Learn を開始したら前のノブはキャンセルされる
- MUST: `midiCC: -1` は「未アサイン」を意味する（Learn 前・Clear 後）

---

## 10. 変更ファイル一覧

| ファイル | 変更内容 |
|---|---|
| `src/application/orchestrator/engine.ts` | `startMidiLearn` / `stopMidiLearn` / `getMidiLearnTarget` 追加・`handleMidiCC` に Learn 分岐追加 |
| `src/ui/components/window/macro-8-window/Macro8Window.tsx` | 右クリックメニュー・点滅 UI・CC バッジ・learnTarget state 追加 |

**新規ファイルなし・既存2ファイルのみ変更。**

---

## 11. 完了条件

- `pnpm tsc --noEmit` エラーゼロ
- `pnpm test --run` 全テストグリーン
- APC40 のノブを右クリック → MIDI Learn → APC40 を触る → CC48 が記録される
- 記録後 APC40 を動かすと MacroKnob の値が変化する
- 10秒触らないと自動キャンセルされる
