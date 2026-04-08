#!/bin/bash
cd /Users/shinbigan/geography && git add -A && git commit \
  -m "docs: restore and complete spec/CLAUDE.md for Day50 (Day50)" \
  -m "write_fileで内容が失われたspec/CLAUDE.mdを元アーカイブから復元。
macro-knob.spec.md: 5〜12セクションを完全復元・Day50変更を統合。
simple-window.spec.md: References・説明文を復元。
6つのCLAUDE.mdを新アーキテクチャに更新。
差分保持ルールをルートCLAUDE.mdに追記（Day50確立）。"
