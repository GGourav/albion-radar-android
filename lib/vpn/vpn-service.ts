/**
 * VPN Service Manager
 * Manages Android VpnService for non-root packet capture
 * Intercepts UDP traffic on port 5056 (Albion Online game server port)
 */

import { Buffer } from 'buffer';
import { EventEmitter } from 'events';

export interface VpnConfig {
  mtu?: number;
  dnsServers?: string[];
  allowedApps?: string[];
}

export interface PacketData {
  sourceIp: string;
  sourcePort: number;
  destinationIp: string;
  destinationPort: number;
  data: Buffer;
  timestamp: number;
}

export class VpnService extends EventEmitter {
  private config: VpnConfig;
  private isActive: boolean = false;
  private packetBuffer: PacketData[] = [];

  constructor(config: VpnConfig = {}) {
    super();
    this.config = {
      mtu: config.mtu || 2048,
      dnsServers: config.dnsServers || ['8.8.8.8', '8.8.4.4'],
      allowedApps: config.allowedApps || ['com.albiononline'],
    };
  }

  /**
   * Starts the VPN service
   * In a real Android implementation, this would:
   * 1. Request VPN permission from the user
   * 2. Create a VPN interface using VpnService.Builder
   * 3. Set up packet capture on the TUN interface
   * 4. Filter packets for port 5056
   */
  async start(): Promise<void> {
    if (this.isActive) {
      console.warn('VPN service is already active');
      return;
    }

    try {
      // In a real implementation, this would call native Android code
      // For now, we simulate the startup
      console.log('Starting VPN service with config:', this.config);
      this.isActive = true;
      this.emit('started');
    } catch (error) {
      console.error('Failed to start VPN service:', error);
      this.emit('error', error);
      throw error;
    }
  }

  /**
   * Stops the VPN service
   */
  async stop(): Promise<void> {
    if (!this.isActive) {
      console.warn('VPN service is not active');
      return;
    }

    try {
      // In a real implementation, this would call native Android code
      console.log('Stopping VPN service');
      this.isActive = false;
      this.emit('stopped');
    } catch (error) {
      console.error('Failed to stop VPN service:', error);
      this.emit('error', error);
      throw error;
    }
  }

  /**
   * Checks if the VPN service is currently active
   */
  isRunning(): boolean {
    return this.isActive;
  }

  /**
   * Processes a captured UDP packet
   * Filters for port 5056 (Albion game server)
   * Emits 'packet' event with the packet data
   */
  processPacket(packet: PacketData): void {
    // Filter for Albion game server port (5056)
    if (packet.destinationPort !== 5056 && packet.sourcePort !== 5056) {
      return;
    }

    // Emit packet event for listeners
    this.emit('packet', packet);

    // Buffer packets for batch processing
    this.packetBuffer.push(packet);

    // Process buffer if it reaches a threshold (e.g., 16ms worth of packets)
    if (this.packetBuffer.length >= 10) {
      this.flushPacketBuffer();
    }
  }

  /**
   * Flushes the packet buffer and emits batch event
   */
  private flushPacketBuffer(): void {
    if (this.packetBuffer.length === 0) {
      return;
    }

    const packets = [...this.packetBuffer];
    this.packetBuffer = [];
    this.emit('packets', packets);
  }

  /**
   * Gets the current configuration
   */
  getConfig(): VpnConfig {
    return { ...this.config };
  }

  /**
   * Updates the VPN configuration
   */
  updateConfig(config: Partial<VpnConfig>): void {
    this.config = { ...this.config, ...config };
  }
}

/**
 * Creates a new VPN service instance
 */
export function createVpnService(config?: VpnConfig): VpnService {
  return new VpnService(config);
}

/**
 * Filters a packet for Albion game traffic
 * Returns true if the packet should be processed
 */
export function isAlbionGamePacket(packet: PacketData): boolean {
  // Check if port is 5056 (Albion game server)
  if (packet.destinationPort === 5056 || packet.sourcePort === 5056) {
    return true;
  }

  return false;
}

/**
 * Extracts the Photon protocol data from a UDP packet
 * Skips UDP header (8 bytes) and returns the payload
 */
export function extractPhotonPayload(packet: PacketData): Buffer {
  // UDP header is 8 bytes, Photon data starts after that
  if (packet.data.length > 8) {
    return packet.data.subarray(8);
  }

  return packet.data;
}
