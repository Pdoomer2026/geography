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
| エンジン | `src/core/engine.ts` |
| レイヤー管理 | `src/core/layerManager.ts` |
| 型定義 | `src/types/index.ts` |
| Shader Plugin spec | `docs/spec/shader-plugin.spec.md` |
| CC Standard spec | `docs/spec/cc-standard.spec.md` |
| App | `src/ui/App.tsx` |
| Electron メイン | `electron/main.js` |
| 引き継ぎ | `HANDOVER.md` |

## 今回のセッション（Day39）で完了したこと

### A. `docs/spec/shader-plugin.spec.md` 拡充（Day34 版から大幅更新）

- `ShaderPlugin` の継承元を `PluginBase` → **`ModulatablePlugin`** に変更
  - `params`（uProgress 等）を持ち、CC Standard Block 8xx 経由で MacroKnob から外部制御される
- `create()` シグネチャを修正
  - 旧: `create(scene: THREE.Scene, geometryData: GeometryData)`
  - 新: `create(scene: THREE.Scene)` — engine 経由で GeometryData を取得するため引数から除去
- **§3-A「疎結合 vs 密結合（カップリング分類）」セクションを新設**
  - Preferences トグル方式は不採用 → **ディレクトリ構造で分類**する設計に決定
  - `src/plugins/shaders/graffiti/` 等 → 疎結合（デフォルト・推奨）
  - `src/plugins/shaders/native/` → 密結合（3ケースのみ許容）
- §9「実装保留の理由」を Day34 → Day39 時点に更新

**Day39 壁打ちで確定した密結合が必要な 3 ケース：**
| ケース | 説明 | 例 |
|---|---|---|
| 意味的部位アクセス | 「特定の六角形だけ光らせる」など Geometry 固有の意味でアクセスしたい | HexGrid の 3 番目のセル |
| 毎フレーム変形データ同期 | 頂点が毎フレーム変わる Geometry のリアルタイム同期が必要 | Contour の地形変形中 |
| Geometry 固有 UV 構造 | Torus の「穴の部分だけ」など固有の UV 知識が必要 | Torus の内側リング |

### B. `docs/spec/cc-standard.spec.md` Block 8xx 定義追加（v0.1 → v0.2）

- Block 定義一覧の 8xx を「CC Standard の対象外」→ **SHADER** に昇格
- **Block 8xx（SHADER）セクションを新設**
  - CC800: Effect Type（0=Fill / 1=Outline / 2=Detail）
  - CC801: Draw Progress（`uProgress`）— MacroKnob / シーケンサーから制御する主要軸
  - CC802: Line Width（`uLineWidth`）
  - CC803: Spray Radius（`uSprayRadius`）
  - CC804: Noise Strength（`uNoiseStrength`）
  - CC805: Shader Color（Shader 専用 Hue）
- §5 横断マッピング表に Shader Plugin（graffiti-fill / graffiti-outline / graffiti-detail）テーブルを追加
- 付録クイックリファレンスに 8xx を追記

## 現在の状態（重要）
- **tsc エラー：ゼロ**
- **テスト：104 passed（14 files）**（Day39 はコード変更なし）
- **最新タグ：`day38`**（Day39 は spec のみ・`day39` タグは終業時に打つ）
- **コミット**: `1eb11b3`（docs: update shader-plugin spec and cc-standard Block 8xx）

## 発生した問題と解決策
- 問題：`edit_file` で HANDOVER.md の一部行がマッチしない → 文字コードの微妙な差異が原因
  → 解決：新規の引き継ぎメモ（このファイル）を作成。HANDOVER.md は次回セッションで Claude Code が更新する

## 次回やること（Day40）
優先度順：

1. **Orbit カメラシステム実装**（Icosphere / Torus / Torusknot 用）
   - `docs/spec/camera-system.spec.md` を読んでから実装
2. **Aerial カメラ実装**（Hex Grid 用・真上俯瞰）
3. **Plugin Store v1 設計**（手動フォルダ追加方式・v3 in-app store まで rework 不要な設計）
4. **`docs/spec/sequencer.spec.md` 新設**（MacroKnob 経由設計で執筆）

## Day39 で確定した設計決定事項（次回以降に反映が必要）

### Shader Plugin カップリング分類（最重要）
```
src/plugins/shaders/
  graffiti/    ← 疎結合（推奨）
  scan/        ← 疎結合（推奨）
  growth/      ← 疎結合（推奨）
  native/      ← 密結合（3ケースのみ許容）
    icosphere/
    hex-grid/
    torusknot/
```

### ShaderPlugin Interface（確定・実装時に src/types/index.ts に追加）
```typescript
interface ShaderPlugin extends ModulatablePlugin {
  create(scene: THREE.Scene): void  // engine.getGeometryData(layerId) を内部で呼ぶ
  update(delta: number, beat: number): void
  destroy(scene: THREE.Scene): void
  // params: Record<string, PluginParam> ← ModulatablePlugin から継承
  // params.uProgress が必須（CC801 に対応）
}
```

### CC Standard v0.2 の Block 8xx
```
8xx SHADER  800=EffectType  801=Progress  802=LineWidth  803=SprayR  804=Noise  805=Color
```

## 環境メモ
- `filesystem:edit_file` は既存ファイルの編集専用（`write_file` は新規作成のみ）
- HANDOVER.md に文字コード問題が一部あり → 引き継ぎメモを別ファイルで作成して対処
- セッション終了時の必須手順：git commit → git tag dayN → git push origin main --tags
