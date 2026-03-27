/**
 * Mob Manager
 * Manages mob detection, tracking, and threat assessment
 */

import { EventEmitter } from 'events';
import { Mob } from '../entities/entity-manager';
import { getMobDefinition, getMobName, determineThreatLevel, isBoss, isMistBoss, isDrone, ThreatLevel, MobCategory } from '../data/mob-types';

export interface MobFilter {
  categories?: MobCategory[];
  tiers?: number[];
  threatLevels?: ThreatLevel[];
  includeOnlyBosses?: boolean;
  excludeDrones?: boolean;
}

export interface MobStats {
  totalMobs: number;
  byCategory: Record<string, number>;
  byTier: Record<number, number>;
  byThreatLevel: Record<string, number>;
  bossCount: number;
  droneCount: number;
}

export interface MobWithThreat extends Mob {
  mobName: string;
  threatLevel: ThreatLevel;
  category: MobCategory;
}

export class MobManager extends EventEmitter {
  private mobs: Map<number, MobWithThreat> = new Map();
  private filters: MobFilter = {};
  private stats: MobStats = {
    totalMobs: 0,
    byCategory: {},
    byTier: {},
    byThreatLevel: {},
    bossCount: 0,
    droneCount: 0,
  };

  constructor() {
    super();
  }

  /**
   * Adds or updates a mob
   */
  addMob(mob: Mob): void {
    const mobDef = getMobDefinition(mob.typeId);
    if (!mobDef) {
      console.warn(`Unknown mob typeId: ${mob.typeId}`);
      return;
    }

    const threatLevel = determineThreatLevel(mobDef, mob.health, mob.maxHealth);

    const mobWithThreat: MobWithThreat = {
      ...mob,
      mobName: mobDef.mobName,
      threatLevel,
      category: mobDef.category,
    };

    this.mobs.set(mob.id, mobWithThreat);
    this.updateStats();
    this.emit('mob-added', mobWithThreat);
  }

  /**
   * Removes a mob
   */
  removeMob(mobId: number): void {
    this.mobs.delete(mobId);
    this.updateStats();
    this.emit('mob-removed', mobId);
  }

  /**
   * Gets all mobs
   */
  getMobs(): MobWithThreat[] {
    return Array.from(this.mobs.values());
  }

  /**
   * Gets filtered mobs based on current filters
   */
  getFilteredMobs(): MobWithThreat[] {
    return this.getMobs().filter((mob) => this.matchesFilter(mob));
  }

  /**
   * Gets a specific mob
   */
  getMob(mobId: number): MobWithThreat | undefined {
    return this.mobs.get(mobId);
  }

  /**
   * Sets filter criteria
   */
  setFilter(filter: MobFilter): void {
    this.filters = filter;
    this.emit('filter-changed', filter);
  }

  /**
   * Gets current filter
   */
  getFilter(): MobFilter {
    return { ...this.filters };
  }

  /**
   * Checks if a mob matches the current filter
   */
  private matchesFilter(mob: MobWithThreat): boolean {
    const filter = this.filters;

    // Filter by category
    if (filter.categories && filter.categories.length > 0) {
      if (!filter.categories.includes(mob.category)) {
        return false;
      }
    }

    // Filter by tier
    if (filter.tiers && filter.tiers.length > 0) {
      const mobDef = getMobDefinition(mob.typeId);
      if (!mobDef || !filter.tiers.includes(mobDef.tier)) {
        return false;
      }
    }

    // Filter by threat level
    if (filter.threatLevels && filter.threatLevels.length > 0) {
      if (!filter.threatLevels.includes(mob.threatLevel)) {
        return false;
      }
    }

    // Filter for bosses only
    if (filter.includeOnlyBosses) {
      const mobDef = getMobDefinition(mob.typeId);
      if (!mobDef || !isBoss(mobDef)) {
        return false;
      }
    }

    // Exclude drones
    if (filter.excludeDrones) {
      const mobDef = getMobDefinition(mob.typeId);
      if (mobDef && isDrone(mobDef)) {
        return false;
      }
    }

    return true;
  }

  /**
   * Gets mobs near a position
   */
  getMobsNear(position: { x: number; y: number }, radius: number): MobWithThreat[] {
    return this.getFilteredMobs().filter((mob) => {
      const dx = mob.position.x - position.x;
      const dy = mob.position.y - position.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      return distance <= radius;
    });
  }

  /**
   * Gets all boss mobs
   */
  getBosses(): MobWithThreat[] {
    return this.getMobs().filter((mob) => {
      const mobDef = getMobDefinition(mob.typeId);
      return mobDef && isBoss(mobDef);
    });
  }

  /**
   * Gets all mist bosses
   */
  getMistBosses(): MobWithThreat[] {
    return this.getMobs().filter((mob) => {
      const mobDef = getMobDefinition(mob.typeId);
      return mobDef && isMistBoss(mobDef);
    });
  }

  /**
   * Gets all drones
   */
  getDrones(): MobWithThreat[] {
    return this.getMobs().filter((mob) => {
      const mobDef = getMobDefinition(mob.typeId);
      return mobDef && isDrone(mobDef);
    });
  }

  /**
   * Gets mobs by threat level
   */
  getMobsByThreatLevel(threatLevel: ThreatLevel): MobWithThreat[] {
    return this.getMobs().filter((mob) => mob.threatLevel === threatLevel);
  }

  /**
   * Gets mob statistics
   */
  getStats(): MobStats {
    return { ...this.stats };
  }

  /**
   * Updates mob statistics
   */
  private updateStats(): void {
    this.stats = {
      totalMobs: this.mobs.size,
      byCategory: {},
      byTier: {},
      byThreatLevel: {},
      bossCount: 0,
      droneCount: 0,
    };

    for (const mob of this.mobs.values()) {
      const mobDef = getMobDefinition(mob.typeId);
      if (!mobDef) {
        continue;
      }

      // Count by category
      this.stats.byCategory[mob.category] = (this.stats.byCategory[mob.category] || 0) + 1;

      // Count by tier
      this.stats.byTier[mobDef.tier] = (this.stats.byTier[mobDef.tier] || 0) + 1;

      // Count by threat level
      this.stats.byThreatLevel[mob.threatLevel] = (this.stats.byThreatLevel[mob.threatLevel] || 0) + 1;

      // Count bosses
      if (isBoss(mobDef)) {
        this.stats.bossCount += 1;
      }

      // Count drones
      if (isDrone(mobDef)) {
        this.stats.droneCount += 1;
      }
    }

    this.emit('stats-updated', this.stats);
  }

  /**
   * Clears all mobs
   */
  clear(): void {
    this.mobs.clear();
    this.updateStats();
    this.emit('cleared');
  }

  /**
   * Gets mob information by typeId
   */
  getMobInfo(typeId: number): { name: string; definition: any } | null {
    const def = getMobDefinition(typeId);
    if (!def) {
      return null;
    }

    return {
      name: getMobName(typeId),
      definition: def,
    };
  }

  /**
   * Updates mob threat level based on health
   */
  updateMobHealth(mobId: number, health: number, maxHealth: number): void {
    const mob = this.mobs.get(mobId);
    if (!mob) {
      return;
    }

    const mobDef = getMobDefinition(mob.typeId);
    if (!mobDef) {
      return;
    }

    mob.health = health;
    mob.maxHealth = maxHealth;
    mob.threatLevel = determineThreatLevel(mobDef, health, maxHealth);
    mob.timestamp = Date.now();

    this.mobs.set(mobId, mob);
    this.emit('mob-health-updated', mob);
  }
}

/**
 * Creates a new mob manager instance
 */
export function createMobManager(): MobManager {
  return new MobManager();
}
