# GeoGraphy 引き継ぎメモ｜Day52（MacroKnob D&D UI + RangeSlider + Geometry Preset）｜2026-04-08

## プロジェクト概要
- **アプリ名**: GeoGraphy（Geometry×地形×Graph のダブルミーニング）
- **目的**: No-Texture・Plugin駆動・マルチライブラリ対応の映像制作プラットフォーム
- **スタック**: Vite / React 18 / TypeScript / Three.js r160+ / pnpm v10.32+ / Electron 41
- **開発スタイル**: SDD × CDD（仕様駆動 × コンパイラ駆動）
- **GitHub**: https://github.com/Pdoomer2026/geography
- **プロジェクトルート**: `/Users/shinbigan/geography`

---

## 重要ファイルパス

| ファイル | パス |
|---|---|
| CLAUDE.md（全体方針） | `CLAUDE.md`（v11） |
| MidiManager | `src/core/midiManager.ts` |
| MacroKnobManager | `src/core/macroKnob.ts` |
| Engine | `src/core/engine.ts` |
| 型定義 | `src/types/index.ts` |
| GeometrySimpleWindow | `src/ui/GeometrySimpleWindow.tsx` |
| MacroKnobPanel | `src/ui/panels/macro-knob/MacroKnobPanel.tsx` |

---

## 現在の状態

- **ブランチ**: `main`
- **タグ**: `day52`（未打）
- **テスト**: 114 tests グリーン・tsc エラーゼロ
- **コミット**: 05fd545（WIP）

---

## Day52 で完了したこと

### 1. MacroKnob D&D アサイン UI（完成）
- `GeometrySimpleWindow` の各パラメーター行に CC番号表示 + `≡` D&D ハンドル追加
- `MacroKnobPanel` の KnobCell にドロップ受け口 + AssignDialog（min/max 設定）
- アサイン済みノブは弧が紫で点灯
- `≡` 右クリック → アサイン解除メニュー
- EditDialog の ASSIGNS 欄に CC番号表示 + `×` ボタンで個別 Remove
- `DragPayload` に `layerId` / `pluginId` を追加

### 2. MacroKnob ノブ操作（完成）
- 上下ドラッグで値をリアルタイム変更
- クリック（移動量ゼロ）→ EditDialog を開く
- `receiveMidiModulation(knobId, val)` 経由で Geometry に反映

### 3. Geometry Param Preset（完成）
- Save / Load / Delete
- `localStorage: geography:geo-presets-v1`（便宜的・将来 `GeoGraphyProject` に統合）
- pluginId 単位でフィルタリング

### 4. RangeSlider（ParamRow）（実装済み・同期の設計確定）
- `PluginParam` に `rangeMin`/`rangeMax` を追加（UI 専用）
- HTML range input 3本重ねで実装（rangeMin つまみ / rangeMax つまみ / 値スライダー）
- レール色分け（範囲外：暗い / 範囲内：明るい紫）
- D&D 時に `rangeMin`/`rangeMax` を `DragPayload.min`/`max` として渡す

### 5. MacroKnob ↔ SimpleWindow 双方向同期（実装済み・設計 WIP）
- MacroKnob → SimpleWindow は動作確認済み ✅
- SimpleWindow → MacroKnob は動作確認済み ✅

### 6. localStorage 使用方針を CLAUDE.md に明文化
- `src/ui/CLAUDE.md` に localStorage 使用方針セクション新設
- ルート `CLAUDE.md` の MUST に localStorage 例外ルール追記

---

## Day53 の最重要タスク（設計確定・未実装）

### MidiCCEvent に rangeMin/rangeMax を追加する

**確定した設計：**

```typescript
interface MidiCCEvent {
  cc: number
  value: number           // 0.0〜1.0（相対値）
  protocol: 'midi1' | 'midi2'
  resolution: 128 | 4294967296
  rangeMin?: number       // 変化幅の下限（絶対値）= assign.min = rangeMin
  rangeMax?: number       // 変化幅の上限（絶対値）= assign.max = rangeMax
}
```

**各入力源：**

| 入力源 | value | rangeMin | rangeMax |
|---|---|---|---|
| SimpleWindow スライダー | 0.0〜1.0 | rangeMin | rangeMax |
| MacroKnob UI ドラッグ | 0.0〜1.0 | assign.min | assign.max |
| 物理MIDI（アサイン済み） | 0.0〜1.0 | assign.min | assign.max |

**設計の根拠（Day52 壁打ちで確定）：**
- `rangeMin`/`rangeMax` は UI 専用・engine 側には伝えない
- スライダーノブ と MacroKnob ノブ は同じ 0.0〜1.0 の相対値
- 変化幅（rangeMin/rangeMax = assign.min/max）は MidiCCEvent で渡す
- engine 側は実値を受け取るだけ・特別な変換不要

**midiManager 側：**
```
実値 = rangeMin + value * (rangeMax - rangeMin)
store に実値を書く
```

**resolveParamValue：**
```
store から実値をそのまま取り出す（変換不要）
```

**修正が必要なファイル：**
1. `src/types/index.ts` — `MidiCCEvent` に `rangeMin?`/`rangeMax?` を追加
2. `src/core/midiManager.ts` — `handleMidiCC` / `receiveModulation` で実値変換
3. `src/core/engine.ts` — `resolveParamValue` から assign 分岐・effective 分岐を削除
4. `src/ui/GeometrySimpleWindow.tsx` — `handleParam` で `rangeMin`/`rangeMax` を渡す
5. `src/ui/panels/macro-knob/MacroKnobPanel.tsx` — `onKnobChange` で `assign.min`/`max` を渡す

---

## 確立した新ルール（Day52）

- **仮説を話してすぐに実装しない**: 設計の合意を得てから実装する
- **rangeMin/rangeMax は UI 専用**: engine 側の `defaultParams` には書かない
- **MidiCCEvent の未定義フィールドで変化幅を渡す**: `rangeMin?`/`rangeMax?` を追加

---

## 次回セッション開始時の確認コマンド

```bash
cd /Users/shinbigan/geography && pnpm tsc --noEmit && pnpm test --run
```

---

## 環境メモ（累積）

- **セッション開始時は全ファイルを読んでから分析**（Day51確立）
- **差分保持ルール**（Day50確立）
- **ブラウザ確認フロー**（Day47確立）: `pnpm dev` → `open http://localhost:5173`
- **localStorage は Preset 永続化のみ例外許可**（Day52確立）: `src/ui/CLAUDE.md` 参照
- **git タグは commit 後に打つこと**
- **tsc が反映ズレで失敗する場合**: 2回実行すると解消する

---

## 次回チャット用スタートプロンプト

```
Day53開始
```
