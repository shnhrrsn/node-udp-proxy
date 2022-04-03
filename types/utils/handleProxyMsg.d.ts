export type UdpProxy = import('../UdpProxy').UdpProxy;
export type Socket = import('dgram').Socket;
export type RemoteInfo = import('dgram').RemoteInfo;
/** @typedef {import('../UdpProxy').UdpProxy} UdpProxy */
/** @typedef {import('dgram').Socket} Socket */
/** @typedef {import('dgram').RemoteInfo} RemoteInfo */
/**
 * @param {Socket} socket
 * @param {UdpProxy} proxy
 * @param {Buffer} msg
 * @param {RemoteInfo} sender
 * @param {RemoteInfo} peer
 */
export function handleProxyMsg(socket: Socket, proxy: UdpProxy, msg: Buffer, sender: RemoteInfo, peer: RemoteInfo): void;
