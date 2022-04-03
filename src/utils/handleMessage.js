'use strict'

/** @typedef {import('../UdpProxy').UdpProxy} UdpProxy */

/**
 * @param {ReturnType<UdpProxy['getClient']>} socket
 * @param {UdpProxy} proxy
 * @param {Buffer} msg
 * @param {import('dgram').RemoteInfo} sender
 */
function handleMessage(socket, proxy, msg, sender) {
	proxy.emit('message', msg, sender)
	socket.send(msg, 0, msg.length, proxy.port, proxy.host, (err, bytes) => {
		if (err) {
			proxy.emit('proxyError', err)
		}

		if (!socket.t) {
			socket.t = setTimeout(() => {
				socket.close()
			}, proxy.tOutTime)
		}
	})
}

exports.handleMessage = handleMessage
