// UDP port of https://github.com/sindresorhus/is-port-reachable/blob/05c665189a88b471954e90c27c9ba0618bb6a6de/index.js
const dgram = require('dgram')

/**
 *
 * @param {number} port
 * @param {dgram.SocketType} type
 * @param {Object} options
 * @param {string} [options.host]
 * @param {number} [options.timeout=1000]
 * @returns
 */
async function isPortReachable(port, type = 'udp4', { host, timeout = 1000 } = {}) {
	const promise = new Promise((resolve, reject) => {
		const socket = dgram.createSocket(type)

		const t = setTimeout(() => {
			socket.close()
			reject(new Error('Timeout'))
		}, timeout)

		const cleanup = () => {
			clearTimeout(t)
			socket.close()
		}

		socket.once('error', error => {
			cleanup()
			reject(error)
		})

		socket.connect(port, host, () => {
			cleanup()
			resolve(true)
		})
	})

	try {
		await promise
		return true
	} catch {
		return false
	}
}

exports.isPortReachable = isPortReachable
