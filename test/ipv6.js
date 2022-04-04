const { default: test } = require('ava')
const { ntpProxyIPv6, sendNtpMessage } = require('./helpers/ntp')
const { registerErrors } = require('./helpers/registerErrors')
const { isPortReachable } = require('./helpers/isPortReachable')
const { sendMessage } = require('./helpers/sendMessage')
const { event } = require('./helpers/event')
const net = require('net')

test('listening', async t => {
	const proxy = ntpProxyIPv6()
	registerErrors(proxy, t)

	const info = await event(proxy, 'listening')
	t.true('server' in info)
	t.true('target' in info)
	t.true(await isPortReachable(info.server.port, 'udp4'))
})

test('ensure ipv6', async t => {
	const proxy = ntpProxyIPv6()
	registerErrors(proxy, t)

	await event(proxy, 'listening')
	const proxyMsg = event(proxy, 'proxyMsg')
	await sendNtpMessage(proxy)

	t.true(net.isIPv6((await proxyMsg)[1].address))
})

test('roundtrip', async t => {
	const proxy = ntpProxyIPv6()
	registerErrors(proxy, t)

	await event(proxy, 'listening')
	const message = event(proxy, 'message')
	const proxyMsg = event(proxy, 'proxyMsg')
	await sendNtpMessage(proxy)

	t.is(0x1b, (await message)[0][0])
	t.is('GOOG', (await proxyMsg)[0].slice(12, 16).toString())
})

test('middleware', async t => {
	const refID = 'AAPL'
	const proxy = ntpProxyIPv6({
		middleware: {
			message(_, sender, next) {
				const ntpData = Buffer.alloc(48, 0)
				ntpData[0] = 0x1b
				next(ntpData, sender)
			},
			proxyMsg(msg, sender, peer, next) {
				for (const [index, letter] of refID.split('').entries()) {
					msg[12 + index] = letter.charCodeAt(0)
				}

				next(msg, sender, peer)
			},
		},
	})
	registerErrors(proxy, t)

	await event(proxy, 'listening')
	const proxyMsg = event(proxy, 'proxyMsg')

	// Allow middleware to rewrite the message, otherwise this will hang/fail
	await sendMessage(proxy, Buffer.from([]))

	// Make sure middleware replaced the response
	t.is(refID, (await proxyMsg)[0].slice(12, 16).toString())
})
