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

### フェーダー（全実機確認済み）

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
| MASTER FADER | 14 | 0 | ✅ |
| CROSSFADER | 15 | 0 | ✅ |

---

## Note コントロール一覧（実機確認済み）

### ボタンの値

| 状態 | メッセージ | velocity |
|---|---|---|
| 押した | Note-On  | 1.00 |
| 離した | Note-Off | 0.00 |

### Clip Stop ボタン（8個横列・Clip Launch グリッドとフェーダーの間）

| Control | Note(dec) | ch | slot | 実機確認 |
|---|---|---|---|---|
| CLIP STOP Track 1 | 52 | 0（未確認） | 2100 | ✅（ch要再確認） |
| CLIP STOP Track 2 | 52 | 1（未確認） | 2228 | ✅（ch要再確認） |
| CLIP STOP Track 3 | 52 | 2（未確認） | 2356 | ✅（ch要再確認） |
| CLIP STOP Track 4 | 52 | 3（未確認） | 2484 | ✅（ch要再確認） |
| CLIP STOP Track 5 | 52 | 4（未確認） | 2612 | ✅（ch要再確認） |
| CLIP STOP Track 6 | 52 | 5（未確認） | 2740 | ✅（ch要再確認） |
| CLIP STOP Track 7 | 52 | 6（未確認） | 2868 | ✅（ch要再確認） |
| CLIP STOP Track 8 | 52 | 7（未確認） | 2996 | ✅（ch要再確認） |

> Note 52 は Track Knob（CC52）と同じ数字だが別物。slot = 2048+note で完全分離。
> ch（0〘7）が各 Track を区別するか要再確認。

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

| Button | Note(dec) | slot | 備考 |
|---|---|---|---|
| SCENE LAUNCH 1（最上） | 82 | 2130 | 押すと一瞬点灯・LED は Host 制御 |
| SCENE LAUNCH 2 | 83 | 2131 | 同上 |
| SCENE LAUNCH 3 | 84 | 2132 | 同上 |
| SCENE LAUNCH 4 | 85 | 2133 | 同上 |
| SCENE LAUNCH 5 | 86 | 2134 | 同上 |
| STOP ALL CLIPS | 81 | 2129 | Scene Launch 列の下に位置 ✅ |
| MASTER（最下） | ?? | ?? | 未確認 |

> LED を常時点灯させるには GeoGraphy 側から SysEx で制御が必要（将来実装）。

### Device Control ボタン（Device Knob 下部 8個・実機確認済み）

Device Knob（右エリア）の下に並ぶ 8個のボタン。上段 4個・下段 4個。

| ボタン | Note(dec) | slot | 候補用途 |
|---|---|---|---|
| 1（上段左） | 58 | 2106 | 将来実装 |
| 2（上段） | 59 | 2107 | 将来実装 |
| 3（上段） | 60 | 2108 | 将来実装 |
| 4（上段右） | 61 | 2109 | 将来実装 |
| 5（下段左） | 62 | 2110 | 将来実装 |
| 6（下段） | 63 | 2111 | 将来実装 |
| 7（下段） | 64 | 2112 | 将来実装 |
| 8（下段右） | 65 | 2113 | 将来実装 |

> Note 58〜65 は他コントロールと衝突なし。将来の UI トグル / プリセット切替等に活用できる。

### Transport（全実機確認済み）

| Button | Note(dec) | 実機確認 |
|---|---|---|
| PAN | 87 | ✅ |
| PLAY | 91 | ✅ |
| RECORD | 93 | ✅ |
| SESSION RECORD | 102 | ✅ |
| SEND | 88 | ✅ |
| METRONOME | 90 | ✅ |
| TAP TEMPO | 99 | ✅ |
| USER | 89 | ✅ |
| NUDGE- | 100 | ✅ |
| NUDGE+ | 101 | ✅ |
| BANK SELECT ↑ | 94 | ✅ |
| BANK SELECT ↓ | 95 | ✅ |
| BANK SELECT → | 96 | ✅ |
| BANK SELECT ← | 97 | ✅ |
| SHIFT | 98 | ✅ |
| BANK | 103 | ✅ |

> PAN / SEND / USER ボタンは Generic Mode では Track Knob に影響しない。Ableton Live Mode 専用の連動機能。

### Track ボタン（各 Track Fader 上部 4個・実機確認済み）

各 Track（1〜8）に 4個のボタン（上段左から 1・A/B、下段左から S・○）がある。
Note 番号は **Track ごとに 8 ずつシフト**する。

| ボタン | Track 1 Note | Track N Note | slot（Track 1） | 備考 |
|---|---|---|---|---|
| **1**（Mute） | 50 | 50 + (N-1)×8 | 2098 | velocity 127 |
| **A/B**（Crossfader Assign） | 66 | 66 + (N-1)×8 | 2114 | velocity 1=A側 / 2=B側（特殊） |
| **S**（Solo） | 49 | 49 + (N-1)×8 | 2097 | velocity 127 |
| **○**（Record Arm） | 48 | 48 + (N-1)×8 | 2096 | velocity 127 |

> ⚠️ Note 48〜50 は Track Knob（CC48〜50）と同じ数字だが別物。
> CC は slot = cc（例: slot 48）、Note は slot = 2048 + note（例: slot 2096）で完全に分離される。衝突なし。

### Track Selection ボタン（1〜8）— Bank Snapshot 機能

**重要**: Track Selection ボタンは単なるバンク切替ではなく、**APC40 mk2 本体がバンクごとの Device Knob 値を保持しており、切替時に現在バンクの値を一斉送信する**。

```
Bank 1 点灯中に Device Knob 1〘8 を全て MAX に移動する
  → Bank 1 は CC16〜23, ch0（slot 16〜23）の値 = 127 を記憶

Bank 2 に切替
  → Device Knob が MIN（初期値）に戻る
  → Bank 2 は CC16〜23, ch1（slot 144〜151）の値 = 0 を送信

Bank 1 に戻す
  → Device Knob が MAX に戻る（Bank 1 の記憶を再送信）
```

**slot エンコーディングによる 8バンク分離:**

| Bank | Track Selection | ch | CC16〜23 の slot |
|---|---|---|---|
| 1 | ボタン 1 点灯 | 0 | slot 16〜23 |
| 2 | ボタン 2 点灯 | 1 | slot 144〜151 |
| 3 | ボタン 3 点灯 | 2 | slot 272〜279 |
| 4 | ボタン 4 点灯 | 3 | slot 400〜407 |
| 5 | ボタン 5 点灯 | 4 | slot 528〜535 |
| 6 | ボタン 6 点灯 | 5 | slot 656〜663 |
| 7 | ボタン 7 点灯 | 6 | slot 784〜791 |
| 8 | ボタン 8 点灯 | 7 | slot 912〜919 |

**8 バンク × 8 ノブ = 64 スロットが全て異なる slot で完全分離。**
`slot = ch * 128 + cc` の設計により衿突なし。

**実機確認済みの活用例:**

```
Bank 1（Layer 1 Geometry 制御）
  Device Knob 1〘8（slot 16〜23）→ Macro #1〘8 → L1 の Speed/Radius 等

Bank 2（Camera 制御）
  Device Knob 1〘8（slot 144〜151）→ Macro #1〘8（別アサイン）→ Camera パラメータ

Bank 3（FX 制御）
  Device Knob 1〘8（slot 272〜279）→ Macro #1〘8（別アサイン）→ Bloom/Glitch 等
```

> GeoGraphy 側は「受け取るだけ」でよい。
> Bank 切替時に発生する一斉送信を `handleMidiCC()` が通常通り処理するだけで自動的に機能する。
> 追加実装不要。✅

---

## CC コントロール一覧（相対値・全実機確認済み）

| Control | CC(dec) | 備考 | 実機確認 |
|---|---|---|---|
| TEMPO KNOB | 13 | 相対値（変化量を送る） | ✅ |
| CUE LEVEL | 47 | 相対値（変化量を送る） | ✅ |

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

### フェーダー → Mixer Output Opacity（実装済み）

```
TRACK FADER 1（CC7, ch0 → slot 7）   → Output L1 Opacity
TRACK FADER 2（CC7, ch1 → slot 135） → Output L2 Opacity
TRACK FADER 3（CC7, ch2 → slot 263） → Output L3 Opacity
```

### Scene Launch → UI トグルコマンド（将来実装）

```
SCENE LAUNCH 1（Note 82 → slot 2130） → Macro8Window トグル
SCENE LAUNCH 2（Note 83 → slot 2131） → Mixer Window トグル
SCENE LAUNCH 3（Note 84 → slot 2132） → MIDI Monitor トグル
SCENE LAUNCH 4（Note 85 → slot 2133） → GEO Monitor トグル
SCENE LAUNCH 5（Note 86 → slot 2134） → 全 Window 非表示/全表示トグル
```

### Transport ボタン用途候補（将来実装）

| 物理ボタン | Note(dec) | slot | 推奨用途 |
|---|---|---|---|
| PLAY | 91 | 2139 | Transport 再生 |
| RECORD | 93 | 2141 | 録画開始/停止 |
| TAP TEMPO | 99 | 2147 | BPM タップテンポ |
| NUDGE- | 100 | 2148 | BPM -1 |
| NUDGE+ | 101 | 2149 | BPM +1 |
| METRONOME | 90 | 2138 | クロック ON/OFF |
| CLIP LAUNCH 0〜39 | 0〜39 | 2048〜2087 | Sequencer トリガー（将来） |

---

## 未確認項目

- STOP ボタンの Note 番号（公式 PDF は 92 だが未確認）
- SHIFT との組み合わせ動作
- Scene Launch LED の Host 制御（SysEx）

---

> バージョン: v3.0（Day76・2026-04-22）— 実機確認によりほぼ全コントロール確定
