# GeoGraphy 引き継ぎメモ｜Day34（壁打ち + spec作成）｜2026-03-31

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
| **Shader Plugin spec（新設）** | **`docs/spec/shader-plugin.spec.md`** |
| 型定義 | `src/types/index.ts` |
| geoAPI 型定義 | `src/types/geoAPI.d.ts` |
| エンジン本体 | `src/core/engine.ts` |
| LayerManager | `src/core/layerManager.ts` |
| App.tsx | `src/ui/App.tsx` |
| Mixer Simple Window | `src/plugins/mixers/simple-mixer/MixerSimpleWindow.tsx` |
| FX Simple Window | `src/ui/FxSimpleWindow.tsx` |
| Macro Knob Simple Window | `src/ui/MacroKnobSimpleWindow.tsx` |
| PreferencesPanel | `src/ui/PreferencesPanel.tsx` |
| Electron メインプロセス | `electron/main.js` |
| Electron preload | `electron/preload.js` |
| Icosphere | `src/plugins/geometry/solid/icosphere/` |
| Torus | `src/plugins/geometry/solid/torus/` |
| Torusknot | `src/plugins/geometry/solid/torusknot/` |
| Hex Grid | `src/plugins/geometry/terrain/hex-grid/` |

---

## 今回のセッション（Day34）で完了したこと

### A. 別 AI との壁打ち内容を GeoGraphy アーキテクチャに照合・ブラッシュアップ

壁打ちの主要テーマ：
- Graffiti コンセプト（透明 Geometry + Shader が描画するアイデア）
- Shader Plugin の3つの設計案（GeometryPlugin一種 / FX一種 / 独立型）
- GeoGraffi ビジョン（位置情報 AR SNS）
- R3F・PLATEAU・WebXR の役割整理
- GeoGraphy の本質（VJツール / Three.js アセットライブラリ）

**決定事項：**
- Shader Plugin は**選択肢3（独立型・疎結合）**で確定
- 実装は**シーケンサー完成後**（`uProgress` の制御主体が必要なため）
- R3F は GeoGraffi（将来の別アプリ）で採用・GeoGraphy 本体はバニラ Three.js のまま

### B. `docs/spec/shader-plugin.spec.md` 新規作成

| セクション | 内容 |
|---|---|
| Purpose | 透明 Geometry + Shader のコアコンセプト・Graffiti ビジョン |
| Constraints | MUSTルール（疎結合・ライフサイクル・dispose等） |
| Interface | `ShaderPlugin` 型・`GeometryData` 型・`engine.getGeometryData()` API |
| Behavior | Effect Type（Fill/Outline/Detail）・標準 Uniforms・3-State シーケンス |
| ディレクトリ構成 | `src/plugins/shaders/` の構造 |
| Layer との関係 | Geometry → Shader → FX の順序 |
| Test Cases | 6つの検証条件 |
| 実装時の注意 | 変更が必要なファイル一覧 |
| **実装しない理由** | **シーケンサー待ちの根拠を明記** |

### C. CLAUDE.md の spec 一覧テーブルに shader-plugin.spec.md を追記

### D. Obsidian に GeoGraffi ビジョン保存

| ファイル | パス |
|---|---|
| GeoGraffi ビジョン | `/Users/shinbigan/GeoGraphy Vault/decisions/geograffi-vision.md` |
| GeoGraffi 要件定義書 draft v0.1 | `/Users/shinbigan/GeoGraphy Vault/decisions/geograffi-要件定義書_draft_v0.1.md` |

---

## 現在の状態

- **ブランチ**: `main`
- **タグ**: `day32`（Day34 は壁打ち+spec作成のみのため実装コミットなし）
- **テスト**: 104 tests グリーン・tsc エラーゼロ（Day34開始時に確認済み）
- **コードベースに変更なし**（Day34は設計作業のみ）

---

## Day34 壁打ちサマリー

### Shader Plugin アーキテクチャ（確定）

| 設計項目 | 決定内容 |
|---|---|
| 型 | `ShaderPlugin`（独立型・`PluginBase` 継承） |
| Geometry との接続 | `engine.getGeometryData(layerId)` 経由（疎結合） |
| 新設する型 | `GeometryData`（頂点・エッジ・面・type・boundingBox） |
| 標準 Uniforms | `uTime` / `uProgress` / `uEffectType` / `uColor` / `uSprayRadius` / `uLineWidth` / `uNoiseStrength` |
| Effect Type | 0=Fill / 1=Outline / 2=Detail |
| ライフサイクル | FX Plugin と同じ（Setup でインスタンス化・Play 中は enabled 切り替えのみ） |
| 実装タイミング | **シーケンサー完成後** |

### GeoGraffi（将来の別アプリ）確定

| 項目 | 内容 |
|---|---|
| 本質 | 位置情報 AR SNS（現実の都市をキャンバスに落書き） |
| GeoGraphy との関係 | アセット（Geometry/Shader/SceneState）をそのまま import |
| 技術スタック | R3F + WebXR + PLATEAU + GPS |
| 着手タイミング | スマートグラス市場に「決定打」が出たら |
| ドキュメント | Obsidian の `decisions/` に保存済み |

### 3層構造の整理

```
層3: GeoGraffi        ← 将来の別アプリ（AR SNS・R3F・PLATEAU）
層2: Shader Plugin    ← 次の設計ターゲット（シーケンサー後に実装）
層1: GeoGraphy core  ← 今開発中・104 tests green
```

---

## 発生した問題と解決策

なし（Day34 は設計・ドキュメント作業のみ）

---

## 次回やること（Day35）

| 優先度 | 作業 |
|---|---|
| ★★★ | 録画機能の動作確認（`pnpm dev:electron` → ⌘R → ⌘⇧R → WebM 保存） |
| ★★★ | Phase 13 の壁打ち（次に実装する UI はどれか） |
| ★★ | ビジネスモデル定義を `docs/` に残す（Lite/Pro・Plugin SDK モデル） |
| ★★ | LICENSE ファイル追加（OSS 公開直前でよい・急がない） |

**Phase 13 候補（壁打ちで決める）：**
- Layer Simple Window
- Geometry Simple Window
- Orbit カメラ UI（Icosphere/Torus/Torusknot 向け）
- シーケンサー設計（Shader Plugin の前提）

---

## 次回セッション開始時の確認コマンド

```bash
cd /Users/shinbigan/geography && pnpm tsc --noEmit && pnpm test --run
```

---

## 環境メモ

- **ファイル更新鉄則**: 既存ファイルの更新は `filesystem:edit_file` を使う・`write_file` は新規作成のみ
- **preserveDrawingBuffer: true**（Day31確立）: `drawImage` で WebGL canvas を読み取るには必須
- **録画**（Day32確立）: `startRecording()` / `stopRecording()` は `engine.ts` に実装済み・IPC は `save-recording`
- **Geometry 自動登録**: `import.meta.glob` で `solid/` 配下も自動スキャン済み・手動登録不要
- **Shader Plugin**（Day34確立）: 独立型（選択肢3）・`GeometryData` 経由・実装はシーケンサー後
- **GeoGraffi**（Day34確立）: 将来の別アプリ・スマートグラス決定打待ち・Obsidian に保存済み
- **CLAUDE.md の読み方**: ルート → 作業対象モジュール → spec の順で読む
- **今後 `dist-electron/` は絶対にコミットしない**（`.gitignore` 済み）
- **git push の前に必ず `git status` で staged を確認してから `git tag` を打つこと**

---

## 次回チャット用スタートプロンプト

```
GeoGraphy Day35を開始します。
まず HANDOVER.md を読んでください（/Users/shinbigan/geography/HANDOVER.md）

その後、以下の手順で進めてください：
1. 下記コマンドの結果を貼り付けます
   cd /Users/shinbigan/geography && pnpm tsc --noEmit && pnpm test --run
2. HANDOVER.md の「次回やること（Day35）」を読んで作業を開始してください

開発スタイル：SDD × CDD
- 始業時は HANDOVER.md → ルート CLAUDE.md → 作業対象モジュールの CLAUDE.md → spec の順で読むこと
- ファイル更新は filesystem:edit_file を使うこと（write_file は新規作成のみ）
- 完了条件は pnpm tsc --noEmit（型エラーゼロ）+ pnpm test --run（全テストグリーン）両方通過
- プランを提示・承認を得てから実装を開始すること
```
