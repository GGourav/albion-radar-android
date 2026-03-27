/**
 * Resource Manager
 * Manages resource detection, tracking, and filtering
 */

import { EventEmitter } from 'events';
import { Resource } from '../entities/entity-manager';
import { getResourceDefinition, getResourceName, isValidResource, BiomeType, MistRarity } from '../data/resource-types';

export interface ResourceFilter {
  types?: number[];
  tiers?: number[];
  enchantments?: number[];
  biomes?: BiomeType[];
  includeOnlyMist?: boolean;
  includeOnlyNormal?: boolean;
}

export interface ResourceStats {
  totalResources: number;
  byType: Record<string, number>;
  byTier: Record<number, number>;
  byEnchantment: Record<number, number>;
}

export class ResourceManager extends EventEmitter {
  private resources: Map<number, Resource> = new Map();
  private filters: ResourceFilter = {};
  private stats: ResourceStats = {
    totalResources: 0,
    byType: {},
    byTier: {},
    byEnchantment: {},
  };

  constructor() {
    super();
  }

  /**
   * Adds or updates a resource
   */
  addResource(resource: Resource): void {
    // Validate resource
    if (!isValidResource(resource.typeId, resource.tier, resource.enchantment)) {
      console.warn(`Invalid resource: typeId=${resource.typeId}, tier=${resource.tier}, enchantment=${resource.enchantment}`);
      return;
    }

    this.resources.set(resource.id, resource);
    this.updateStats();
    this.emit('resource-added', resource);
  }

  /**
   * Removes a resource
   */
  removeResource(resourceId: number): void {
    this.resources.delete(resourceId);
    this.updateStats();
    this.emit('resource-removed', resourceId);
  }

  /**
   * Gets all resources
   */
  getResources(): Resource[] {
    return Array.from(this.resources.values());
  }

  /**
   * Gets filtered resources based on current filters
   */
  getFilteredResources(): Resource[] {
    return this.getResources().filter((resource) => this.matchesFilter(resource));
  }

  /**
   * Gets a specific resource
   */
  getResource(resourceId: number): Resource | undefined {
    return this.resources.get(resourceId);
  }

  /**
   * Sets filter criteria
   */
  setFilter(filter: ResourceFilter): void {
    this.filters = filter;
    this.emit('filter-changed', filter);
  }

  /**
   * Gets current filter
   */
  getFilter(): ResourceFilter {
    return { ...this.filters };
  }

  /**
   * Checks if a resource matches the current filter
   */
  private matchesFilter(resource: Resource): boolean {
    const filter = this.filters;

    // Filter by type
    if (filter.types && filter.types.length > 0) {
      const resourceDef = getResourceDefinition(resource.typeId);
      if (!resourceDef || !filter.types.includes(resourceDef.typeId)) {
        return false;
      }
    }

    // Filter by tier
    if (filter.tiers && filter.tiers.length > 0) {
      if (!filter.tiers.includes(resource.tier)) {
        return false;
      }
    }

    // Filter by enchantment
    if (filter.enchantments && filter.enchantments.length > 0) {
      if (!filter.enchantments.includes(resource.enchantment)) {
        return false;
      }
    }

    // Filter by mist/normal
    if (filter.includeOnlyMist && resource.enchantment === 0) {
      return false; // Skip normal resources
    }

    if (filter.includeOnlyNormal && resource.enchantment > 0) {
      return false; // Skip enchanted resources
    }

    return true;
  }

  /**
   * Gets resources near a position
   */
  getResourcesNear(position: { x: number; y: number }, radius: number): Resource[] {
    return this.getFilteredResources().filter((resource) => {
      const dx = resource.position.x - position.x;
      const dy = resource.position.y - position.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      return distance <= radius;
    });
  }

  /**
   * Gets resource statistics
   */
  getStats(): ResourceStats {
    return { ...this.stats };
  }

  /**
   * Updates resource statistics
   */
  private updateStats(): void {
    this.stats = {
      totalResources: this.resources.size,
      byType: {},
      byTier: {},
      byEnchantment: {},
    };

    for (const resource of this.resources.values()) {
      const def = getResourceDefinition(resource.typeId);
      const typeName = def?.typeName || 'Unknown';

      this.stats.byType[typeName] = (this.stats.byType[typeName] || 0) + 1;
      this.stats.byTier[resource.tier] = (this.stats.byTier[resource.tier] || 0) + 1;
      this.stats.byEnchantment[resource.enchantment] = (this.stats.byEnchantment[resource.enchantment] || 0) + 1;
    }

    this.emit('stats-updated', this.stats);
  }

  /**
   * Clears all resources
   */
  clear(): void {
    this.resources.clear();
    this.updateStats();
    this.emit('cleared');
  }

  /**
   * Gets resource information by typeId and tier
   */
  getResourceInfo(typeId: number, tier: number): { name: string; definition: any } | null {
    const def = getResourceDefinition(typeId);
    if (!def) {
      return null;
    }

    return {
      name: getResourceName(typeId, tier),
      definition: def,
    };
  }

  /**
   * Detects mist resources based on enchantment level
   */
  isMistResource(resource: Resource): boolean {
    // Mist resources typically have enchantment level > 0 or specific tier ranges
    // In Albion, mist resources are usually T4+ with enchantment
    return resource.tier >= 4 && resource.enchantment > 0;
  }

  /**
   * Gets mist resource rarity based on enchantment level
   */
  getMistResourceRarity(enchantment: number): MistRarity {
    switch (enchantment) {
      case 1:
        return MistRarity.Common;
      case 2:
        return MistRarity.Uncommon;
      case 3:
        return MistRarity.Rare;
      case 4:
        return MistRarity.Epic;
      case 5:
        return MistRarity.Legendary;
      default:
        return MistRarity.Common;
    }
  }
}

/**
 * Creates a new resource manager instance
 */
export function createResourceManager(): ResourceManager {
  return new ResourceManager();
}
