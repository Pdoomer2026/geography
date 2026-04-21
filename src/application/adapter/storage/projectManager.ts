/**
 * ProjectManager
 * Day60: App.tsx からファイル操作ロジックを引き剥がす
 *
 * 責務:
 *   - currentFilePath の管理
 *   - New / Open / Save / SaveAs の実行
 *   - window.geoAPI への委譲
 *   - engine.buildProject / engine.restoreProject の呼び出し
 *
 * 責務外:
 *   - UI 表示（React に残る）
 *   - 録画（engine が持つ）
 */

import { engine } from '../../orchestrator/engine'
import type { GeoGraphyProject } from '../../schema'

class ProjectManagerImpl {
  private currentFilePath: string | null = null

  getCurrentFilePath(): string | null {
    return this.currentFilePath
  }

  newProject(): void {
    engine.restoreProject({
      version: '1.0.0',
      name: 'untitled',
      savedAt: '',
      setup: {
        geometry: [],
        camera: ['static-camera', 'static-camera', 'static-camera'],
        fx: { 'layer-1': [], 'layer-2': [], 'layer-3': [] },
      },
      sceneState: { layers: [] },
      assignRegistryState: [],
      presetRefs: {},
    })
    this.currentFilePath = null
  }

  openProject(filePath: string, data: string): void {
    try {
      const project = JSON.parse(data) as GeoGraphyProject
      engine.restoreProject(project)
      this.currentFilePath = filePath
    } catch (e) {
      console.warn('[GeoGraphy] プロジェクトの読み込みに失敗:', e)
    }
  }

  async save(): Promise<void> {
    if (!window.geoAPI) return
    if (!this.currentFilePath) {
      // SaveAs にフォールバック（geoAPI 側でダイアログを開く）
      window.geoAPI.onMenuEvents({ onSaveAs: (path: string) => this.saveAs(path) })
      return
    }
    const name =
      this.currentFilePath.split('/').pop()?.replace(/\.geography$/, '') ?? 'untitled'
    const project = engine.buildProject(name)
    await window.geoAPI.saveProjectFile(
      this.currentFilePath,
      JSON.stringify(project, null, 2),
    )
  }

  async saveAs(filePath: string): Promise<void> {
    if (!window.geoAPI) return
    const name = filePath.split('/').pop()?.replace(/\.geography$/, '') ?? 'untitled'
    const project = engine.buildProject(name)
    await window.geoAPI.saveProjectFile(filePath, JSON.stringify(project, null, 2))
    this.currentFilePath = filePath
  }
}

export const projectManager = new ProjectManagerImpl()
