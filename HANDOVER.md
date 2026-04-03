# GeoGraphy 引き継ぎメモ｜Day39（spec 整備・開発ルール確立）｜2026-04-03

## プロジェクト概要
- **アプリ名**: GeoGraphy（Geometry×地形×Graph のダブルミーニング）
- **目的**: No-Texture・Plugin駆動・マルチライブラリ対応の映像制作プラットフォーム
- **スタック**: Vite / React 18 / TypeScript / Three.js r160+ / pnpm v10.32+ / Electron 41
- **開発スタイル**: SDD × CDD（仕様駆動 × コンパイラ駆動）
- **GitHub**: https://github.com/Pdoomer2026/geography
- **開発サーバー（Electron）**: `pnpm dev:electron`
- **プロジェクトルート**: `/Users/shinbigan/geography`

---

## 重要ファイルパス

| ファイル | パス |
|---|---|
| CLAUDE.md（全体方針） | `CLAUDE.md`（v10・Day39 最終更新済み） |
| 引き継ぎメモ（最新） | `HANDOVER.md` |
| Shader Plugin spec（Day39更新） | `docs/spec/shader-plugin.spec.md` |
| CC Standard spec（Day39更新） | `docs/spec/cc-standard.spec.md`（v0.2） |
| カメラ spec（Day40 必読） | `docs/spec/camera-system.spec.md` |
| MacroKnob spec（Day37更新） | `docs/spec/macro-knob.spec.md` |
| 型定義（Day37更新） | `src/types/index.ts` |
| MacroKnob コア（Day37更新） | `src/core/macroKnob.ts` |
| エンジン本体（Day37更新） | `src/core/engine.ts` |
| MacroKnob UI | `src/ui/panels/macro-knob/MacroKnobPanel.tsx` |
| PreferencesPanel | `src/ui/panels/preferences/PreferencesPanel.tsx` |
| FX Plugin バレル | `src/plugins/fx/index.ts` |
| Electron メインプロセス | `electron/main.js` |

---

## 現在の状態

- **ブランチ**: `main`
- **タグ**: `day39`（最新コミット: `a60beac`）
- **テスト**: 104 tests グリーン・tsc エラーゼロ（Day39 はコード変更なし）
- **FX Plugin 総数**: 12本

---

## Day39 で完了したこと（spec 作業・ルール整備のみ・コード変更なし）

### A. `docs/spec/shader-plugin.spec.md` 拡充
- `ShaderPlugin` の継承元を `PluginBase` → **`ModulatablePlugin`** に変更
- `create()` シグネチャを `create(scene, geometryData)` → **`create(scene)`** に修正（engine 経由で取得）
- **§3-A「疎結合 vs 密結合（カップリング分類）」セクションを新設**
  - Preferences トグル方式は不採用 → ディレクトリ構造で分類する設計に確定
  - `shaders/graffiti/` 等 → 疎結合（デフォルト・9割カバー）
  - `shaders/native/` → 密結合（3ケースのみ許容）
- §9「実装保留の理由」を Day39 時点に更新

**密結合が必要な 3 ケース（Day39 壁打ちで確定）：**
| ケース | 例 |
|---|---|
| 意味的部位アクセス | HexGrid の特定セルだけ光らせる |
| 毎フレーム変形データ同期 | Contour の地形変形中にリアルタイム同期 |
| Geometry 固有 UV 構造 | Torus の内側リングだけ色を変える |

### B. `docs/spec/cc-standard.spec.md` Block 8xx 追加（v0.1 → v0.2）
- Block 8xx を「対象外」→ **SHADER** に昇格
- CC800〜CC805 を定義：
  - CC800: Effect Type（0=Fill / 1=Outline / 2=Detail）
  - CC801: Draw Progress（`uProgress`）← MacroKnob / シーケンサーの主要制御軸
  - CC802: Line Width / CC803: Spray Radius / CC804: Noise Strength / CC805: Shader Color
- §5 横断マッピング表に Shader Plugin テーブルを追加

### C. CLAUDE.md に3つのルールを追記（Day39確立）
1. **NFC 正規化ルール**：`write_file` で日本語ファイル作成後に python3 で NFC 正規化
2. **Linus スタイルのコミットメッセージ**：タイトル + ボディの2段構成・Day40 から全面適用
3. **Obsidian dev-log 作成ルール**：セッション終了時に必ず作成・NFC 正規化も実行

### D. Obsidian dev-log を Day17〜Day39 分遡って作成（計 20 ファイル）

---

## Day37・Day38 で確定したアーキテクチャ（継続して有効）

### Plugin 二分類（Day37確立）
```
ModulatablePlugin（MIDI 2.0 / MacroKnob 制御可能）
  → GeometryPlugin / FXPlugin / ParticlePlugin / LightPlugin / SequencerPlugin（予定）

PluginBase のみ（外部制御不要）
  → TransitionPlugin / WindowPlugin / MixerPlugin
```

制御経路：`MIDI → main.js → IPC 'geo:midi-cc' → MacroKnob → ParameterStore → Plugin.params.value`

### Shader Plugin カップリング分類（Day39確立）
```
src/plugins/shaders/
  graffiti/  scan/  growth/  ← 疎結合（推奨・engine.getGeometryData() 経由）
  native/                    ← 密結合（3ケースのみ許容）
```

### ShaderPlugin Interface（実装時に src/types/index.ts に追加）
```typescript
interface ShaderPlugin extends ModulatablePlugin {
  create(scene: THREE.Scene): void
  update(delta: number, beat: number): void
  destroy(scene: THREE.Scene): void
  // params.uProgress が必須（CC801 に対応）
}
```

---

## 次回やること（Day40）

| 優先度 | 作業 |
|---|---|
| ★★★ | Orbit カメラシステム実装（Icosphere / Torus / Torusknot 用） |
| ★★★ | Aerial カメラ実装（Hex Grid 用・真上俯瞰） |
| ★★ | Plugin Store v1 設計（手動フォルダ追加方式） |
| ★ | `docs/spec/sequencer.spec.md` 新設（MacroKnob 経由設計） |

**Day40 始業時の必須手順：**
1. HANDOVER.md を読む
2. `docs/spec/camera-system.spec.md` を必ず読む
3. `pnpm tsc --noEmit && pnpm test --run` で 104 tests 確認
4. Orbit カメラ実装開始

---

## 次回セッション開始時の確認コマンド

```bash
cd /Users/shinbigan/geography && pnpm tsc --noEmit && pnpm test --run
```

---

## 環境メモ（累積）

- **NFC 正規化**（Day39確立）: `write_file` で日本語ファイル作成後は python3 で NFC 正規化を実行
- **Linus スタイルコミット**（Day39確立）: `git commit -m "タイトル" -m "ボディ（なぜ変えたか）"` で Day40 から適用
- **Obsidian dev-log**（Day39確立）: 毎セッション終了時に `GeoGraphy Vault/dev-log/YYYY-MM-DD_DayN.md` を作成
- **終業時の必須手順**: dev-log 作成 → NFC 正規化 → git commit → git tag dayN → git push origin main --tags
- **ModulatablePlugin**（Day37確立）: params を持つ Plugin の中間層
- **MidiCCEvent**（Day37確立）: MIDI 1.0/2.0 共通フォーマット・value は 0〜1 正規化済み
- **rangeMap(v, min, max)**（Day37確立）: 0〜1 → min/max 変換
- **CC Standard v0.2**（Day39確立）: Block 8xx SHADER 追加・`docs/spec/cc-standard.spec.md`
- **preserveDrawingBuffer: true**（Day31確立）: `drawImage` で WebGL canvas 読み取りに必須
- **録画**（Day32確立）: `startRecording()` / `stopRecording()` は `engine.ts` 実装済み
- **Geometry 自動登録**: `import.meta.glob` で `solid/` 配下も自動スキャン済み
- **write_file 禁止**: 既存ファイルへの使用は禁止。`read_text_file` → `edit_file` のみ
- **git タグは commit 後に打つこと**
- **zsh でインラインコメント（`#`）はエラー**: コメント行とコマンド行は必ず分けて渡す
- **tsc が反映ズレで失敗する場合**: 2回実行すると解消する

---

## 次回チャット用スタートプロンプト

```
GeoGraphy Day40を開始します。
引き継ぎスキル

その後、以下の手順で進めてください：
1. まず HANDOVER.md を NFC 正規化してください（必須）：
   python3 -c "
import unicodedata, pathlib
p = pathlib.Path('/Users/shinbigan/geography/HANDOVER.md')
p.write_text(unicodedata.normalize('NFC', p.read_text('utf-8')), 'utf-8')
print('NFC 正規化完了')
"
2. 下記コマンドの結果を貼り付けます
   cd /Users/shinbigan/geography && pnpm tsc --noEmit && pnpm test --run
3. HANDOVER.md の「次回やること（Day40）」を読んで作業を開始してください

開発スタイル：SDD × CDD
- 始業時は HANDOVER.md → docs/spec/camera-system.spec.md を読んでから実装開始
- ファイル更新は filesystem:edit_file を使うこと（write_file は新規作成のみ）
- 完了条件は pnpm tsc --noEmit（型エラーゼロ）+ pnpm test --run（全テストグリーン）両方通過
- プランを提示・承認を得てから実装を開始すること
- コミットは Linus スタイル（タイトル + ボディ）で
```
