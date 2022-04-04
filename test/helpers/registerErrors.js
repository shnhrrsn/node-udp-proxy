/**
 * Listen for error callbacks and fail tests
 *
 * @param {import('../../src/UdpProxy').UdpProxy} proxy
 * @param {import('ava').ExecutionContext<unknown>} t
 */
function registerErrors(proxy, t) {
	proxy.on('error', error => {
		t.fail(error.message)
	})

	proxy.on('proxyError', error => {
		t.fail(error.message)
	})
}

exports.registerErrors = registerErrors
