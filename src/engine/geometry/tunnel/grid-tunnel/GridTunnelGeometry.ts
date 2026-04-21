import * as THREE from 'three'

/**
 * GridTunnelGeometry
 *
 * 円周を多角形で近似したリングを Z 方向に並べ、
 * トンネルを前進する感覚を演出する。
 *
 * 実装方針:
 * - rings 枚の LineLoop（多角形リング）を Z 方向に等間隔配置
 * - update() で各リングの Z を前進方向にずらし、末尾に来たら先頭に折り返す
 * - 縦線（ストライプ）も追加してトンネルのグリッド感を強調
 */
export class GridTunnelGeometry {
  private group: THREE.Group
  private ringMeshes: THREE.LineLoop[] = []
  private stripeMeshes: THREE.Line[] = []
  private material: THREE.LineBasicMaterial
  private ringCount: number
  private spacing: number
  private radius: number
  private segments: number
  private totalLength: number

  constructor(params: {
    radius: number
    segments: number
    rings: number
    length: number
    hue: number
  }) {
    const { radius, segments, rings, length, hue } = params

    this.group = new THREE.Group()
    this.ringCount = rings
    this.spacing = length / rings
    this.radius = radius
    this.segments = segments
    this.totalLength = length

    this.material = new THREE.LineBasicMaterial({
      color: new THREE.Color().setHSL(hue / 360, 1.0, 0.5),
    })

    this.buildRings()
    this.buildStripes()
  }

  private buildRings(): void {
    for (let i = 0; i < this.ringCount; i++) {
      const geo = new THREE.BufferGeometry()
      const points: number[] = []

      for (let j = 0; j <= this.segments; j++) {
        const angle = (j / this.segments) * Math.PI * 2
        points.push(
          Math.cos(angle) * this.radius,
          Math.sin(angle) * this.radius,
          0,
        )
      }

      geo.setAttribute('position', new THREE.Float32BufferAttribute(points, 3))
      const ring = new THREE.LineLoop(geo, this.material)
      ring.position.z = -i * this.spacing
      this.ringMeshes.push(ring)
      this.group.add(ring)
    }
  }

  private buildStripes(): void {
    // segments 本の縦線でグリッド感を強調
    for (let j = 0; j < this.segments; j++) {
      const angle = (j / this.segments) * Math.PI * 2
      const x = Math.cos(angle) * this.radius
      const y = Math.sin(angle) * this.radius

      const geo = new THREE.BufferGeometry()
      geo.setAttribute(
        'position',
        new THREE.Float32BufferAttribute([x, y, 0, x, y, -this.totalLength], 3),
      )
      const stripe = new THREE.Line(geo, this.material)
      this.stripeMeshes.push(stripe)
      this.group.add(stripe)
    }
  }

  update(delta: number, params: { speed: number; hue: number }): void {
    const { speed, hue } = params

    // リングを前進方向（+Z）にずらす
    for (const ring of this.ringMeshes) {
      ring.position.z += delta * speed * 10

      // カメラより手前に来たら末尾に送る（ループ）
      if (ring.position.z > 2) {
        ring.position.z -= this.ringCount * this.spacing
      }
    }

    // hue リアルタイム変更
    ;(this.material.color as THREE.Color).setHSL(hue / 360, 1.0, 0.5)
  }

  getGroup(): THREE.Group {
    return this.group
  }

  dispose(): void {
    for (const ring of this.ringMeshes) {
      ring.geometry.dispose()
    }
    for (const stripe of this.stripeMeshes) {
      stripe.geometry.dispose()
    }
    this.material.dispose()
    this.ringMeshes = []
    this.stripeMeshes = []
  }
}
