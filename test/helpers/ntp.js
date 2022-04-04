const { UdpProxy } = require('../../src/UdpProxy')
const { sendMessage } = require('./sendMessage')

/**
 * @param {ConstructorParameters<typeof UdpProxy>[0]} options
 * @returns
 */
function ntpProxyIPv4(options = {}) {
	return new UdpProxy({
		...options,
		address: 'time.google.com',
		port: 123,
		ipv6: false,
		localipv6: false,
	})
}

exports.ntpProxyIPv4 = ntpProxyIPv4

/**
 * @param {ConstructorParameters<typeof UdpProxy>[0]} options
 * @returns
 */
function ntpProxyIPv6(options = {}) {
	return new UdpProxy({
		...options,
		address: 'time.google.com',
		port: 123,
		ipv6: true,
		localipv6: true,
	})
}

exports.ntpProxyIPv6 = ntpProxyIPv6

function ntpMessage() {
	const ntpData = Buffer.alloc(48, 0)
	ntpData[0] = 0x1b
	return ntpData
}

exports.ntpMessage = ntpMessage

/**
 * @param {UdpProxy} proxy
 */
function sendNtpMessage(proxy) {
	sendMessage(proxy, ntpMessage())
}

exports.sendNtpMessage = sendNtpMessage
