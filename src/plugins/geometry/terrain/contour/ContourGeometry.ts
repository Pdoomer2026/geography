import * as THREE from 'three'

/**
 * ContourGeometry
 *
 * PlaneGeometry をワイヤーフレームで表示し、
 * 複数のサイン波を重ね合わせて地形的・等高線的な動きを作る。
 *
 * grid-wave との違い:
 * - 波の方向を複数重ねることで「地形ノイズ」に近い見た目
 * - hue パラメーターで色を制御
 * - カメラから見やすいように rotation.x を深めに傾ける
 */
export class ContourGeometry {
  private geometry: THREE.PlaneGeometry
  private material: THREE.MeshBasicMaterial
  private mesh: THREE.Mesh

  constructor(segments: number, size: number, hue: number) {
    this.geometry = new THREE.PlaneGeometry(size, size, segments, segments)
    this.material = new THREE.MeshBasicMaterial({
      color: new THREE.Color().setHSL(hue / 360, 1.0, 0.5),
      wireframe: true,
    })
    this.mesh = new THREE.Mesh(this.geometry, this.material)
    // 斜め上から見た視点で地形らしく見えるよう傾ける
    this.mesh.rotation.x = -Math.PI / 2.8
  }

  update(
    time: number,
    params: { speed: number; scale: number; amplitude: number; hue: number }
  ): void {
    const { speed, scale, amplitude, hue } = params
    const positions = this.geometry.attributes.position

    for (let i = 0; i < positions.count; i++) {
      const x = positions.getX(i)
      const y = positions.getY(i)

      // 複数方向のサイン波を重ねて地形ノイズに近い形状を作る
      const z =
        Math.sin(x * scale + time * speed) * amplitude * 0.5 +
        Math.sin(y * scale * 0.7 + time * speed * 0.8) * amplitude * 0.4 +
        Math.sin((x + y) * scale * 0.5 + time * speed * 1.2) * amplitude * 0.3 +
        Math.cos(x * scale * 1.3 - y * scale * 0.9 + time * speed * 0.6) * amplitude * 0.2

      positions.setZ(i, z)
    }

    positions.needsUpdate = true
    this.geometry.computeVertexNormals()

    // hue 変化をマテリアルに反映
    ;(this.material.color as THREE.Color).setHSL(hue / 360, 1.0, 0.5)
  }

  getMesh(): THREE.Mesh {
    return this.mesh
  }

  dispose(): void {
    this.geometry.dispose()
    this.material.dispose()
  }
}
