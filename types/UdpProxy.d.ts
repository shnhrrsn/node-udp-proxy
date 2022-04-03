/// <reference types="node" />
export class UdpProxy extends events {
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
    /** @type {'IPv4' | 'IPv6'} */
    family: 'IPv4' | 'IPv6';
    /** @type {dgram.SocketType} */
    udpType: dgram.SocketType;
    /** @type {string} */
    host: string;
    /** @type {number} */
    port: number;
    /** @type {Map<string, ReturnType<UdpProxy['getClient']>>} */
    connections: Map<string, ReturnType<UdpProxy['getClient']>>;
    /** @type {Record<string, any>} */
    _details: Record<string, any>;
    /** @type {string[]} */
    _detailKeys: string[];
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
     * @param {Record<string, any>} initialObj
     * @returns
     */
    getDetails(initialObj: Record<string, any>): Record<string, any>;
    /**
     * @param {Buffer} msg
     * @param {dgram.RemoteInfo} sender
     * @returns {dgram.Socket & { _bound?: boolean, t?: NodeJS.Timeout, peer?: dgram.RemoteInfo }}
     */
    getClient(msg: Buffer, sender: dgram.RemoteInfo): dgram.Socket & {
        _bound?: boolean;
        t?: NodeJS.Timeout;
        peer?: dgram.RemoteInfo;
    };
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
}
import events = require("events");
import dgram = require("dgram");
