# MIDI Monitor Window Spec

> SSoT: このファイル
> 担当エージェント: Claude Desktop（spec）/ Claude Code（実装）
> バージョン: v1.0（Day75・2026-04-22）
> 状態: 設計完了・実装待ち

---

## 1. 目的

GeoGraphy に接続された MIDI デバイスからの信号をリアルタイムで可視化する
デバッグ・確認用 Window。

### 解決する課題

- デバイスが認識されているか確認するためにブラウザコンソールを使う必要がある
- どの CC / Note が来ているか・値がどう変化しているか目視できない
- APC40 mk2 など物理コントローラーの信号が GeoGraphy に届いているか確認できない
- Ableton Live → IAC Driver 経由の信号も同列に確認したい

---

## 2. 分類・配置

**Window** として実装する（既存 Window 資産を最大活用）。

```
src/ui/components/window/midi-monitor/MidiMonitorWindow.tsx
```

`windowMode.ts` の `monitor: boolean` フィールドがすでに存在する。
これを使って表示状態を管理する。

---

## 3. 表示内容

### 3.1 接続デバイス一覧

```
┌─ MIDI MONITOR ─────────────────────────┐
│ DEVICES                                │
│  ● APC40 mkII                         │  ← 接続中（緑）
│  ● IAC Driver Bus 1                   │  ← 接続中（緑）
└────────────────────────────────────────┘
```

- Web MIDI API の `MIDIAccess.inputs` から取得
- デバイスの接続・切断はリアルタイムで反映（`onstatechange`）
- 接続中: 緑ドット `●` / 切断中: グレードット `○`
- デバイスが0件のとき: `No MIDI devices connected`

### 3.2 リアルタイムログ

```
┌─ INCOMING MIDI ────────────────────────┐
│ CC   48  0.75  ch:0  APC40 mkII       │
│ CC   49  0.32  ch:0  APC40 mkII       │
│ CC    7  1.00  ch:2  APC40 mkII       │
│ CC   13   +1   ch:0  APC40 mkII       │  ← 相対値
│ NT   91  1.00  ch:0  APC40 mkII       │  ← Note-On
│ CC   16  0.50  ch:0  IAC Driver Bus 1 │  ← Ableton LFO
└────────────────────────────────────────┘
```

各行のフォーマット：

| フィールド | 内容 | 例 |
|---|---|---|
| タイプ | `CC` / `NT` | `CC` |
| 番号 | CC番号 or Note番号（dec・3桁ゼロ埋め） | `048` |
| 値 | 0.00〜1.00（正規化済み） | `0.75` |
| ch | MIDI チャンネル | `ch:0` |
| デバイス名 | 送信元デバイス名 | `APC40 mkII` |

- 最大表示件数: **50件**（超えたら古いものから削除）
- 最新のものが**上**に表示される
- `[CLEAR]` ボタンでログを全消去できる

---

## 4. 開閉制御

### フェーズ1（Day75 実装）

| トリガー | 動作 |
|---|---|
| キー `M` | MIDI Monitor Window のトグル（表示/非表示） |

- `windowMode.monitor` の `true` / `false` をトグルする
- 既存の `H`（Hide All）/ `S`（Show All）にも連動する

### フェーズ2（後日実装）

Preferences Panel の Macro Window セクション下部に選択 UI を追加する。

```
Preferences > [該当セクション]
  ┌──────────────────────────────┐
  │ MIDI Monitor                 │
  │  ○ Show  ○ Hide             │  ← デフォルト: Hide（未選択 = false）
  └──────────────────────────────┘
```

- デフォルト: `false`（非表示）
- `windowMode.monitor` と同期する
- `DEFAULT_WINDOW_MODE.monitor = false` は変更しない

---

## 5. MidiInputWrapper の拡張

現在の `MidiInputWrapper` は CC のみ対応・MIDI ch を無視している。
MIDI Monitor Window の実装に合わせて以下を追加する。

### 5.1 Note-On/Off 対応

```typescript
// status byte の上位4bit
// 0xB0 = CC
// 0x90 = Note-On
// 0x80 = Note-Off

const statusType = data[0] & 0xf0
const channel = data[0] & 0x0f  // 下位4bit = MIDI ch

if (statusType === 0xb0) { /* CC 処理（既存） */ }
if (statusType === 0x90) { /* Note-On 処理（新規） */ }
if (statusType === 0x80) { /* Note-Off 処理（新規） */ }
```

### 5.2 MIDI ch の取得

```typescript
const channel = data[0] & 0x0f
```

TransportEvent に `channel` フィールドを追加するか、
Monitor 専用コールバックを別途用意するかは Claude Code が判断する。

### 5.3 デバイス名の取得

```typescript
// MIDIMessageEvent から送信元デバイス名を取得
const deviceName = (event.target as MIDIInput).name ?? 'Unknown'
```

---

## 6. Monitor 専用イベント型

```typescript
// Monitor 表示専用（engine / TransportEvent とは独立）
export interface MidiMonitorEvent {
  type: 'cc' | 'note-on' | 'note-off'
  number: number       // CC番号 or Note番号
  value: number        // 0.0〜1.0 正規化済み
  rawValue: number     // 0〜127 生の値
  channel: number      // MIDI ch（0〜15）
  deviceName: string   // 送信元デバイス名
  timestamp: number    // Date.now()
}
```

---

## 7. データフロー

```
物理デバイス（APC40 mk2）
  または
Ableton Live → IAC Driver
      ↓
MidiInputWrapper.onMidiMessage
      ↓（既存）             ↓（新規追加）
TransportEvent           MidiMonitorEvent
engine.handleMidiCC      onMonitorEvent コールバック
      ↓                        ↓
パラメータ反映           MidiMonitorWindow
                         リアルタイム表示
```

- Monitor への通知は既存の TransportEvent フローに**影響しない**
- `onMonitorEvent` は MidiInputWrapper に追加するオプショナルコールバック

---

## 8. View メニュー連携

```
View
  ├── MacroWindow         (⌘1)
  ├── FX Simple Window    (⌘2)
  ├── Mixer Simple Window (⌘3)
  ├── Camera Simple Window(⌘4)
  ├── Geometry Simple Window(⌘5)
  ├── MIDI Monitor Window (M)   ← 追加
  ├── ──────────────────────
  ├── Hide All Windows    (H)
  └── Show All Windows    (S)
```

---

## 9. MUST ルール

- MUST: `useDraggable.ts` を使うこと（フローティング・ドラッグ可能）
- MUST: `windowMode.monitor` で表示状態を管理すること
- MUST: Monitor 表示は既存の TransportEvent フローに影響しないこと
- MUST: ログは最大50件・古いものから削除すること
- MUST: `<form>` タグを使用しないこと
- MUST: `localStorage` を使用しないこと（ログは揮発性・セッション限り）
- MUST: デバイス接続・切断はリアルタイムで反映すること（`onstatechange`）

---

## 10. 完了条件

- `pnpm tsc --noEmit` エラーゼロ
- `pnpm test --run` 全テストグリーン
- キー `M` で Window が開閉できる
- APC40 mk2 を繋いだ状態でノブを回すとログに表示される
- IAC Driver 経由の信号も同列に表示される

---

## 11. 将来拡張（v2 以降・今回は実装しない）

- APC40 mk2 の CC番号から物理コントロール名を自動表示
  （`docs/spec/devices/apc40mk2.md` を参照）
- フィルター機能（デバイス別・タイプ別）
- CC番号クリックで GeoGraphy パラメータへのアサイン
