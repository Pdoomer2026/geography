# GeoGraphy SDD（仕様駆動開発）概要

> 唯一の真実の情報源（SSoT）: `docs/spec/` ディレクトリ配下の `.spec.md` ファイル群

---

## SDDの基本原則（GeoGraphy版）

1. **コードを書く前に仕様を書く** — specファイルを先に定義し、それを根拠に実装する
2. **仕様は検証可能にする** — テストコードを自動生成できるほど詳細に記述する
3. **コードではなく仕様を修正する** — バグや変更があれば、先にspecを直してから実装を直す
4. **AIへのコンテキストはspecから渡す** — Claude Codeにはspecファイルを読み込ませてから実装を指示する

---

## ツール役割分担（SDD対応版）

| ツール | 役割 |
|---|---|
| Claude Desktop | **spec制作・仕様の壁打ち・docs/spec/ の管理** |
| Claude Code | specを読み込んで実装・テスト・Git操作 |
| Obsidian | 開発ログ・意思決定記録・YouTube素材 |

---

## specファイル一覧（SSoT）

| ファイル | 対象 | フェーズ | 状態 |
|---|---|---|---|
| `command-pattern.spec.md` | Commandパターン・Parameter Store | Phase 2 | ✅ 実装済み・仕様化 |
| `plugin-registry.spec.md` | Plugin Registry・自動登録 | Phase 2 | ✅ 実装済み・仕様化 |
| `program-preview-bus.spec.md` | Program/Previewバス・SceneState | Phase 7 | ✅ 実装済み・仕様化 |
| `transition-plugin.spec.md` | Transition Plugin・execute()純粋関数 | Phase 7 | ✅ 実装済み・仕様化 |
| `layer-system.spec.md` | レイヤーシステム・CSS合成 | Phase 8 | 🔴 Day12実装対象 |
| `macro-knob.spec.md` | マクロノブ・MIDIマッピング | Phase 8 | ⬜ 未着手 |
| `mixer-plugin.spec.md` | MixerPlugin Interface・SimpleMixer | Phase 7 | ⬜ 未着手 |
| `fx-stack.spec.md` | FXスタック・順序・EffectComposer | Phase 4 | ⬜ 未着手 |
| `camera-system.spec.md` | カメラモード・AUTO・Lerp | Phase 3 | ⬜ 未着手 |

---

## 開発サイクル（SDD版）

```
1. spec制作（Claude Desktop）
   docs/spec/[機能].spec.md を作成・レビュー

2. Claude Codeへの指示
   「docs/spec/layer-system.spec.md を読んでから実装してください」

3. 実装（Claude Code）
   specのInterface・Constraintsに従ってコードを生成

4. テスト実行
   specのTest Casesがすべてパスするか確認

5. 仕様変更が必要な場合
   コードを直接修正しない → specを先に修正 → 再実装
```

---

## specファイルのフォーマット

各specファイルは以下の構造で統一する：

```markdown
# [機能名] Spec

## 1. Purpose（目的）
## 2. Constraints（不変条件・MUSTルール）
## 3. Interface（型・APIシグネチャ）
## 4. Behavior（振る舞いの定義）
## 5. Test Cases（検証可能な条件）
## 6. References（関連ドキュメント）
```
