# GeoGraphy 引き継ぎメモ｜Day33（壁打ちのみ）｜2026-03-31

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
| 要件定義書（最新） | `docs/要件定義書_v1.9.md` |
| 実装計画書（最新） | `docs/実装計画書_v3.1.md` |
| CLAUDE.md（全体方針） | `CLAUDE.md`（v10） |
| 引き継ぎメモ（前回） | `HANDOVER.md`（Day32完了時点） |
| エンジン本体 | `src/core/engine.ts` |
| geoAPI 型定義 | `src/types/geoAPI.d.ts` |
| Shader Plugin spec | `docs/spec/shader-plugin.spec.md`（**未作成・次回以降**） |

---

## 今回のセッション（Day33）で完了したこと

### 実装作業
- なし（本日は壁打ちのみ）
- tsc・テスト確認も未実施（帰宅前に外出のため）

### 壁打ち1：Shader Plugin アーキテクチャ設計

| テーマ | 決定事項 |
|---|---|
| 基本方針 | 疎結合（エンジン仲介）を採用 |
| エンジン API | `engine.getGeometryData(layerId)` を新設・標準 `GeometryData` フォーマットで供給 |
| N×M 爆発の回避 | Shader Plugin は Geometry の種類を知らなくてよい |
| インスタンス管理 | FX Plugin と同じモデル・Preferences で必要なものだけインスタンス化 |
| generic / native | Preference で切り替え可能（generic=疎結合/native=密結合・Geometry固有） |
| Graffiti コンセプト | Geometry はアルファ透明（位置情報のみ）・Shader が辺や面を「塗っていく」 |

**GeometryData 標準フォーマット（案）**
```typescript
interface GeometryData {
  vertices: Float32Array   // 頂点座標
  edges: Uint16Array       // 辺のインデックス
  faces: Uint16Array       // 面のインデックス
}
```

**Shader Plugin Interface（案）**
```typescript
interface ShaderPlugin {
  targetLayerId: string          // 参照する Geometry レイヤー
  mode: 'edge-trace' | 'face-spray' | ...
  uniforms: Record<string, number>
  shaderMode: 'generic' | 'native'  // Preference で切り替え
}
```

**Shader の種類（案）**
- `edge-trace`: 辺を time uniform で一筆書きでなぞる
- `face-spray`: 面を barycentric座標×ノイズ×time でスプレー塗り
- `pulse` / `noise-warp` など拡張予定

**Scene State Preset（JSON）**
```json
{
  "name": "Graffiti",
  "layers": [
    { "geometry": "icosphere", "alpha": 0 },
    { "shader": "face-spray", "targetLayer": 0 },
    { "shader": "edge-trace", "targetLayer": 0 },
    { "fx": "noise-color" }
  ]
}
```

### 壁打ち2：GeoGraphy の本質の再定義

```
表層:  Electron デスクトップ VJ ツール（ショーケース・サンドボックス）
本質:  No-Texture・Plugin駆動の Three.js ジオメトリ＆シェーダーアセットライブラリ
将来:  VR/AR アプリが GeoGraphy Plugin を import して使う
```

- engine.ts が React 非依存 → VR/AR アプリでも Plugin をそのまま使い回せる
- Command・Parameter Store → HMD コントローラーも同じ経路で流せる
- Scene State Preset（JSON） → VR シーンのプリセットとしても機能する
- スマートグラスの決定打が出たら即出動

**VR ビジョン**
- VR グラスをかけたまま空間そのものをリアルタイムで変容させる新ジャンルアプリ
- 「空間楽器」「Space VJ」とも言える体験
- Shader Plugin の `face-spray` / `edge-trace` が「VR 空間で魔法を描く」感覚に直結

**React Three Fiber について**
- 現在の GeoGraphy は Three.js 直接操作（imperative）+ React は UI のみ
- R3F は使っていない・engine.ts の React 非依存原則と相性が悪い
- VR アプリは「別アプリとして R3F + WebXR で開発し GeoGraphy を import」が最適

### 壁打ち3：ビジネスモデル設計

**製品ラインナップ**

| 製品 | 内容 |
|---|---|
| GeoGraphy Lite | 安価・機能制限・「まず試したい」ユーザー向け |
| GeoGraphy Pro | 全機能 + 公式 Plugin Pack 同梱（Shader・Preset含む） |
| VR/AR 版 | 将来・別売・既存 Plugin をそのまま使い回し可能 |

**Plugin SDK モデル（Figma 型）**

```
本体（有料・private）
  └─ エンジン・UI・Plugin ランタイム

Plugin SDK（OSS・public）
  └─ GeometryPlugin / ShaderPlugin / FXPlugin interface
  └─ 型定義一式・サンプル Plugin 数本
  └─ コミュニティが自由に Plugin を開発・公開

公式 Plugin Pack（Pro版に同梱）
  └─ 厳選・高品質・サポート付き
  └─ Graffiti Pack・Neon Pack 等
```

**ユーザー導線**
```
Plugin SDK（無料・開発者向け）
  → Lite 購入（「試したい」一般ユーザー）
  → Pro にアップグレード（「全部欲しい」）
  → VR/AR 版（将来・別売）
```

**収益源**
1. Lite / Pro 販売（デスクトップ）
2. Pro 版に同梱の公式 Plugin Pack
3. VR/AR 版 別売（将来）
4. エンタープライズライセンス（大阪スタートアップ支援枠）

**ライセンス状況**
- ライセンスファイル未追加（要対応）
- 使用ライブラリ全て MIT / Apache 2.0・商用利用に制約なし
- 今後の導入予定ライブラリ（R3F・Rapier・Tone.js等）も全て MIT

---

## 現在の状態

- **ブランチ**: `main`
- **タグ**: `day32`（コミット `5181b3d`・GitHub push済み）
- **テスト**: 104 tests グリーン・tsc エラーゼロ（Day32時点・Day33では未確認）
- **Day33 の実装**: なし（壁打ちのみ）
- **Day33 タグ**: 未打ち（実装なしのため）

---

## 発生した問題と解決策

- 特になし（壁打ちセッションのため）

---

## 次回やること（Day34）

| 優先度 | 作業 |
|---|---|
| ★★★ | 録画機能の動作確認（`pnpm dev:electron` → ⌘R → ⌘⇧R → WebM 保存） |
| ★★★ | `LICENSE` ファイルの追加（MIT を推奨・リポジトリルートに配置） |
| ★★★ | Shader Plugin spec 作成（`docs/spec/shader-plugin.spec.md`）← 別 AI との壁打ち結果も合わせて |
| ★★ | Phase 13 UI 実装の壁打ち（Layer / Geometry Simple Window どちらから着手するか） |
| ★★ | ビジネスモデル定義を `docs/` に残す（Lite/Pro・Plugin SDK モデル） |

### Shader Plugin spec に含めるべき内容（メモ）

- `GeometryData` 標準フォーマットの型定義
- `engine.getGeometryData(layerId)` API の仕様
- `ShaderPlugin` interface（targetLayerId・mode・uniforms・shaderMode）
- generic / native モードの切り替え仕様
- Preferences でのインスタンス管理（FX と同じライフサイクル）
- Scene State Preset（JSON）との接続
- uniforms の Command 経由アクセス（直接代入禁止）

---

## 環境メモ

- **ファイル更新鉄則**: 既存ファイルの更新は `filesystem:edit_file` を使う・`write_file` は新規作成のみ
- **録画**（Day32確立）: `startRecording()` / `stopRecording()` は `engine.ts` に実装済み・IPC は `save-recording`
- **Geometry 自動登録**: `import.meta.glob` で `solid/` 配下も自動スキャン済み
- **Shader Plugin spec**: 別 AI との壁打ち結果あり・次回セッション開始時に共有予定
- **ライセンスファイル**: 未追加・`MIT` を推奨・早めに対応すること
- **git push 前に必ず `git status` で staged を確認してから `git tag` を打つこと**

---

## 次回セッション開始時の確認コマンド

```bash
cd /Users/shinbigan/geography && pnpm tsc --noEmit && pnpm test --run
```

---

## 次回チャット用スタートプロンプト

```
GeoGraphy Day34を開始します。
まず HANDOVER.md を読んでください（/Users/shinbigan/geography/HANDOVER.md）

その後、以下の手順で進めてください：
1. 下記コマンドの結果を貼り付けます（104 tests グリーン確認）
   cd /Users/shinbigan/geography && pnpm tsc --noEmit && pnpm test --run
2. 別 AI との Shader Plugin 壁打ち結果を共有します
3. HANDOVER.md の「次回やること（Day34）」を読んで作業を開始してください

開発スタイル：SDD × CDD
- 始業時は HANDOVER.md → ルート CLAUDE.md → 作業対象モジュールの CLAUDE.md → spec の順で読むこと
- ファイル更新は filesystem:edit_file を使うこと（write_file は新規作成のみ）
- 完了条件は pnpm tsc --noEmit（型エラーゼロ）+ pnpm test --run（全テストグリーン）両方通過
- プランを提示・承認を得てから実装を開始すること
```
