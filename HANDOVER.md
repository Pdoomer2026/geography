# GeoGraphy 引き継ぎメモ｜Day36（CC Standard・FXパラメーター対照表・映像設計提案書）｜2026-04-02

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
| 要件定義書（最新） | `docs/要件定義書_v1.9.md` |
| 実装計画書（最新） | `docs/実装計画書_v3.1.md` |
| CLAUDE.md（全体方針） | `CLAUDE.md`（v10） |
| 引き継ぎメモ（最新） | `HANDOVER.md` |
| Shader Plugin spec | `docs/spec/shader-plugin.spec.md` |
| MacroKnob spec（更新済み） | `docs/spec/macro-knob.spec.md` |
| Simple Window spec（更新済み） | `docs/spec/simple-window.spec.md` |
| Agent Roles spec（更新済み） | `docs/spec/agent-roles.md` |
| 要件定義書（最新） | `docs/要件定義書_v2.0.md` |
| 実装計画書（最新） | `docs/実装計画書_v3.2.md` |
| 型定義 | `src/types/index.ts` |
| geoAPI 型定義 | `src/types/geoAPI.d.ts` |
| エンジン本体 | `src/core/engine.ts` |
| LayerManager | `src/core/layerManager.ts` |
| App.tsx | `src/ui/App.tsx` |
| Mixer Simple Window | `src/plugins/mixers/simple-mixer/MixerSimpleWindow.tsx` |
| FX Simple Window | `src/ui/FxSimpleWindow.tsx` |
| MacroKnob（コア） | `src/core/macroKnob.ts` |
| MacroKnob UI（要リネーム） | `src/ui/MacroKnobSimpleWindow.tsx` → `src/ui/panels/macro-knob/MacroKnobPanel.tsx` |
| PreferencesPanel（要移動） | `src/ui/PreferencesPanel.tsx` → `src/ui/panels/preferences/PreferencesPanel.tsx` |
| Electron メインプロセス | `electron/main.js` |
| Electron preload | `electron/preload.js` |

---

## 現在の状態

- **ブランチ**: `main`
- **タグ**: `day34`（Day36 はドキュメント・spec 作業のみ・実装コミットなし）
- **テスト**: 104 tests グリーン・tsc エラーゼロ（Day35開始時確認済み・Day36でコード変更なし）
- **コードベースに変更なし**（Day36 は設計・spec 作業のみ）

---

## Day35 で確定したアーキテクチャ決定事項

### A. シーケンサー設計（Sequencer Plugin）

| 設計項目 | 決定内容 |
|---|---|
| 位置づけ | **Plugin**（コントリビューター開発可能） |
| ディレクトリ | `src/plugins/sequencers/simple-sequencer/` |
| 接続先 | **MacroKnob ID に値を送るだけ**（Plugin.params を直接知らない・疎結合） |
| 本質 | 「1小節のキャンバスに Shape（波形）を描く」・BPM グリッド同期 |
| ステップ数 | 1〜32 可変（タイムライン幅固定・仕切り線のみ変化） |
| ループ長 | 64拍固定（16小節×4拍）・Ableton Link 同期 |
| 操作系 | ドラッグ＆ドロップ（デザインモード）＋ライブクリック（ライブモード） |
| v1 波形 | hold / linear / sine / saw / saw-down / square |
| v2 波形 | random / custom（ベジェ編集） |
| 実装タイミング | **MacroKnob Panel 完成後** |
| 参照モデル | Massive Stepper/Performer・ShaperBox 3 |

### B. MacroKnob / MIDI アーキテクチャ（コア固定）

| 設計項目 | 決定内容 |
|---|---|
| 位置づけ | **コア固定**（Plugin 化しない・コントリビューター触れない） |
| 役割 | 全入力源（MIDI/Sequencer/LFO）のルーター兼、値の正規化レイヤー |
| 命名変更 | `MacroKnobSimpleWindow` → **`MacroKnobPanel`**（Window ではなく Panel） |
| 移動先 | `src/ui/panels/macro-knob/MacroKnobPanel.tsx`（新設ディレクトリ） |
| MIDI 受信 | **MIDI 2.0 を `electron/main.js` 経由（IPC）で処理** |
| MIDI 2.0 メリット | CC番号 32,768個・32bit 解像度・双方向・Property Exchange（JSON自動認識） |

### C. Panel ディレクトリの新設（確定）

```
src/ui/panels/                   ← 【新設】
├── CLAUDE.md                    ← Panel 共通ルール
├── preferences/
│   ├── CLAUDE.md                ← Preferences 固有（新設）
│   └── PreferencesPanel.tsx     ← 移動
└── macro-knob/
    ├── CLAUDE.md                ← MacroKnob + MIDI 2.0 固有（新設・最重要）
    └── MacroKnobPanel.tsx       ← リネーム＋移動
```

### D. CC番号 Rosetta Stone（The Standard）

全 Plugin がデフォルトで準拠する共通 CC 定義。シーケンサー「使い回し」の基盤。

| CC番号 | 抽象概念 | Geometry 例 | FX 例 | Shader 例 |
|---|---|---|---|---|
| CC 20 | Primary Amount | Size / Radius | Mix (Dry/Wet) | Emission |
| CC 21 | Density / Detail | Segments | Grain Size | Tiling |
| CC 22 | Deformation | Twist / Noise | Glitch | Displacement |
| CC 23 | Sharpness / Width | Stroke / InnerRadius | Contrast | Fresnel |
| CC 24 | Temporal Speed | Rotation Speed | Feedback Rate | UV Flow |

**CC定義は気長に・全 Plugin の params を比較しながら定義する。**
確定したら `docs/spec/cc-standard.spec.md` に書く（GeoGraphy の「憲法」）。

### E. ディレクトリ全体（確定版）

```
src/plugins/
├── geometry/       ← 既存
├── particles/      ← 既存
├── fx/             ← 既存
├── lights/         ← 既存
├── mixers/         ← 既存（現状維持）
├── transitions/    ← 既存（UI なし・現状維持）
├── sequencers/     ← 【新設】Sequencer Plugin（固有スキーマ・固有 CLAUDE.md）
└── windows/        ← 将来の外部コントリビューター向け（空・v2〜）
```

### F. 命名原則の更新

| 名称 | 定義 | 例 |
|---|---|---|
| **Window** | Plugin エコシステムの UI | `MixerSimpleWindow` / `SequencerWindow` |
| **Panel** | アプリ固定・コントリビューターが触れない | `PreferencesPanel` / `MacroKnobPanel` |
| **Simple Window** | Plugin 付属のデフォルト最小 UI | `FxSimpleWindow` |

---

## Day35 Obsidian 保存ファイル

| ファイル | パス |
|---|---|
| MacroKnob / MIDI 設計まとめ | `/Users/shinbigan/GeoGraphy Vault/decisions/macroknob-midi-architecture-day35.md` |
| Sequencer 設計まとめ | `/Users/shinbigan/GeoGraphy Vault/decisions/sequencer-architecture-day35.md` |

---

## 発生した問題と解決策

- **Day36 重大ミス**：`fx-parameter-reference.md` を `write_file` で上書き → 元ファイル消滅（復元済み）
  → 原因：`read_text_file` で読まずに `edit_file` しようとしたときのエンコードエラーを口実に `write_file` を使用
  → 正しい対処：エラーが出ても `read_text_file` → `edit_file` のみ。`write_file` 逃げは絶対禁止
  → CLAUDE.md にルール強化を記録済み

---

## 次回やること（Day37）

| 優先度 | 作業 |
|---|---|
| ★★★ | `docs/spec/macro-knob.spec.md` 更新（CC Standard 統合・MIDI Learn・MIDI 2.0 IPC 設計） |
| ★★★ | `src/ui/panels/` 新設・`PreferencesPanel.tsx` 移動・`MacroKnobSimpleWindow.tsx` → `MacroKnobPanel.tsx` リネーム（Phase 13） |
| ★★★ | `src/ui/panels/CLAUDE.md` 新規作成（Panel 共通ルール） |
| ★★★ | `src/ui/panels/preferences/CLAUDE.md` 新規作成 |
| ★★★ | `src/ui/panels/macro-knob/CLAUDE.md` 新規作成（最重要・MIDI 2.0 設計含む） |
| ★★ | Glitch Plugin 未公開パラメーター公開（`amount`, `distortion_x`, `distortion_y`） |
| ★★ | Feedback Plugin `scale` / `rotation` 拡張実装 |
| ★★ | FilmPass Plugin 新規実装 |
| ★★ | FreiChenShader Plugin 新規実装 |
| ★★ | `docs/spec/sequencer.spec.md` 新設（MacroKnob 経由設計で執筆） |
| ★ | 録画機能の動作確認（`pnpm dev:electron` → ⌘R → ⌘⇧R → WebM 保存） |

**Phase 13 実装順序：**
```
1. 各モジュールの CLAUDE.md / docs/spec/[feature].spec.md を確認
2. src/ui/panels/ ディレクトリ新設
3. PreferencesPanel.tsx 移動
4. MacroKnobSimpleWindow.tsx → MacroKnobPanel.tsx リネーム+移動
5. App.tsx の import を全て更新
6. 各 CLAUDE.md 新規作成
7. pnpm tsc --noEmit → 型エラーゼロ確認
8. pnpm test --run → 104 tests グリーン確認
9. git commit + tag day37
```

---

## 次回セッション開始時の確認コマンド

```bash
cd /Users/shinbigan/geography && pnpm tsc --noEmit && pnpm test --run
```

---

## 環境メモ（累積）

- **ファイル更新鉄則**: 既存ファイルの更新は `filesystem:edit_file` を使う・`write_file` は新規作成のみ
- **preserveDrawingBuffer: true**（Day31確立）: `drawImage` で WebGL canvas を読み取るには必須
- **録画**（Day32確立）: `startRecording()` / `stopRecording()` は `engine.ts` に実装済み・IPC は `save-recording`
- **Geometry 自動登録**: `import.meta.glob` で `solid/` 配下も自動スキャン済み・手動登録不要
- **Shader Plugin**（Day34確立）: 独立型（選択肢3）・`GeometryData` 経由・実装はシーケンサー後
- **GeoGraffi**（Day34確立）: 将来の別アプリ・スマートグラス決定打待ち・Obsidian に保存済み
- **MacroKnob = コア固定**（Day35確立）: Plugin 化しない・Panel として分離・コントリビューター触れない
- **MIDI 2.0 = main.js 経由**（Day35確立）: IPC でレンダラーへ・CC 32,768個・32bit 解像度
- **Sequencer → MacroKnob 経由**（Day35確立）: Sequencer は macroKnobId に値を送るだけ・paramId を直接知らない
- **CC Standard v0.1**（Day36確立）: Block 1xx〜9xx 体系・全Plugin横断マッピング表・AI自然言語インターフェース設計完了・`docs/spec/cc-standard.spec.md`
- **FX未公開パラメーター対照表**（Day36確立）: `docs/spec/fx-parameter-reference.md` に全整理・Glitch が最も未開拓
- **映像設計提案書**（Day36確立）: `docs/spec/fx-visual-design-proposals.md` に映像スタイル5パターン・Sequencer制御提案
- **write_file禁止強化**（Day36確立）: エンコードエラーが出ても `write_file` 逃げは禁止。`read_text_file` → `edit_file` のみ
- **CLAUDE.md の読み方**: ルート → 作業対象モジュール → spec の順で読む
- **今後 `dist-electron/` は絶対にコミットしない**（`.gitignore` 済み）
- **git push の前に必ず `git status` で staged を確認してから `git tag` を打つこと**
- **zsh でインラインコメント（`#`）はエラーになる**: コメント行とコマンド行は必ず分けて渡す

---

## 次回チャット用スタートプロンプト

```
GeoGraphy Day37を開始します。
まず HANDOVER.md を読んでください（/Users/shinbigan/geography/HANDOVER.md）

その後、以下の手順で進めてください：
1. 下記コマンドの結果を貼り付けます
   cd /Users/shinbigan/geography && pnpm tsc --noEmit && pnpm test --run
2. HANDOVER.md の「次回やること（Day37）」を読んで作業を開始してください

開発スタイル：SDD × CDD
- 始業時は HANDOVER.md → 各モジュールの CLAUDE.md / docs/spec/[機能].spec.md を確認 → 更新か継続か判定 → 必要箇所だけ更新してから実装
- ファイル更新は filesystem:edit_file を使うこと（write_file は新規作成のみ）
- 完了条件は pnpm tsc --noEmit（型エラーゼロ）+ pnpm test --run（全テストグリーン）両方通過
- プランを提示・承認を得てから実装を開始すること
```
