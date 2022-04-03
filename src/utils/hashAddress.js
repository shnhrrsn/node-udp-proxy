'use strict'

/**
 * @param {import('dgram').RemoteInfo} address
 * @returns
 */
function hashAddress(address) {
	return `${address.address}:${address.port}`
}

exports.hashAddress = hashAddress
