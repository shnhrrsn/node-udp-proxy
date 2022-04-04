/**
 * Creates an instance of UdpProxy with the given options
 * The proxy always connects outwards with a random port
 *
 * @param {ConstructorParameters<typeof UdpProxy>[0]} options
 * @returns
 */
export function createServer(options: ConstructorParameters<typeof UdpProxy>[0]): UdpProxy;
import { UdpProxy } from "./UdpProxy";
