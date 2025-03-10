const { clamp } = require('@kmamal/util/number/clamp')
const { sortBy } = require('@kmamal/util/array/sort')

const sortBy$$$ = sortBy.$$$

const getDist = (x) => x.dist

const _nearestPoint = ([ x0, x1, y0, y1, z0, z1 ], [ x, y, z ]) => [
	clamp(x, x0, x1),
	clamp(y, y0, y1),
	clamp(z, z0, z1),
]

class Octree {
	constructor (bounds, maxDepth) {
		this._bounds = bounds
		this._maxDepth = maxDepth
		this._tree = [ null ]
	}

	insert (point) {
		const [ x, y, z ] = point
		let [
			{ from: x0, to: x1 },
			{ from: y0, to: y1 },
			{ from: z0, to: z1 },
		] = this._bounds

		let node = this._tree
		let index = 0

		for (let depth = 0; depth < this._maxDepth; depth++) {
			let next = node[index]
			if (next === null) {
				next = node[index] = new Array(8).fill(null)
			}
			node = next
			const xm = (x0 / 2) + (x1 / 2)
			const ym = (y0 / 2) + (y1 / 2)
			const zm = (z0 / 2) + (z1 / 2)

			index = 0
			if (z > zm) {
				index += 4
				z0 = zm
			} else {
				z1 = zm
			}
			if (y > ym) {
				index += 2
				y0 = ym
			} else {
				y1 = ym
			}
			if (x > xm) {
				index += 1
				x0 = xm
			} else {
				x1 = xm
			}
		}

		let bin = node[index]
		if (bin === null) {
			bin = node[index] = []
		}
		bin.push(point)
	}

	nearestNeighbor (target, fnDist) {
		const solution = { point: null, dist: Infinity }

		const _nearestNeighbor = (node, [ x0, x1, y0, y1, z0, z1 ], depth) => {
			if (depth === this._maxDepth) {
				for (const point of node) {
					const dist = fnDist(point, target)
					if (dist < solution.dist) {
						solution.point = point
						solution.dist = dist
					}
				}
				return
			}

			const xm = x0 / 2 + x1 / 2
			const ym = y0 / 2 + y1 / 2
			const zm = z0 / 2 + z1 / 2
			const quadrants = [
				[ x0, xm, y0, ym, z0, zm ],
				[ xm, x1, y0, ym, z0, zm ],
				[ x0, xm, ym, y1, z0, zm ],
				[ xm, x1, ym, y1, z0, zm ],
				[ x0, xm, y0, ym, zm, z1 ],
				[ xm, x1, y0, ym, zm, z1 ],
				[ x0, xm, ym, y1, zm, z1 ],
				[ xm, x1, ym, y1, zm, z1 ],
			]

			let index
			const [ x, y, z ] = target
			if (x < x0 || x1 < x || y < y0 || y1 < y || z < z0 || z1 < z) {
				index = -1
			} else {
				index = 0
				if (z > zm) { index += 4 }
				if (y > ym) { index += 2 }
				if (x > xm) { index += 1 }
			}


			if (index !== -1 && node[index]) {
				_nearestNeighbor(node[index], quadrants[index], depth + 1)
			}

			const invocations = []
			for (let i = 0; i < 8; i++) {
				if (i === index || !node[i]) { continue }

				const quadrant = quadrants[i]
				const nearest = _nearestPoint(quadrant, target)
				const lowerBound = fnDist(target, nearest)
				if (lowerBound > solution.dist) { continue }

				invocations.push({ dist: lowerBound, child: node[i], quadrant })
			}

			sortBy$$$(invocations, getDist)


			for (const { dist, child, quadrant } of invocations) {
				if (dist > solution.dist) { continue }
				_nearestNeighbor(child, quadrant, depth + 1)
			}
		}

		const node = this._tree[0]
		if (node) {
			const [
				{ from: x0, to: x1 },
				{ from: y0, to: y1 },
				{ from: z0, to: z1 },
			] = this._bounds
			_nearestNeighbor(node, [ x0, x1, y0, y1, z0, z1 ], 0)
		}

		return solution
	}

	kNearestNeighbors (point, k, fnDist) {
		//
	}
}

module.exports = { Octree }
