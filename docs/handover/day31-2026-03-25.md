# GeoGraphy 引き継ぎメモ｜Day31完了｜2026-03-26

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
| CLAUDE.md（全体方針） | `CLAUDE.md`（v10・ファイル更新鉄則追加済み） |
| 引き継ぎメモ（最新） | `HANDOVER.md` |
| 型定義 | `src/types/index.ts` |
| geoAPI 型定義 | `src/types/geoAPI.d.ts` |
| エンジン本体 | `src/core/engine.ts` |
| LayerManager | `src/core/layerManager.ts` |
| App.tsx | `src/ui/App.tsx` |
| Mixer Simple Window | `src/plugins/mixers/simple-mixer/MixerSimpleWindow.tsx` |
| FX Simple Window | `src/ui/FxSimpleWindow.tsx` |
| Macro Knob Simple Window | `src/ui/MacroKnobSimpleWindow.tsx` |
| Electron メインプロセス | `electron/main.js` |
| Electron preload | `electron/preload.js` |

---

## 今回のセッション（Day31）で完了したこと

### A. Small screen 実装（MixerSimpleWindow内）

| 内容 | 詳細 |
|---|---|
| 表示方式 | `layerManager` の各レイヤー canvas を `drawImage` で 200ms ポーリング合成 |
| ソース | `screenAssign.small` が `edit` → editOpacity / `output` → outputOpacity でブレンド |
| サイズ | 240×135px（CSS）/ DPR対応で物理ピクセルは 480×270（Retina） |
| 配置 | MixerSimpleWindow の左側・フェーダーエリアと横並び |
| ウィンドウ幅 | 480px → 680px に拡大 |

### B. 技術的解決事項

| 問題 | 解決策 |
|---|---|
| `drawImage` で WebGL canvas が真っ黒 | `THREE.WebGLRenderer` に `preserveDrawingBuffer: true` を追加 |
| Small screen がぼやける | `canvas` の `width/height` を `devicePixelRatio` 倍にして CSS サイズはそのまま |
| previewBus.mount() では実映像が映らない | 実際の映像を映すには WebGL canvas を直接参照する必要がある |

### C. 設計確定事項（壁打ち）

- Small screen = Large screen と**別の映像**を映す（SWAP で役割が入れ替わる）
- Large screen と同じ映像ではない → Edit/Output の分離が Small screen の存在意義
- v1 の Small screen 画質は `drawImage` の限界（5fps・縮小コピー）→ v2 で専用 WebGL レンダラー検討
- 200ms ポーリング方式は Three.js レンダーループに干渉しない軽量設計

---

## 現在の状態

- **ブランチ**: `main`
- **タグ**: `day31`（コミット `2ffa43c`・GitHub push済み）
- **テスト**: 104 tests グリーン・tsc エラーゼロ確認済み
- **動作確認済み**:
  - Small screen が MixerSimpleWindow 左側に表示される
  - Small screen に Edit/Output view の合成映像が映る（5fps・200msポーリング）
  - SWAP で Large/Small のアサインと Small screen の映像が切り替わる
  - Edit/Output フェーダーを動かすと Small screen の映像が変化する
  - FX初期値は全てOFF

---

## 発生した問題と解決策

| 問題 | 解決策 |
|---|---|
| ルートCLAUDE.mdに文字化け（`ター❓ナル`）があり `str_replace` が効かない | `sed -i '' 's/ター.ナル/ターミナル/g' CLAUDE.md` で修正後、`filesystem:edit_file` で編集 |
| フェーダーを動かしても映像が変化しない | `setLayerRouting()` 内で `layerManager.setOpacity()` を呼ぶように修正 |
| フェーダー0%でも映像が消えない | `mute=true`（`display:none`）も合わせて制御するよう修正 |
| 起動時に3レイヤーが黒くなる | `initialize()` 末尾に初期ルーティング反映処理を追加 |
| FX初期値がONで3レイヤーに全てかかり映像が見えない | FX Pluginの `enabled` 初期値を `false` に変更 |

---

## 次回やること（Day31）

### 最優先：Small screen の実装

MixerSimpleWindow内にSmall screenがまだない。Large screenとの対比を作る必要がある。

| 順序 | 作業 |
|---|---|
| 1 | Small screen の表示内容を壁打ちで決める（Edit viewの合成をリアルタイム表示 or テキスト情報） |
| 2 | MixerSimpleWindow内にSmall screenエリアを追加 |
| 3 | tsc + test 通過確認 |
| 4 | `pnpm dev:electron` で目視確認 |

### その他検討事項

- 実装計画書 Phase 11 セクションの更新（Day30の新設計を反映）
- 実装計画書 Phase 11 セクションの更新（Day31の実装を反映）
- 次の機能実装の壁打ち

---

## 次回セッション開始時の確認コマンド

```bash
cd /Users/shinbigan/geography && pnpm tsc --noEmit && pnpm test --run
```

---

## 環境メモ

- **ファイル更新鉄則**: 既存ファイルの更新は `filesystem:edit_file` を使う・`write_file` は新規作成のみ
- **preserveDrawingBuffer: true**（Day31確立）: `drawImage` で WebGL canvas を読み取るには必須・`layerManager.ts` に追加済み
- **CLAUDE.md の読み方**: ルート → 作業対象モジュール → spec の順で読む
- **CLAUDE.md アーカイブ**: `docs/archive/CLAUDE/`
- **今後 `dist-electron/` は絶対にコミットしない**（`.gitignore` 済み）
- **git push の前に必ず `git status` で staged を確認してから `git tag` を打つこと**

---

## 次回チャット用スタートプロンプト

```
GeoGraphy Day32を開始します。
まず HANDOVER.md を読んでください（/Users/shinbigan/geography/HANDOVER.md）

その後、以下の手順で進めてください：
1. 下記コマンドの結果を貼り付けます（104 tests グリーン確認）
   cd /Users/shinbigan/geography && pnpm tsc --noEmit && pnpm test --run
2. HANDOVER.md の「次回やること（Day32）」を読んで作業を開始してください

開発スタイル：SDD × CDD
- 始業時は HANDOVER.md → ルート CLAUDE.md → 作業対象モジュールの CLAUDE.md → spec の順で読むこと
- ファイル更新は filesystem:edit_file を使うこと（write_file は新規作成のみ）
- 完了条件は pnpm tsc --noEmit（型エラーゼロ）+ pnpm test --run（全テストグリーン）両方通過
- プランを提示・承認を得てから実装を開始すること
```
