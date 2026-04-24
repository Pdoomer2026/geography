# Clock Spec

> SSoT: このファイル
> 対応実装: `src/application/orchestrator/tempo/clock.ts`
> 担当: Claude Desktop（設計） / Claude Code（実装）
> 状態: Day73 設計確定・実装待ち

---

## 1. 目的と役割

Clock は GeoGraphy の**唯一の時間軸**。

Sequencer・LFO・Scheduler・将来の音生成、すべての時間依存モジュールが
この Clock を参照する。

```
Wall Time（実時間）
  ↓
Scheduler（将来）
  「何時から何分間・何ループ」→ BPM を逆算して注入
  ↓
Clock（Tone.js ベース）
  BPM → getTotalBeats() → 小節・ステップ・位相
  ↓
Sequencer / LFO（将来）
  ↓
paramCommand$（既存パイプライン）
  ↓
engine.handleMidiCC() → Plugin → 映像
```

---

## 2. なぜ Tone.js か

### 2-1. 自前実装の限界

```typescript
// 現在の clock.ts（performance.now() ベース）
setTempo(bpm: number): void {
  this.startTime = performance.now()  // ← BPM 変更時にリセット発生
  this.bpm = bpm
}
```

**問題**: BPM をリアルタイムで操作（つまみを回す）すると
`getTotalBeats()` がゼロに戻り、シーケンサーが途切れる。
これは DAW では常識的に解決されている問題。

`accumulatedBeats` を自前で保持すれば解決できるが、
それは Tone.js がすでに解決済みの問題を再実装することになる。

### 2-2. Tone.js 導入で得られる恩恵

| 恩恵 | 内容 |
|---|---|
| ✅ BPM変更時のリセット問題 | `Tone.Transport` が累積 tick を保持。BPM を何度変えても位置はリセットされない |
| ✅ MIDI Clock 受信 | 外部音源（Ableton・DJ ソフト等）から MIDI Clock を受信し映像をビートに同期できる |
| ✅ 将来の音生成 | GeoGraphy 内部で音を生成する機能をそのまま拡張できる |
| ✅ スケジューラ精度 | `AudioContext.currentTime` ベースで高精度。`performance.now()` より音楽用途に適している |
| ✅ TAP TEMPO | Tone.js に組み込み済み。自前実装不要 |

### 2-3. サイズ懸念について

```
Three.js   ~600KB
React      ~130KB
Tone.js    ~100KB  ← 誤差の範囲
RxJS        ~40KB
```

GeoGraphy はすでに Three.js を積んでいる。
Tone.js の 100KB は許容範囲。個人開発は自前最小主義。
自前実装で再発明するコストより Tone.js の恩恵の方が大きい。

---

## 3. IClock インターフェース

```typescript
export interface IClock {
  /** Transport 開始 */
  start(): void

  /**
   * Transport 停止。
   * 累積拍数は保持する（pause 相当）。
   * 完全リセットが必要な場合は reset() を使う。
   */
  stop(): void

  /** Transport を開始位置にリセットして停止 */
  reset(): void

  /**
   * BPM を変更する。
   * Tone.Transport ベースなので累積拍数はリセットされない。
   * Scheduler が Wall Time から逆算した BPM を注入するエントリーポイント。
   */
  setTempo(bpm: number): void

  /** 現在の BPM を返す */
  getBpm(): number

  /**
   * 1拍内の位相（0.0〜1.0）
   * getTotalBeats() % 1 で導ける。
   */
  getBeat(): number

  /**
   * 累積拍数（モノトニック増加）。
   * BPM 変更・一時停止をまたいでもリセットされない。
   * Sequencer・LFO が「今何ステップ目か」を計算する唯一の源。
   *
   * 利用例:
   *   const total = clock.getTotalBeats()
   *   const currentBar = Math.floor(total / 4) % 16   // 16小節ループ内の小節番号
   *   const step16th   = Math.floor(total * 4) % 64   // 1/16ステップ番号
   *   const loopPhase  = (total % 64) / 64            // ループ全体の進捗 0.0〜1.0
   */
  getTotalBeats(): number

  /** Transport が動作中かどうか。Scheduler が状態確認に使う。 */
  isRunning(): boolean
}
```

---

## 4. Tone.js ベースの実装設計

```typescript
import * as Tone from 'tone'
import { DEFAULT_BPM } from '../../schema/config'
import type { IClock } from './IClock'

export class Clock implements IClock {
  constructor() {
    Tone.getTransport().bpm.value = DEFAULT_BPM
  }

  start(): void {
    Tone.getTransport().start()
  }

  stop(): void {
    // pause() = 累積位置を保持したまま停止（stop() はゼロリセットのため使わない）
    Tone.getTransport().pause()
  }

  reset(): void {
    Tone.getTransport().stop()  // stop() = ゼロリセット
  }

  setTempo(bpm: number): void {
    if (bpm <= 0) return
    Tone.getTransport().bpm.value = bpm  // 累積 tick はリセットされない
  }

  getBpm(): number {
    return Tone.getTransport().bpm.value
  }

  getBeat(): number {
    return this.getTotalBeats() % 1
  }

  getTotalBeats(): number {
    return Tone.getTransport().ticks / Tone.getTransport().PPQ
  }

  isRunning(): boolean {
    return Tone.getTransport().state === 'started'
  }
}
```

### stop() / reset() の使い分け

| メソッド | 内部処理 | 用途 |
|---|---|---|
| `stop()` | `Transport.pause()` | 一時停止。再開すると続きから |
| `reset()` | `Transport.stop()` | 完全リセット。頭から再生 |

---

## 5. Scheduler との関係（将来・インスタレーション用途）

Scheduler は Clock を**外から操作するだけ**。Clock 自体は変わらない。

```
展示: 13:00〜13:05（5分間）
目標: 16小節を4ループさせたい

逆算:
  4ループ × 16小節 × 4拍 = 256拍
  256拍 ÷ 300秒 × 60 = 51.2 BPM

Scheduler が実行:
  clock.setTempo(51.2)
  clock.start()
  // 5分後
  clock.stop()
```

```typescript
// 将来の Scheduler インターフェース（参考）
interface IScheduler {
  schedule(plan: {
    startAt: Date         // 開始時刻（Wall Time）
    durationSec: number   // 展示時間（秒）
    targetLoops: number   // 何ループさせるか
    totalBars: number     // 何小節のループか
  }): void
}
```

---

## 6. MIDI Clock 受信（Phase 2・外部同期）

外部音源（Ableton・DJ ソフト等）から MIDI Clock を受信し、
`Tone.Transport` の BPM を追従させる。

```
外部音源
  → MIDI Clock（24ppqn）
  → Web MIDI API（既存の MidiInputWrapper）
  → BPM 計算
  → clock.setTempo(calculatedBpm)  // Tone.Transport に注入
  → 映像がビートに同期
```

GeoGraphy はすでに Web MIDI API を持つため、
MIDI Clock 受信のパスは既存インフラの延長で実現できる。

---

## 7. 音生成への拡張（Phase 3・将来）

Tone.js を導入しておくことで、音生成機能を**後から自然に追加**できる。

```typescript
// Phase 3 のイメージ（Clock 自体は変わらない）
const synth = new Tone.Synth().toDestination()
Tone.getTransport().scheduleRepeat((time) => {
  synth.triggerAttackRelease('C4', '8n', time)
}, '4n')
```

---

## 8. 移行方針（現 clock.ts からの変更）

| 項目 | 現在 | 移行後 |
|---|---|---|
| 時間源 | `performance.now()` | `Tone.Transport.ticks` |
| BPM 変更 | `startTime` リセット（問題あり） | Tone.Transport が保持 |
| `getBeat()` | 独自計算 | `getTotalBeats() % 1` |
| `getTotalBeats()` | 存在しない | 追加 |
| `isRunning()` | 存在しない | 追加 |
| `reset()` | 存在しない | 追加 |
| `stop()` | `running = false` | `Transport.pause()` |

**既存の IClock を使用している箇所（engine.ts 等）の変更は最小限。**
インターフェースに `getTotalBeats()` / `isRunning()` / `reset()` が増えるが、
既存コードへの影響は追加実装のみ。

---

## 9. Phase 別ロードマップ

| Phase | 内容 | タイミング |
|---|---|---|
| Phase 1（今回） | Tone.js 導入・Clock 移行・`getTotalBeats()` / `isRunning()` / `reset()` 追加 | Day73 |
| Phase 2 | MIDI Clock 受信・外部音源同期 | Sequencer 実装時 |
| Phase 3 | 音生成・`Tone.Synth` 等の統合 | 将来 |

---

## 10. 完了条件（CDD 原則）

```bash
pnpm tsc --noEmit   # 型エラーゼロ
pnpm test --run     # 全テストグリーン
```

- `Clock` が `IClock` を実装している
- `getTotalBeats()` が BPM 変更をまたいでもリセットされない
- `isRunning()` が Transport 状態を正しく返す
- 既存の `getBeat()` の挙動が変わらない（0.0〜1.0 の繰り返し）
- 既存テストが全てグリーンのまま

---

## 11. 関連ファイル

| ファイル | 関係 |
|---|---|
| `src/application/orchestrator/tempo/clock.ts` | 対応実装 |
| `src/application/schema/config.ts` | `DEFAULT_BPM` の定義元 |
| `docs/spec/execution-planner.spec.md` | Scheduler の将来像 |
| `docs/spec/sequencer-window.spec.md` | `getTotalBeats()` の主要利用者（将来） |
