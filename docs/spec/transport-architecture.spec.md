# Transport Architecture Spec

> SSoT: このファイル
> 担当: Claude Desktop（設計）/ Claude Code（実装）
> 状態: Day57 設計確定・実装は次フェーズ以降

---

## 0. 設計原則（最重要）

- システムは「意味」と「伝送」を完全に分離する
- 値は常に **0.0〜1.0 の比率（Normalized Value）** として扱う
- Engine は一切のプロトコル知識を持たない
- プロトコル（MIDI / UMP / OSC 等）はすべて Input Wrapper に隔離する

---

## 1. 二つの世界の定義

### Geometry World（Local / ParamID）

- 言語: ParamID（例: "radius", "speed"）
- 値: 0.0〜1.0（Normalized）
- 責務: 値を受け取り内部定数で実数化・描画に適用
- スタンス: 「誰が操作しているかは知らない。このIDに値が来たら動くだけ」

### Window World（Global / Control Layer）

- 言語: Slot（抽象ID・現在は CC番号と同値）
- 値: 0.0〜1.0（Normalized）
- 責務: UI操作を Normalized に変換・Slot に対して値を送信
- スタンス: 「相手を知らない。Slot に対して値を送るだけ」

---

## 2. TransportEvent 型（Day57 MidiCCEvent から移行）

すべてのデータはイベントとして扱う。

```typescript
// 現在（Day57）
interface MidiCCEvent {
  slot: number       // cc → slot に改名済み（Day57）
  value: number      // 0.0〜1.0
  source?: string    // ループ防止用（Day57 追加）
  time?: number      // タイムスタンプ（Day57 追加）
  protocol: 'midi1' | 'midi2'
  resolution: 128 | 4294967296
}

// 移行後（Step 1）
interface TransportEvent {
  slot: number
  value: number       // 0.0〜1.0
  source?: 'window' | 'plugin' | 'midi' | 'osc'
  time?: number
}
// protocol / resolution は Input Wrapper が吸収するため不要になる
```

---

## 3. Input Wrapper（プロトコル隔離層）

MIDI / UMP / OSC 等の解析を担当。Engine にプロトコル知識を持ち込まない。

### 役割

- CC番号 → Slot 変換
- 生の値（0〜127 等）→ 0.0〜1.0 正規化
- TransportEvent 生成
- Engine.dispatch(event) を呼ぶ

### 現状との対応

```
現状（midiManager.ts）:
  handleMidiCC(MidiCCEvent) → store.set(String(event.slot), value)
  ↑ MIDI 解析と配送が混在

移行後:
  [MidiInputWrapper]
    onMidiMessage → CC番号を Slot に変換 → TransportEvent 生成
    → Engine.dispatch(TransportEvent)

  [Engine]
    dispatch(event: TransportEvent) → Registry で解決 → Plugin へ配送
```

### ファイル構成（移行後）

```
src/drivers/input/
├── MidiInputWrapper.ts   // MIDI 1.0 / 2.0 解析
├── OscInputWrapper.ts    // 将来
└── index.ts
```

---

## 4. データフロー全体像

```
[Input Layer]
  MIDI / UI / Network
      |
[Input Wrapper]
  normalize + Slot 変換 → TransportEvent 生成
      |
[Engine]
  dispatch(TransportEvent) — 無意味配送
      |
[Registry]
  Slot → LayerId + ParamID の関係解決
      |
[Plugin]
  意味解釈・描画適用
      |
[Registry]
  逆引き（ParamID → Slot）
      |
[Window]
  UI 更新（source で自己ループを防止）
```

---

## 5. 実装ロードマップ（Step 1〜3）

Step 4（Engine の ccMapService 依存解消）は影響範囲が大きいため別セッションで設計する。

### Step 1: MidiCCEvent → TransportEvent rename

**難易度: 低**

- `src/types/index.ts` の `MidiCCEvent` を `TransportEvent` に改名
- `protocol` / `resolution` フィールドを削除（Input Wrapper が吸収）
- 全参照箇所を一括変更（`handleMidiCC` の引数型も変更）
- 影響ファイル: `src/types/index.ts` / `src/core/midiManager.ts` / 各 WindowPlugin / App.tsx

**完了条件:** `pnpm tsc --noEmit` ゼロ・`pnpm test --run` 全グリーン

---

### Step 2: Input Wrapper 切り出し

**難易度: 中**

- `midiManager.ts` から MIDI プロトコル解析部分を `MidiInputWrapper.ts` に切り出す
- `MidiInputWrapper` は `TransportEvent` を生成して Engine に渡すだけ
- `midiManager.ts` は「配送・MacroKnob 解決」に専念
- App.tsx の `navigator.requestMIDIAccess` 処理も `MidiInputWrapper` に移動

**完了条件:** Step 1 と同じ

---

### Step 3: Registry 逆引き（ポーリング → イベント駆動）

**難易度: 中**

現状の 200ms ポーリング（`syncValues`）を将来的にイベント駆動に置き換える。

- Plugin が値を変更したとき `source: 'plugin'` の TransportEvent を Registry 経由で Window に通知
- Window 側は `source === 'plugin'` のとき自己ループを防止して表示を更新
- 200ms ポーリングは Step 3 完了後に廃止

**注意:** Step 3 は Step 2 完了後に着手する。
ポーリングは動作しているため、Step 3 は急がない。

**完了条件:** Step 1 と同じ

---

### Step 4: Engine の ccMapService 依存解消（別セッションで設計）

`engine.ts` の `resolveParamValue()` が `ccMapService` に依存している問題。
影響範囲が大きく、Registry の責務再設計を伴うため単独セッションで壁打ちしてから実装する。

---

## 6. 現状との対応表（Day57 時点）

| 新仕様の要素 | Day57 時点の状態 |
|---|---|
| Slot 概念 | 完了（`cc → slot` 改名済み） |
| source / time フィールド | 完了（MidiCCEvent に追加済み） |
| TransportEvent 型 | 未実装（Step 1 で対応） |
| Input Wrapper | 未実装（Step 2 で対応） |
| Registry 逆引き | ポーリングで近似中（Step 3 で対応） |
| Engine ccMapService 分離 | 未実装（Step 4・別セッション） |

---

## 7. References

- `docs/spec/midi-registry.spec.md` — MIDIRegistry 仕様
- `docs/spec/plugin-manager.spec.md` — Plugin Manager 仕様
- `src/types/index.ts` — MidiCCEvent 型定義
- `src/core/midiManager.ts` — 現行の配送実装
- `src/drivers/input/` — 将来の Input Wrapper 配置先
