export type UdpProxy = import('../UdpProxy').UdpProxy;
/** @typedef {import('../UdpProxy').UdpProxy} UdpProxy */
/**
 * @param {ReturnType<UdpProxy['getClient']>} socket
 * @param {UdpProxy} proxy
 * @param {Buffer} msg
 * @param {import('dgram').RemoteInfo} sender
 */
export function handleMessage(socket: ReturnType<UdpProxy['getClient']>, proxy: UdpProxy, msg: Buffer, sender: import('dgram').RemoteInfo): void;
