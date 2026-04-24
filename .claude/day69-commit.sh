cd /Users/shinbigan/geography && git add -A && git commit -m "feat: add ParamCatalogRegistry (Day69)" \
  -m "feat: paramCatalogRegistry を新設（application/catalog/paramCatalogRegistry.ts）
refactor: registry.register() 時に catalog が存在すれば自動登録する仕組みを追加
コントリビューターは config.ts に catalog を書くだけで SDK から参照可能になる
UI / SDK は paramCatalogRegistry.get(pluginId) でカタログを取得できる"
