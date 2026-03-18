import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import { registry } from '../core/registry'
import gridWavePlugin from '../plugins/geometry/wave/grid-wave'
import starfieldPlugin from '../plugins/particles/starfield'
import ambientPlugin from '../plugins/lights/ambient'
import { SimpleMixer } from '../plugins/windows/simple-mixer/SimpleMixer'

export default function App() {
  const mountRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!mountRef.current) return

    // Plugin を登録
    registry.register(gridWavePlugin)
    const plugin = registry.get('grid-wave')!

    // Scene
    const scene = new THREE.Scene()

    // Camera：波が見えるよう斜め上から見下ろす
    const camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      2000
    )
    camera.position.set(0, 8, 12)
    camera.lookAt(0, 0, 0)

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true })
    renderer.setSize(window.innerWidth, window.innerHeight)
    renderer.setPixelRatio(window.devicePixelRatio)
    mountRef.current.appendChild(renderer.domElement)

    // Plugin 起動
    plugin.create(scene)
    starfieldPlugin.create(scene)
    ambientPlugin.create(scene)

    // OrbitControls
    const controls = new OrbitControls(camera, renderer.domElement)
    controls.enableDamping = true
    controls.dampingFactor = 0.05

    // アニメーションループ
    const clock = new THREE.Clock()
    let animationId: number
    const animate = () => {
      animationId = requestAnimationFrame(animate)
      const delta = clock.getDelta()
      plugin.update(delta, 0)
      starfieldPlugin.update(delta, 0)
      ambientPlugin.update(delta, 0)
      controls.update()
      renderer.render(scene, camera)
    }
    animate()

    return () => {
      cancelAnimationFrame(animationId)
      plugin.destroy(scene)
      starfieldPlugin.destroy(scene)
      ambientPlugin.destroy(scene)
      controls.dispose()
      renderer.dispose()
      if (mountRef.current) {
        mountRef.current.removeChild(renderer.domElement)
      }
    }
  }, [])

  return (
    <>
      <div
        ref={mountRef}
        style={{ width: '100vw', height: '100vh', background: '#000' }}
      />
      <SimpleMixer />
    </>
  )
}
