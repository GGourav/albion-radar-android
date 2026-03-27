/**
 * Entity Manager
 * Manages all game entities (resources, mobs, players, chests)
 * Provides thread-safe access and real-time updates
 */

import { EventEmitter } from 'events';

export interface Resource {
  id: number;
  typeId: number;
  tier: number;
  enchantment: number;
  charges: number;
  position: { x: number; y: number };
  timestamp: number;
}

export interface Mob {
  id: number;
  typeId: number;
  health: number;
  maxHealth: number;
  enchantment: number;
  position: { x: number; y: number };
  timestamp: number;
}

export interface Player {
  id: number;
  characterName: string;
  guildId?: number;
  allianceId?: number;
  factionFlag?: number;
  timestamp: number;
}

export interface Chest {
  id: number;
  chestType: number;
  position: { x: number; y: number };
  timestamp: number;
}

export class EntityManager extends EventEmitter {
  private resources: Map<number, Resource> = new Map();
  private mobs: Map<number, Mob> = new Map();
  private players: Map<number, Player> = new Map();
  private chests: Map<number, Chest> = new Map();

  private staleEntityTimeout: number = 120000; // 2 minutes

  constructor() {
    super();
    this.startStaleEntityCleanup();
  }

  /**
   * Adds or updates a resource
   */
  addResource(resource: Resource): void {
    this.resources.set(resource.id, resource);
    this.emit('resource-added', resource);
  }

  /**
   * Removes a resource
   */
  removeResource(resourceId: number): void {
    this.resources.delete(resourceId);
    this.emit('resource-removed', resourceId);
  }

  /**
   * Gets all resources
   */
  getResources(): Resource[] {
    return Array.from(this.resources.values());
  }

  /**
   * Gets a specific resource
   */
  getResource(resourceId: number): Resource | undefined {
    return this.resources.get(resourceId);
  }

  /**
   * Adds or updates a mob
   */
  addMob(mob: Mob): void {
    this.mobs.set(mob.id, mob);
    this.emit('mob-added', mob);
  }

  /**
   * Removes a mob
   */
  removeMob(mobId: number): void {
    this.mobs.delete(mobId);
    this.emit('mob-removed', mobId);
  }

  /**
   * Gets all mobs
   */
  getMobs(): Mob[] {
    return Array.from(this.mobs.values());
  }

  /**
   * Gets a specific mob
   */
  getMob(mobId: number): Mob | undefined {
    return this.mobs.get(mobId);
  }

  /**
   * Adds or updates a player
   */
  addPlayer(player: Player): void {
    this.players.set(player.id, player);
    this.emit('player-added', player);
  }

  /**
   * Removes a player
   */
  removePlayer(playerId: number): void {
    this.players.delete(playerId);
    this.emit('player-removed', playerId);
  }

  /**
   * Gets all players
   */
  getPlayers(): Player[] {
    return Array.from(this.players.values());
  }

  /**
   * Gets a specific player
   */
  getPlayer(playerId: number): Player | undefined {
    return this.players.get(playerId);
  }

  /**
   * Adds or updates a chest
   */
  addChest(chest: Chest): void {
    this.chests.set(chest.id, chest);
    this.emit('chest-added', chest);
  }

  /**
   * Removes a chest
   */
  removeChest(chestId: number): void {
    this.chests.delete(chestId);
    this.emit('chest-removed', chestId);
  }

  /**
   * Gets all chests
   */
  getChests(): Chest[] {
    return Array.from(this.chests.values());
  }

  /**
   * Gets a specific chest
   */
  getChest(chestId: number): Chest | undefined {
    return this.chests.get(chestId);
  }

  /**
   * Clears all entities
   */
  clear(): void {
    this.resources.clear();
    this.mobs.clear();
    this.players.clear();
    this.chests.clear();
    this.emit('cleared');
  }

  /**
   * Gets entity statistics
   */
  getStats(): {
    resourceCount: number;
    mobCount: number;
    playerCount: number;
    chestCount: number;
  } {
    return {
      resourceCount: this.resources.size,
      mobCount: this.mobs.size,
      playerCount: this.players.size,
      chestCount: this.chests.size,
    };
  }

  /**
   * Starts periodic cleanup of stale entities
   */
  private startStaleEntityCleanup(): void {
    setInterval(() => {
      const now = Date.now();
      const threshold = now - this.staleEntityTimeout;

      // Remove stale resources
      for (const [id, resource] of this.resources.entries()) {
        if (resource.timestamp < threshold) {
          this.removeResource(id);
        }
      }

      // Remove stale mobs
      for (const [id, mob] of this.mobs.entries()) {
        if (mob.timestamp < threshold) {
          this.removeMob(id);
        }
      }

      // Remove stale players
      for (const [id, player] of this.players.entries()) {
        if (player.timestamp < threshold) {
          this.removePlayer(id);
        }
      }

      // Remove stale chests
      for (const [id, chest] of this.chests.entries()) {
        if (chest.timestamp < threshold) {
          this.removeChest(id);
        }
      }
    }, 30000); // Check every 30 seconds
  }

  /**
   * Sets the stale entity timeout
   */
  setStaleEntityTimeout(timeout: number): void {
    this.staleEntityTimeout = timeout;
  }
}

/**
 * Creates a new entity manager instance
 */
export function createEntityManager(): EntityManager {
  return new EntityManager();
}
