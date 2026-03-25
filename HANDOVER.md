# GeoGraphy 引き継ぎメモ｜Day30完了｜2026-03-25

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

## 今回のセッション（Day30）で完了したこと

### A. 壁打ち：Output/Edit view 設計確定

| 用語 | 定義 |
|---|---|
| **Large screen** | Electronメインウィンドウ（大画面） |
| **Small screen** | MixerSimpleWindow内の小画面 |
| **Output view** | 出力映像（観客に見せる映像）|
| **Edit view** | 編集映像（次に出す映像を仕込む場所）|

- 縦フェーダー6本（Edit×3 + Output×3）でレイヤーごとのOpacityをルーティング
- ⇄ SWAPボタンでLarge/Smallのアサインを完全入れ替え
- アサインラベルを常時表示（`Large: OUTPUT / Small: EDIT`）
- Transition/Crossfader/Tap Tempoはv2送り（コードは残す・UIは非表示）

### B. spec 更新

| ファイル | 内容 |
|---|---|
| `docs/spec/program-preview-bus.spec.md` | Output/Edit view・Large/Small screen・LayerRouting型・ScreenAssignState型追加 |
| `docs/spec/mixer-plugin.spec.md` | 縦フェーダー6本・SWAPボタン・Transition v2送り反映 |

### C. CLAUDE.md 更新

| ファイル | 内容 |
|---|---|
| `CLAUDE.md` v10 | **ファイル更新時の鉄則**（始業時確認セクション）追加・`filesystem:edit_file` を明記 |
| `src/core/CLAUDE.md` v4 | Output/Edit view セクション・LayerRouting/ScreenAssignState型追加 |
| `src/plugins/mixers/CLAUDE.md` v2 | 新UIレイアウト・MUSTルール更新・v2送り明記 |

### D. 今日確立した重要知見

**ファイル編集ツールの使い分け（確定）**

| ツール | 用途 |
|---|---|
| `filesystem:edit_file` | 既存ファイルの更新（これを使う） |
| `filesystem:write_file` | 新規ファイル作成のみ |
| `str_replace` | 文字化けがあるファイルには効かない |

- ルートCLAUDE.mdに文字化けがあり `str_replace` が効かなかった → `sed` で修正 → `filesystem:edit_file` で解決
- `write_file` は全書き換えになるため既存ファイルへの使用は禁止

### E. Phase 11 実装

| 内容 | ファイル |
|---|---|
| `LayerRouting` / `ScreenAssign` / `ScreenAssignState` 型追加 | `src/types/index.ts` |
| `layerRoutings` / `screenAssign` プロパティ追加 | `src/core/engine.ts` |
| `getLayerRoutings()` / `setLayerRouting()` / `getScreenAssign()` / `swapScreenAssign()` API追加 | `src/core/engine.ts` |
| 起動時ルーティング反映（黒くなるバグ修正） | `src/core/engine.ts` |
| MixerSimpleWindow 全面再設計（縦フェーダー6本・SWAP・プラグイン名表示） | `src/plugins/mixers/simple-mixer/MixerSimpleWindow.tsx` |
| FX 初期値を全て `enabled=false` に変更（after-image・bloom・rgb-shift・color-grading） | `src/plugins/fx/*/index.ts` |

---

## 現在の状態

- **ブランチ**: `main`
- **タグ**: `day30`（コミット `9448757`・GitHub push済み）
- **テスト**: 104 tests グリーン・tsc エラーゼロ確認済み
- **動作確認済み**:
  - 起動時から3レイヤーがクリアに表示される
  - Edit/Output 縦フェーダーがcanvasのopacityに反映される
  - SWAPボタンでLarge/Smallのアサインが入れ替わる
  - フェーダー下にプラグイン名が表示される
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
- `previewBus.ts` の `getCanvas()` を Small screen に活用できるか検討

---

## 次回セッション開始時の確認コマンド

```bash
cd /Users/shinbigan/geography && pnpm tsc --noEmit && pnpm test --run
```

---

## 環境メモ

- **ファイル更新鉄則（Day30確立）**: 既存ファイルの更新は `filesystem:edit_file` を使う・`write_file` は新規作成のみ・更新後は `git diff HEAD [ファイル名] | cat` で差分確認
- **CLAUDE.md の読み方**: ルート → 作業対象モジュール → spec の順で読む
- **CLAUDE.md アーカイブ**: `docs/archive/CLAUDE/`
- **今後 `dist-electron/` は絶対にコミットしない**（`.gitignore` 済み）
- **git push の前に必ず `git status` で staged を確認してから `git tag` を打つこと**

---

## 次回チャット用スタートプロンプト

```
GeoGraphy Day31を開始します。
まず HANDOVER.md を読んでください（/Users/shinbigan/geography/HANDOVER.md）

その後、以下の手順で進めてください：
1. 下記コマンドの結果を貼り付けます（104 tests グリーン確認）
   cd /Users/shinbigan/geography && pnpm tsc --noEmit && pnpm test --run
2. HANDOVER.md の「次回やること（Day31）」を読んで作業を開始してください

開発スタイル：SDD × CDD
- 始業時は HANDOVER.md → ルート CLAUDE.md → 作業対象モジュールの CLAUDE.md → spec の順で読むこと
- ファイル更新は filesystem:edit_file を使うこと（write_file は新規作成のみ）
- 完了条件は pnpm tsc --noEmit（型エラーゼロ）+ pnpm test --run（全テストグリーン）両方通過
- プランを提示・承認を得てから実装を開始すること
```
