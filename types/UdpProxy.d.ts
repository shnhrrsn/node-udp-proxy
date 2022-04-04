/// <reference types="node" />
export type UdpProxyEvents = {
    listening(info: {
        target: net.AddressInfo;
        server: net.AddressInfo;
    }): void;
    bound(info: {
        target: net.AddressInfo;
        route: net.AddressInfo;
        peer: dgram.RemoteInfo;
    }): void;
    message(data: Buffer, sender: dgram.RemoteInfo): void;
    error(error: Error): void;
    close(): void;
    proxyMsg(data: Buffer, sender: dgram.RemoteInfo, peer: dgram.RemoteInfo): void;
    proxyError(error: Error): void;
    proxyClose(peer: dgram.RemoteInfo | undefined): void;
};
declare const UdpProxy_base: new () => import('typed-emitter').default<UdpProxyEvents>;
/**
 @typedef {{
    listening(info: { target: net.AddressInfo, server: net.AddressInfo }): void,
    bound(info: { target: net.AddressInfo, route: net.AddressInfo, peer: dgram.RemoteInfo }): void,

    message(data: Buffer, sender: dgram.RemoteInfo): void,
    error(error: Error): void,
    close(): void,

    proxyMsg(data: Buffer, sender: dgram.RemoteInfo, peer: dgram.RemoteInfo): void,
    proxyError(error: Error): void,
    proxyClose(peer: dgram.RemoteInfo | undefined): void,
 }} UdpProxyEvents
 */
export class UdpProxy extends UdpProxy_base {
    /**
     * @param {object} options
     * @param {number} [options.timeOutTime]
     * @param {number} [options.localport]
     * @param {string} [options.localaddress]
     * @param {string} [options.proxyaddress]
     * @param {string} [options.address]
     * @param {number} [options.port]
     * @param {boolean} [options.ipv6]
     * @param {boolean} [options.localipv6]
     * @param {object} [options.middleware]
     * @param {(msg: Buffer, sender: dgram.RemoteInfo, next: (msg: Buffer, sender: dgram.RemoteInfo) => void) => void} options.middleware.message
     * @param {(msg: Buffer, sender: dgram.RemoteInfo, peer: dgram.RemoteInfo, next: (msg: Buffer, sender: dgram.RemoteInfo, peer: dgram.RemoteInfo) => void) => void} options.middleware.proxyMsg
     */
    constructor(options?: {
        timeOutTime?: number;
        localport?: number;
        localaddress?: string;
        proxyaddress?: string;
        address?: string;
        port?: number;
        ipv6?: boolean;
        localipv6?: boolean;
        middleware?: {
            message: (msg: Buffer, sender: dgram.RemoteInfo, next: (msg: Buffer, sender: dgram.RemoteInfo) => void) => void;
            proxyMsg: (msg: Buffer, sender: dgram.RemoteInfo, peer: dgram.RemoteInfo, next: (msg: Buffer, sender: dgram.RemoteInfo, peer: dgram.RemoteInfo) => void) => void;
        };
    });
    /** @type {number} */
    tOutTime: number;
    /** @type {dgram.RemoteInfo['family']} */
    family: dgram.RemoteInfo['family'];
    /** @type {dgram.SocketType} */
    udpType: dgram.SocketType;
    /** @type {string} */
    host: string;
    /** @type {number} */
    port: number;
    /** @type {Map<string, ReturnType<UdpProxy['getClient']>>} */
    connections: Map<string, ReturnType<UdpProxy['getClient']>>;
    middleware: {
        message: (msg: Buffer, sender: dgram.RemoteInfo, next: (msg: Buffer, sender: dgram.RemoteInfo) => void) => void;
        proxyMsg: (msg: Buffer, sender: dgram.RemoteInfo, peer: dgram.RemoteInfo, next: (msg: Buffer, sender: dgram.RemoteInfo, peer: dgram.RemoteInfo) => void) => void;
    };
    _server: dgram.Socket;
    /**
     * @param {Buffer} msg
     * @param {number | undefined} port
     * @param {string | undefined} address
     * @param {((error: Error | null, bytes: number) => void) | undefined} callback
     */
    send(msg: Buffer, port?: number | undefined, address?: string | undefined, callback?: (error: Error | null, bytes: number) => void): void;
    /**
     * @template {Object} T
     * @param {T} details
     * @returns {T & {target: net.AddressInfo}}
     */
    getDetails<T extends unknown>(details: T): T & {
        target: net.AddressInfo;
    };
    /**
     * @param {Buffer} msg
     * @param {dgram.RemoteInfo} sender
     * @returns {ReturnType<UdpProxy['createClient']>}
     */
    getClient(msg: Buffer, sender: dgram.RemoteInfo): ReturnType<UdpProxy['createClient']>;
    /**
     * @param {Buffer} msg
     * @param {dgram.RemoteInfo} sender
     * @param {string} senderHash
     * @returns {dgram.Socket & { _bound?: boolean, t?: NodeJS.Timeout, peer?: dgram.RemoteInfo }}
     */
    createClient(msg: Buffer, sender: dgram.RemoteInfo, senderHash: string): dgram.Socket & {
        _bound?: boolean;
        t?: NodeJS.Timeout;
        peer?: dgram.RemoteInfo;
    };
    /**
     * @param {(() => void) | undefined} callback
     */
    close(callback?: (() => void) | undefined): void;
    /**
     * @returns {net.AddressInfo}
     */
    address(): net.AddressInfo;
}
import net = require("net");
import dgram = require("dgram");
export {};
