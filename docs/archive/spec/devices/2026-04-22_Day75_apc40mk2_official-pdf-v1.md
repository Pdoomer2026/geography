# APC40 mk2 Device Mapping

> バージョン: v1.0（Day75・2026-04-22）
> 出典: Akai APC40 Mk2 Communications Protocol Version 1.2
> PDF: https://cdn.inmusicbrands.com/akai/attachments/apc40II/APC40Mk2_Communications_Protocol_v1.2.pdf
>
> **このファイルは GeoGraphy 内部 CC 体系（cc-mapping.md）とは独立した外部デバイス仕様書。**
> **GeoGraphy 内部 CC との対応付けは「GeoGraphy 接続推奨マッピング」セクションを参照。**

---

## デバイス概要

| 項目 | 内容 |
|---|---|
| デバイス名 | AKAI APC40 mk2 |
| 接続方式 | USB（Class Compliant・ドライバー不要） |
| OS 対応 | Mac / Windows（OS 標準ドライバーで動作） |
| フェーダー | 9本（Track×8 + Master×1） |
| ノブ | 16個（Device Knob×8 + Track Knob×8） |
| ボタン | 多数（Clip Launch×40 + Transport + ナビゲーション等） |
| LED | RGB対応（Clip Launch / Scene Launch） |

---

## GeoGraphy で使うモード

**Generic Mode（Mode 0）を使用する。**

起動時デフォルトがこのモード。特別な初期化なしで使える。

| モード | 識別子 | 説明 |
|---|---|---|
| Generic Mode | 0x40 | Ableton 非依存・全コントロールが素直に MIDI を出す |
| Ableton Live Mode | 0x41 | Ableton 専用（GeoGraphy では使わない） |
| Alternate Ableton Mode | 0x42 | Ableton 専用（GeoGraphy では使わない） |

Generic Mode の主な挙動：
- Clip Launch ボタン：モメンタリ（押している間だけ ON）
- Activator / Solo / Record Arm：トグル
- Track Selection ボタン：ラジオ式（1つだけ ON）→ MIDI は出さない・Device Knob のバンク切替専用
- Device Knob：Track Selection で MIDI ch が変わる（ch0〜7）
- Track Knob・フェーダー：バンクなし・常に同じ CC

---

## CC コントロール一覧（絶対値・0〜127）

### フェーダー

| Control | CC(dec) | CC(hex) | MIDI ch | 値範囲 |
|---|---|---|---|---|
| TRACK FADER 1 | 7 | 0x07 | 0（Track 1） | 0-127 |
| TRACK FADER 2 | 7 | 0x07 | 1（Track 2） | 0-127 |
| TRACK FADER 3 | 7 | 0x07 | 2（Track 3） | 0-127 |
| TRACK FADER 4 | 7 | 0x07 | 3（Track 4） | 0-127 |
| TRACK FADER 5 | 7 | 0x07 | 4（Track 5） | 0-127 |
| TRACK FADER 6 | 7 | 0x07 | 5（Track 6） | 0-127 |
| TRACK FADER 7 | 7 | 0x07 | 6（Track 7） | 0-127 |
| TRACK FADER 8 | 7 | 0x07 | 7（Track 8） | 0-127 |
| MASTER FADER  | 14 | 0x0E | - | 0-127 |
| CROSSFADER    | 15 | 0x0F | - | 0-127 |

> Track Fader は全て CC=7・MIDI ch でトラックを区別する。

### Device Knob（上段8ノブ）

**バンクあり**：Track Selection ボタンで MIDI ch が変わる（ch0〜7・Master=ch8）。
Track Selection ボタン自体は MIDI を出さない。

| Control | CC(dec) | CC(hex) | MIDI ch |
|---|---|---|---|
| DEVICE KNOB 1 | 16 | 0x10 | Track Selection による（ch0〜8） |
| DEVICE KNOB 2 | 17 | 0x11 | 同上 |
| DEVICE KNOB 3 | 18 | 0x12 | 同上 |
| DEVICE KNOB 4 | 19 | 0x13 | 同上 |
| DEVICE KNOB 5 | 20 | 0x14 | 同上 |
| DEVICE KNOB 6 | 21 | 0x15 | 同上 |
| DEVICE KNOB 7 | 22 | 0x16 | 同上 |
| DEVICE KNOB 8 | 23 | 0x17 | 同上 |

> 9バンク（Track 1〜8 + Master）× 8ノブ = 最大72アサインが可能。
> ただし ch を区別する実装が必要。

### Track Knob（下段8ノブ）

**バンクなし**：Track Selection の影響を受けない。常に同じ CC・MIDI ch。

| Control | CC(dec) | CC(hex) | MIDI ch |
|---|---|---|---|
| TRACK KNOB 1 | 48 | 0x30 | - |
| TRACK KNOB 2 | 49 | 0x31 | - |
| TRACK KNOB 3 | 50 | 0x32 | - |
| TRACK KNOB 4 | 51 | 0x33 | - |
| TRACK KNOB 5 | 52 | 0x34 | - |
| TRACK KNOB 6 | 53 | 0x35 | - |
| TRACK KNOB 7 | 54 | 0x36 | - |
| TRACK KNOB 8 | 55 | 0x37 | - |

> GeoGraphy との接続に最も適したノブ群。バンク不要・絶対値・1対1でパラメータに繋げられる。

### その他

| Control | CC(dec) | CC(hex) | 備考 |
|---|---|---|---|
| CUE LEVEL | 47 | 0x2F | **相対値**（後述） |
| Footswitch | 64 | 0x40 | 押=127 / 離=0 |

---

## CC コントロール一覧（相対値）

以下2つは「変化量」を送る。絶対値ではないため、ソフト側で加算処理が必要。

| Control | CC(dec) | CC(hex) |
|---|---|---|
| TEMPO KNOB | 13 | 0x0D |
| CUE LEVEL  | 47 | 0x2F |

### 相対値の読み方

| 受信値（dec） | 意味 |
|---|---|
| 1〜63 | 正方向（+1〜+63） |
| 64 | -64 |
| 65〜127 | 負方向（-63〜-1） |
| 0 | 変化なし |

```typescript
// 相対値デコード例
function decodeRelative(value: number): number {
  if (value === 0) return 0
  if (value <= 63) return value        // 正方向
  return value - 128                   // 負方向（64→-64, 127→-1）
}
```

---

## Note コントロール一覧（ボタン類）

### ボタンの値

| 状態 | メッセージ | velocity |
|---|---|---|
| 押した | Note-On | 127（0x7F） |
| 離した | Note-Off | 127（0x7F） |

### Clip Launch グリッド（5行 × 8列 = 40ボタン）

MIDI ch はトラック対応（ch0〜7）。

| Button | Note(dec) | Note(hex) |
|---|---|---|
| CLIP LAUNCH 1 | 0 | 0x00 |
| CLIP LAUNCH 2 | 1 | 0x01 |
| CLIP LAUNCH 3 | 2 | 0x02 |
| CLIP LAUNCH 4 | 3 | 0x03 |
| CLIP LAUNCH 5 | 4 | 0x04 |
| CLIP LAUNCH 6 | 5 | 0x05 |
| CLIP LAUNCH 7 | 6 | 0x06 |
| CLIP LAUNCH 8 | 7 | 0x07 |
| CLIP LAUNCH 9 | 8 | 0x08 |
| CLIP LAUNCH 10 | 9 | 0x09 |
| CLIP LAUNCH 11 | 10 | 0x0A |
| CLIP LAUNCH 12 | 11 | 0x0B |
| CLIP LAUNCH 13 | 12 | 0x0C |
| CLIP LAUNCH 14 | 13 | 0x0D |
| CLIP LAUNCH 15 | 14 | 0x0E |
| CLIP LAUNCH 16 | 15 | 0x0F |
| CLIP LAUNCH 17 | 16 | 0x10 |
| CLIP LAUNCH 18 | 17 | 0x11 |
| CLIP LAUNCH 19 | 18 | 0x12 |
| CLIP LAUNCH 20 | 19 | 0x13 |
| CLIP LAUNCH 21 | 20 | 0x14 |
| CLIP LAUNCH 22 | 21 | 0x15 |
| CLIP LAUNCH 23 | 22 | 0x16 |
| CLIP LAUNCH 24 | 23 | 0x17 |
| CLIP LAUNCH 25 | 24 | 0x18 |
| CLIP LAUNCH 26 | 25 | 0x19 |
| CLIP LAUNCH 27 | 26 | 0x1A |
| CLIP LAUNCH 28 | 27 | 0x1B |
| CLIP LAUNCH 29 | 28 | 0x1C |
| CLIP LAUNCH 30 | 29 | 0x1D |
| CLIP LAUNCH 31 | 30 | 0x1E |
| CLIP LAUNCH 32 | 31 | 0x1F |
| CLIP LAUNCH 33 | 32 | 0x20 |
| CLIP LAUNCH 34 | 33 | 0x21 |
| CLIP LAUNCH 35 | 34 | 0x22 |
| CLIP LAUNCH 36 | 35 | 0x23 |
| CLIP LAUNCH 37 | 36 | 0x24 |
| CLIP LAUNCH 38 | 37 | 0x25 |
| CLIP LAUNCH 39 | 38 | 0x26 |
| CLIP LAUNCH 40 | 39 | 0x27 |

### トラック別ボタン（ch0〜7でトラック1〜8）

| Button | Note(dec) | Note(hex) |
|---|---|---|
| RECORD ARM | 48 | 0x30 |
| SOLO | 49 | 0x31 |
| ACTIVATOR | 50 | 0x32 |
| TRACK SELECT | 51 | 0x33 |
| TRACK STOP / CLIP STOP | 52 | 0x34 |

### シーン・クリップ制御

| Button | Note(dec) | Note(hex) |
|---|---|---|
| SCENE LAUNCH 1 | 82 | 0x52 |
| SCENE LAUNCH 2 | 83 | 0x53 |
| SCENE LAUNCH 3 | 84 | 0x54 |
| SCENE LAUNCH 4 | 85 | 0x55 |
| SCENE LAUNCH 5 | 86 | 0x56 |
| STOP ALL CLIPS | 81 | 0x51 |
| MASTER | 80 | 0x50 |

### トランスポート

| Button | Note(dec) | Note(hex) |
|---|---|---|
| PLAY | 91 | 0x5B |
| STOP | 92 | 0x5C |
| RECORD | 93 | 0x5D |
| SESSION RECORD | 102 | 0x66 |

### ナビゲーション

| Button | Note(dec) | Note(hex) |
|---|---|---|
| UP | 94 | 0x5E |
| DOWN | 95 | 0x5F |
| RIGHT | 96 | 0x60 |
| LEFT | 97 | 0x61 |
| SHIFT | 98 | 0x62 |
| TAP TEMPO | 99 | 0x63 |
| NUDGE - | 100 | 0x64 |
| NUDGE + | 101 | 0x65 |
| BANK LOCK | 103 | 0x67 |

### デバイスコントロール

| Button | Note(dec) | Note(hex) |
|---|---|---|
| DEVICE LEFT | 58 | 0x3A |
| DEVICE RIGHT | 59 | 0x3B |
| BANK LEFT | 60 | 0x3C |
| BANK RIGHT | 61 | 0x3D |
| DEVICE ON/OFF | 62 | 0x3E |
| DEVICE LOCK | 63 | 0x3F |
| CLIP/DEVICE VIEW | 64 | 0x40 |
| DETAIL VIEW | 65 | 0x41 |
| CROSSFADER A/B | 66 | 0x42 |

### モード切替

| Button | Note(dec) | Note(hex) |
|---|---|---|
| PAN | 87 | 0x57 |
| SENDS | 88 | 0x58 |
| USER | 89 | 0x59 |
| METRONOME | 90 | 0x5A |

---

## GeoGraphy 接続推奨マッピング

### 優先度 高（即使える・絶対値・バンク不要）

| 物理コントロール | CC(dec) | 推奨用途 |
|---|---|---|
| TRACK KNOB 1-8 | 48〜55 | Macro 1〜8 直結（最もシンプル） |
| MASTER FADER | 14 | マスター輝度・グローバルパラメータ |
| CROSSFADER | 15 | Layer A/B ブレンド |
| TRACK FADER 1-8 | 7（ch違い） | レイヤー別パラメータ |

### 優先度 中（バンク活用で大量アサイン可能）

| 物理コントロール | CC(dec) | MIDI ch | 推奨用途 |
|---|---|---|---|
| DEVICE KNOB 1-8 | 16〜23 | ch0〜8 | 9バンク×8 = 72アサイン |

> 実装時は `MidiCCEvent.channel` でバンクを区別する。

### ボタン用途例

| 物理ボタン | Note(dec) | 推奨用途 |
|---|---|---|
| CLIP LAUNCH 1〜40 | 0〜39 | Sequencer トリガー・シーン切替 |
| PLAY | 91 | Transport 再生 |
| STOP | 92 | Transport 停止 |
| TAP TEMPO | 99 | BPM タップテンポ |
| SCENE LAUNCH 1〜5 | 82〜86 | プリセット呼び出し |

---

## 注意事項

1. **Track Fader は CC=7 共通・MIDI ch でトラックを区別する**
   受信時に `event.channel` を確認してどのフェーダーか判定する。

2. **Device Knob はバンクあり・Track Knob はバンクなし**
   GeoGraphy v1 での接続は Track Knob を優先推奨。

3. **TEMPO KNOB と CUE LEVEL は相対値**
   絶対値として使う場合は `decodeRelative()` で変化量に変換し、内部状態に加算する。

4. **Track Selection ボタン自体は MIDI を出さない**
   Device Knob のバンク切替のみ行う。MIDI イベントは発生しない。

5. **Generic Mode がデフォルト**
   電源投入時は自動的に Generic Mode になる。
   Ableton Live を起動するとモードが切り替わる場合があるため、
   GeoGraphy 使用時は Ableton を起動しないこと。
