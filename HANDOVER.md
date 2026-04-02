# GeoGraphy 引き継ぎメモ｜Day37（MIDI 2.0 型システム・ModulatablePlugin・全CLAUDE.md検証）｜2026-04-02

## プロジェクト概要
- **アプリ名**: GeoGraphy（Geometry×地形×Graph のダブルミーニング）
- **目的**: No-Texture・Plugin駆動・マルチライブラリ対応の映像制作プラットフォーム
- **スタック**: Vite / React 18 / TypeScript / Three.js r160+ / pnpm v10.32+ / Electron 41
- **開発スタイル**: SDD × CDD（仕様駆動 × コンパイラ駆動）
- **GitHub**: https://github.com/Pdoomer2026/geography
- **開発サーバー（ブラウザ）**: `pnpm dev`（ポート5173）
- **開発サーバー（Electron）**: `pnpm dev:electron`
- **プロジェクトルート**: `/Users/shinbigan/geography`

---

## 重要ファイルパス

| ファイル | パス |
|---|---|
| 要件定義書（最新） | `docs/要件定義書_v2.0.md` |
| 実装計画書（最新） | `docs/実装計画書_v3.2.md` |
| CLAUDE.md（全体方針） | `CLAUDE.md`（v10） |
| 引き継ぎメモ（最新） | `HANDOVER.md` |
| MacroKnob spec（Day37更新済み） | `docs/spec/macro-knob.spec.md` |
| CC Standard spec | `docs/spec/cc-standard.spec.md` |
| 型定義（Day37更新済み） | `src/types/index.ts` |
| MacroKnob コア（Day37更新済み） | `src/core/macroKnob.ts` |
| エンジン本体（Day37更新済み） | `src/core/engine.ts` |
| LayerManager | `src/core/layerManager.ts` |
| App.tsx | `src/ui/App.tsx` |
| MacroKnob UI（要リネーム） | `src/ui/MacroKnobSimpleWindow.tsx` → `src/ui/panels/macro-knob/MacroKnobPanel.tsx` |
| PreferencesPanel（要移動） | `src/ui/PreferencesPanel.tsx` → `src/ui/panels/preferences/PreferencesPanel.tsx` |
| Electron メインプロセス | `electron/main.js` |
| Electron preload | `electron/preload.js` |

---

## 現在の状態

- **ブランチ**: `main`
- **タグ**: `day37`（commit: `fc66c9d`）
- **テスト**: 104 tests グリーン・tsc エラーゼロ（Day37終了時確認済み）
- **変更ファイル数**: 9ファイル（spec・型定義・実装・全CLAUDE.md）

---

## Day37 で確定したアーキテクチャ決定事項

### A. Plugin 二分類（最重要・Day37確立）

```
ModulatablePlugin（MIDI 2.0 / MacroKnob 制御可能）
  extends PluginBase + params: Record<string, PluginParam>
  ├── GeometryPlugin   → radius, speed, hue 等を CC Standard 経由で制御
  ├── FXPlugin         → strength, amount 等を CC Standard 経由で制御
  ├── ParticlePlugin   → size, count, speed 等を CC Standard 経由で制御
  ├── LightPlugin      → 同上
  └── SequencerPlugin  → 新設予定・Sequencer 自身も制御される側

PluginBase のみ（外部制御不要）
  ├── TransitionPlugin → execute() 純粋関数・選択のみ
  ├── WindowPlugin     → UI コンポーネントのみ
  └── MixerPlugin      → 現在独自定義（TODO: v2〜 CC706 対応時に検討）
```

**Plugin 自体は MIDI を受信しない。制御経路は以下のみ：**
```
MIDI 2.0 / 1.0 → main.js → IPC 'geo:midi-cc' → MacroKnob → ParameterStore → Plugin.params.value
```

### B. MidiCCEvent 型（Day37新設）

```typescript
interface MidiCCEvent {
  cc: number           // MIDI 1.0: 0〜127 / MIDI 2.0 AC: 0〜32767
  value: number        // 正規化済み 0.0〜1.0（main.js 側で正規化）
  protocol: 'midi1' | 'midi2'
  resolution: 128 | 4294967296
}
```

IPC チャンネル: `'geo:midi-cc'`（MIDI 1.0/2.0 共通）

### C. rangeMap / normalize の使い分け（Day37確立）

```typescript
// normalize(midi, min, max) ← 既存・Phase 14 で rangeMap に統一予定
// テスト TC-2〜TC-4 はこちらを参照（そのまま有効）

// rangeMap(v, min, max) ← Day37新設・0.0〜1.0 → min/max に変換
// handleMidiCC・receiveModulation 内部で使用
const rangeMap = (v: number, min: number, max: number) => min + v * (max - min)
```

### D. MacroAssign.defaultCC（Day37新設）

```typescript
interface MacroAssign {
  paramId: string
  min: number
  max: number
  curve: CurveType
  defaultCC?: number  // CC Standard v0.1 の CC番号（例: CC101, CC300）
}
```

### E. MacroKnobManager 新シグネチャ（Day37確立）

```typescript
interface MacroKnobManager {
  handleMidiCC(event: MidiCCEvent): void      // 旧: (cc, value) → 新: (event)
  receiveModulation(knobId: string, value: number): void  // 新設
  getKnobs(): MacroKnobConfig[]
  setKnob(id: string, config: MacroKnobConfig): void
  getValue(knobId: string): number
}
```

### F. MacroKnobConfig.midiCC の3状態（Day37確立）

```typescript
midiCC: number
// 0〜127    = MIDI 1.0 CC番号
// 0〜32767  = MIDI 2.0 AC番号
// -1        = 未割り当て
```

---

## Day37 で更新したファイル一覧

| ファイル | 変更内容 |
|---|---|
| `docs/spec/macro-knob.spec.md` | CC Standard 統合・MidiCCEvent・rangeMap・MIDI 2.0 IPC フロー・共存ルール |
| `src/types/index.ts` | ModulatablePlugin 追加・MidiCCEvent 追加・MacroAssign.defaultCC 追加・GeometryPlugin/FXPlugin の extends 変更・MacroKnobManager 新シグネチャ・receiveModulation 追加 |
| `src/core/macroKnob.ts` | handleMidiCC(event: MidiCCEvent) に変更・receiveModulation() 実装・rangeMap() 追加・currentValues を 0〜1 キャッシュに変更 |
| `src/core/engine.ts` | handleMidiCC ラッパーを新シグネチャに更新・MidiCCEvent を import に追加 |
| `src/plugins/fx/CLAUDE.md` | Interface を ModulatablePlugin に更新・Plugin 二分類表追加・enabled の挙動（instantiate/destroy）を明記 |
| `src/plugins/geometry/CLAUDE.md` | Interface を ModulatablePlugin に更新・Plugin 二分類表追加・Macro Knobs を CC Standard（defaultCC）に更新 |
| `src/core/CLAUDE.md` | MacroKnobManager フロー図を新シグネチャに更新 |
| `src/plugins/mixers/CLAUDE.md` | MixerPlugin の独自定義理由と TODO（v2〜 CC706）を明記 |
| `src/ui/CLAUDE.md` | レイアウトコメントに Phase 13 注記追加 |

---

## 発生した問題と解決策

- **tsc 1回目失敗**（engine.ts:139）: edit_file の反映タイミングのズレ。2回目で解消。
  → `pnpm tsc --noEmit` を2回実行して確認するのが安全。
- **旧シグネチャが engine.ts に残存**: `handleMidiCC(cc, value)` ラッパーが残っていた。
  → `MidiCCEvent` を import に追加して同時に修正。

---

## Day37 で議論・確認した設計概念

### Plugin と MIDI 2.0 の関係
- Plugin 自体は MIDI を受信しない（直接通信なし）
- `params` を持つ Plugin（ModulatablePlugin）が MIDI 2.0 制御の対象
- `params` を持たない Plugin（Transition・Window）は対象外
- これが「疎結合」の本質

### CC Standard と JSON の役割
- CC Standard（番号体系）: CC101 = "Primary Amount" という共通語彙
- JSON（Scene State）: AI や外部ツールが CC番号でシーンを記述できる
- Plugin 独自パラメーター名（strength, radius 等）は変わらない
- MacroKnob が CC番号 → paramId の変換を担う

---

## 次回やること（Day38）

| 優先度 | 作業 |
|---|---|
| ★★★ | `src/ui/panels/` ディレクトリ新設 |
| ★★★ | `src/ui/panels/CLAUDE.md` 新規作成（Panel 共通ルール） |
| ★★★ | `src/ui/panels/preferences/CLAUDE.md` 新規作成 |
| ★★★ | `src/ui/panels/macro-knob/CLAUDE.md` 新規作成（MIDI 2.0 設計含む・最重要） |
| ★★★ | Phase 13 実装（PreferencesPanel 移動・MacroKnobSimpleWindow → MacroKnobPanel リネーム・App.tsx import 更新） |
| ★★ | Glitch Plugin 未公開パラメーター公開（`amount`, `distortion_x`, `distortion_y`） |
| ★★ | Feedback Plugin `scale` / `rotation` 拡張実装 |
| ★★ | FilmPass Plugin 新規実装 |
| ★★ | FreiChenShader Plugin 新規実装 |
| ★★ | `docs/spec/sequencer.spec.md` 新設（MacroKnob 経由設計で執筆） |

**Phase 13 実装順序：**
```
1. CLAUDE.md / spec を読む（macro-knob.spec.md・ui/CLAUDE.md）
2. src/ui/panels/ ディレクトリ新設（write_file で各 CLAUDE.md を新規作成）
3. PreferencesPanel.tsx を src/ui/panels/preferences/ へ移動
4. MacroKnobSimpleWindow.tsx → src/ui/panels/macro-knob/MacroKnobPanel.tsx へリネーム＋移動
5. App.tsx の import を全て更新
6. pnpm tsc --noEmit → 型エラーゼロ確認
7. pnpm test --run → 104 tests グリーン確認
8. git commit + tag day38
```

---

## 次回セッション開始時の確認コマンド

```bash
cd /Users/shinbigan/geography && pnpm tsc --noEmit && pnpm test --run
```

---

## 環境メモ（累積）

- **ファイル更新鉄則**: 既存ファイルの更新は `filesystem:edit_file` を使う・`write_file` は新規作成のみ
- **ModulatablePlugin**（Day37確立）: params を持つ Plugin の中間層・Geometry/FX/Particle/Light/Sequencer が対象
- **MidiCCEvent**（Day37確立）: MIDI 1.0/2.0 共通フォーマット・value は main.js で 0〜1 正規化済み
- **rangeMap(v, min, max)**（Day37確立）: 0〜1 → min/max 変換・normalize は Phase 14 で統一予定
- **IPC チャンネル 'geo:midi-cc'**（Day37確立）: MIDI 1.0/2.0 どちらもこのチャンネルで受け取る
- **currentValues キャッシュ**（Day37確立）: 0〜127 ではなく 0〜1 で保持・getValue() の除算不要
- **preserveDrawingBuffer: true**（Day31確立）: `drawImage` で WebGL canvas を読み取るには必須
- **録画**（Day32確立）: `startRecording()` / `stopRecording()` は `engine.ts` に実装済み・IPC は `save-recording`
- **Geometry 自動登録**: `import.meta.glob` で `solid/` 配下も自動スキャン済み・手動登録不要
- **Shader Plugin**（Day34確立）: 独立型・`GeometryData` 経由・実装はシーケンサー後
- **MacroKnob = コア固定**（Day35確立）: Plugin 化しない・Panel として分離
- **Sequencer → MacroKnob 経由**（Day35確立）: Sequencer は macroKnobId に値を送るだけ
- **CC Standard v0.1**（Day36確立）: Block 1xx〜9xx 体系・`docs/spec/cc-standard.spec.md`
- **write_file禁止**: エンコードエラーが出ても `write_file` 逃げは禁止。`read_text_file` → `edit_file` のみ
- **CLAUDE.md の読み方**: ルート → 作業対象モジュール → spec の順で読む
- **今後 `dist-electron/` は絶対にコミットしない**（`.gitignore` 済み）
- **git タグは commit 後に打つこと**（タグ先打ちは orphaned tag になる）
- **zsh でインラインコメント（`#`）はエラーになる**: コメント行とコマンド行は必ず分けて渡す
- **tsc が反映ズレで失敗する場合**: 2回実行すると解消する

---

## 次回チャット用スタートプロンプト

```
GeoGraphy Day38を開始します。
引き継ぎスキル

その後、以下の手順で進めてください：
1. 下記コマンドの結果を貼り付けます
   cd /Users/shinbigan/geography && pnpm tsc --noEmit && pnpm test --run
2. HANDOVER.md の「次回やること（Day38）」を読んで作業を開始してください

開発スタイル：SDD × CDD
- 始業時は HANDOVER.md → 各モジュールの CLAUDE.md / docs/spec/[機能].spec.md を確認 → 更新か継続か判定 → 必要箇所だけ更新してから実装
- ファイル更新は filesystem:edit_file を使うこと（write_file は新規作成のみ）
- 完了条件は pnpm tsc --noEmit（型エラーゼロ）+ pnpm test --run（全テストグリーン）両方通過
- プランを提示・承認を得てから実装を開始すること
```
