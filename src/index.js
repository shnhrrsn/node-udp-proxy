'use strict'

const { UdpProxy } = require('./UdpProxy')

/**
 * Creates an instance of UdpProxy with the given options
 * The proxy always connects outwards with a random port
 *
 * @param {ConstructorParameters<typeof UdpProxy>[0]} options
 * @returns
 */
function createServer(options) {
	return new UdpProxy(options)
}

exports.createServer = createServer
