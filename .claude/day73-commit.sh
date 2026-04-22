#!/bin/bash
cd /Users/shinbigan/geography
git commit -m "feat: introduce GeoParamAddress as unified parameter identity (Day73)" \
           -m "GeoParamAddress (geo://layerId/pluginId/paramId) を導入し ParameterStore のキーと MacroAssign の参照を統一。geoParamAddress.ts 新設 / ParameterStore に delete() 追加 / RegisteredParameterWithCC に geoParamAddress フィールド追加 / MacroAssign.paramId を geoParamAddress に変更 / engine.ts initTransportRegistry() で付与 / transportManager store.set() を GeoParamAddress キーに変更 / MacroWindow・Macro8Window UI 対応 / 全テスト更新。効果: レイヤー間 CC 誤作動防止・AI 可読性向上・Sequencer target 指定が geoParamAddress で直接できる"
