<p align="center">
<a href="https://github.com/shnhrrsn/node-udp-proxy/actions"><img src="https://github.com/shnhrrsn/node-udp-proxy/workflows/test/badge.svg" alt="Build Status"></a>
<a href="https://www.npmjs.com/package/@shnhrrsn/udp-proxy"><img src="https://img.shields.io/npm/dt/@shnhrrsn/udp-proxy.svg" alt="Total Downloads"></a>
<a href="https://www.npmjs.com/package/@shnhrrsn/udp-proxy"><img src="https://img.shields.io/npm/v/@shnhrrsn/udp-proxy.svg" alt="Latest Version"></a>
<a href="./LICENSE"><img src="https://img.shields.io/npm/l/@shnhrrsn/udp-proxy.svg" alt="License"></a>
</p>

# udp-proxy

**NOTE:** This project was forked from [gildean/node-udp-proxy](https://github.com/gildean/node-udp-proxy).

UDP Proxy for [Node.js](http://nodejs.org/) version >=12.x

Supports both IPv4 and IPv6, and bridging in between (see example below).

## Installation

### yarn

```bash
yarn add @shnhrrsn/udp-proxy
```

### npm

```bash
npm install @shnhrrsn/udp-proxy
```

udp-proxy has no dependencies beyond Node.js itself.

## Usage

### Example

```javascript
// Let's create a DNS-proxy that proxies IPv4 udp-requests to googles IPv6 DNS-server
const proxy = require('udp-proxy')
const options = {
  address: '2001:4860:4860::8888',
  port: 53,
  ipv6: true,
  localaddress: '0.0.0.0',
  localport: 53535,
  localipv6: false,
  proxyaddress: '::0',
  timeOutTime: 10000,
}

// This is the function that creates the server, each connection is handled internally
const server = proxy.createServer(options)

// this should be obvious
server.on('listening', function (details) {
  console.log('DNS - IPv4 to IPv6 proxy }>=<{ by: ok 2012')
  console.log(
    'udp-proxy-server ready on ' +
      details.server.family +
      '  ' +
      details.server.address +
      ':' +
      details.server.port,
  )
  console.log(
    'traffic is forwarded to ' +
      details.target.family +
      '  ' +
      details.target.address +
      ':' +
      details.target.port,
  )
})

// 'bound' means the connection to server has been made and the proxying is in action
server.on('bound', function (details) {
  console.log('proxy is bound to ' + details.route.address + ':' + details.route.port)
  console.log('peer is bound to ' + details.peer.address + ':' + details.peer.port)
})

// 'message' is emitted when the server gets a message
server.on('message', function (message, sender) {
  console.log('message from ' + sender.address + ':' + sender.port)
})

// 'proxyMsg' is emitted when the bound socket gets a message and it's send back to the peer the socket was bound to
server.on('proxyMsg', function (message, sender, peer) {
  console.log('answer from ' + sender.address + ':' + sender.port)
})

// 'proxyClose' is emitted when the socket closes (from a timeout) without new messages
server.on('proxyClose', function (peer) {
  console.log('disconnecting socket from ' + peer.address)
})

server.on('proxyError', function (err) {
  console.log('ProxyError! ' + err)
})

server.on('error', function (err) {
  console.log('Error! ' + err)
})
```

## Methods

**const server = proxy.createServer(** _options_ **);**

- **.createServer(** _options_ **)** creates an instance of udp-proxy with the given _options_
  - _options_ must be an _object_ consisting of:
    - `address`: **_string_** (the address you want to proxy to)
      - default: **_'localhost'_**
    - `port`: **_number_** (the port you want to proxy to)
      - default: **_41234_**
    - `ipv6`: **_boolean_** (if the target uses IPv6)
      - default: **_false_**
    - `localaddress`: **_string_** (the interface-addresses to use for the server)
      - default: **_'0.0.0.0'_** ( **_::0_** if `localipv6` is set to true)
    - `localport`: **_number_** (the port for the server to listen on)
      - default: **_0_** (random)
    - `localipv6`: **_boolean_** (if you want the server to use IPv6)
      - default: **_false_**
    - `proxyaddress`: **_string_** (if you want to set on which interface the proxy connects out)
      - default: **_0.0.0.0_** ( **_::0_** if `ipv6` is set to true)
    - `timeOutTime`: **_number_** the time it takes for socket to time out (in ms)
      - default: **_10000_** (10s)
    - `timeOutTime`: **_number_** the time it takes for socket to time out (in ms)
      - default: **_10000_** (10s)
    - `middleware`: **_object_** apply a middleware to the proxy, see Middleware section below.
      - default: **_none_**

_the proxy always connects outwards with a random port_

**server.close(callback)** closes proxy server.

## Events

**server.on(** `'event'` **, function (** _args_ **) { });**

- `'listening'`, _details_
  - _details_ is an _object_ with two objects:
    - _target_ **address**
    - _server_ **address**
- `'bound'`, _details_
  - _details_ is an _object_ with two objects:
    - _route_ **address**
    - _peer_ **address**
- `'message'`, _message_, _sender_
  - _message_ is the payload from user using the proxy
  - _sender_ is the user **address**
- `'proxyMsg'`, _message_, _sender_, _peer_
  - _message_ is the answer to the message from the user
  - _sender_ is the answerer **address**
  - _peer_ is the requesting **address**
- `'error'`, _err_
  - in case of an error _err_ has the error-messages
- `'proxyError'`, _err_
  - if the message could not be proxied _err_ has the error-messages
- `'proxyClose'`, _peer_
  - when a socket is closed after no new messages in set timeout
  - _peer_ is the **address** of the disconnected client
- `'close'`
  - self-explanatory

**address** _object_ contains:

- `address`: **_string_** ip-address
- `family`: **_string_** IPv6 or IPv4
- `port`: **_number_** udp-port

## Middleware

Add a middleware object to the proxy to intercept any incoming or outgoing message. Use this if you need to potentially change the message content before it is relayed, or prevent it from sending altogether.

The `middleware` object must contain the following functions:

**message(** `msg`, `sender`**, function `next` (** _msg, sender_ **) { });**

- will be invoked with every message from a peer `sender` to the server.
- proxy will only relay the message when `next`is invoked.

**proxyMsg(** `msg`, `sender`, `peer`**, function `next` (** _msg, sender, peer_ **) { });**

- will be invoked with every message from the server `sender` to a `peer`.
- proxy will only relay the message when `next`is invoked.

### Example:

The following example will block any message going from the client to the server that has length > 120.

```javascript
// Following the first example, let's create a DNS-proxy that proxies IPv4 udp-requests to googles IPv6 DNS-server and provide a middleware.
const proxy = require('udp-proxy')
const options = {
  address: '2001:4860:4860::8888',
  port: 53,
  ipv6: true,
  localaddress: '0.0.0.0',
  localport: 53535,
  localipv6: false,
  proxyaddress: '::0',
  timeOutTime: 10000,
  middleware: {
    message: function (msg, sender, next) {
      // messages with longer length will not be relayed, because 'next' will not be invoked.
      if (msg.length <= 120) {
        next(msg, sender)
      }
    },
    proxyMsg: function (msg, sender, peer, next) {
      next(msg, sender, peer)
    },
  },
}

const server = proxy.createServer(options)

// ..
```

## Tests

Tests are built with [ava](https://github.com/avajs/ava) and can be triggered by running:

```bash
yarn test
```

## Development

For a comprehensive end to end proxy flow, you can run proxy DNS lookups:

```bash
node dev/dns-ipv4.js # IPv4
node dev/dns-ipv6.js # IPv6
```
