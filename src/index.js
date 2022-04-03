'use strict'

const dgram = require('dgram')
const events = require('events')
const net = require('net')
const assert = require('assert')

class UdpProxy extends events.EventEmitter {
	/**
	 * @param {object} options
	 * @param {number} [options.timeOutTime]
	 * @param {number} [options.localport]
	 * @param {string} [options.localaddress]
	 * @param {string} [options.proxyaddress]
	 * @param {string} [options.address]
	 * @param {number} [options.port]
	 * @param {boolean} [options.ipv6]
	 * @param {boolean} [options.localipv6]
	 * @param {object} [options.middleware]
	 * @param {(msg: Buffer, sender: dgram.RemoteInfo, next: (msg: Buffer, sender: dgram.RemoteInfo) => void) => void} options.middleware.message
	 * @param {(msg: Buffer, sender: dgram.RemoteInfo, peer: dgram.RemoteInfo, next: (msg: Buffer, sender: dgram.RemoteInfo, peer: dgram.RemoteInfo) => void) => void} options.middleware.proxyMsg
	 */
	constructor(options = {}) {
		super()

		/** @type {dgram.SocketType} */
		let localUdpType = 'udp4'
		let serverPort = options.localport ?? 0
		let serverHost = options.localaddress ?? '0.0.0.0'
		let proxyHost = options.proxyaddress ?? '0.0.0.0'

		/** @type {number} */
		this.tOutTime = options.timeOutTime ?? 10000

		/** @type {'IPv4' | 'IPv6'} */
		this.family = 'IPv4'

		/** @type {dgram.SocketType} */
		this.udpType = 'udp4'

		/** @type {string} */
		this.host = options.address ?? 'localhost'

		/** @type {number} */
		this.port = options.port ?? 41234

		/** @type {Map<string, ReturnType<UdpProxy['getClient']>>} */
		this.connections = new Map()

		if (options.ipv6) {
			this.udpType = 'udp6'
			this.family = 'IPv6'
			proxyHost =
				options.proxyaddress && net.isIPv6(options.proxyaddress)
					? options.proxyaddress
					: '::0'
		}

		/** @type {Record<string, any>} */
		this._details = {
			target: {
				address: this.host,
				family: this.family,
				port: this.port,
			},
		}

		/** @type {string[]} */
		this._detailKeys = Object.keys(this._details)

		if (options.localipv6) {
			localUdpType = 'udp6'
			serverHost =
				options.localaddress && net.isIPv6(options.localaddress)
					? options.localaddress
					: '::0'
		}

		this.middleware = options.middleware
		this._server = dgram.createSocket(localUdpType)

		this._server.on('listening', () => {
			const details = this.getDetails({ server: this._server.address() })
			setImmediate(() => {
				this.emit('listening', details)
			})
		})

		this._server.on('message', (msg, sender) => {
			const client = this.getClient(msg, sender)

			if (!client._bound) {
				client.bind(0, proxyHost)
			} else {
				client.emit('send', msg, sender)
			}
		})

		this._server.on('error', err => {
			this._server.close()
			this.emit('error', err)
		})

		this._server.on('close', () => {
			this.emit('close')
		})

		this._server.bind(serverPort, serverHost)
	}

	/**
	 * @param {Buffer} msg
	 * @param {number | undefined} port
	 * @param {string | undefined} address
	 * @param {((error: Error | null, bytes: number) => void) | undefined} callback
	 */
	send(msg, port = undefined, address = undefined, callback = undefined) {
		this._server.send(msg, 0, msg.length, port, address, callback)
	}

	/**
	 * @param {Record<string, any>} initialObj
	 * @returns
	 */
	getDetails(initialObj) {
		return this._detailKeys.reduce((obj, key) => {
			obj[key] = this._details[key]
			return obj
		}, initialObj)
	}

	/**
	 * @param {Buffer} msg
	 * @param {dgram.RemoteInfo} sender
	 * @returns {dgram.Socket & { _bound?: boolean, t?: NodeJS.Timeout, peer?: dgram.RemoteInfo }}
	 */
	getClient(msg, sender) {
		const senderD = hashD(sender)
		const client = this.connections.get(senderD)

		if (!client) {
			return this.createClient(msg, sender, senderD)
		} else if (client.t) {
			clearTimeout(client.t)
			client.t = undefined
		}

		return client
	}

	/**
	 * @param {Buffer} msg
	 * @param {dgram.RemoteInfo} sender
	 * @param {string} senderD
	 * @returns {dgram.Socket & { _bound?: boolean, t?: NodeJS.Timeout, peer?: dgram.RemoteInfo }}
	 */
	createClient(msg, sender, senderD) {
		/** @type {ReturnType<UdpProxy['createClient']>} */
		const client = dgram.createSocket(this.udpType)
		client.once('listening', () => {
			const details = this.getDetails({ route: client.address(), peer: sender })
			client.peer = sender
			client._bound = true
			this.emit('bound', details)
			client.emit('send', msg, sender)
		})

		client.on('message', (msg, sender) => {
			assert(client.peer)

			if (this.middleware) {
				this.middleware.proxyMsg(msg, sender, client.peer, (msg, sender, peer) => {
					handleProxyMsg(client, this, msg, sender, peer)
				})
			} else {
				handleProxyMsg(client, this, msg, sender, client.peer)
			}
		})

		client.on('close', () => {
			this.emit('proxyClose', client.peer)
			client.removeAllListeners()
			this.connections.delete(senderD)
		})

		client.on('error', err => {
			client.close()
			this.emit('proxyError', err)
		})

		client.on('send', (msg, sender) => {
			if (this.middleware) {
				this.middleware.message(msg, sender, (msg, sender) => {
					handleMessage(client, this, msg, sender)
				})
			} else {
				handleMessage(client, this, msg, sender)
			}
		})

		this.connections.set(senderD, client)
		return client
	}

	/**
	 * @param {(() => void) | undefined} callback
	 */
	close(callback = undefined) {
		// close clients
		for (const client of this.connections.values()) {
			if (!client.t) {
				continue
			}

			clearTimeout(client.t)
			client.t = undefined
			client.close()
		}

		this.connections = new Map()
		this._server.close(callback ?? (() => {}))
	}
}

/**
 * @param {dgram.RemoteInfo} address
 * @returns
 */
function hashD(address) {
	return (address.address + address.port).replace(/\./g, '')
}

/**
 * @param {dgram.Socket} socket
 * @param {UdpProxy} proxy
 * @param {Buffer} msg
 * @param {dgram.RemoteInfo} sender
 * @param {dgram.RemoteInfo} peer
 */
function handleProxyMsg(socket, proxy, msg, sender, peer) {
	proxy.send(msg, peer.port, peer.address, (err, bytes) => {
		if (err) {
			socket.emit('proxyError', err)
		}
	})
	proxy.emit('proxyMsg', msg, sender, peer)
}

/**
 * @param {ReturnType<UdpProxy['getClient']>} socket
 * @param {UdpProxy} proxy
 * @param {Buffer} msg
 * @param {dgram.RemoteInfo} sender
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

/**
 * @param {ConstructorParameters<typeof UdpProxy>[0]} options
 * @returns
 */
exports.createServer = function (options) {
	return new UdpProxy(options)
}
