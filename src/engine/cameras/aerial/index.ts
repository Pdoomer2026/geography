import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import type { CameraPlugin } from '../../../types'

/**
 * AerialCameraPlugin ファクトリ
 * spec: docs/spec/camera-plugin.spec.md §3-B
 */
export function createAerialCameraPlugin(): CameraPlugin {
  let _camera: THREE.PerspectiveCamera | null = null
  let _controls: OrbitControls | null = null

  return {
    id: 'aerial-camera',
    name: 'Aerial Camera',
    renderer: 'threejs',
    enabled: true,
    params: {
      height: { value: 20, min: 1, max: 100, label: 'Height' },
    },

    getParameters() {
      return Object.entries(this.params).map(([id, p]) => ({
        id, name: p.label, min: p.min, max: p.max,
        step: (p.max - p.min) / 100,
      }))
    },

    mount(cam: THREE.PerspectiveCamera, renderer: THREE.WebGLRenderer): void {
      _camera = cam
      const h = this.params.height.value
      _camera.position.set(0, h, 0)
      _camera.lookAt(0, 0, 0)
      _controls = new OrbitControls(_camera, renderer.domElement)
      _controls.enableRotate = false
      _controls.enableZoom = true
      _controls.enablePan = true
    },

    update(_delta: number): void {
      _controls?.update()
    },

    dispose(): void {
      _controls?.dispose()
      _controls = null
      _camera = null
    },
  }
}

export default createAerialCameraPlugin
