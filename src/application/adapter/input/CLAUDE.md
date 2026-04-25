# src/application/adapter/input - CLAUDE.md

## このフォルダの役割

入力デバイスを管理します。外部プロトコルを `TransportEvent` に変換して engine に渡す「外側の世界」です。
engine はプロトコルを知らない。Input Wrapper が全ての変換を担当します。

spec: `docs/spec/transport-architecture.spec.md` §3

---

## ファイル構成

```
src/application/adapter/input/
├── CLAUDE.md
├── MidiInputWrapper.ts
├── OscInputWrapper.ts    <- 将来（OSC 対応時）
└── index.ts
```

---

## Input Wrapper の役割（Day58 確定）

各 Input Wrapper の責務：
- 外部プロトコルのパース（MIDI CC / OSC メッセージ等）
- CC番号 → Slot 変換（現在は同値・将来 OSC 等対応時に分離）
- 生の値（0〜127 等）→ 0.0〜1.0 正規化
- `TransportEvent { slot, value, source }` を生成
- `engine.handleMidiCC(event)` を呼ぶ

**engine はプロトコルを一切知らない。TransportEvent だけを受け取る。**

---

## MidiInputWrapper（Day58 実装済み）

```typescript
// App.tsx での使用（3行に簡略化）
useEffect(() => {
  midiInputWrapper.init((event) => engine.handleMidiCC(event))
  return () => midiInputWrapper.dispose()
}, [])
```

内部処理：
```typescript
// CC メッセージをパースして TransportEvent を生成
const slot = cc               // CC番号 → Slot（現在は同値）
const value = rawValue / 127  // 0〜127 → 0.0〜1.0
engine.handleMidiCC({ slot, value, source: 'midi' })
```

---

## Input Driver 一覧

| Driver | API | 状態 | 主な用途 |
|---|---|---|---|
| MidiInputWrapper | Web MIDI API | ✅ 実装済み | Geometry・FX パラメーター制御 |
| OscInputWrapper | WebSocket / OSC | 将来 | 外部ツール連携 |
| TrackballDriver | Pointer Events API | 将来 | カメラアングル・移動操作 |
| GamepadDriver | Gamepad API | 将来 | カメラ操作・Geometry 切替 |

---

## InputManager の役割（将来）

```typescript
class InputManager {
  private drivers: InputDriver[] = []
  register(driver: InputDriver): void
  getInput(param: string): number
}
```

エンジンは InputManager のみを知る。各 Driver は知らない。

---

## TrackballDriver の実装（将来）

```typescript
// トラックボールでカメラを操作
container.addEventListener('pointermove', (e) => {
  if (!e.buttons) return
  camera.pan  += e.movementX * sensitivity
  camera.tilt += e.movementY * sensitivity
})
```

候補デバイス：Elecom HUGE / Kensington SlimBlade Pro（有線推奨）

---

## カメラ操作の対応表

| 操作 | トラックボール | MIDI ノブ | ゲームパッド |
|---|---|---|---|
| Pan（X軸） | ボール左右 | Endless ノブ 1 | 右スティック左右 |
| Tilt（Y軸） | ボール上下 | Endless ノブ 2 | 右スティック上下 |
| Roll（Z軸） | ボタン + 回転 | Endless ノブ 3 | L2 / R2 |
| Dolly | スクロール | Endless ノブ 4 | L1 / R1 |

---

## 推奨 MIDI コントローラー（Day75 実機確認済み）

**APC40 mk2**: GeoGraphy の推奨コントローラー。USB Class Compliant（ドライバー不要）。

| コントロール | CC / Note | GeoGraphy 用途 |
|---|---|---|
| Track Knob 1～8（CC48～55, ch0） | slot 48～55 | Macro #1～8 |
| Track Fader 1～3（CC7, ch0～2） | slot 7/135/263 | Mixer Output L1～3 Opacity |
| Device Knob（CC16～23, ch0～7） | 8bank×8knob = 64 slot | 将来: Bank 別マッピング |
| Scene Launch 1～5（Note 82～86） | slot 2130～2134 | 将来: UI トグル |

詳細: `docs/spec/devices/apc40mk2.md`（v3.0 実機確認済み）

---

## 実装ルール

1. Input Wrapper は独立して動作する（他の Wrapper に依存しない）
2. `dispose()` では必ずリスナーを解除する
3. エラーハンドリングを必ず実装する（デバイスが見つからない場合など）
4. 出力は必ず `TransportEvent` 形式に統一する
5. engine / TransportManager / TransportRegistry を直接 import しない
   → コールバック（`onEvent`）経由で渡す
