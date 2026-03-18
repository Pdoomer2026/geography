# Day 10 実装プロンプト｜BPM クロック + Tap Tempo

## 前提確認
- ブランチ: `main`
- 最終コミット: `feat: Day9 - engine.ts grid-wave create/destroy + initial SceneState`（a394654）
- テスト: 34 tests グリーン ✅

## 今日やること（順番通りに進める）

---

### Step 1: `src/core/clock.ts` を新規作成

以下の内容で作成する。

```typescript
import { DEFAULT_BPM } from './config'

export class Clock {
  private bpm: number = DEFAULT_BPM
  private startTime: number = 0
  private running: boolean = false

  start(): void {
    if (this.running) return
    this.startTime = performance.now()
    this.running = true
  }

  stop(): void {
    this.running = false
  }

  setTempo(bpm: number): void {
    if (bpm <= 0) return
    // テンポ変更時は位相をリセット（beat が急ジャンプしないように）
    this.startTime = performance.now()
    this.bpm = bpm
  }

  getBpm(): number {
    return this.bpm
  }

  /** beat 値: 0.0〜1.0 の繰り返し小数（1拍の中の位置） */
  getBeat(): number {
    if (!this.running) return 0
    const elapsed = (performance.now() - this.startTime) / 1000
    const beatDuration = 60 / this.bpm
    return (elapsed / beatDuration) % 1
  }
}
```

---

### Step 2: `src/core/engine.ts` を修正

#### 2-1. import を追加（ファイル先頭）

```typescript
import { Clock } from './clock'
```

#### 2-2. クラスフィールドの `clock` を置き換え

現在:
```typescript
private clock: THREE.Clock = new THREE.Clock()
```

変更後:
```typescript
private threeClock: THREE.Clock = new THREE.Clock()
readonly clock: Clock = new Clock()
```

#### 2-3. `start()` を修正

現在:
```typescript
start(): void {
  if (this.animationId !== null) return
  this.clock.start()
  this.loop()
}
```

変更後:
```typescript
start(): void {
  if (this.animationId !== null) return
  this.threeClock.start()
  this.clock.start()
  this.loop()
}
```

#### 2-4. `loop()` の `getDelta()` を修正

現在:
```typescript
const delta = this.clock.getDelta()
```

変更後:
```typescript
const delta = this.threeClock.getDelta()
```

#### 2-5. `update()` の beat 固定値を修正

現在:
```typescript
const beat = 0
```

変更後:
```typescript
const beat = this.clock.getBeat()
```

#### 2-6. `stop()` に clock.stop() を追加

現在:
```typescript
stop(): void {
  if (this.animationId !== null) {
    cancelAnimationFrame(this.animationId)
    this.animationId = null
  }
}
```

変更後:
```typescript
stop(): void {
  if (this.animationId !== null) {
    cancelAnimationFrame(this.animationId)
    this.animationId = null
  }
  this.clock.stop()
}
```

---

### Step 3: SimpleMixer に Tap Tempo ボタンを追加

`src/plugins/windows/simple-mixer/SimpleMixer.tsx` を修正する。

#### 3-1. import を追加

```typescript
import { engine } from '../../../core/engine'
```

#### 3-2. Tap Tempo ロジックを追加（コンポーネント内）

```typescript
const tapTimesRef = useRef<number[]>([])

const handleTap = () => {
  const now = performance.now()
  const taps = tapTimesRef.current

  // 2秒以上間隔が空いたらリセット
  if (taps.length > 0 && now - taps[taps.length - 1] > 2000) {
    tapTimesRef.current = []
  }

  tapTimesRef.current.push(now)

  // 2回以上タップで BPM 計算
  if (tapTimesRef.current.length >= 2) {
    const intervals = []
    for (let i = 1; i < tapTimesRef.current.length; i++) {
      intervals.push(tapTimesRef.current[i] - tapTimesRef.current[i - 1])
    }
    const avg = intervals.reduce((a, b) => a + b, 0) / intervals.length
    const bpm = Math.round(60000 / avg)
    engine.clock.setTempo(bpm)
    setDisplayBpm(bpm)
  }
}
```

#### 3-3. `displayBpm` state を追加

```typescript
const [displayBpm, setDisplayBpm] = useState(128)
```

#### 3-4. UI に Tap ボタンと BPM 表示を追加

SimpleMixer の JSX に以下を追加（クロスフェーダーの下あたり）:

```tsx
{/* BPM / Tap Tempo */}
<div style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
  <button
    onClick={handleTap}
    style={{
      padding: '6px 14px',
      background: '#333',
      color: '#fff',
      border: '1px solid #555',
      borderRadius: 4,
      cursor: 'pointer',
      fontSize: 13,
    }}
  >
    TAP
  </button>
  <span style={{ color: '#aaa', fontSize: 13 }}>{displayBpm} BPM</span>
</div>
```

---

### Step 4: テスト追加

`tests/clock.test.ts` を新規作成:

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { Clock } from '../src/core/clock'

describe('Clock', () => {
  let clock: Clock

  beforeEach(() => {
    clock = new Clock()
  })

  it('停止中は getBeat() が 0 を返す', () => {
    expect(clock.getBeat()).toBe(0)
  })

  it('start() 直後は getBeat() が 0〜1 の範囲内', () => {
    clock.start()
    const beat = clock.getBeat()
    expect(beat).toBeGreaterThanOrEqual(0)
    expect(beat).toBeLessThan(1)
  })

  it('setTempo() で BPM が変わる', () => {
    clock.setTempo(120)
    expect(clock.getBpm()).toBe(120)
  })

  it('setTempo(0) は無視される', () => {
    clock.setTempo(0)
    expect(clock.getBpm()).toBe(128) // DEFAULT_BPM
  })
})
```

---

### Step 5: 動作確認

```bash
pnpm test --run 2>&1 | tee .claude/test-latest.txt
```

38 tests（元の 34 + 新規 4）がグリーンであることを確認。

---

### Step 6: コミット

```bash
git add -A
git commit -m "feat: Day10 - BPM clock + tap tempo"
```

---

## 注意点

- `engine.ts` の `private clock` フィールド名が `THREE.Clock` と衝突するため `threeClock` にリネームする
- `engine.clock` は `readonly` で外部（SimpleMixer）からアクセスできるようにする
- Tap Tempo の `tapTimesRef` は `useRef` で管理する（再レンダリングを避けるため）
- `engine` の import は循環参照に注意（SimpleMixer → engine は OK・engine → SimpleMixer は NG）
