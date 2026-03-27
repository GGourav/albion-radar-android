import { NativeModules, NativeEventEmitter, EmitterSubscription } from 'react-native';

const { ExpoVpnService } = NativeModules;

export interface VpnConfig {
  targetPort?: number;
  mtu?: number;
  allowedApps?: string[];
}

export interface PacketEvent {
  data: number[];
  sourceIp: string;
  sourcePort: number;
  destinationIp: string;
  destinationPort: number;
  timestamp: number;
}

export interface VpnStatus {
  isRunning: boolean;
  packetsCaptured: number;
  bytesCaptured: number;
}

class VpnServiceModule {
  private eventEmitter: NativeEventEmitter;
  private listeners: Map<string, EmitterSubscription> = new Map();

  constructor() {
    this.eventEmitter = new NativeEventEmitter(ExpoVpnService);
  }

  /**
   * Check if VPN service is supported on this device
   */
  async isSupported(): Promise<boolean> {
    return await ExpoVpnService.isSupported();
  }

  /**
   * Check if VPN permission has been granted
   */
  async hasPermission(): Promise<boolean> {
    return await ExpoVpnService.hasPermission();
  }

  /**
   * Request VPN permission from user
   * Returns true if permission was granted
   */
  async requestPermission(): Promise<boolean> {
    return await ExpoVpnService.requestPermission();
  }

  /**
   * Start the VPN service
   * @param config VPN configuration options
   */
  async start(config: VpnConfig = {}): Promise<void> {
    const defaultConfig: VpnConfig = {
      targetPort: 5056,
      mtu: 2048,
      allowedApps: ['com.albiononline'],
      ...config,
    };
    await ExpoVpnService.start(defaultConfig);
  }

  /**
   * Stop the VPN service
   */
  async stop(): Promise<void> {
    await ExpoVpnService.stop();
  }

  /**
   * Get current VPN status
   */
  async getStatus(): Promise<VpnStatus> {
    return await ExpoVpnService.getStatus();
  }

  /**
   * Add a listener for packet events
   * @param callback Function to call when a packet is captured
   */
  addOnPacketListener(callback: (event: PacketEvent) => void): void {
    const subscription = this.eventEmitter.addListener('onPacket', callback);
    this.listeners.set('onPacket', subscription);
  }

  /**
   * Add a listener for VPN status changes
   * @param callback Function to call when status changes
   */
  addOnStatusChangeListener(callback: (status: VpnStatus) => void): void {
    const subscription = this.eventEmitter.addListener('onStatusChange', callback);
    this.listeners.set('onStatusChange', subscription);
  }

  /**
   * Add a listener for errors
   * @param callback Function to call when an error occurs
   */
  addOnErrorListener(callback: (error: { code: string; message: string }) => void): void {
    const subscription = this.eventEmitter.addListener('onError', callback);
    this.listeners.set('onError', subscription);
  }

  /**
   * Remove all listeners
   */
  removeAllListeners(): void {
    this.listeners.forEach((subscription) => {
      subscription.remove();
    });
    this.listeners.clear();
  }

  /**
   * Remove a specific listener
   * @param eventName Name of the event to remove
   */
  removeListener(eventName: string): void {
    const subscription = this.listeners.get(eventName);
    if (subscription) {
      subscription.remove();
      this.listeners.delete(eventName);
    }
  }
}

export default new VpnServiceModule();
export { VpnServiceModule };
