# GeoGraphy 引き継ぎメモ｜Day35｜2026-03-31

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
| Shader Plugin spec | `docs/spec/shader-plugin.spec.md` |
| MacroKnob spec（更新済み） | `docs/spec/macro-knob.spec.md` |
| Simple Window spec（更新済み） | `docs/spec/simple-window.spec.md` |
| Agent Roles spec（更新済み） | `docs/spec/agent-roles.md` |
| 型定義 | `src/types/index.ts` |
| geoAPI 型定義 | `src/types/geoAPI.d.ts` |
| エンジン本体 | `src/core/engine.ts` |
| MacroKnob コア | `src/core/macroKnob.ts` |
| LayerManager | `src/core/layerManager.ts` |
| App.tsx | `src/ui/App.tsx` |
| ui CLAUDE.md（更新済み） | `src/ui/CLAUDE.md` |
| Mixer Simple Window | `src/plugins/mixers/simple-mixer/MixerSimpleWindow.tsx` |
| FX Simple Window | `src/ui/FxSimpleWindow.tsx` |
| MacroKnob UI（要リネーム） | `src/ui/MacroKnobSimpleWindow.tsx` → `src/ui/panels/macro-knob/MacroKnobPanel.tsx` |
| PreferencesPanel（要移動） | `src/ui/PreferencesPanel.tsx` → `src/ui/panels/preferences/PreferencesPanel.tsx` |
| Electron メインプロセス | `electron/main.js` |
| Electron preload | `electron/preload.js` |

---

## 今回のセッション（Day35）で完了したこと

### A. 壁打ち：シーケンサー・MacroKnob・MIDI 2.0 アーキテクチャ設計確定
- シーケンサーの本質「1小節のキャンバスに Shape を描く」確定
- MacroKnob = コア固定（Plugin 化しない）・全入力源のルーター
- MIDI 2.0 = `electron/main.js` 経由（IPC）確定
- Sequencer → MacroKnob ID 経由の疎結合設計確定
- CC番号 Rosetta Stone 初期定義（CC 20〜24）
- `src/plugins/sequencers/` ディレクトリ新設確定
- `src/ui/panels/` Panel 体系新設確定
- `MacroKnobSimpleWindow` → `MacroKnobPanel` にリネーム確定

### B. 要件定義書 v2.0 制作
- `docs/要件定義書_v2.0.md` 新規作成（Day35壁打ち全反映）
- `要件定義書_v2.0.docx` 制作・ダウンロード済み

### C. 実装計画書 v3.2 制作
- `docs/実装計画書_v3.2.md` 新規作成
- Phase 12（録画）完了済みに更新
- Phase 13〜16 新規追加（Panel 体系 → MacroKnob Panel → Sequencer → Shader）
- 開発サイクル Step 0 を「各モジュールの CLAUDE.md / docs/spec/[機能].spec.md を確認」に修正
- `実装計画書_v3.2.docx` 制作・ダウンロード済み

### D. CLAUDE.md / spec 4ファイル更新
- `docs/spec/simple-window.spec.md`: MacroKnob を Panel 側へ移動・Panel 一覧新設
- `docs/spec/macro-knob.spec.md`: MIDI 2.0・Sequencer 連携・CC Rosetta Stone 追加
- `src/ui/CLAUDE.md`: Panel 命名原則・panels/ ディレクトリ構成追加
- `docs/spec/agent-roles.md`: Mixer Agent パス修正・Sequencer Agent 新設

### E. Obsidian に2文書保存
- `macroknob-midi-architecture-day35.md`
- `sequencer-architecture-day35.md`

---

## 現在の状態

- **ブランチ**: `main`
- **タグ**: `day35`（push 済み）
- **テスト**: 104 tests グリーン・tsc エラーゼロ
- **コードベース変更**: なし（Day35 は設計・ドキュメント作業のみ）

---

## 発生した問題と解決策

- `filesystem:edit_file` で絵文字を含む行がマッチしないケースあり → `write_file` で全書き換えで対応
- `docs/実装計画書_v3.2.md` の最初の write が途中で途切れた → 再度 write_file で完全版を書き込み

---

## 次回やること（Day36）

| 優先度 | 作業 |
|---|---|
| ★★★ | `src/ui/panels/` ディレクトリ新設・`PreferencesPanel.tsx` 移動・`MacroKnobSimpleWindow.tsx` → `MacroKnobPanel.tsx` リネーム（Phase 13） |
| ★★★ | `src/ui/panels/CLAUDE.md` 新規作成（Panel 共通ルール） |
| ★★★ | `src/ui/panels/preferences/CLAUDE.md` 新規作成 |
| ★★★ | `src/ui/panels/macro-knob/CLAUDE.md` 新規作成（最重要・MIDI 2.0 設計含む） |
| ★★★ | `docs/spec/simple-window.spec.md` の CLAUDE.md 更新（実装後に照合） |
| ★★ | `docs/spec/cc-standard.spec.md` 新設（全 Plugin params 比較・CC Rosetta Stone 確定） |
| ★★ | `docs/spec/macro-knob.spec.md` 更新（Phase 13 実装後に照合） |
| ★ | 録画機能の動作確認（`pnpm dev:electron` → ⌘R → ⌘⇧R → WebM 保存） |

**Phase 13 実装順序：**
```
1. spec ファイル確認（simple-window.spec.md・macro-knob.spec.md）
2. src/ui/panels/ ディレクトリ新設
3. PreferencesPanel.tsx 移動
4. MacroKnobSimpleWindow.tsx → MacroKnobPanel.tsx リネーム＋移動
5. App.tsx の import を全て更新
6. 各 CLAUDE.md 新規作成
7. pnpm tsc --noEmit → 型エラーゼロ確認
8. pnpm test --run → 104 tests グリーン確認
9. git commit + tag day36
```

---

## 環境メモ（累積）

- **ファイル更新鉄則**: 既存ファイルの更新は `filesystem:edit_file` を使う・`write_file` は新規作成のみ（ただし絵文字マッチ問題が出たら `write_file` で対応）
- **開発サイクル Step 0**（Day35確立）: 各モジュールの CLAUDE.md / docs/spec/[機能].spec.md を確認→更新か継続か判定→必要箇所だけ更新してから実装へ
- **preserveDrawingBuffer: true**（Day31確立）: `drawImage` で WebGL canvas を読み取るには必須
- **録画**（Day32確立）: `startRecording()` / `stopRecording()` は `engine.ts` に実装済み・IPC は `save-recording`
- **Geometry 自動登録**: `import.meta.glob` で `solid/` 配下も自動スキャン済み・手動登録不要
- **Shader Plugin**（Day34確立）: 独立型（選択肢3）・`GeometryData` 経由・実装はシーケンサー後
- **MacroKnob = コア固定**（Day35確立）: Plugin 化しない・Panel として分離・コントリビューター触れない
- **MIDI 2.0 = main.js 経由**（Day35確立）: IPC でレンダラーへ・CC 32,768個・32bit 解像度
- **Sequencer → MacroKnob 経由**（Day35確立）: Sequencer は macroKnobId に値を送るだけ・paramId を直接知らない
- **CC Rosetta Stone**（Day35確立）: CC20〜24 を全 Plugin 共通定義・詳細は比較後に cc-standard.spec.md に確定
- **CLAUDE.md の読み方**: ルート → 作業対象モジュール → spec の順で読む
- **今後 `dist-electron/` は絶対にコミットしない**（`.gitignore` 済み）
- **zsh でインラインコメント（`#`）はエラーになる**: コメント行とコマンド行は必ず分けて渡す

---

## 次回セッション開始時の確認コマンド

```bash
cd /Users/shinbigan/geography && pnpm tsc --noEmit && pnpm test --run
```

---

## 次回チャット用スタートプロンプト

```
GeoGraphy Day36を開始します。
まず HANDOVER.md を読んでください（/Users/shinbigan/geography/HANDOVER.md）

その後、以下の手順で進めてください：
1. 下記コマンドの結果を貼り付けます
   cd /Users/shinbigan/geography && pnpm tsc --noEmit && pnpm test --run
2. HANDOVER.md の「次回やること（Day36）」を読んで作業を開始してください

開発スタイル：SDD × CDD
- 始業時は HANDOVER.md → 各モジュールの CLAUDE.md / docs/spec/[機能].spec.md を確認→更新か継続か判定→必要箇所だけ更新してから実装
- ファイル更新は filesystem:edit_file を使うこと（write_file は新規作成のみ）
- 完了条件は pnpm tsc --noEmit（型エラーゼロ）+ pnpm test --run（全テストグリーン）両方通過
- プランを提示・承認を得てから実装を開始すること
```
