# src/drivers/input - CLAUDE.md

## このフォルダの役割

入力デバイスを管理します。InputManager がすべての入力を抽象化します。

---

## Input Driver 一覧

| Driver | API | 主な用途 |
|---|---|---|
| MidiDriver | Web MIDI API | Geometry・Color・FX パラメーター制御 |
| TrackballDriver | Pointer Events API | カメラアングル・移動操作 |
| GamepadDriver | Gamepad API | カメラ操作・Geometry 切替 |

---

## InputManager の役割

```typescript
class InputManager {
  private drivers: InputDriver[] = []
  register(driver: InputDriver): void
  getInput(param: string): number
}
```

エンジンは InputManager のみを知る。各 Driver は知らない。

---

## MidiDriver の実装

```typescript
navigator.requestMIDIAccess().then(access => {
  access.inputs.forEach(input => {
    input.onmidimessage = (event) => {
      const [status, cc, value] = event.data;
      // CC メッセージをパラメーターにマッピング
      this.parameterStore.set(mapping[cc], value / 127);
    };
  });
});
```

MIDI マッピングは `.md` ファイルで管理。
各フローティングウィンドウの MIDI MAPPING セクションで Load / Save。

---

## TrackballDriver の実装

```typescript
// トラックボールでカメラを操作
container.addEventListener('pointermove', (e) => {
  if (!e.buttons) return;
  camera.pan   += e.movementX * sensitivity;
  camera.tilt  += e.movementY * sensitivity;
});
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

## デバイスの役割分担

- **APC40 Mk2**: Resolume Arena 専用（GeoGraphy では使用しない）
- **別途 MIDI コントローラー**: GeoGraphy 専用（BCR2000 推奨）
