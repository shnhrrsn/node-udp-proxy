'use strict'

/** @typedef {import('../UdpProxy').UdpProxy} UdpProxy */
/** @typedef {import('dgram').Socket} Socket */
/** @typedef {import('dgram').RemoteInfo} RemoteInfo */

/**
 * @param {Socket} socket
 * @param {UdpProxy} proxy
 * @param {Buffer} msg
 * @param {RemoteInfo} sender
 * @param {RemoteInfo} peer
 */
function handleProxyMsg(socket, proxy, msg, sender, peer) {
	proxy.send(msg, peer.port, peer.address, (err, bytes) => {
		if (err) {
			socket.emit('proxyError', err)
		}
	})
	proxy.emit('proxyMsg', msg, sender, peer)
}
exports.handleProxyMsg = handleProxyMsg
