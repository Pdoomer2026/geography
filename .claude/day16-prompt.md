GeoGraphy Day16を開始します。
まずHANDOVER.mdとCLAUDE.mdを読んで現状を把握してください。
その後、以下の手順で進めてください：
1. `pnpm tsc --noEmit && pnpm test --run` で現状確認（61 tests グリーン確認）
2. `pnpm dev` でブラウザ起動確認
3. `cat .claude/day16-prompt.md` を読んでDay16実装を開始してください
開発スタイル：SDD × CDD
- 実装前に必ず対応する `docs/spec/` ファイルを読むこと
- 完了条件は `pnpm tsc --noEmit`（型エラーゼロ）+ `pnpm test --run`（全テストグリーン）両方通過
- anyは使わない・型エラーは自律修正
- 各ステップ完了ごとに `docs/progress/day16-[機能名].log.md` に追記すること
- プランを提示してから実装を開始すること
