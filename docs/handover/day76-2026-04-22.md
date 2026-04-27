# GeoGraphy 引き継ぎメモ｜Day76｜2026-04-22

## プロジェクト概要
- **アプリ名**: GeoGraphy（Geometry×地形×Graph のダブルミーニング）
- **目的**: No-Texture・Plugin駆動・マルチライブラリ対応の映像制作プラットフォーム
- **スタック**: Vite / React 18 / TypeScript / Three.js r160+ / pnpm / Electron 41 / RxJS 7.8.2 / Zustand 5.0.12 / Zod 4.3.6
- **開発スタイル**: SDD × CDD（仕様駆動 × コンパイラ駆動）
- **GitHub**: https://github.com/Pdoomer2026/geography
- **ブランチ**: `refactor/day53-design`
- **プロジェクトルート**: `/Users/shinbigan/geography`

---

## 重要ファイルパス

| ファイル | パス |
|---|---|
| CLAUDE.md | `CLAUDE.md` |
| MidiInputWrapper | `src/application/adapter/input/MidiInputWrapper.ts` |
| MidiLearnService | `src/application/registry/midiLearnService.ts` |
| MidiLearnTarget schema | `src/application/schema/zod/midiLearnTarget.schema.ts` |
| schema/index.ts | `src/application/schema/index.ts` |
| engine.ts | `src/application/orchestrator/engine.ts` |
| MixerSimpleWindow | `src/ui/components/mixers/simple-mixer/MixerSimpleWindow.tsx` |
| Macro8MidiWindow | `src/ui/components/window/macro-8-window/Macro8MidiWindow.tsx` |
| APC40 デバイス仕様 | `docs/spec/devices/apc40mk2.md` |
| MIDI Learn spec | `docs/spec/midi-learn.spec.md` |

---

## 今回のセッションで完了したこと

### slot エンコーディング永続設計（Day76 最重要成果）
- **CC 空間**: `slot = channel * 128 + cc`（0〜2047）
- **Note 空間**: `slot = 2048 + channel * 128 + note`（2048〜4095）
- 4096 スロットで MIDI 1.0 の全アドレス空間を完全分離・衝突なし
- `MidiInputWrapper.ts` に実装済み（CC + Note-On/Off 両方）

### MidiLearnTarget Zod 化
- `src/application/schema/zod/midiLearnTarget.schema.ts` 新規作成
- `schema/index.ts` の手書き interface → Zod 派生型に差し替え

### Mixer Output フェーダー MIDI Learn（実機確認済み）
- `MixerSimpleWindow.tsx` に右クリック MIDI Learn 追加
- CC バッジ・点滅アニメーション実装
- Track Fader 3本（CC7, ch0/1/2 → slot 7/135/263）が独立動作 ✅
- `engine.ts dispatchToLearned()` に `layer-opacity` 分岐実装

### Note → TransportEvent 対応（Day76 確定）
- Note-On/Off が初めて `engine.handleMidiCC()` に届くようになった
- Scene Launch ボタンの MIDI Learn が技術的に可能になった

### APC40 mk2 デバイス仕様 v3.0（ほぼ全確定）
- Transport ボタン全確認（PAN/SEND/USER/PLAY/RECORD/NUDGE±/BANK SELECT/SHIFT/BANK 等）
- Track ボタン（Mute NT50・Solo NT49・RecordArm NT48・A/B NT66）ch:0確認
- Track Selection = **Bank Snapshot 機能**確認（8bank × 8knob = 64 slot）
- Clip Stop: Note 52, ch per track（slot 2100/2228/2356...）確認
- Stop All Clips: Note 81（slot 2129）確認
- Master Fader CC14・Crossfader CC15・CUE LEVEL CC47 全確認

---

## 現在の状態

- **ブランチ**: `refactor/day53-design`
- **タグ**: `day74`（day75・day76 はまだ未タグ）
- **テスト**: 129 tests グリーン・tsc エラーゼロ
- **コミット**: `.claude/day76-commit.txt` に記載済み・未コミット

---

## slot エンコーディング（SSoT: docs/spec/midi-learn.spec.md §slot-encoding）

```
CC 空間（slot 0〜2047）:
  slot = channel * 128 + cc
  ch0, CC48 → slot 48    Track Knob 1（既存・変わらず）
  ch0, CC7  → slot 7     Track Fader 1
  ch1, CC7  → slot 135   Track Fader 2

Note 空間（slot 2048〜4095）:
  slot = 2048 + channel * 128 + note
  ch0, Note 82 → slot 2130  Scene Launch 1
  ch0, Note 52 → slot 2100  Clip Stop Track 1
  ch1, Note 52 → slot 2228  Clip Stop Track 2
```

## APC40 mk2 推奨マッピング（確定版）

```
Track Knob 1〜8（CC48〜55, ch0） → Macro #1〜8
Track Fader 1〜3（CC7, ch0〜2 → slot 7/135/263） → Mixer Output L1〜L3 ✅実装済み
Device Knob（CC16〜23, ch0〜7） → 8bank × 8knob = 64スロット
Scene Launch 1〜5（Note 82〜86 → slot 2130〜2134） → UI トグル（将来実装）
```

---

## 発生した問題と解決策

- **問題**: Track Fader（全て CC7）が同じ slot に衝突 → **解決**: `slot = ch*128 + cc` でチャンネル分離
- **問題**: Note が engine に届いていなかった → **解決**: `MidiInputWrapper` で Note-On/Off を `onEvent` に追加
- **問題**: Clip Stop も Note 番号が ch で変わる → **解決**: Note 空間に `channel * 128` を含める設計で完全分離
- **問題**: `MixerSimpleWindow` JSX の閉じタグ不足でtscエラー → **解決**: return 全体を書き直し

---

## 次回やること

### 優先度 高
1. **git commit + tag**
   ```bash
   git add -A
   git commit -F .claude/day76-commit.txt
   git tag day75 HEAD~3  # Day75相当コミットに
   git tag day76
   git push origin refactor/day53-design --tags
   ```

2. **Macro8MidiWindow → Macro8Window 統合**
   - 動作確認済み → `Macro8Window.tsx` をアーカイブ
   - `Macro8MidiWindow.tsx` を `Macro8Window.tsx` として統合
   - App.tsx の並列表示を解消

3. **Scene Launch → UI トグル実装**（`MidiLearnTargetType` に `'command'` を追加）
   - Note-On が engine に届くようになったので実装可能
   - `engine.dispatchToLearned()` に `type === 'command'` 分岐追加
   - `windowMode` のトグルを呼ぶ

### 優先度 中
4. **MIDI Learn 永続化**
   - `GeoGraphyProject.midiLearnAssigns` への保存・復元
5. **docs/spec/midi-learn.spec.md §slot-encoding 更新**
   - NFC 正規化後に Note 空間を追記（`python3 /Users/shinbigan/nfc_normalize.py` → `edit_file`）
6. **film / frei-chen の `FX_STACK_ORDER` 未登録警告修正**

### 優先度 低
7. **Sequencer Window spec 作成**（Phase 16）

---

## APC40 mk2 残り未確認

- STOP ボタンの Note 番号（公式 PDF は 92）
- MASTER ボタン（Scene 列最下部）の Note 番号
- SHIFT との組み合わせ動作
- Scene Launch LED の Host 制御（SysEx）

---

## 環境メモ

- **ブラウザ確認**: `pnpm dev` → `open http://localhost:5174`（ポート 5174 で起動中）
- **NFC 正規化**: 日本語ファイル edit_file 失敗時は `python3 /Users/shinbigan/nfc_normalize.py`
- **コミット**: 日本語長文は `.claude/dayN-commit.txt` に書いて `git commit -F` で実行
- **Macro8MidiWindow**: 現在 Macro8Window と並列表示中（統合前の動作確認用）
- **slot エンコーディング**: MidiLearnService の assigns Map のキーは slot 値（number）

---

## 次回チャット用スタートプロンプト

```
Day77開始
```
