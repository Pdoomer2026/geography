# GeoGraphy Day86 引き継ぎ｜2026-04-28

## プロジェクト概要
- **アプリ名**: GeoGraphy（No-Texture Plugin 駆動 VJ アプリ）
- **スタック**: Vite / React 18 / TypeScript / Three.js r160+ / pnpm / Electron / Zod
- **GitHub**: https://github.com/Pdoomer2026/geography
- **ブランチ**: `feature/inspector-ui`
- **テスト**: 129 tests グリーン・tsc エラーゼロ
- **タグ**: `day86`（終業時に打つこと）

---

## 始業時に必読

```
docs/architecture/ui-event-flow.md
```

---

## Day86 で完了したこと

### 1. 旧 Window 廃止 → `docs/examples/` アーカイブ

Inspector Panel の完成により不要になった4カテゴリの Window を src から削除し、コントリビューター向けの参考実装として `docs/examples/window-plugin-patterns/` に保存した。

**削除した src ディレクトリ：**
- `simple-window/`
- `standard-window/`（RangeSlider.tsx を除く）
- `simple-dnd-window/`
- `standard-dnd-window/`

**新設ファイル：**
- `src/ui/components/common/RangeSlider.tsx`（standard-window から昇格）
- `docs/examples/window-plugin-patterns/README.md`（コントリビューター向け説明）

**合わせて修正：**
- GeometryPanel / CameraPanel / FxPanel の RangeSlider import パスを `common/` に変更
- `GeoWindowMode` 型を `'none'` のみに簡素化
- App.tsx から旧 Window の import・render・未使用 callback を完全除去
- PreferencesPanel の Window 選択肢を整理

### 2. MacroKnob アサイン逆転トグル（`⇅`）+ 直接アサイン

**背景：**
Inspector の RangeSlider で lo/hi を設定してもアサイン方向が固定で、「Knob↑でparam A↑、Knob↑でparam B↓」という操作ができなかった。

**実装内容：**

| ファイル | 変更内容 |
|---|---|
| `useStandardDnDParamRow.ts` | `inverted` state + `handleToggleInverted` 追加。`inverted=true` のとき proposal の lo/hi を入れ替え |
| `DnDHandleWithMenu.tsx` | `⇅` トグルボタンを `≡` ハンドルの隣に追加。inverted=ON でオレンジ色 |
| `GeometryPanel.tsx` / `CameraPanel.tsx` / `FxPanel.tsx` | `inverted` / `handleToggleInverted` を DnDHandleWithMenu に渡すよう更新 |
| `MacroWindow.tsx` / `MacroPanel.tsx` | `payload.proposal` がある場合は AssignDialog をスキップして直接アサイン |

**操作フロー：**
```
Inspector の ParamRow
  1. RangeSlider で lo/hi（稼働幅）を設定
  2. 必要なら ⇅ をクリックして逆転ON（オレンジ）
  3. ≡ をドラッグ → MacroKnob にドロップ
     → AssignDialog なしで即アサイン
     → inverted=ON なら lo/hi が入れ替わって逆方向アサイン
```

**アーキテクチャポイント：**
- `rangeMap(v, min, max)` は `min > max` のとき自動で逆マッピング（数学的に正しい）
- スキーマ変更ゼロ・`MacroAssign` の min/max に `min > max` を許容するだけ
- AssignDialog のスキップは proposal の有無で判定（Inspector 以外は従来通りダイアログ表示）

---

## 現在の状態（重要）

- **テスト**: 129 passed（15 files）✅
- **tsc**: エラーゼロ ✅
- **ブラウザ確認**:
  - `⇅` ボタンが各 ParamRow に表示 ✅
  - 逆転ON でオレンジ色になる ✅
  - ドラッグ → ドロップで即アサイン（AssignDialog なし）✅
  - MacroKnob の挙動が逆方向に変わる ✅
  - lo/hi の数値表示は変わらない（正しい挙動）✅

---

## 次回やること（Day87）

1. **Sequencer Plugin 設計**（`docs/spec/sequencer.spec.md` 作成）
2. **Preferences Panel CC Map タブ**
3. MacroKnob アサイン状態を EditDialog から確認したとき `⇅` 逆転状態が視覚的にわかるか確認（今は assign.min > assign.max で判定可能）

---

## 重要ファイルパス

| ファイル | パス |
|---|---|
| UIイベントフロー設計図 | `docs/architecture/ui-event-flow.md` |
| RangeSlider（共通） | `src/ui/components/common/RangeSlider.tsx` |
| DnDHandleWithMenu | `src/ui/components/inspector/layer/panels/DnDHandleWithMenu.tsx` |
| useStandardDnDParamRow | `src/ui/hooks/useStandardDnDParamRow.ts` |
| MacroWindow | `src/ui/components/window/macro-window/MacroWindow.tsx` |
| MacroPanel | `src/ui/components/inspector/layer/panels/MacroPanel.tsx` |
| Window パターン集 | `docs/examples/window-plugin-patterns/README.md` |

---

## 環境メモ

- 開発: `pnpm dev` → `open http://localhost:5173`（HMR / hard reload 不可）
- NFC 正規化: `python3 /Users/shinbigan/nfc_normalize.py`（日本語ファイル書き込み後に必須）
- git commit の日本語本文: `-m` で直接書いてよい（zsh の `!` 問題に注意）
- bash は Claude Desktop から実行不可（コンテナ内で動く）→ Cursor で実行

---

## 次回スタートプロンプト

```
Day87開始
```
