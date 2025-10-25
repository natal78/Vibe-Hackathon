import { Color4, Vector3, Quaternion } from '@dcl/sdk/math'
import { engine, Entity, Transform, MeshRenderer, Material, Name, AudioSource } from '@dcl/sdk/ecs'

// ===============================
// Scene configuration constants
// ===============================
const GRID_ROWS = 10
const GRID_COLS = 10
const GRID_SPACING = 6

const TOMB_BASE_SIZE = Vector3.create(2.6, 0.5, 1.4)
const TOMB_STONE_SIZE = Vector3.create(1.4, 1.6, 0.25)

const LAMP_COUNT = 4
const LAMP_HEIGHT = 3.2

const TREE_COUNT = 0

// (Fluorescent palette removed per request)

function applyStoneBaseMaterial(target: Entity): void {
	Material.setPbrMaterial(target, {
		albedoColor: Color4.create(0.15, 0.15, 0.18, 1),
		metallic: 0.0,
		roughness: 0.9,
		emissiveColor: Color4.Black(),
		emissiveIntensity: 0
	})
}

function applyStoneHeadstoneMaterial(target: Entity): void {
	Material.setPbrMaterial(target, {
		albedoColor: Color4.create(0.20, 0.20, 0.22, 1),
		metallic: 0.0,
		roughness: 0.95,
		// no emissive on headstone; glow will come from grave base
		emissiveColor: Color4.Black(),
		emissiveIntensity: 0.0
	})
}

function applyIronMaterial(target: Entity): void {
	Material.setPbrMaterial(target, {
		albedoColor: Color4.create(0.06, 0.06, 0.07, 1),
		metallic: 0.6,
		roughness: 0.3
	})
}

// ===============================
// Deterministic PRNG (mulberry32)
// ===============================
function mulberry32(seed: number): () => number {
	let t = seed >>> 0
	return () => {
		t += 0x6D2B79F5
		let x = Math.imul(t ^ (t >>> 15), 1 | t)
		x ^= x + Math.imul(x ^ (x >>> 7), 61 | x)
		return ((x ^ (x >>> 14)) >>> 0) / 4294967296
	}
}

// ===============================
// Helpers
// ===============================
// (Neon color picker removed per request)

function createTomb(position: Vector3, rng: () => number): void {
	// Base (stone slab)
	const base = engine.addEntity()
	Name.create(base, { value: 'TombBase' })
	Transform.create(base, {
		position: Vector3.create(position.x, position.y, position.z),
		scale: Vector3.create(TOMB_BASE_SIZE.x, TOMB_BASE_SIZE.y, TOMB_BASE_SIZE.z)
	})
	MeshRenderer.setBox(base)
	applyStoneBaseMaterial(base)

	// Subtle underglow from the grave (thin emissive slab slightly above ground)
	const glow = engine.addEntity()
	Name.create(glow, { value: 'GraveGlow' })
	Transform.create(glow, {
		parent: base,
		position: Vector3.create(0, TOMB_BASE_SIZE.y * -0.5 + 0.04, 0),
		scale: Vector3.create(TOMB_BASE_SIZE.x * 0.9, 0.02, TOMB_BASE_SIZE.z * 0.9)
	})
	MeshRenderer.setBox(glow)
	Material.setPbrMaterial(glow, {
		albedoColor: Color4.create(0.0, 0.0, 0.0, 1),
		emissiveColor: Color4.create(0.30, 1.0, 0.70, 1),
		emissiveIntensity: 0.7,
		metallic: 0,
		roughness: 1.0
	})

	// Very faint outer halo for a softer spill
	const halo = engine.addEntity()
	Name.create(halo, { value: 'GraveGlowHalo' })
	Transform.create(halo, {
		parent: base,
		position: Vector3.create(0, TOMB_BASE_SIZE.y * -0.5 + 0.035, 0),
		scale: Vector3.create(TOMB_BASE_SIZE.x * 1.05, 0.01, TOMB_BASE_SIZE.z * 1.05)
	})
	MeshRenderer.setBox(halo)
	Material.setPbrMaterial(halo, {
		albedoColor: Color4.create(0.0, 0.0, 0.0, 1),
		emissiveColor: Color4.create(0.30, 1.0, 0.70, 1),
		emissiveIntensity: 0.08,
		metallic: 0,
		roughness: 1.0
	})

	// Tombstone main slab (upright)
	const stone = engine.addEntity()
	Name.create(stone, { value: 'TombStone' })
	Transform.create(stone, {
		position: Vector3.create(
			position.x,
			position.y + TOMB_BASE_SIZE.y / 2 + TOMB_STONE_SIZE.y / 2,
			position.z - (TOMB_BASE_SIZE.z * 0.15)
		),
		scale: Vector3.create(TOMB_STONE_SIZE.x, TOMB_STONE_SIZE.y, TOMB_STONE_SIZE.z)
	})
	MeshRenderer.setBox(stone)

	// Slight random tilt for creepiness
	const tilt = (rng() - 0.5) * 0.06
	const yaw = (rng() - 0.5) * 0.12
	Transform.getMutable(stone).rotation = Quaternion.fromEulerDegrees(tilt * 57.2958, yaw * 57.2958, 0)

	applyStoneHeadstoneMaterial(stone)

	// (Top arch removed per request)

	// (Epitaph text removed per request)
}

function createLamppost(position: Vector3): void {
	// Pole
	const pole = engine.addEntity()
	Name.create(pole, { value: 'LamppostPole' })
	Transform.create(pole, {
		position,
		scale: Vector3.create(0.12, LAMP_HEIGHT, 0.12)
	})
	MeshRenderer.setCylinder(pole)
	Material.setPbrMaterial(pole, {
		albedoColor: Color4.create(0.05, 0.05, 0.06, 1),
		metallic: 0.2,
		roughness: 0.8
	})

	// Head (emissive to simulate light)
	const head = engine.addEntity()
	Name.create(head, { value: 'LamppostHead' })
	Transform.create(head, {
		position: Vector3.create(position.x, position.y + LAMP_HEIGHT + 0.15, position.z),
		scale: Vector3.create(0.35, 0.22, 0.35)
	})
	MeshRenderer.setBox(head)
	Material.setPbrMaterial(head, {
		albedoColor: Color4.create(0.2, 0.18, 0.12, 1),
		emissiveColor: Color4.create(1.0, 0.85, 0.55, 1),
		emissiveIntensity: 1.0,
		metallic: 0,
		roughness: 0.3
	})
}

function createTree(position: Vector3, rng: () => number): void {
	// Trunk
	const trunk = engine.addEntity()
	Name.create(trunk, { value: 'TreeTrunk' })
	const height = 2.6 + rng() * 1.6
	Transform.create(trunk, {
		position,
		scale: Vector3.create(0.18, height, 0.18)
	})
	MeshRenderer.setCylinder(trunk)
	Material.setPbrMaterial(trunk, {
		albedoColor: Color4.create(0.08, 0.07, 0.06, 1),
		metallic: 0,
		roughness: 0.9
	})

	// Sparse crown (dark spheres) offset above trunk top
	const clumps = 2 + Math.floor(rng() * 3)
	for (let i = 0; i < clumps; i++) {
		const leaf = engine.addEntity()
		Name.create(leaf, { value: 'TreeLeaf' })
		const r = 0.5 + rng() * 0.5
		Transform.create(leaf, {
			position: Vector3.create(
				position.x + (rng() - 0.5) * 0.6,
				position.y + height + 0.3 + rng() * 0.6,
				position.z + (rng() - 0.5) * 0.6
			),
			scale: Vector3.create(r, r * (0.8 + rng() * 0.4), r)
		})
		MeshRenderer.setSphere(leaf)
		Material.setPbrMaterial(leaf, {
			albedoColor: Color4.create(0.03, 0.04, 0.03, 1),
			metallic: 0,
			roughness: 0.9
		})
	}
}

function createFence(halfWidth: number, halfDepth: number): void {
	const margin = 2
	const hw = halfWidth + margin
	const hd = halfDepth + margin
	const postHeight = 1.8
	const postRadius = 0.06
	const railThickness = 0.06
	const railDepth = 0.08
	const railY1 = 0.6
	const railY2 = 1.2
	const postSpacing = 2.5
 	const outward = 0.2 // small outward offset for visibility on back/right

	function placePost(x: number, z: number): void {
		const post = engine.addEntity()
		Name.create(post, { value: 'FencePost' })
		Transform.create(post, {
			position: Vector3.create(x, postHeight / 2, z),
			scale: Vector3.create(postRadius, postHeight, postRadius)
		})
		MeshRenderer.setCylinder(post)
		applyIronMaterial(post)

		// small cap
		const cap = engine.addEntity()
		Name.create(cap, { value: 'FencePostCap' })
		Transform.create(cap, {
			position: Vector3.create(x, postHeight + 0.06, z),
			scale: Vector3.create(0.08, 0.08, 0.08)
		})
		MeshRenderer.setSphere(cap)
		applyIronMaterial(cap)
	}

	function placeRail(x1: number, z1: number, x2: number, z2: number, y: number): void {
		const len = Math.hypot(x2 - x1, z2 - z1)
		const mid = Vector3.create((x1 + x2) / 2, y, (z1 + z2) / 2)
		const rail = engine.addEntity()
		Name.create(rail, { value: 'FenceRail' })
		// Determine rotation: rails only axis-aligned in this scene
		const alongX = Math.abs(x2 - x1) > Math.abs(z2 - z1)
		Transform.create(rail, {
			position: mid,
			scale: Vector3.create(alongX ? len : railDepth, railThickness, alongX ? railDepth : len)
		})
		MeshRenderer.setBox(rail)
		applyIronMaterial(rail)
	}

	// Posts along rectangle perimeter
	function postsAlongEdge(x1: number, z1: number, x2: number, z2: number): void {
		const len = Math.hypot(x2 - x1, z2 - z1)
		const steps = Math.max(1, Math.floor(len / postSpacing))
		for (let i = 0; i <= steps; i++) {
			const t = i / steps
			const x = x1 + (x2 - x1) * t
			const z = z1 + (z2 - z1) * t
			placePost(x, z)
		}
	}

	// Four edges
	// Bottom edge (-hd)
	postsAlongEdge(-hw, -hd, hw, -hd)
	placeRail(-hw, -hd, hw, -hd, railY1)
	placeRail(-hw, -hd, hw, -hd, railY2)

	// Top edge (+hd)
	postsAlongEdge(-hw, hd, hw, hd)
	placeRail(-hw, hd, hw, hd, railY1)
	placeRail(-hw, hd, hw, hd, railY2)
	// duplicate rails slightly outward for visibility
	placeRail(-hw, hd + outward, hw, hd + outward, railY1)
	placeRail(-hw, hd + outward, hw, hd + outward, railY2)

	// Left edge (-hw)
	postsAlongEdge(-hw, -hd, -hw, hd)
	placeRail(-hw, -hd, -hw, hd, railY1)
	placeRail(-hw, -hd, -hw, hd, railY2)

	// Right edge (+hw)
	postsAlongEdge(hw, -hd, hw, hd)
	placeRail(hw, -hd, hw, hd, railY1)
	placeRail(hw, -hd, hw, hd, railY2)
	// duplicate rails slightly outward for visibility
	placeRail(hw + outward, -hd, hw + outward, hd, railY1)
	placeRail(hw + outward, -hd, hw + outward, hd, railY2)
}

// ===============================
// Ghost
// ===============================
let ghostRoot: Entity | null = null
let ghostTime = 0
let ghostBodyParts: Entity[] = []
let ghostSkirtParts: { e: Entity; baseY: number; phase: number }[] = []
let ghostEyes: Entity[] = []
let ghostEyeBleeds: Entity[] = []
let ghostSound: Entity | null = null


function applyGhostMaterial(target: Entity, alpha: number, intensity: number): void {
	Material.setPbrMaterial(target, {
		albedoColor: Color4.create(0.95, 0.95, 0.95, alpha),
		emissiveColor: Color4.create(0.9, 0.95, 1.0, 1),
		emissiveIntensity: intensity,
		metallic: 0,
		roughness: 0.2
	})
}

// ===============================
// Crawling corpse
// ===============================
type Crawler = {
	root: Entity
	head: Entity
	armL: Entity
	armR: Entity
	speed: number
	t: number
	dir: number // 0: +X, 1: -X, 2: +Z, 3: -Z
}

// ===============================
// Moving human-like ground shadows (simulated)
// ===============================
type ShadowPerson = {
	root: Entity
	parts: Entity[]
	center: Vector3
	radius: number
	speed: number
	angle: number
}

const shadowPeople: ShadowPerson[] = []

function shadowMat(target: Entity, alpha: number): void {
	Material.setPbrMaterial(target, {
		albedoColor: Color4.create(0.08, 0.08, 0.08, alpha),
		metallic: 0,
		roughness: 1
	})
}

function createShadowPerson(center: Vector3, radius: number, speed: number, initialAngle: number): void {
	const root = engine.addEntity()
	Name.create(root, { value: 'ShadowRoot' })
	Transform.create(root, { position: Vector3.create(center.x + radius, 0.05, center.z), scale: Vector3.create(1.25, 1.0, 1.25) })

	const parts: Entity[] = []
	// Head
	const head = engine.addEntity()
	Name.create(head, { value: 'ShadowHead' })
	Transform.create(head, { parent: root, position: Vector3.create(0, 0, 0), scale: Vector3.create(0.18, 0.01, 0.18) })
	MeshRenderer.setSphere(head)
	shadowMat(head, 0.55)
	parts.push(head)
	// Torso
	const torso = engine.addEntity()
	Name.create(torso, { value: 'ShadowTorso' })
	Transform.create(torso, { parent: root, position: Vector3.create(0, 0, -0.22), scale: Vector3.create(0.22, 0.01, 0.36) })
	MeshRenderer.setBox(torso)
	shadowMat(torso, 0.55)
	parts.push(torso)
	// Legs (two ovals)
	const legL = engine.addEntity()
	Name.create(legL, { value: 'ShadowLegL' })
	Transform.create(legL, { parent: root, position: Vector3.create(-0.08, 0, -0.48), scale: Vector3.create(0.12, 0.01, 0.28) })
	MeshRenderer.setBox(legL)
	shadowMat(legL, 0.5)
	parts.push(legL)
	const legR = engine.addEntity()
	Name.create(legR, { value: 'ShadowLegR' })
	Transform.create(legR, { parent: root, position: Vector3.create(0.08, 0, -0.48), scale: Vector3.create(0.12, 0.01, 0.28) })
	MeshRenderer.setBox(legR)
	shadowMat(legR, 0.5)
	parts.push(legR)

	shadowPeople.push({ root, parts, center, radius, speed, angle: initialAngle })
}

function updateShadows(dt: number): void {
	for (const s of shadowPeople) {
		s.angle += s.speed * dt
		const x = s.center.x + Math.cos(s.angle) * s.radius
		const z = s.center.z + Math.sin(s.angle) * s.radius
		const pos = Transform.getMutable(s.root).position
		pos.x = x
		pos.y = 0.01
		pos.z = z

		// Simple gait: swing leg offsets along tangent
		const stride = Math.sin(s.angle * 2.4) * 0.06
		for (const part of s.parts) {
			const tm = Transform.getMutable(part)
			// Slight stretch with speed to simulate motion blur
			if (Name.get(part).value === 'ShadowLegL') {
				tm.position.x = -0.08 - stride
			} else if (Name.get(part).value === 'ShadowLegR') {
				tm.position.x = 0.08 + stride
			}
		}
	}
}

// ===============================
// Crawling shadow field
// ===============================
type ShadowBlob = {
	e: Entity
	center: Vector3
	radius: number
	angle: number
	speed: number
	scale: number
	alpha: number
}

// ===============================
// Grey cloud layer above the graves
// ===============================
type CloudBlob = {
	e: Entity
	center: Vector3
	offset: Vector3
	speed: number
	scale: Vector3
}

const cloudBlobs: CloudBlob[] = []

function cloudMat(target: Entity, alpha: number): void {
	Material.setPbrMaterial(target, {
		albedoColor: Color4.create(0.5, 0.5, 0.5, alpha),
		metallic: 0,
		roughness: 1.0,
		emissiveColor: Color4.create(0.08, 0.08, 0.08, 1),
		emissiveIntensity: 0.02
	})
}

function createCloudField(center: Vector3, halfWidth: number, halfDepth: number, height: number, count: number): void {
	for (let i = 0; i < count; i++) {
		const x = center.x + (Math.random() * 2 - 1) * (halfWidth * 0.9)
		const z = center.z + (Math.random() * 2 - 1) * (halfDepth * 0.9)
		const y = height + (Math.random() * 0.6 - 0.3)
		const e = engine.addEntity()
		Name.create(e, { value: 'GraveCloud' })
		const sx = 1.2 + Math.random() * 2.0
		const sy = 0.6 + Math.random() * 0.8
		const sz = 1.2 + Math.random() * 2.0
		Transform.create(e, { position: Vector3.create(x, y, z), scale: Vector3.create(sx, sy, sz) })
		MeshRenderer.setSphere(e)
		cloudMat(e, 0.35 + Math.random() * 0.15)
		cloudBlobs.push({ e, center: Vector3.create(center.x, height, center.z), offset: Vector3.create(x - center.x, 0, z - center.z), speed: 0.1 + Math.random() * 0.15, scale: Vector3.create(sx, sy, sz) })
	}
}

function updateCloud(dt: number): void {
	// very slow drift in a circular pattern
	for (let i = 0; i < cloudBlobs.length; i++) {
		const b = cloudBlobs[i]
		const t = (i * 0.3) + (Date.now() % 100000) / 100000 * Math.PI * 2
		const driftX = Math.cos(t) * 0.2
		const driftZ = Math.sin(t) * 0.2
		const tm = Transform.getMutable(b.e)
		tm.position.x = b.center.x + b.offset.x + driftX
		tm.position.z = b.center.z + b.offset.z + driftZ
		// gentle vertical pulsing
		tm.position.y = b.center.y + Math.sin(t * 1.3) * 0.15
	}
}

const shadowCrawl: ShadowBlob[] = []

function createShadowBlob(center: Vector3, radius: number, angle: number, speed: number, scale: number, alpha: number): void {
	const e = engine.addEntity()
	Name.create(e, { value: 'ShadowBlob' })
	Transform.create(e, { position: Vector3.create(center.x + Math.cos(angle) * radius, 0.03, center.z + Math.sin(angle) * radius), scale: Vector3.create(scale, 0.01, scale * 1.6) })
	MeshRenderer.setBox(e)
	shadowMat(e, alpha)
	shadowCrawl.push({ e, center, radius, angle, speed, scale, alpha })
}

function createShadowCrawlField(center: Vector3, innerRadius: number, outerRadius: number, count: number): void {
	for (let i = 0; i < count; i++) {
		const r = innerRadius + Math.random() * Math.max(0.1, (outerRadius - innerRadius))
		const a = Math.random() * Math.PI * 2
		const s = 0.12 + Math.random() * 0.25
		const alpha = 0.35 + Math.random() * 0.25
		const speed = (Math.random() * 0.4 + 0.1) * (Math.random() < 0.5 ? 1 : -1)
		createShadowBlob(center, r, a, speed, s, alpha)
	}
}

function updateShadowCrawl(dt: number): void {
	for (const b of shadowCrawl) {
		b.angle += b.speed * dt
		// slight radial breathing
		const rOffset = Math.sin(b.angle * 1.7) * 0.4
		const r = Math.max(0.1, b.radius + rOffset)
		const x = b.center.x + Math.cos(b.angle) * r
		const z = b.center.z + Math.sin(b.angle) * r
		const tm = Transform.getMutable(b.e)
		tm.position.x = x
		tm.position.y = 0.03
		tm.position.z = z
		// subtle scale/alpha pulse
		const pulse = 0.9 + 0.2 * Math.sin(b.angle * 2.3)
		tm.scale.x = b.scale * pulse
		tm.scale.z = b.scale * 1.6 * (1.05 - 0.1 * Math.sin(b.angle * 1.3))
	}
}
let crawler: Crawler | null = null

function corpseMat(target: Entity): void {
	Material.setPbrMaterial(target, {
		albedoColor: Color4.create(0.55, 0.5, 0.48, 1),
		metallic: 0,
		roughness: 0.9
	})
}

function createCrawler(start: Vector3, dir: number): void {
	crawler = null
	const root = engine.addEntity()
	Name.create(root, { value: 'CrawlerRoot' })
	Transform.create(root, { position: start, scale: Vector3.create(1, 1, 1) })

	// Head
	const head = engine.addEntity()
	Name.create(head, { value: 'CrawlerHead' })
	Transform.create(head, { parent: root, position: Vector3.create(0, 0.22, 0.1), scale: Vector3.create(0.24, 0.22, 0.28) })
	MeshRenderer.setSphere(head)
	corpseMat(head)

	// Torso (short, torn back edge)
	const torso = engine.addEntity()
	Name.create(torso, { value: 'CrawlerTorso' })
	Transform.create(torso, { parent: root, position: Vector3.create(0, 0.16, -0.10), scale: Vector3.create(0.36, 0.16, 0.36) })
	MeshRenderer.setBox(torso)
	corpseMat(torso)

	// Arms forward
	const armL = engine.addEntity()
	Name.create(armL, { value: 'CrawlerArmL' })
	Transform.create(armL, { parent: root, position: Vector3.create(-0.22, 0.12, 0.24), rotation: Quaternion.fromEulerDegrees(0, 0, 18), scale: Vector3.create(0.08, 0.36, 0.08) })
	MeshRenderer.setCylinder(armL)
	corpseMat(armL)

	const armR = engine.addEntity()
	Name.create(armR, { value: 'CrawlerArmR' })
	Transform.create(armR, { parent: root, position: Vector3.create(0.22, 0.12, 0.24), rotation: Quaternion.fromEulerDegrees(0, 0, -18), scale: Vector3.create(0.08, 0.36, 0.08) })
	MeshRenderer.setCylinder(armR)
	corpseMat(armR)

	// No legs: half-torso crawler
	crawler = { root, head, armL, armR, speed: 0.5, t: 0, dir }
}

function updateCrawler(dt: number): void {
	if (!crawler) return
	crawler.t += dt
	const crawl = Math.sin(crawler.t * 4)
	// Wiggle head and arms
	Transform.getMutable(crawler.head).rotation = Quaternion.fromEulerDegrees(10 + crawl * 6, Math.sin(crawler.t * 2) * 4, 0)
	Transform.getMutable(crawler.armL).rotation = Quaternion.fromEulerDegrees(0, 0, 10 + Math.max(0, crawl) * 25)
	Transform.getMutable(crawler.armR).rotation = Quaternion.fromEulerDegrees(0, 0, -10 + Math.max(0, -crawl) * -25)

	// Move root forward along chosen dir
	const rp = Transform.getMutable(crawler.root).position
	const step = crawler.speed * dt
	switch (crawler.dir) {
		case 0: rp.x += step; break
		case 1: rp.x -= step; break
		case 2: rp.z += step; break
		case 3: rp.z -= step; break
	}
}
function createGhost(centerX: number, centerZ: number, radius: number, height: number): void {
	ghostRoot = engine.addEntity()
	Name.create(ghostRoot, { value: 'GhostRoot' })
	Transform.create(ghostRoot, {
		position: Vector3.create(centerX + radius, height, centerZ),
		scale: Vector3.create(1, 1, 1)
	})

	ghostBodyParts = []
	ghostSkirtParts = []
 	ghostEyes = []
 	ghostEyeBleeds = []

	// Head (sphere)
	const head = engine.addEntity()
	Name.create(head, { value: 'GhostHead' })
	Transform.create(head, {
		parent: ghostRoot,
		position: Vector3.create(0, 0.85, 0),
		scale: Vector3.create(0.48, 0.55, 0.48)
	})
	MeshRenderer.setSphere(head)
	applyGhostMaterial(head, 0.4, 0.35)
	ghostBodyParts.push(head)

	// Torso (vertical cylinder)
	const torso = engine.addEntity()
	Name.create(torso, { value: 'GhostTorso' })
	Transform.create(torso, {
		parent: ghostRoot,
		position: Vector3.create(0, 0.2, 0),
		scale: Vector3.create(0.38, 1.0, 0.28)
	})
	MeshRenderer.setCylinder(torso)
	applyGhostMaterial(torso, 0.34, 0.3)
	ghostBodyParts.push(torso)

	// Arms (angled cylinders)
	const armL = engine.addEntity()
	Name.create(armL, { value: 'GhostArmL' })
	Transform.create(armL, {
		parent: ghostRoot,
		position: Vector3.create(-0.36, 0.35, 0),
		rotation: Quaternion.fromEulerDegrees(0, 0, 20),
		scale: Vector3.create(0.09, 0.55, 0.09)
	})
	MeshRenderer.setCylinder(armL)
	applyGhostMaterial(armL, 0.28, 0.25)
	ghostBodyParts.push(armL)

	const armR = engine.addEntity()
	Name.create(armR, { value: 'GhostArmR' })
	Transform.create(armR, {
		parent: ghostRoot,
		position: Vector3.create(0.36, 0.35, 0),
		rotation: Quaternion.fromEulerDegrees(0, 0, -20),
		scale: Vector3.create(0.09, 0.55, 0.09)
	})
	MeshRenderer.setCylinder(armR)
	applyGhostMaterial(armR, 0.28, 0.25)
	ghostBodyParts.push(armR)

	// Legs (cylinders)
	const legL = engine.addEntity()
	Name.create(legL, { value: 'GhostLegL' })
	Transform.create(legL, {
		parent: ghostRoot,
		position: Vector3.create(-0.14, -0.35, 0.02),
		rotation: Quaternion.fromEulerDegrees(5, 0, 2),
		scale: Vector3.create(0.10, 0.6, 0.10)
	})
	MeshRenderer.setCylinder(legL)
	applyGhostMaterial(legL, 0.26, 0.22)
	ghostBodyParts.push(legL)

	const legR = engine.addEntity()
	Name.create(legR, { value: 'GhostLegR' })
	Transform.create(legR, {
		parent: ghostRoot,
		position: Vector3.create(0.14, -0.35, 0.02),
		rotation: Quaternion.fromEulerDegrees(-3, 0, -2),
		scale: Vector3.create(0.10, 0.6, 0.10)
	})
	MeshRenderer.setCylinder(legR)
	applyGhostMaterial(legR, 0.26, 0.22)
	ghostBodyParts.push(legR)

	// Clear any previous skirt pieces
	ghostSkirtParts = []

	// Eyes (dark voids with tiny glow)
	const eyeL = engine.addEntity()
	Name.create(eyeL, { value: 'GhostEyeL' })
	Transform.create(eyeL, {
		parent: ghostRoot,
		position: Vector3.create(-0.16, 0.78, -0.47),
		scale: Vector3.create(0.08, 0.08, 0.08)
	})
	MeshRenderer.setSphere(eyeL)
	Material.setPbrMaterial(eyeL, {
		albedoColor: Color4.create(0.0, 0.0, 0.0, 1),
		emissiveColor: Color4.create(1.0, 0.05, 0.05, 1),
		emissiveIntensity: 0.55,
		metallic: 0,
		roughness: 0.5
	})
 	ghostEyes.push(eyeL)

	// Bloody halo/bleed around eye
	const bleedL = engine.addEntity()
	Name.create(bleedL, { value: 'GhostEyeBleedL' })
	Transform.create(bleedL, {
		parent: ghostRoot,
		position: Vector3.create(-0.16, 0.76, -0.49),
		scale: Vector3.create(0.14, 0.16, 0.01)
	})
	MeshRenderer.setBox(bleedL)
	Material.setPbrMaterial(bleedL, {
		albedoColor: Color4.create(0.3, 0.0, 0.0, 0.25),
		emissiveColor: Color4.create(0.8, 0.0, 0.0, 1),
		emissiveIntensity: 0.15,
		metallic: 0,
		roughness: 0.6
	})
	ghostEyeBleeds.push(bleedL)

	const eyeR = engine.addEntity()
	Name.create(eyeR, { value: 'GhostEyeR' })
	Transform.create(eyeR, {
		parent: ghostRoot,
		position: Vector3.create(0.16, 0.78, -0.47),
		scale: Vector3.create(0.08, 0.08, 0.08)
	})
	MeshRenderer.setSphere(eyeR)
	Material.setPbrMaterial(eyeR, {
		albedoColor: Color4.create(0.0, 0.0, 0.0, 1),
		emissiveColor: Color4.create(1.0, 0.05, 0.05, 1),
		emissiveIntensity: 0.55,
		metallic: 0,
		roughness: 0.5
	})
 	ghostEyes.push(eyeR)

	const bleedR = engine.addEntity()
	Name.create(bleedR, { value: 'GhostEyeBleedR' })
	Transform.create(bleedR, {
		parent: ghostRoot,
		position: Vector3.create(0.16, 0.76, -0.49),
		scale: Vector3.create(0.14, 0.16, 0.01)
	})
	MeshRenderer.setBox(bleedR)
	Material.setPbrMaterial(bleedR, {
		albedoColor: Color4.create(0.3, 0.0, 0.0, 0.25),
		emissiveColor: Color4.create(0.8, 0.0, 0.0, 1),
		emissiveIntensity: 0.15,
		metallic: 0,
		roughness: 0.6
	})
	ghostEyeBleeds.push(bleedR)

	// Ghastly looping sound attached to the ghost
	ghostSound = engine.addEntity()
	Name.create(ghostSound, { value: 'GhostSound' })
	Transform.create(ghostSound, {
		parent: ghostRoot,
		position: Vector3.create(0, 0, 0)
	})
	AudioSource.create(ghostSound, {
		audioClipUrl: 'assets/sfx/ghastly.ogg',
		playing: true,
		loop: true,
		volume: 0.25,
		pitch: 1.0
	})
}

function updateGhost(dt: number, centerX: number, centerZ: number, radius: number, baseHeight: number): void {
	if (!ghostRoot) return
	ghostTime += dt
	const angularSpeed = 0.22
	const bobSpeed = 1.0
	const bobAmp = 0.3
	const angle = ghostTime * angularSpeed
	const x = centerX + Math.cos(angle) * radius
	const z = centerZ + Math.sin(angle) * radius
	const y = baseHeight + Math.sin(ghostTime * bobSpeed) * bobAmp
	Transform.getMutable(ghostRoot).position = Vector3.create(x, y, z)

	// Skirt wave
	for (const seg of ghostSkirtParts) {
		const wave = Math.sin(ghostTime * 2.0 + seg.phase) * 0.05
		const tm = Transform.getMutable(seg.e)
		tm.position.y = seg.baseY + wave
	}

	// Flicker opacity/emissive lightly
	const flicker = 0.4 + 0.06 * Math.sin(ghostTime * 3.1) + 0.04 * Math.sin(ghostTime * 1.7)
	for (const e of ghostBodyParts) {
		// vary alpha slightly across parts by using their id
		const variance = ((e as unknown as number) % 7) * 0.005
		applyGhostMaterial(e, Math.max(0.18, Math.min(0.5, flicker + variance)), Math.max(0.2, Math.min(0.6, flicker)))
	}

	// Subtle sound modulation for ghastliness
	if (ghostSound) {
		const v = 0.18 + 0.08 * Math.max(0, Math.sin(ghostTime * 0.8))
		const p = 0.92 + 0.10 * Math.sin(ghostTime * 0.33 + 1.1)
		const src = AudioSource.getMutable(ghostSound)
		src.volume = v
		src.pitch = p
	}
}

// (Epitaph generator removed per request)

// ===============================
// Scene assembly
// ===============================
export function main() {
	// Seed PRNG for deterministic layout/coloring
	const rng = mulberry32(123456789)

	// Compute centered grid origin
	const x0 = -((GRID_COLS - 1) * GRID_SPACING) / 2
	const z0 = -((GRID_ROWS - 1) * GRID_SPACING) / 2

	// Create tombs (10x5 grid)
	for (let r = 0; r < GRID_ROWS; r++) {
		for (let c = 0; c < GRID_COLS; c++) {
			const x = x0 + c * GRID_SPACING
			const z = z0 + r * GRID_SPACING
			createTomb(Vector3.create(x, 0, z), rng)
		}
	}

	// Compute cemetery half extents for fence/trees
	const halfWidth = ((GRID_COLS - 1) * GRID_SPACING) / 2 + 3
	const halfDepth = ((GRID_ROWS - 1) * GRID_SPACING) / 2 + 3

	// Build iron fence around the graveyard with slight margin
	createFence(halfWidth, halfDepth)

	// Scatter a few creepy trees near edges with slight randomness
	for (let i = 0; i < TREE_COUNT; i++) {
		const side = rng() < 0.5 ? -1 : 1
		const along = (rng() - 0.5)
		const x = side * (halfWidth + 1.5 + rng() * 2.0)
		const z = along * halfDepth * (0.8 + rng() * 0.4)
		createTree(Vector3.create(x, 0, z), rng)
	}

	// Create a ghastly ghost circling above the cemetery
	const centerX = 0
	const centerZ = 0
	const radius = Math.max(halfWidth, halfDepth) * 0.6
	const baseHeight = 3.2
	createGhost(centerX, centerZ, radius, baseHeight)

	// Simple update loop
	engine.addSystem((dt: number) => {
		updateGhost(dt, centerX, centerZ, radius, baseHeight)
	})

	// Create a crawling corpse outside the cemetery (front side)
	const corpseStart = Vector3.create(-halfWidth - 3, 0, -halfDepth - 3)
	createCrawler(corpseStart, 0) // crawl along +X direction outside the fence

	engine.addSystem((dt: number) => {
		updateCrawler(dt)
	})

	// Create two moving shadow figures circling the cemetery perimeter
	createShadowPerson(Vector3.create(0, 0, 0), Math.max(halfWidth, halfDepth) + 1.2, 0.22, 0)
	createShadowPerson(Vector3.create(0, 0, 0), Math.max(halfWidth, halfDepth) + 1.8, -0.18, Math.PI)
	engine.addSystem((dt: number) => updateShadows(dt))

	// Crawl the ground with many small shadows outside the fence
	const outer = Math.max(halfWidth, halfDepth) + 3
	createShadowCrawlField(Vector3.create(0, 0, 0), Math.max(halfWidth, halfDepth) + 0.5, outer, 40)
	engine.addSystem((dt: number) => updateShadowCrawl(dt))

	// (Cloud layer removed per request)
}
