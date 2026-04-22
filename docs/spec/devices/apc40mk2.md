# APC40 mk2 Device Mapping

> バージョン: v2.0（Day75・2026-04-22）
> 出典: 公式プロトコル v1.2 + **実機検証（慎太郎）**
> アーカイブ: docs/archive/spec/devices/2026-04-22_Day75_apc40mk2_official-pdf-v1.md
>
> **このファイルは GeoGraphy 内部 CC 体系（cc-mapping.md）とは独立した外部デバイス仕様書。**
> ★ 実機で未確認の項目には「未確認」と明記する。

---

## デバイス概要

| 項目 | 内容 |
|---|---|
| デバイス名 | AKAI APC40 mk2 |
| 接続方式 | USB（Class Compliant・ドライバー不要） |
| OS 対応 | Mac / Windows（OS 標準ドライバーで動作） |
| ノブ | 8個（横一列）+ Device Knob 8個（右エリア上4・下4） |
| フェーダー | 9本（Track×8 + Master×1） |
| ボタン | Clip Launch×40（5行×8列）+ Scene Launch×5 + Transport 等 |
| LED | RGB 対応（Clip Launch / Scene Launch）・Host 制御 |

---

## GeoGraphy で使うモード

**Generic Mode（Mode 0）を使用する。起動時デフォルト。**

| モード | 識別子 | 説明 |
|---|---|---|
| Generic Mode | 0x40 | Ableton 非依存・全コントロールが素直に MIDI を出す |
| Ableton Live Mode | 0x41 | Ableton 専用（GeoGraphy では使わない） |
| Alternate Ableton Mode | 0x42 | Ableton 専用（GeoGraphy では使わない） |

---

## 物理レイアウト（実機確認済み）

```
┌──────────────────────────────────────────────────────┐
│  [TK1][TK2][TK3][TK4][TK5][TK6][TK7][TK8]  [DK1-4] │
│   CC48  49   50   51   52   53   54   55     CC16-19  │
│                                              [DK5-8]  │
│  ┌──────────────────────────────────┐        CC20-23  │
│  │ 32   33   34   35   36   37   38   39  │           │
│  │ 24   25   26   27   28   29   30   31  │  [SCENE]  │
│  │ 16   17   18   19   20   21   22   23  │   NT82    │
│  │  8    9   10   11   12   13   14   15  │   NT83    │
│  │  0    1    2    3    4    5    6    7  │   NT84    │
│  └──────────────────────────────────┘    │   NT85    │
│                                           │   NT86    │
│  [F1] [F2] [F3] [F4] [F5] [F6] [F7] [F8] [MASTER]   │
│   CC7  CC7  CC7  CC7  CC7  CC7  CC7  CC7   CC14      │
│   ch0  ch1  ch2  ch3  ch4  ch5  ch6  ch7             │
│                          [CROSSFADER CC15]            │
└──────────────────────────────────────────────────────┘
  TK = Track Knob / DK = Device Knob / F = Fader
```

---

## CC コントロール一覧（絶対値・実機確認済み）

### Track Knob（横一列8個・左エリア）

**バンクなし**。Track Selection の影響を受けない。常に同じ CC。

| Control | CC(dec) | 実機確認 |
|---|---|---|
| TRACK KNOB 1 | 48 | ✅ |
| TRACK KNOB 2 | 49 | ✅ |
| TRACK KNOB 3 | 50 | ✅ |
| TRACK KNOB 4 | 51 | ✅ |
| TRACK KNOB 5 | 52 | ✅ |
| TRACK KNOB 6 | 53 | ✅ |
| TRACK KNOB 7 | 54 | ✅ |
| TRACK KNOB 8 | 55 | ✅ |

> **GeoGraphy との接続に最も適したノブ群。**
> バンク不要・絶対値・1対1でパラメータに繋げられる。

### Device Knob（右エリア・上4＋下4）

**バンクあり**：Track Selection ボタンで MIDI ch が変わる（ch0〜7）。
Track Selection ボタンを押した瞬間に、全8個の現在値を一斉送信する。

| Control | CC(dec) | 物理位置 | 実機確認 |
|---|---|---|---|
| DEVICE KNOB 1 | 16 | 右エリア上段 左 | ✅ |
| DEVICE KNOB 2 | 17 | 右エリア上段 | ✅ |
| DEVICE KNOB 3 | 18 | 右エリア上段 | ✅ |
| DEVICE KNOB 4 | 19 | 右エリア上段 右 | ✅ |
| DEVICE KNOB 5 | 20 | 右エリア下段 左 | ✅ |
| DEVICE KNOB 6 | 21 | 右エリア下段 | ✅ |
| DEVICE KNOB 7 | 22 | 右エリア下段 | ✅ |
| DEVICE KNOB 8 | 23 | 右エリア下段 右 | ✅ |

> Track Selection を押した瞬間 CC16〜23 が全て送信される（現在値の一斉送信）。
> GeoGraphy 側で ch を区別して使う必要がある。

### フェーダー

| Control | CC(dec) | MIDI ch | 実機確認 |
|---|---|---|---|
| TRACK FADER 1 | 7 | 0 | ✅ |
| TRACK FADER 2 | 7 | 1 | ✅ |
| TRACK FADER 3 | 7 | 2 | ✅ |
| TRACK FADER 4 | 7 | 3 | ✅ |
| TRACK FADER 5 | 7 | 4 | ✅ |
| TRACK FADER 6 | 7 | 5 | ✅ |
| TRACK FADER 7 | 7 | 6 | ✅ |
| TRACK FADER 8 | 7 | 7 | ✅ |
| MASTER FADER | 14 | - | 未確認 |
| CROSSFADER | 15 | - | 未確認 |

---

## Note コントロール一覧（実機確認済み）

### ボタンの値

| 状態 | メッセージ | velocity |
|---|---|---|
| 押した | Note-On  | 1.00 |
| 離した | Note-Off | 0.00 |

### Clip Launch グリッド（5行×8列・実機確認済み）

```
行5（最上部）  32  33  34  35  36  37  38  39
行4           24  25  26  27  28  29  30  31
行3           16  17  18  19  20  21  22  23
行2            8   9  10  11  12  13  14  15
行1（最下部）   0   1   2   3   4   5   6   7
              └─────────────────────────────┘
              Track 1                  Track 8
```

> ⚠️ 行3（Note 16〜23）は Device Knob の CC番号（16〜23）と同じ数字だが別物。
> Clip Launch は Note / Device Knob は CC で区別できる。

### Scene Launch（右端縦列・実機確認済み）

| Button | Note(dec) | 備考 |
|---|---|---|
| SCENE LAUNCH 1（最上） | 82 | 押すと一瞬点灯・すぐ消灯（LED は Host 制御） |
| SCENE LAUNCH 2 | 83 | 同上 |
| SCENE LAUNCH 3 | 84 | 同上 |
| SCENE LAUNCH 4 | 85 | 同上 |
| SCENE LAUNCH 5（最下） | 86 | 同上 |

> LED を常時点灯させるには GeoGraphy 側から SysEx で制御が必要（将来実装）。

### Transport（未確認・公式 PDF より）

| Button | Note(dec) | 実機確認 |
|---|---|---|
| PLAY | 91 | 未確認 |
| STOP | 92 | 未確認 |
| RECORD | 93 | 未確認 |
| TAP TEMPO | 99 | 未確認 |
| SESSION RECORD | 102 | 未確認 |

### Track Selection ボタン（1〜8）

- MIDI メッセージは**出さない**（バンク切替専用）
- 押した瞬間に Device Knob（CC16〜23）の現在値を一斉送信する ✅

---

## CC コントロール一覧（相対値・公式 PDF より・未確認）

| Control | CC(dec) | 備考 |
|---|---|---|
| TEMPO KNOB | 13 | 相対値（変化量を送る） |
| CUE LEVEL | 47 | 相対値（変化量を送る） |

---

## GeoGraphy 接続推奨マッピング（v1）

### ノブ → Macro アサイン（最優先）

```
TRACK KNOB 1（CC48）→ Macro #1
TRACK KNOB 2（CC49）→ Macro #2
TRACK KNOB 3（CC50）→ Macro #3
TRACK KNOB 4（CC51）→ Macro #4
TRACK KNOB 5（CC52）→ Macro #5
TRACK KNOB 6（CC53）→ Macro #6
TRACK KNOB 7（CC54）→ Macro #7
TRACK KNOB 8（CC55）→ Macro #8
```

### ボタン用途候補

| 物理ボタン | Note(dec) | 推奨用途 |
|---|---|---|
| SCENE LAUNCH 1〜5 | 82〜86 | プリセット呼び出し（将来） |
| CLIP LAUNCH 0〜39 | 0〜39 | Sequencer トリガー（将来） |
| PLAY | 91 | Transport 再生（将来） |
| STOP | 92 | Transport 停止（将来） |
| TAP TEMPO | 99 | BPM タップテンポ（将来） |

---

## 未確認項目（今後実機で確認）

- MASTER FADER（CC14）
- CROSSFADER（CC15）
- Play / Stop / Record / Tap Tempo の Note 番号
- SHIFT ボタンとの組み合わせ動作
- Scene Launch LED の Host 制御（SysEx）
