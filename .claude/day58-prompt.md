# Day58 Step 1: MidiCCEvent → TransportEvent rename

## 作業概要

`MidiCCEvent` 型を `TransportEvent` に改名し、`protocol` / `resolution` フィールドを削除する。
ロジックの変更は一切なし。型名と型定義の変更のみ。

## 参照ファイル

- `docs/spec/transport-architecture.spec.md`（§2・§5 を必ず読むこと）

## 変更内容

### ① src/types/index.ts

変更前:
```typescript
interface MidiCCEvent {
  slot: number
  value: number
  source?: string
  time?: number
  protocol: 'midi1' | 'midi2'
  resolution: 128 | 4294967296
}
```

変更後:
```typescript
interface TransportEvent {
  slot: number
  value: number
  source?: 'window' | 'plugin' | 'midi' | 'osc'
  time?: number
}
```

- `MidiCCEvent` → `TransportEvent` に改名
- `protocol` / `resolution` フィールドを削除
- `source` の型を `string` → `'window' | 'plugin' | 'midi' | 'osc'` に絞る

### ② 影響ファイル（型名を一括置換）

以下のファイルで `MidiCCEvent` → `TransportEvent` に置換する。
ロジックは変更しない。

| ファイル | 変更内容 |
|---|---|
| `src/core/midiManager.ts` | `handleMidiCC(event: MidiCCEvent)` → `(event: TransportEvent)` |
| `src/core/engine.ts` | `handleMidiCC` の引数型 |
| `src/ui/App.tsx` | イベント生成箇所の型・import |
| `src/ui/CameraSimpleWindow.tsx` | 同上 |
| `src/ui/FxSimpleWindow.tsx` | 同上 |
| `src/ui/GeometrySimpleWindow.tsx` | 同上 |
| `src/plugins/windows/simple-window/SimpleWindowPlugin.tsx` | 同上 |
| `src/plugins/windows/fx-window/FxWindowPlugin.tsx` | 同上 |

### ③ イベント生成箇所の修正

各ファイルでイベントを生成している箇所から `protocol` / `resolution` を削除する。

変更前の例:
```typescript
engine.handleMidiCC({ slot: cc, value: normalized, protocol: 'midi2', resolution: 4294967296 })
```

変更後:
```typescript
engine.handleMidiCC({ slot: cc, value: normalized, source: 'window' })
```

## 完了条件

- `pnpm tsc --noEmit` エラーゼロ
- `pnpm test --run` 114 tests 全グリーン

## 注意事項

- ロジックの変更は一切しない
- `protocol` / `resolution` を参照している箇所がある場合は削除するだけでよい
- テストファイルにも `MidiCCEvent` が使われている場合は同様に置換すること
