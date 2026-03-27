/**
 * VPN Service Manager
 * Manages Android VpnService for non-root packet capture
 * Intercepts UDP traffic on port 5056 (Albion Online game server port)
 */

import { NativeModules, NativeEventEmitter, EmitterSubscription } from 'react-native';
import { Buffer } from 'buffer';

// Native module
const { ExpoVpnService } = NativeModules;

export interface VpnConfig {
  targetPort?: number;
  mtu?: number;
  allowedApps?: string[];
}

export interface PacketData {
  data: number[];
  timestamp: number;
}

export interface VpnStatus {
  isRunning: boolean;
  packetsCaptured: number;
  bytesCaptured: number;
}

export class VpnService {
  private eventEmitter: NativeEventEmitter | null = null;
  private listeners: Map<string, EmitterSubscription> = new Map();
  private isActive: boolean = false;

  constructor() {
    if (ExpoVpnService) {
      this.eventEmitter = new NativeEventEmitter(ExpoVpnService);
    }
  }

  /**
   * Check if VPN service is supported
   */
  async isSupported(): Promise<boolean> {
    if (!ExpoVpnService) {
      console.warn('Native VPN module not available');
      return false;
    }
    return await ExpoVpnService.isSupported();
  }

  /**
   * Check if VPN permission has been granted
   */
  async hasPermission(): Promise<boolean> {
    if (!ExpoVpnService) {
      return false;
    }
    return await ExpoVpnService.hasPermission();
  }

  /**
   * Request VPN permission from user
   */
  async requestPermission(): Promise<boolean> {
    if (!ExpoVpnService) {
      throw new Error('Native VPN module not available');
    }
    return await ExpoVpnService.requestPermission();
  }

  /**
   * Starts the VPN service
   */
  async start(config: VpnConfig = {}): Promise<void> {
    if (!ExpoVpnService) {
      throw new Error('Native VPN module not available');
    }

    if (this.isActive) {
      console.warn('VPN service is already active');
      return;
    }

    const defaultConfig: VpnConfig = {
      targetPort: 5056,
      mtu: 2048,
      allowedApps: ['com.albiononline'],
      ...config,
    };

    try {
      this.setupListeners();
      await ExpoVpnService.start(defaultConfig);
      this.isActive = true;
      console.log('VPN service started successfully');
    } catch (error) {
      console.error('Failed to start VPN service:', error);
      throw error;
    }
  }

  /**
   * Stops the VPN service
   */
  async stop(): Promise<void> {
    if (!ExpoVpnService) {
      return;
    }

    if (!this.isActive) {
      console.warn('VPN service is not active');
      return;
    }

    try {
      await ExpoVpnService.stop();
      this.removeAllListeners();
      this.isActive = false;
      console.log('VPN service stopped');
    } catch (error) {
      console.error('Failed to stop VPN service:', error);
      throw error;
    }
  }

  /**
   * Gets the current VPN status
   */
  async getStatus(): Promise<VpnStatus> {
    if (!ExpoVpnService) {
      return {
        isRunning: false,
        packetsCaptured: 0,
        bytesCaptured: 0,
      };
    }
    return await ExpoVpnService.getStatus();
  }

  /**
   * Checks if the VPN service is currently active
   */
  isRunning(): boolean {
    return this.isActive;
  }

  /**
   * Add a listener for packet events
   */
  onPacket(callback: (packet: Buffer) => void): void {
    if (!this.eventEmitter) {
      console.warn('Event emitter not available');
      return;
    }

    const subscription = this.eventEmitter.addListener('onPacket', (event: PacketData) => {
      const buffer = Buffer.from(event.data);
      callback(buffer);
    });

    this.listeners.set('onPacket', subscription);
  }

  /**
   * Add a listener for status change events
   */
  onStatusChange(callback: (status: VpnStatus) => void): void {
    if (!this.eventEmitter) {
      return;
    }

    const subscription = this.eventEmitter.addListener('onStatusChange', callback);
    this.listeners.set('onStatusChange', subscription);
  }

  /**
   * Add a listener for error events
   */
  onError(callback: (error: { code: string; message: string }) => void): void {
    if (!this.eventEmitter) {
      return;
    }

    const subscription = this.eventEmitter.addListener('onError', callback);
    this.listeners.set('onError', subscription);
  }

  /**
   * Setup all event listeners
   */
  private setupListeners(): void {
    if (!this.eventEmitter) {
      return;
    }

    this.onStatusChange((status) => {
      this.isActive = status.isRunning;
      console.log('VPN status changed:', status);
    });

    this.onError((error) => {
      console.error('VPN error:', error);
    });
  }

  /**
   * Remove all listeners
   */
  removeAllListeners(): void {
    this.listeners.forEach((listener) => {
      listener.remove();
    });
    this.listeners.clear();
  }
}

/**
 * Creates a new VPN service instance
 */
export function createVpnService(): VpnService {
  return new VpnService();
}

/**
 * Filters a packet for Albion game traffic
 */
export function isAlbionGamePacket(data: Buffer): boolean {
  if (data.length > 0 && data[0] === 0x3c) {
    return true;
  }
  return false;
}

/**
 * Extracts the Photon protocol data from a raw packet
 */
export function extractPhotonPayload(data: Buffer): Buffer {
  return data;
}
