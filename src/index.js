'use strict'

const { UdpProxy } = require('./UdpProxy')

/**
 * @param {ConstructorParameters<typeof UdpProxy>[0]} options
 * @returns
 */
function createServer(options) {
	return new UdpProxy(options)
}

exports.createServer = createServer
