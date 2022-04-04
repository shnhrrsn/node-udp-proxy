const proxy = require('../../src/UdpProxy')
const pTimeout = require('p-timeout')

/**
 * @template {keyof proxy.UdpProxyEvents} Event
 * @param {proxy.UdpProxy} emitter
 * @param {Event} event
 * @param {number} timeout
 * @returns {Promise<Parameters<proxy.UdpProxyEvents[Event]>['length'] extends 1 ? Parameters<proxy.UdpProxyEvents[Event]>[0] : Parameters<proxy.UdpProxyEvents[Event]>>}
 */
function event(emitter, event, timeout = 1000) {
	return pTimeout(
		new Promise((resolve, reject) => {
			if (event !== 'error') {
				emitter.once('error', reject)
			}

			emitter.once(
				event,
				/**
				 * @param  {...any} args
				 */
				(...args) => {
					emitter.off('error', reject)

					if (args.length === 1) {
						resolve(args[0])
					} else {
						resolve(/** @type {*} */ (args))
					}
				},
			)
		}),
		timeout,
	)
}

exports.event = event
