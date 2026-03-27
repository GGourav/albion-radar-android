/**
 * Packet Processor
 * Main packet processing pipeline that connects VPN service to entity managers
 */

import { Buffer } from 'buffer';
import { VpnService } from './vpn/vpn-service';
import { parsePhotonPacket, parsePhotonCommand, PhotonEvent } from './photon/packet-parser';
import { EntityManager } from './entities/entity-manager';
import { createEventProcessor } from './events/event-processor';

export interface PacketProcessorConfig {
  targetPort?: number;
  debugMode?: boolean;
}

export class PacketProcessor {
  private vpnService: VpnService;
  private entityManager: EntityManager;
  private eventProcessor: ReturnType<typeof createEventProcessor>;
  private isRunning: boolean = false;
  private config: PacketProcessorConfig;
  private stats = {
    packetsProcessed: 0,
    eventsProcessed: 0,
    errors: 0,
  };

  constructor(
    entityManager: EntityManager,
    config: PacketProcessorConfig = {}
  ) {
    this.entityManager = entityManager;
    this.vpnService = new VpnService();
    this.eventProcessor = createEventProcessor(entityManager);
    this.config = {
      targetPort: 5056,
      debugMode: false,
      ...config,
    };
  }

  /**
   * Start the packet processing pipeline
   */
  async start(): Promise<void> {
    if (this.isRunning) {
      console.warn('Packet processor already running');
      return;
    }

    try {
      const isSupported = await this.vpnService.isSupported();
      if (!isSupported) {
        throw new Error('VPN service not supported on this device');
      }

      const hasPermission = await this.vpnService.hasPermission();
      if (!hasPermission) {
        const granted = await this.vpnService.requestPermission();
        if (!granted) {
          throw new Error('VPN permission denied by user');
        }
      }

      this.vpnService.onPacket(this.handlePacket.bind(this));
      this.vpnService.onError(this.handleError.bind(this));

      await this.vpnService.start({
        targetPort: this.config.targetPort,
      });

      this.isRunning = true;
      console.log('Packet processor started successfully');
    } catch (error) {
      console.error('Failed to start packet processor:', error);
      throw error;
    }
  }

  /**
   * Stop the packet processing pipeline
   */
  async stop(): Promise<void> {
    if (!this.isRunning) {
      return;
    }

    try {
      await this.vpnService.stop();
      this.vpnService.removeAllListeners();
      this.isRunning = false;
      console.log('Packet processor stopped');
    } catch (error) {
      console.error('Failed to stop packet processor:', error);
      throw error;
    }
  }

  /**
   * Handle incoming packet from VPN service
   */
  private handlePacket(data: Buffer): void {
    try {
      this.stats.packetsProcessed++;

      if (!this.isPhotonPacket(data)) {
        return;
      }

      const commands = parsePhotonPacket(data);

      for (const command of commands) {
        const events = parsePhotonCommand(command);

        for (const event of events) {
          this.processEvent(event);
        }
      }
    } catch (error) {
      this.stats.errors++;
      if (this.config.debugMode) {
        console.error('Error processing packet:', error);
      }
    }
  }

  /**
   * Check if packet is a Photon protocol packet
   */
  private isPhotonPacket(data: Buffer): boolean {
    if (data.length < 12) return false;
    return data[0] === 0x3c;
  }

  /**
   * Process a single Photon event
   */
  private processEvent(event: PhotonEvent): void {
    this.stats.eventsProcessed++;

    if (this.config.debugMode) {
      console.log(`Processing event: ${event.eventCode}`, event.parameters);
    }

    this.eventProcessor.processEvent(event);
  }

  /**
   * Handle VPN errors
   */
  private handleError(error: { code: string; message: string }): void {
    console.error(`VPN Error [${error.code}]: ${error.message}`);
    this.stats.errors++;
    this.entityManager.emit('vpn-error', error);
  }

  /**
   * Get current stats
   */
  getStats(): typeof this.stats {
    return { ...this.stats };
  }

  /**
   * Check if processor is running
   */
  isActive(): boolean {
    return this.isRunning;
  }

  /**
   * Get entity manager
   */
  getEntityManager(): EntityManager {
    return this.entityManager;
  }
}

/**
 * Creates a new packet processor instance
 */
export function createPacketProcessor(
  entityManager: EntityManager,
  config?: PacketProcessorConfig
): PacketProcessor {
  return new PacketProcessor(entityManager, config);
    }
