import * as THREE from 'three'

interface StarfieldParams {
  speed: number
  size: number
  opacity: number
  depth: number
}

export class StarfieldParticle {
  private geometry: THREE.BufferGeometry
  private material: THREE.PointsMaterial
  private points: THREE.Points
  private positions: Float32Array
  private readonly count: number
  private readonly halfDepth: number

  constructor(count: number, depth: number) {
    this.count = count
    this.halfDepth = depth / 2

    // バッファは一度だけアロケート
    this.positions = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
      this.positions[i * 3]     = (Math.random() - 0.5) * 60  // x
      this.positions[i * 3 + 1] = (Math.random() - 0.5) * 40  // y
      this.positions[i * 3 + 2] = (Math.random() - 0.5) * depth  // z
    }

    this.geometry = new THREE.BufferGeometry()
    this.geometry.setAttribute(
      'position',
      new THREE.BufferAttribute(this.positions, 3)
    )

    this.material = new THREE.PointsMaterial({
      color: 0xa0c4ff,
      size: 0.05,
      transparent: true,
      opacity: 0.6,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    })

    this.points = new THREE.Points(this.geometry, this.material)
  }

  getPoints(): THREE.Points {
    return this.points
  }

  update(delta: number, params: StarfieldParams): void {
    this.material.size = params.size
    this.material.opacity = params.opacity

    const posAttr = this.geometry.attributes.position as THREE.BufferAttribute

    for (let i = 0; i < this.count; i++) {
      // Z 軸方向に手前（正方向）へ移動
      this.positions[i * 3 + 2] += params.speed * delta * 10

      // 手前端を超えたら奥にリセット
      if (this.positions[i * 3 + 2] > this.halfDepth) {
        this.positions[i * 3]     = (Math.random() - 0.5) * 60
        this.positions[i * 3 + 1] = (Math.random() - 0.5) * 40
        this.positions[i * 3 + 2] = -this.halfDepth
      }
    }

    // 忘れると星が動かない
    posAttr.needsUpdate = true
  }

  dispose(): void {
    this.geometry.dispose()
    this.material.dispose()
  }
}
