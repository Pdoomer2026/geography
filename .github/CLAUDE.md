# .github - CLAUDE.md

## このフォルダの役割

GitHub の動作を自動化・標準化する設定ファイルを管理します。
コードとは関係なく、GitHub のサーバーが読み込むファイルです。

---

## ファイル構成

```
.github/
├── pull_request_template.md    ← PR 作成時に自動表示されるフォーム
├── ISSUE_TEMPLATE/
│   ├── bug-report.md           ← バグ報告フォーム
│   └── feature-request.md     ← 機能要望フォーム
└── workflows/
    └── ci.yml                  ← CI 自動実行設定
```

---

## PR テンプレートのルール

PR には以下が含まれていること：

- [ ] ブラウザで動作確認済み
- [ ] TypeScript 型エラーなし
- [ ] ESLint エラーなし
- [ ] Vitest テストが通る
- [ ] CLAUDE.md を作成済み（新規プラグインの場合）
- [ ] README.md を作成済み（新規プラグインの場合）
- [ ] template-basic.md を作成済み（新規 Geometry / FX の場合）
- [ ] template-all.md を作成済み（新規 Geometry / FX の場合）
- [ ] スクリーンショットまたは動画を添付

---

## CI（GitHub Actions）の設定

```yaml
# ci.yml が実行すること
- pnpm install
- TypeScript 型チェック（tsc --noEmit）
- ESLint
- Vitest
- Vercel プレビューデプロイ
```

CI が失敗した PR はマージしない。

---

## OSS 運営の基本方針

- Issue は丁寧に対応する・初めてのコントリビューターを歓迎する
- PR レビューは1週間以内を目標にする
- 悪意あるコードは即座にクローズする
- MIDI マッピング .md の PR は基本的にマージする（テキストファイルのみ・リスク低）
- Geometry / FX Plugin の PR は動作確認を必ず行う
