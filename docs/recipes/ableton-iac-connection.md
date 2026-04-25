# Ableton Live → GeoGraphy 接続ガイド（IAC Driver 経由）

> 作成: Day79（2026-04-25）
> 対象: macOS / 同一マシン内接続

---

## 概要

Ableton Live のシーケンサー・LFO・オートメーションを GeoGraphy のパラメーターに
リアルタイムで接続する方法。IAC（Inter-Application Communication）Driver を使った
同一 Mac 内の仮想 MIDI バス接続。

**GeoGraphy 側のコード変更は不要。IAC Driver の有効化だけで動作する。**

---

## なぜ IAC + MIDI か

- GeoGraphy の内部プロトコルが `TransportEvent { slot, value: 0.0–1.0 }` で統一されており、
  MIDI CC（0〜127 → 0.0〜1.0）と直結できる
- `MidiInputWrapper` が Web MIDI API で全デバイスを自動検出するため追加実装不要
- MIDI Learn 機能で任意の CC を任意のパラメーターに即アサインできる
- 将来の Sequencer Plugin 設計の前に「どのパラメーターがどう動くと気持ちいいか」を
  Ableton で体験してから仕様を書ける

---

## 接続手順

### Step 1: IAC Driver を有効化（macOS）

1. `Spotlight` →「Audio MIDI 設定」を開く
2. メニューバー「ウィンドウ」→「MIDI スタジオ」
3. 「IAC Driver」をダブルクリック
4. 「デバイスはオンラインです」にチェックを入れる
5. バス名「Bus 1」があることを確認（なければ `+` で追加）

### Step 2: Ableton Live の MIDI 出力を IAC に設定

1. Ableton Live の環境設定 → 「Link / Tempo / MIDI」タブ
2. MIDI ポートの一覧で「IAC Driver Bus 1」を探す
3. 「出力」列の「トラック」と「シンク」をオンにする

### Step 3: GeoGraphy を起動

```bash
cd /Users/shinbigan/geography && pnpm dev
```

IAC Driver の有効化後は GeoGraphy の再起動不要。
`MidiInputWrapper` の `onstatechange` が新デバイスを自動検出する。

### Step 4: 受信確認

1. GeoGraphy で `M` キーを押して MIDI Monitor を開く
2. Ableton Live のノブ・オートメーション・LFO で CC を送信
3. MIDI Monitor にチャンネル・CC 番号・値が表示されれば接続成功

### Step 5: パラメーターにアサイン（MIDI Learn）

1. GeoGraphy の MacroKnob パネルを開く（`1` キー）
2. アサインしたいノブを右クリック → MIDI Learn
3. Ableton 側で対応する CC を動かす → 自動でアサイン完了
4. 以降は Ableton の LFO・オートメーション・シーケンサーで GeoGraphy を制御できる

---

## 信号フロー

```
Ableton Live
  （MIDI クリップ / LFO / オートメーション）
    ↓ MIDI CC（ch: 0-15, cc: 0-127, value: 0-127）
  IAC Driver Bus 1
    ↓ macOS 仮想 MIDI バス
  Web MIDI API（navigator.requestMIDIAccess）
    ↓
  MidiInputWrapper.onMidiMessage()
    slot  = channel * 128 + cc   （例: ch0 CC7 → slot 7）
    value = rawValue / 127        （0.0〜1.0 に正規化）
    ↓
  engine.handleMidiCC(TransportEvent)
    ↓
  TransportManager → ParameterStore → Plugin パラメーター
```

---

## Ableton 側の設定例

| 用途 | Ableton の機能 | CC 設定例 |
|---|---|---|
| ゆっくり揺らす | LFO（Max for Live） | ch0 CC1 → MacroKnob にアサイン |
| リズムに合わせる | MIDI クリップ（エンベロープ） | ch0 CC7 → Geometry パラメーター |
| フィルタースイープ | オートメーション | ch0 CC74 → FX パラメーター |
| BPM 同期スイッチ | MIDI ノート | ch0 Note 60 → Beat Cut トリガー |

---

## トラブルシューティング

| 症状 | 原因 | 対処 |
|---|---|---|
| MIDI Monitor に何も出ない | IAC が無効 / Ableton 出力設定漏れ | Step 1-2 を再確認 |
| MIDI Monitor に出るがパラメーターが動かない | MIDI Learn 未設定 | MacroKnob で Learn してアサイン |
| GeoGraphy 起動後に IAC を有効にした | ← 問題なし | `onstatechange` で自動検出される |
| ブラウザが MIDI 権限を求める | Web MIDI API の初回確認 | 「許可」を選ぶ |

---

## 将来の拡張

- **Sequencer Plugin（Phase 20）設計前**に Ableton で動作確認し、
  「どのパラメーターをどう動かすか」の知見を得る
- **MIDI 2.0 / UMP** 対応時も macOS ネイティブ MIDI スタック経由のため互換性が高い
- **別マシン接続**が必要になった場合は rtpMIDI（ネットワーク MIDI）を検討

---

## 関連ファイル

- `src/application/adapter/input/MidiInputWrapper.ts`
- `docs/spec/transport-architecture.spec.md`
- `docs/spec/midi-registry.spec.md`
