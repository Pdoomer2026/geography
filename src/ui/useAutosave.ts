/**
 * useAutosave hook
 * spec: docs/spec/project-file.spec.md §2（自動保存）
 *
 * Electron 環境でのみ動作する。
 *
 * 役割:
 *   1. マウント時: autosave.geography が存在すれば engine.restoreProject() で復元
 *   2. main からの 'request-autosave-data' を受信したとき:
 *      engine.buildProject('autosave') → geoAPI.autosave(json) → notify-autosave-complete
 */

import { useEffect } from 'react'
import { engine } from '../application/orchestrator/engine'
import type { GeoGraphyProject } from '../application/schema'

const AUTOSAVE_PROJECT_NAME = 'autosave'

export function useAutosave() {
  useEffect(() => {
    if (!window.geoAPI) return

    const geoAPI = window.geoAPI

    // ── 起動時: autosave.geography があれば復元 ──────────────────
    geoAPI.getAutosave().then((raw) => {
      if (!raw) return
      try {
        const project = JSON.parse(raw) as GeoGraphyProject
        engine.restoreProject(project)
        console.info('[GeoGraphy] autosave を復元しました:', project.savedAt)
      } catch (e) {
        console.warn('[GeoGraphy] autosave の復元に失敗しました:', e)
      }
    })

    // ── 終了時: main からのリクエストを受けて autosave ──────────
    geoAPI.onRequestAutosave(async (sendData) => {
      try {
        const project = engine.buildProject(AUTOSAVE_PROJECT_NAME)
        const json = JSON.stringify(project, null, 2)
        await sendData(json)
        console.info('[GeoGraphy] autosave 完了')
      } catch (e) {
        console.warn('[GeoGraphy] autosave 失敗:', e)
      }
    })

    return () => {
      geoAPI.removeAutosaveListener()
    }
  }, [])
}
