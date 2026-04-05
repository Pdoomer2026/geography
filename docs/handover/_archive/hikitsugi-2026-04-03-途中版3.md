# GeoGraphy 引き継ぎメモ｜Day39｜2026-04-03

## プロジェクト概要
- アプリ名：GeoGraphy（Electron VJ アプリ + Three.js ビジュアルエンジン）
- スタック：Vite / React 18 / TypeScript / Three.js r160+ / Electron / pnpm
- 開発スタイル：SDD × CDD（spec → 実装 → tsc + test グリーン）
- GitHub：https://github.com/Pdoomer2026/geography
- 開発コマンド：`pnpm dev:electron`
- 検証コマンド：`pnpm tsc --noEmit && pnpm test --run`

## 重要ファイルパス
| ファイル | パス |
|---|---|
| CLAUDE.md（全体方針） | `CLAUDE.md`（v10・Day39 更新済み） |
| 引き継ぎ | `HANDOVER.md` |
| Shader Plugin spec | `docs/spec/shader-plugin.spec.md`（Day39 更新済み） |
| CC Standard spec | `docs/spec/cc-standard.spec.md`（v0.2・Day39 更新済み） |
| 型定義 | `src/types/index.ts` |
| エンジン | `src/core/engine.ts` |
| カメラ spec | `docs/spec/camera-system.spec.md`（Day40 実装前に必読） |
| Electron メイン | `electron/main.js` |

## 今回のセッション（Day39）で完了したこと

### A. `docs/spec/shader-plugin.spec.md` 拡充
- `ShaderPlugin` の継承元を `PluginBase` → **`ModulatablePlugin`** に変更
- `create()` シグネチャを `create(scene, geometryData)` → **`create(scene)`** に修正
  - 理由：engine.getGeometryData(layerId) を内部で呼ぶ疎結合設計のため引数不要
- **§3-A「疎結合 vs 密結合（カップリング分類）」セクションを新設**
  - Preferences トグル方式は不採用 → ディレクトリ構造で分類する設計に確定
  - `shaders/graffiti/` 等 → 疎結合（デフォルト・9割カバー）
  - `shaders/native/` → 密結合（3ケースのみ許容）
- §9「実装保留の理由」を Day39 時点に更新

### B. `docs/spec/cc-standard.spec.md` Block 8xx 追加（v0.1 → v0.2）
- Block 8xx を「CC Standard の対象外」→ **SHADER** に昇格
- CC800〜CC805 を定義：
  - CC800: Effect Type（0=Fill / 1=Outline / 2=Detail）
  - CC801: Draw Progress（`uProgress`）← MacroKnob / シーケンサーの主要制御軸
  - CC802: Line Width（`uLineWidth`）
  - CC803: Spray Radius（`uSprayRadius`）
  - CC804: Noise Strength（`uNoiseStrength`）
  - CC805: Shader Color（Shader 専用 Hue）
- §5 横断マッピング表に Shader Plugin テーブルを追加
- 付録クイックリファレンスに 8xx を追記

### C. `CLAUDE.md` に2つのルールを追記
- **NFC 正規化ルール**：`write_file` で日本語ファイルを新規作成した直後に python3 で NFC 正規化を実行する
- **Linus スタイルのコミットメッセージ**：タイトル + ボディの2段構成。Day40 から全コミットに適用

## 現在の状態（重要）
- **tsc エラー：ゼロ**
- **テスト：104 passed（14 files）**（Day39 はコード変更なし・spec 作業のみ）
- **最新タグ：`day39`**
- **最新コミット：`d3b3929`**（docs: add Linus-style commit message rule to CLAUDE.md）

## 発生した問題と解決策
- **問題**：`edit_file` で HANDOVER.md の日本語行がマッチしない
  - **原因**：macOS APFS が日本語を NFD 形式で保存 / Claude は NFC で送信 → 不一致
  - **解決**：`write_file` で新規ファイルを作成した直後に python3 で NFC 正規化を実行
  - **恒久対策**：CLAUDE.md にルールとして明記済み（Day39 確立）
- **問題**：HANDOVER.md の一部行に文字化け（`完了し���こと` 等）
  - **原因**：同上の NFC/NFD 問題が蓄積したもの
  - **対策**：`docs/handover/` に引き継ぎメモを別ファイルで作成して対処

## Day39 で確定した設計決定事項

### Shader Plugin カップリング分類（最重要）
```
src/plugins/shaders/
  graffiti/    ← 疎結合（推奨）engine.getGeometryData() 経由
  scan/        ← 疎結合（推奨）
  growth/      ← 疎結合（推奨）
  native/      ← 密結合（以下の3ケースのみ許容）
    icosphere/   意味的部位アクセス
    hex-grid/    毎フレーム変形データ同期
    torusknot/   Geometry 固有 UV 構造
```

### ShaderPlugin Interface（src/types/index.ts に実装時に追加）
```typescript
interface ShaderPlugin extends ModulatablePlugin {
  create(scene: THREE.Scene): void
  update(delta: number, beat: number): void
  destroy(scene: THREE.Scene): void
  // params.uProgress が必須（CC801 に対応）
}
```

### Linus スタイルのコミットメッセージ（Day40 から適用）
```bash
git commit -m "feat: タイトル (DayN)" \
           -m "なぜこの変更をしたか。
何を判断したか。
どのファイルに何を追加したか。"
```

## 次回やること（Day40）
優先度順：

1. **★★★ Orbit カメラシステム実装**（Icosphere / Torus / Torusknot 用）
   - 始業時に `docs/spec/camera-system.spec.md` を必ず読むこと
   - `cameraPreset` に OrbitControls を統合する設計
2. **★★★ Aerial カメラ実装**（Hex Grid 用・真上俯瞰）
3. **★★ Plugin Store v1 設計**（手動フォルダ追加方式・v3 in-app store まで rework 不要な設計）
4. **★ `docs/spec/sequencer.spec.md` 新設**（MacroKnob 経由設計で執筆）

## 環境メモ
- `filesystem:edit_file` は既存ファイルの編集専用（`write_file` は新規作成のみ）
- `write_file` で日本語ファイルを作成した直後は NFC 正規化コマンドを実行すること
- コミットは Linus スタイル（タイトル + ボディ）で Day40 から適用
- セッション終了時の必須手順：git commit → git tag dayN → git push origin main --tags
- zsh でインラインコメント（`#`）はエラーになる：コメント行とコマンド行は必ず分けて渡す
- tsc が反映ズレで失敗する場合：2回実行すると解消する
