'use strict'

const dgram = require('dgram')
const net = require('net')
const assert = require('assert')
const { EventEmitter } = require('events')
const { handleMessage } = require('./utils/handleMessage')
const { handleProxyMsg } = require('./utils/handleProxyMsg')
const { hashAddress } = require('./utils/hashAddress')

/**
 @typedef {{
	listening: (info: { target: net.AddressInfo, server: net.AddressInfo }) => void,
	bound: (info: { target: net.AddressInfo, route: net.AddressInfo, peer: dgram.RemoteInfo }) => void,

	message: (data: Buffer, sender: dgram.RemoteInfo) => void,
	error: (error: Error) => void,
	close: () => void,

	proxyMsg: (data: Buffer, sender: dgram.RemoteInfo, peer: dgram.RemoteInfo) => void,
	proxyError: (error: Error) => void,
	proxyClose: (peer: dgram.RemoteInfo | undefined) => void,
 }} UdpProxyEvents
 */

/**
 * @typedef {import('typed-emitter').default<UdpProxyEvents>} UdpProxyEventEmitter
 */

/**
 * @implements {UdpProxyEventEmitter}
 */
class UdpProxy extends EventEmitter {
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
		let serverPort = options.localport || 0
		let serverHost = options.localaddress || '0.0.0.0'
		let proxyHost = options.proxyaddress || '0.0.0.0'

		/** @type {number} */
		this.tOutTime = options.timeOutTime || 10000

		/** @type {dgram.RemoteInfo['family']} */
		this.family = 'IPv4'

		/** @type {dgram.SocketType} */
		this.udpType = 'udp4'

		/** @type {string} */
		this.host = options.address || 'localhost'

		/** @type {number} */
		this.port = options.port || 41234

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
	 * @template {Object} T
	 * @param {T} details
	 * @returns {T & {target: net.AddressInfo}}
	 */
	getDetails(details) {
		return {
			...details,
			target: {
				address: this.host,
				family: this.family,
				port: this.port,
			},
		}
	}

	/**
	 * @param {Buffer} msg
	 * @param {dgram.RemoteInfo} sender
	 * @returns {ReturnType<UdpProxy['createClient']>}
	 */
	getClient(msg, sender) {
		const senderHash = hashAddress(sender)
		const client = this.connections.get(senderHash)

		if (!client) {
			return this.createClient(msg, sender, senderHash)
		} else if (client.t) {
			clearTimeout(client.t)
			client.t = undefined
		}

		return client
	}

	/**
	 * @param {Buffer} msg
	 * @param {dgram.RemoteInfo} sender
	 * @param {string} senderHash
	 * @returns {dgram.Socket & { _bound?: boolean, t?: NodeJS.Timeout, peer?: dgram.RemoteInfo }}
	 */
	createClient(msg, sender, senderHash) {
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
			this.connections.delete(senderHash)
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

		this.connections.set(senderHash, client)
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
		this._server.close(callback || (() => {}))
	}

	/**
	 * @returns {net.AddressInfo}
	 */
	address() {
		return this._server.address()
	}
}

exports.UdpProxy = UdpProxy
