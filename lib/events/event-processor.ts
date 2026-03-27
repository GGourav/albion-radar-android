/**
 * Event Processor
 * Processes Photon protocol events and updates entity manager
 */

import { EventEmitter } from 'events';
import { PhotonEvent, PhotonEventCode, extractResourceFromEvent, extractMobFromEvent, extractPlayerFromEvent, extractChestFromEvent } from '../photon/packet-parser';
import { EntityManager, Resource, Mob, Player, Chest } from '../entities/entity-manager';

export class EventProcessor extends EventEmitter {
  private entityManager: EntityManager;
  private mobTypeMapping: Map<number, { tier: number; code: string; name: string }>;

  constructor(entityManager: EntityManager) {
    super();
    this.entityManager = entityManager;
    this.mobTypeMapping = new Map();
    this.initializeMobTypeMapping();
  }

  /**
   * Processes a Photon event and updates entity manager
   */
  processEvent(event: PhotonEvent): void {
    try {
      switch (event.eventCode) {
        case PhotonEventCode.Leave:
          this.handleLeaveEvent(event);
          break;

        case PhotonEventCode.Move:
          this.handleMoveEvent(event);
          break;

        case PhotonEventCode.NewCharacter:
          this.handleNewCharacterEvent(event);
          break;

        case PhotonEventCode.NewHarvestableObject:
          this.handleNewHarvestableObjectEvent(event);
          break;

        case PhotonEventCode.NewSimpleHarvestableObjectList:
          this.handleNewSimpleHarvestableObjectListEvent(event);
          break;

        case PhotonEventCode.HarvestableChangeState:
          this.handleHarvestableChangeStateEvent(event);
          break;

        case PhotonEventCode.NewMob:
          this.handleNewMobEvent(event);
          break;

        case PhotonEventCode.RegenerationHealthChanged:
          this.handleRegenerationHealthChangedEvent(event);
          break;

        case PhotonEventCode.NewRandomDungeonExit:
          this.handleNewRandomDungeonExitEvent(event);
          break;

        case PhotonEventCode.NewLootChest:
        case PhotonEventCode.NewTreasureChest:
          this.handleNewChestEvent(event);
          break;

        default:
          // Unknown event, ignore
          break;
      }
    } catch (error) {
      console.error(`Error processing event ${event.eventCode}:`, error);
      this.emit('error', error);
    }
  }

  /**
   * Handles Leave event (entity removed)
   */
  private handleLeaveEvent(event: PhotonEvent): void {
    const entityId = event.parameters[0];
    const entityType = event.parameters[1];

    // Remove entity from appropriate collection
    // entityType: 0 = resource, 1 = mob, 2 = player, etc.
    if (entityType === 0) {
      this.entityManager.removeResource(entityId);
    } else if (entityType === 1) {
      this.entityManager.removeMob(entityId);
    } else if (entityType === 2) {
      this.entityManager.removePlayer(entityId);
    }

    this.emit('entity-removed', { entityId, entityType });
  }

  /**
   * Handles Move event (position update)
   */
  private handleMoveEvent(event: PhotonEvent): void {
    const entityId = event.parameters[0];
    // Position data is in parameter 1 as Little-Endian float32 array
    // This is typically handled by the packet parser
    this.emit('entity-moved', { entityId });
  }

  /**
   * Handles NewCharacter event (player spawn)
   */
  private handleNewCharacterEvent(event: PhotonEvent): void {
    const playerData = extractPlayerFromEvent(event);
    if (!playerData) {
      return;
    }

    const player: Player = {
      id: playerData.playerId,
      characterName: playerData.characterName,
      guildId: playerData.guildId,
      allianceId: playerData.allianceId,
      factionFlag: playerData.factionFlag,
      timestamp: Date.now(),
    };

    this.entityManager.addPlayer(player);
    this.emit('player-spawned', player);
  }

  /**
   * Handles NewHarvestableObject event (individual resource spawn)
   */
  private handleNewHarvestableObjectEvent(event: PhotonEvent): void {
    const resourceData = extractResourceFromEvent(event);
    if (!resourceData) {
      return;
    }

    const resource: Resource = {
      id: resourceData.objectId,
      typeId: resourceData.typeId,
      tier: resourceData.tier,
      enchantment: resourceData.enchantment,
      charges: resourceData.charges,
      position: resourceData.position,
      timestamp: Date.now(),
    };

    this.entityManager.addResource(resource);
    this.emit('resource-spawned', resource);
  }

  /**
   * Handles NewSimpleHarvestableObjectList event (batch resource spawn)
   */
  private handleNewSimpleHarvestableObjectListEvent(event: PhotonEvent): void {
    const resourceList = event.parameters[0];
    if (!Array.isArray(resourceList)) {
      return;
    }

    for (const resourceData of resourceList) {
      if (resourceData && typeof resourceData === 'object') {
        const resource: Resource = {
          id: resourceData.id || 0,
          typeId: resourceData.typeId || 0,
          tier: resourceData.tier || 1,
          enchantment: resourceData.enchantment || 0,
          charges: resourceData.charges || 0,
          position: resourceData.position || { x: 0, y: 0 },
          timestamp: Date.now(),
        };

        this.entityManager.addResource(resource);
      }
    }

    this.emit('resources-batch-spawned', resourceList.length);
  }

  /**
   * Handles HarvestableChangeState event (resource update)
   */
  private handleHarvestableChangeStateEvent(event: PhotonEvent): void {
    const resourceId = event.parameters[0];
    const resource = this.entityManager.getResource(resourceId);

    if (!resource) {
      return;
    }

    // Update enchantment or charges
    const enchantment = event.parameters[1];
    const charges = event.parameters[2];

    if (enchantment !== undefined) {
      resource.enchantment = enchantment;
    }

    if (charges !== undefined) {
      resource.charges = charges;
    }

    resource.timestamp = Date.now();
    this.entityManager.addResource(resource);
    this.emit('resource-updated', resource);
  }

  /**
   * Handles NewMob event (mob spawn)
   */
  private handleNewMobEvent(event: PhotonEvent): void {
    const mobData = extractMobFromEvent(event);
    if (!mobData) {
      return;
    }

    const mob: Mob = {
      id: mobData.mobId,
      typeId: mobData.typeId,
      health: mobData.health,
      maxHealth: mobData.maxHealth,
      enchantment: mobData.enchantment,
      position: mobData.position,
      timestamp: Date.now(),
    };

    this.entityManager.addMob(mob);
    this.emit('mob-spawned', mob);
  }

  /**
   * Handles RegenerationHealthChanged event (health update)
   */
  private handleRegenerationHealthChangedEvent(event: PhotonEvent): void {
    const entityId = event.parameters[0];
    const health = event.parameters[1];
    const maxHealth = event.parameters[2];

    const mob = this.entityManager.getMob(entityId);
    if (!mob) {
      return;
    }

    mob.health = health;
    mob.maxHealth = maxHealth;
    mob.timestamp = Date.now();
    this.entityManager.addMob(mob);
    this.emit('mob-health-updated', mob);
  }

  /**
   * Handles NewRandomDungeonExit event (dungeon entrance/exit)
   */
  private handleNewRandomDungeonExitEvent(event: PhotonEvent): void {
    const dungeonData = {
      dungeonId: event.parameters[0],
      dungeonType: event.parameters[1],
      position: event.parameters[2],
      isExit: event.parameters[3],
    };

    this.emit('dungeon-detected', dungeonData);
  }

  /**
   * Handles NewChest event (chest spawn)
   */
  private handleNewChestEvent(event: PhotonEvent): void {
    const chestData = extractChestFromEvent(event);
    if (!chestData) {
      return;
    }

    const chest: Chest = {
      id: chestData.chestId,
      chestType: chestData.chestType,
      position: chestData.position,
      timestamp: Date.now(),
    };

    this.entityManager.addChest(chest);
    this.emit('chest-spawned', chest);
  }

  /**
   * Initializes the hardcoded mob type mapping
   * This maps TypeID to mob information
   * In a production system, this would be loaded from a database
   */
  private initializeMobTypeMapping(): void {
    // Sample mob type mappings (inherited from QRadar)
    // In production, this would be loaded from mobs.json or a database
    const mobMappings = [
      { typeId: 1, tier: 1, code: 'Deer', name: 'Deer' },
      { typeId: 2, tier: 1, code: 'Rabbit', name: 'Rabbit' },
      { typeId: 3, tier: 2, code: 'Wolf', name: 'Wolf' },
      { typeId: 4, tier: 2, code: 'Bear', name: 'Bear' },
      { typeId: 111, tier: 3, code: 'Veilweaver', name: 'Veilweaver' },
      { typeId: 112, tier: 4, code: 'Gorgon', name: 'Gorgon' },
      { typeId: 304, tier: 4, code: 'Fairydragon', name: 'Fairy Dragon' },
      { typeId: 1337, tier: 8, code: 'Nameless', name: 'Nameless Boss' },
    ];

    for (const mapping of mobMappings) {
      this.mobTypeMapping.set(mapping.typeId, {
        tier: mapping.tier,
        code: mapping.code,
        name: mapping.name,
      });
    }
  }

  /**
   * Gets mob information by TypeID
   */
  getMobInfo(typeId: number): { tier: number; code: string; name: string } | undefined {
    return this.mobTypeMapping.get(typeId);
  }

  /**
   * Adds or updates a mob type mapping
   */
  addMobTypeMapping(typeId: number, tier: number, code: string, name: string): void {
    this.mobTypeMapping.set(typeId, { tier, code, name });
  }

  /**
   * Loads mob type mappings from external source
   */
  async loadMobTypeMappings(source: string): Promise<void> {
    try {
      // In production, this would fetch from a remote server or load from a file
      console.log(`Loading mob type mappings from ${source}`);
      // TODO: Implement loading logic
    } catch (error) {
      console.error('Failed to load mob type mappings:', error);
      this.emit('error', error);
    }
  }
}

/**
 * Creates a new event processor instance
 */
export function createEventProcessor(entityManager: EntityManager): EventProcessor {
  return new EventProcessor(entityManager);
}
