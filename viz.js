const SDL = require('@kmamal/sdl')
const { createCanvas } = require('canvas')

const window = SDL.video.createWindow()
const { pixelWidth: width, pixelHeight: height } = window
const canvas = createCanvas(width, height)
const ctx = canvas.getContext('2d')

const { Octree } = require('.')
const { rand } = require('@kmamal/util/random/rand')
const { throttle } = require('@kmamal/util/function/async/throttle')

const M = require('@kmamal/numbers/js')
const V = require('@kmamal/linear-algebra/vec2').defineFor(M)

const fnDist = (a, b) => V.normSquared(V.sub(a, b))

const N = 20
const K = 7

const octree = new Octree([
	{ from: 0, to: width },
	{ from: 0, to: height },
], K)

const points = []
for (let i = 0; i < N; i++) {
	const point = [
		rand(width),
		rand(height),
	]
	octree.insert(point)
	points.push(point)
}

let mouse = null

const render = throttle(() => {
	ctx.fillStyle = 'black'
	ctx.fillRect(0, 0, width, height)

	ctx.strokeStyle = 'white'
	const drawNode = (x0, x1, y0, y1, node, depth) => {
		if (depth === K) { return }

		ctx.strokeRect(x0, y0, x1 - x0, y1 - y0)

		if (node === null) { return }

		const xm = x0 / 2 + x1 / 2
		const ym = y0 / 2 + y1 / 2

		drawNode(x0, xm, y0, ym, node[0], depth + 1)
		drawNode(xm, x1, y0, ym, node[1], depth + 1)
		drawNode(x0, xm, ym, y1, node[2], depth + 1)
		drawNode(xm, x1, ym, y1, node[3], depth + 1)
	}

	drawNode(0, width, 0, height, octree._tree[0], 0)

	if (mouse) {
		const nearest = octree.nearestNeighbor(mouse, fnDist)
		console.log(nearest.culled, nearest.calls)

		ctx.strokeStyle = 'blue'
		ctx.beginPath()
		ctx.moveTo(...mouse)
		ctx.lineTo(...nearest.point)
		ctx.stroke()

		ctx.fillStyle = 'green'
		ctx.fillRect(mouse[0] - 3, mouse[1] - 3, 6, 6)
	}

	ctx.fillStyle = 'red'
	for (const [ x, y ] of points) {
		ctx.fillRect(x - 3, y - 3, 6, 6)
	}

	const buffer = canvas.toBuffer('raw')
	window.render(width, height, width * 4, 'bgra32', buffer)
}, 0)

window.on('expose', render)

window.on('mouseMove', ({ x, y }) => {
	mouse = [ x, y ]
	render()
})
window.on('leave', () => {
	mouse = null
	render()
})
