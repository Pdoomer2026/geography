# GeoGraphy Agent Roles
# マルチエージェント担当範囲定義

> SSoT: このファイル
> 目的: v2以降のマルチエージェント化において、エージェント間の衝突を防ぐ
> 更新タイミング: 新しいエージェントを追加するとき・担当範囲が変わるとき

---

## 基本原則

1. **各エージェントは自分の担当ディレクトリ以外を直接編集しない**
2. **共有ファイル（engine.ts・types/index.ts等）の変更は必ずレビュー対象**
3. **specファイルはClaude Desktopのみが作成・更新する**
4. **Git操作（commit・push）はClaude Codeのみが行う**

---

## エージェント一覧と担当範囲

### 🖥️ Claude Desktop（設計・仕様管理）
**役割**: SSoT管理・仕様駆動開発の司令塔

| 担当 | パス |
|---|---|
| spec作成・更新 | `docs/spec/**` |
| CLAUDE.md更新 | `**/CLAUDE.md` |
| 要件定義書・実装計画書 | `docs/*.md` |
| HANDOVER.md | `HANDOVER.md` |
| エージェント定義 | `docs/spec/agent-roles.md` |

**触れないもの**: `src/**` のコード・テストファイル・Git操作

---

### ⚙️ Claude Code（実装・テスト・Git）
**役割**: specを読んで実装する。Git操作の唯一の担当。

| 担当 | パス |
|---|---|
| エンジンコア | `src/core/**` |
| 型定義 | `src/types/index.ts` |
| メインエントリー | `src/main.tsx` / `App.tsx` |
| テスト | `tests/**` |
| Git操作 | commit / push / branch |
| 設定ファイル | `vite.config.ts` / `tsconfig.json` / `package.json` |

**触れないもの**: `docs/spec/**`（specの変更はClaude Desktopへ依頼）

---

### 🎨 Geometry Agent（v2以降）
**役割**: Geometry Pluginの追加・改善専門

| 担当 | パス |
|---|---|
| Geometry Plugin | `src/plugins/geometry/**` |
| テンプレート | `src/plugins/geometry/**/template-*.md` |

**読むべきspec**: `docs/spec/geometry-plugin.spec.md`（要作成）
**触れないもの**: `src/core/**` / `src/types/index.ts` の変更は禁止（変更が必要なときはClaude Codeへ依頼）

---

### ✨ FX Agent（v2以降）
**役割**: FX Plugin・EffectComposerの追加・改善専門

| 担当 | パス |
|---|---|
| FX Plugin | `src/plugins/fx/**` |

**読むべきspec**: `docs/spec/fx-stack.spec.md`（要作成）
**制約**: FXスタック順序（`src/plugins/fx/CLAUDE.md`）を厳守
**触れないもの**: `src/core/**`

---

### 🎛️ Mixer Agent（v2以降）
**役割**: Mixer Plugin・SimpleMixerのUI改善専門

| 担当 | パス |
|---|---|
| Window Plugin | `src/plugins/windows/**` |
| Mixer UI | `src/plugins/windows/simple-mixer/**` |

**読むべきspec**: `docs/spec/mixer-plugin.spec.md`（要作成）
**制約**: SimpleMixerは閉じるボタンを実装してはいけない
**触れないもの**: `src/core/engine.ts`（エンジンAPIを通じてのみ操作）

---

### 🔄 Transition Agent（v2以降）
**役割**: Transition Plugin追加専門（GL Transitions移植等）

| 担当 | パス |
|---|---|
| Transition Plugin | `src/plugins/transitions/**` |

**読むべきspec**: `docs/spec/transition-plugin.spec.md` ✅
**制約**: execute()は純粋関数・UIを持たない・SceneStateのみ操作

---

## 共有ファイルのルール

以下のファイルは複数エージェントが参照するが、**変更はClaude Codeのみ**：

| ファイル | 変更時のルール |
|---|---|
| `src/types/index.ts` | specに型変更を先に記載 → Claude Codeが実装 |
| `src/core/engine.ts` | specに変更内容を先に記載 → Claude Codeが実装 |
| `src/core/config.ts` | 定数変更はClaude Desktopがspecに記載 → Claude Codeが実装 |
| `package.json` | 依存追加はClaude Codeのみ |

---

## エージェント間の依頼フロー

```
新機能が必要なとき:
  各Agent → Claude Desktopに「spec更新依頼」
  Claude Desktop → spec更新
  Claude Code → specを読んで実装

バグ修正のとき:
  Claude Code → 修正実装 → specとの乖離があればClaude Desktopに報告
  Claude Desktop → specを更新

新しいPluginを追加したいとき:
  Geometry/FX/Transition Agent → 自担当ディレクトリに追加
  自動登録（import.meta.glob）で即時反映 → Claude Codeへの依頼不要
```

---

## v2マルチエージェント化チェックリスト

実装前に以下がすべて揃っていること：

- [ ] 全モジュールのspecファイルが存在する
- [ ] 各エージェントが読むべきspecが明記されている
- [ ] 共有ファイルの変更ルールが全エージェントに共有されている
- [ ] `import.meta.glob`による自動登録が機能している（エージェント間調整不要）
- [ ] テストがグリーン（エージェントの実装がspecを満たしているか自動検証）
