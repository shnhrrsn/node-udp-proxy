const dgram = require('dgram')

/**
 * @param {import('../../src/UdpProxy').UdpProxy} proxy
 * @param {Buffer} message
 */
function sendMessage(proxy, message) {
	return new Promise((resolve, reject) => {
		const address = proxy.address()
		const socket = dgram.createSocket({
			type: address.family === 'IPv6' ? 'udp6' : 'udp4',
			reuseAddr: true,
		})

		socket.send(message, address.port, undefined, (error, bytes) => {
			if (error) {
				return reject(error)
			}

			resolve(bytes)
		})
	})
}

exports.sendMessage = sendMessage
