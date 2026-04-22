# MIDI Learn Spec

> SSoT: このファイル
> 担当エージェント: Claude Desktop（spec）/ Claude Code（実装）
> バージョン: v2.0（Day75・2026-04-22）
> 旧バージョン: docs/archive/spec/2026-04-22_Day75_midi-learn-v1-macro-only.spec.md
> 状態: 設計完了・実装待ち

---

## 1. 目的

GeoGraphy の**全てのコントロール**（ノブ・スライダー・オパシティ等）に
外部 MIDI デバイスの CC を自由に割り当てられる汎用インフラ。

### 解決する課題

```
現状：
  APC40 の CC48 が届いても → 誰も受け取らない
  （GeoGraphy 内部は CC101, CC300... で動いているため）

MIDI Learn 後：
  CC48 → Macro #1 の値が変わる
  CC49 → Layer1 Geometry の Speed スライダーが動く
  CC50 → Layer1 のオパシティが変わる（= Mixer）
  CC51 → Camera の Radius が変わる
  → Geometry + Camera + Mixer を同時に1台で制御できる
```

### 設計の核心

**MacroKnob 専用ではない。GeoGraphy の全コントロールが対象。**

```
MIDI Learn 対象（MidiLearnable）:
  MacroKnob #1〜8        ← 今回実装
  Geometry スライダー全て ← 将来
  Camera スライダー全て   ← 将来
  FX スライダー全て       ← 将来
  Layer Opacity           ← 将来（= Mixer）
  Sequencer パラメータ    ← 将来
```

---

## 2. MidiLearnable インターフェース

```typescript
/**
 * MIDI Learn 可能な全コントロールが実装する共通インターフェース。
 * ノブ・スライダー・フェーダー・Sequencer レーン等が対象。
 * spec: docs/spec/midi-learn.spec.md
 */
interface MidiLearnable {
  /** 外部デバイスの CC番号（-1 = 未アサイン） */
  learnedCC: number
}
```

---

## 3. MidiLearnTarget 型

Learn モードの対象を表す型。コントロールの種類によって engine の処理が変わる。

```typescript
type MidiLearnTargetType =
  | 'macro'           // MacroKnob（Macro8Window）
  | 'geometry-param'  // Geometry スライダー（将来）
  | 'camera-param'    // Camera スライダー（将来）
  | 'fx-param'        // FX スライダー（将来）
  | 'layer-opacity'   // Layer Opacity = Mixer（将来）
  | 'sequencer-param' // Sequencer（将来）

interface MidiLearnTarget {
  /** コントロールの一意 ID（例: 'macro-1', 'geo-l1-speed', 'opacity-layer-1'）*/
  id: string
  /** コントロールの種類 */
  type: MidiLearnTargetType
  /** UI 表示用ラベル（例: 'Macro #1', 'Layer1 Speed', 'Layer1 Opacity'）*/
  label: string
}
```

---

## 4. MidiLearnService

外部 CC と GeoGraphy コントロールのマッピングを管理するシングルトン。
engine とは独立したサービスとして実装する。

```typescript
/**
 * MidiLearnService
 * spec: docs/spec/midi-learn.spec.md
 *
 * 責務:
 *   - Learn モードの状態管理（対象コントロール・タイムアウト）
 *   - 外部CC → コントロール のマッピング定義を保持
 *   - CC受信時にマッチするコントロールを返す
 *
 * 責務外:
 *   - 実際にパラメータへ値を書く（engine の責務）
 *   - MIDI 受信（MidiInputWrapper の責務）
 */

interface MidiLearnService {
  // ── Learn モード ──────────────────────────────────────

  /** Learn モード開始（10秒タイムアウト付き）*/
  startLearn(target: MidiLearnTarget): void

  /** Learn モード終了・キャンセル */
  stopLearn(): void

  /** 現在の Learn 対象（null = 通常モード）*/
  getLearnTarget(): MidiLearnTarget | null

  // ── CC アサイン管理 ────────────────────────────────────

  /** CC を指定コントロールにアサイン（Learn 完了時に engine が呼ぶ）*/
  assign(controlId: string, cc: number): void

  /** アサインを解除 */
  clearAssign(controlId: string): void

  /** コントロールに割り当てられた CC を取得（-1 = 未アサイン）*/
  getAssignedCC(controlId: string): number

  /** 全アサインを取得（永続化用）*/
  getAllAssigns(): Record<string, number>

  /** 全アサインを復元（プロジェクト読み込み時）*/
  restoreAssigns(assigns: Record<string, number>): void

  // ── CC ルーティング ────────────────────────────────────

  /**
   * CC受信時に呼ぶ。
   * マッチするコントロールがあれば MidiLearnTarget を返す。
   * engine がこれを使って適切なハンドラを呼ぶ。
   */
  resolve(cc: number): MidiLearnTarget | null
}
```

配置場所：`src/application/registry/midiLearnService.ts`

---

## 5. データフロー

### 5.1 Learn モード開始〜CC 記録

```
[UI] Macro8Window でノブを右クリック → 「MIDI Learn」を選択
  → engine.startMidiLearn({ id: 'macro-1', type: 'macro', label: 'Macro #1' })
      ↓
  → midiLearnService.startLearn(target)
  → learnTarget = target
  → 10秒タイムアウトセット

[MidiInputWrapper] APC40 から CC48 受信
  → engine.handleMidiCC({ slot: 48, value: 0.5, source: 'midi' })
      ↓
[engine.handleMidiCC()]
  learnTarget が存在 && source === 'midi'
  → midiLearnService.assign('macro-1', 48)
  → midiLearnService.stopLearn()
  → return（通常処理スキップ）

[Macro8Window] 200ms ポーリング
  → 'macro-1' の learnedCC = 48 を確認
  → ノブに「CC48」バッジ表示
```

### 5.2 通常動作（Learn 完了後）

```
[MidiInputWrapper] APC40 から CC48 受信
  → engine.handleMidiCC({ slot: 48, value: 0.75, source: 'midi' })
      ↓
[engine.handleMidiCC()]
  learnTarget = null（通常モード）
  → midiLearnService.resolve(48) → { id: 'macro-1', type: 'macro' }
  → type === 'macro':
      engine.setMacroKnobValue('macro-1', 0.75)
      engine.receiveMidiModulation('macro-1', 0.75)
  → TransportManager.handle() も通常通り実行
      ↓
[Macro8Window]
  → MacroKnob #1 の値が 0.75 に変わる
  → アサイン先のパラメータも変わる
  → GeoMonitor のバーも動く ✅
```

### 5.3 将来：Layer Opacity = Mixer

```
[UI] Mixer Window の Layer1 オパシティスライダーを右クリック → 「MIDI Learn」
  → target = { id: 'opacity-layer-1', type: 'layer-opacity', label: 'Layer1 Opacity' }

[MidiInputWrapper] CC50 受信
  → engine.handleMidiCC({ slot: 50, value: 0.6, source: 'midi' })
  → midiLearnService.resolve(50) → { id: 'opacity-layer-1', type: 'layer-opacity' }
  → type === 'layer-opacity':
      engine.setLayerOpacity('layer-1', 0.6)
      ↓
  → Layer1 の透明度が 60% に → Mixer として機能 ✅
```

---

## 6. engine への追加 API

```typescript
// Learn モード管理
engine.startMidiLearn(target: MidiLearnTarget): void
engine.stopMidiLearn(): void
engine.getMidiLearnTarget(): MidiLearnTarget | null

// CC アサイン取得（UI 表示用）
engine.getLearnedCC(controlId: string): number  // -1 = 未アサイン
engine.clearLearnedCC(controlId: string): void
```

### engine.handleMidiCC() の変更

```typescript
handleMidiCC(event: TransportEvent): void {
  // ① Learn モード中 → CC を記録して終了
  const learnTarget = midiLearnService.getLearnTarget()
  if (learnTarget && event.source === 'midi') {
    midiLearnService.assign(learnTarget.id, event.slot)
    midiLearnService.stopLearn()
    return  // 通常処理スキップ
  }

  // ② Learn 済みコントロールへのルーティング
  const learned = midiLearnService.resolve(event.slot)
  if (learned) {
    this.dispatchToLearned(learned, event.value)
    // ※ TransportManager にも流す（MacroKnob assign と共存させる）
  }

  // ③ 通常の TransportManager 処理
  this.transportManager.handle(event)
}

private dispatchToLearned(target: MidiLearnTarget, value: number): void {
  switch (target.type) {
    case 'macro':
      this.setMacroKnobValue(target.id, value)
      this.receiveMidiModulation(target.id, value)
      break
    case 'layer-opacity':
      // 将来実装
      break
    case 'geometry-param':
    case 'camera-param':
    case 'fx-param':
      // 将来実装：内部 CC に変換して TransportManager に流す
      break
  }
}
```

---

## 7. UI 仕様

### 7.1 右クリックコンテキストメニュー（全コントロール共通）

```
┌──────────────────────┐
│ 🔴 MIDI Learn        │  ← Learn モード開始
│    Clear MIDI CC     │  ← アサイン解除（midiCC がある場合のみ表示）
│ ─────────────────── │
│    Edit...           │  ← 既存 EditDialog（MacroKnob のみ）
└──────────────────────┘
```

### 7.2 Learn 待機中のビジュアル

```
通常:                    Learn 待機中（点滅）:
  ╭━━━╮                   ╭╌╌╌╮
  ┃ ● ┃                   ┃ ● ┃  ← border が pulse アニメーション
  ╰━━━╯                   ╰╌╌╌╯
  #1                       #1
  0.00                     Move a controller...
                           [Cancel]
```

### 7.3 Learn 完了後

```
  ╭━━━╮
  ┃ ● ┃ 🔴  ← 赤ドット（midiCC あり）
  ╰━━━╯
  #1
  0.00
  CC48  ← バッジ表示
```

### 7.4 タイムアウト

Learn モード開始から **10秒** 経過で自動キャンセル。
カウントダウン表示は不要（シンプルに点滅が止まるだけ）。

---

## 8. 永続化

アサイン情報は `GeoGraphyProject` に保存する。

```typescript
// GeoGraphyProject への追加フィールド
interface GeoGraphyProject {
  // ... 既存フィールド ...

  /** MIDI Learn アサイン（controlId → external CC番号）*/
  midiLearnAssigns?: Record<string, number>
}
```

保存タイミング：プロジェクト保存時（既存の save フローに乗る）
復元タイミング：プロジェクト読み込み時

---

## 9. 変更・新規ファイル一覧

| ファイル | 種別 | 変更内容 |
|---|---|---|
| `src/application/registry/midiLearnService.ts` | **新規** | MidiLearnService シングルトン |
| `src/application/schema/index.ts` | 変更 | `MidiLearnable` / `MidiLearnTarget` 型追加 |
| `src/application/orchestrator/engine.ts` | 変更 | Learn API 追加・`handleMidiCC` に Learn 分岐追加 |
| `src/application/schema/index.ts` | 変更 | `GeoGraphyProject.midiLearnAssigns` 追加 |
| `src/ui/components/window/macro-8-window/Macro8Window.tsx` | 変更 | 右クリックメニュー・点滅・CC バッジ追加 |

**今回実装（v1）: 上記5ファイルのみ。**
将来（v2）: Geometry / Camera / FX スライダー・Layer Opacity に右クリックメニューを追加。

---

## 10. MUST ルール

- MUST: Learn モードは `source === 'midi'` のイベントのみ反応する
- MUST: Learn モード中は `return` して通常の TransportManager 処理をスキップする
- MUST: 10秒タイムアウトで自動キャンセルする
- MUST: 別のコントロールで Learn を開始したら前のコントロールはキャンセルされる
- MUST: `learnedCC: -1` は「未アサイン」を意味する
- MUST: MidiLearnService は engine に依存しない（engine が MidiLearnService に依存する）
- MUST: `GeoGraphyProject.midiLearnAssigns` で永続化する

---

## 11. 完了条件（v1）

- `pnpm tsc --noEmit` エラーゼロ
- `pnpm test --run` 全テストグリーン
- Macro8Window のノブを右クリック → MIDI Learn → APC40 を触る → CC48 が記録される
- 記録後 APC40 の Track Knob 1 を回すと Macro #1 の値が変化する
- GeoMonitor のバーがリアルタイムに追従する
- 10秒触らないと自動キャンセルされる
- プロジェクト保存→読み込み後もアサインが保持される
