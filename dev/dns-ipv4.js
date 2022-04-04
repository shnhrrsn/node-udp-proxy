'use strict'

// Let's create a DNS-proxy that proxies IPv4 udp-requests to googles IPv6 DNS-server
const proxy = require('../src/index')
const assert = require('assert')
const platform = require('os').platform()
const { execFile } = require('child_process')

let parallelism = 2
let allTestsComplete = 0

const testTimes = 10
const expectedComplete = testTimes * parallelism
const options = {
	address: '8.8.8.8',
	port: 53,
	ipv6: false,
	localaddress: '127.0.0.1',
	localport: 5354,
	localipv6: false,
	proxyaddress: '0.0.0.0',
	timeOutTime: 10000,
}

const mitmOptions = {
	address: '127.0.0.1',
	port: 5354,
	ipv6: false,
	localaddress: '0.0.0.0',
	localport: 5355,
	localipv6: false,
	proxyaddress: '127.0.0.1',
	timeOutTime: 10000,
}

// This is the function that creates the server, each connection is handled internally
const server = proxy.createServer(options)
const mitm = proxy.createServer(mitmOptions)

// Show some info when the server starts
server.on('listening', function (details) {
	console.log(' * IPv4 to IPv4  proxy * | by : | ok:2012')
	console.log('              running on | os : | ' + platform)
	console.log(
		'   proxy-server ready on | ' +
			details.server.family +
			' | ' +
			details.server.address +
			':' +
			details.server.port,
	)
	console.log(
		' traffic is forwarded to | ' +
			details.target.family +
			' | ' +
			details.target.address +
			':' +
			details.target.port,
	)
})

mitm.on('listening', function (details) {
	console.log(
		'           mitm ready on | ' +
			details.server.family +
			' | ' +
			details.server.address +
			':' +
			details.server.port,
	)
})

// 'bound' means the connection to server has been made and the proxying is in action
server.on('bound', function (details) {
	console.log(
		'       proxy is bound to | ' +
			details.route.family +
			' | ' +
			details.route.address +
			':' +
			details.route.port,
	)
	console.log(
		'        peer is bound to | ' +
			details.peer.family +
			' | ' +
			details.peer.address +
			':' +
			details.peer.port,
	)
})

mitm.on('bound', function (details) {
	console.log(
		'   mitmproxy is bound to | ' +
			details.route.family +
			' | ' +
			details.route.address +
			':' +
			details.route.port,
	)
	console.log(
		'    mitmpeer is bound to | ' +
			details.peer.family +
			' | ' +
			details.peer.address +
			':' +
			details.peer.port,
	)
})

// 'message' is emitted when the server gets a message
server.on('message', function (message, sender) {
	console.log(
		'            message from | ' + sender.family + ' | ' + sender.address + ':' + sender.port,
	)
})

mitm.on('message', function (message, sender) {
	console.log(
		'        mitmmessage from | ' + sender.family + ' | ' + sender.address + ':' + sender.port,
	)
})

// 'proxyMsg' is emitted when the bound socket gets a message and it's send back to the peer the socket was bound to
server.on('proxyMsg', function (message, sender) {
	console.log(
		'             answer from | ' + sender.family + ' | ' + sender.address + ':' + sender.port,
	)
})

mitm.on('proxyMsg', function (message, sender) {
	console.log(
		'     answer to mitm from | ' + sender.family + ' | ' + sender.address + ':' + sender.port,
	)
})

server.on('proxyClose', function (peer) {
	assert(peer)
	console.log(
		'      disconnecting from | ' + peer.family + ' | ' + peer.address + ':' + peer.port,
	)
})

mitm.on('proxyClose', function (peer) {
	assert(peer)
	console.log(
		' mitm disconnecting from | ' + peer.family + ' | ' + peer.address + ':' + peer.port,
	)
})

server.on('proxyError', function (err) {
	console.log('             ProxyError! | ' + err.message)
})

server.on('close', function () {
	console.log('    server disconnected! | ')
})

server.on('error', function (err) {
	console.log('                  Error! | ' + err.message)
})

mitm.on('proxyError', function (err) {
	console.log('         mitmProxyError! | ' + err.message)
})

mitm.on('close', function () {
	console.log('      mitm disconnected! | ')
})

mitm.on('error', function (err) {
	console.log('              mitmError! | ' + err.message)
})

/**
 * @param {number} times
 */
function testIt(times) {
	/** @type {Parameters<execFile>[3]} */
	const printOut = function (err, stdout, stderr) {
		allTestsComplete += 1

		if (err) {
			console.log(err)
		} else if (stdout) {
			console.log('                  output | ' + stdout)
		} else if (stderr) {
			console.log('            error output | ' + stderr)
		}

		if (times < testTimes) {
			testIt(times + 1)
		}

		if (allTestsComplete === expectedComplete) {
			mitm.close()
			server.close(function () {
				console.log('      test Complete!     | ')
			})
		}
	}

	if (platform === 'win32') {
		execFile('nslookup', ['-p=5355', '/server 127.0.0.1', '-q=aaaa', 'google.com'], printOut)
	} else {
		execFile('dig', ['-p', '5355', '+short', '@127.0.0.1', 'google.com', 'aaaa'], printOut)
	}
}

while (parallelism) {
	testIt(1)
	parallelism -= 1
}
