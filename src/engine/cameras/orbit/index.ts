import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import type { CameraPlugin } from '../../../application/schema'

/**
 * OrbitCameraPlugin ファクトリ
 *
 * export default はファクトリ関数。
 * getCameraPlugin() が呼ぶたびに独立したクロージャ（_camera/_controls/_angle）を
 * 持つ新インスタンスを生成するため、複数レイヤーへの配布で状態が干渉しない。
 *
 * spec: docs/spec/camera-plugin.spec.md §3-A
 */
export function createOrbitCameraPlugin(): CameraPlugin {
  let _camera: THREE.PerspectiveCamera | null = null
  let _controls: OrbitControls | null = null
  let _angle = 0

  return {
    id: 'orbit-camera',
    name: 'Orbit Camera',
    renderer: 'threejs',
    enabled: true,
    params: {
      radius:     { value: 10,  min: 1,   max: 50,  label: 'Radius' },
      height:     { value: 3,   min: -20, max: 30,  label: 'Height' },
      speed:      { value: 0.5, min: 0.0, max: 3.0, label: 'Speed' },
      autoRotate: { value: 1,   min: 0,   max: 1,   label: 'Auto Rotate' },
    },

    getParameters() {
      return Object.entries(this.params).map(([id, p]) => ({
        id, name: p.label, min: p.min, max: p.max,
        step: (p.max - p.min) / 100,
      }))
    },

    mount(cam: THREE.PerspectiveCamera, renderer: THREE.WebGLRenderer): void {
      _camera = cam
      _angle = 0
      const r = this.params.radius.value
      const h = this.params.height.value
      _camera.position.set(r, h, 0)
      _camera.lookAt(0, 0, 0)
      _controls = new OrbitControls(_camera, renderer.domElement)
      _controls.enabled = this.params.autoRotate.value < 0.5
    },

    update(delta: number): void {
      if (!_camera) return
      const autoRotate = this.params.autoRotate.value >= 0.5
      if (autoRotate) {
        _angle += this.params.speed.value * delta
        const r = this.params.radius.value
        const h = this.params.height.value
        _camera.position.set(
          Math.cos(_angle) * r,
          h,
          Math.sin(_angle) * r,
        )
        _camera.lookAt(0, 0, 0)
      } else {
        if (_controls) {
          _controls.enabled = true
          _controls.update()
        }
      }
    },

    dispose(): void {
      _controls?.dispose()
      _controls = null
      _camera = null
      _angle = 0
    },
  }
}

// import.meta.glob の収集用に default export も必要
// （Registry がファクトリ関数として認識するため）
export default createOrbitCameraPlugin
