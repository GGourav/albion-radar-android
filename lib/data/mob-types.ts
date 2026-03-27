/**
 * Mob Type Definitions
 * Defines all mob types, categories, and threat levels
 */

export enum MobCategory {
  Normal = 'normal',
  Enchanted = 'enchanted',
  MiniBoss = 'miniboss',
  Boss = 'boss',
  MistBoss = 'mistboss',
  Drone = 'drone',
  Skinnable = 'skinnable',
}

export enum ThreatLevel {
  Safe = 'safe',
  Caution = 'caution',
  Danger = 'danger',
  Extreme = 'extreme',
}

export interface MobDefinition {
  typeId: number;
  mobCode: string;
  mobName: string;
  tier: number;
  category: MobCategory;
  threatLevel: ThreatLevel;
  isBoss?: boolean;
  isMistBoss?: boolean;
  isDrone?: boolean;
  isSkinnable?: boolean;
  icon: string;
}

// Import full mob data from JSON
import mobData from '../../data/mobs.json';

/**
 * Mob type mapping - Auto-generated from data/mobs.json
 * Maps TypeID to mob information
 */
export const MOB_DEFINITIONS: Record<number, MobDefinition> = {};

// Initialize mob definitions from JSON data
function initializeMobDefinitions(): void {
  for (const entry of mobData) {
    const category = mapCategory(entry.Category);
    const tier = entry.Tier;
    
    MOB_DEFINITIONS[entry.TypeId] = {
      typeId: entry.TypeId,
      mobCode: entry.MobCode,
      mobName: entry.MobName,
      tier: tier,
      category: category,
      threatLevel: calculateThreatFromTier(tier, category),
      isBoss: category === MobCategory.Boss,
      isMistBoss: category === MobCategory.MistBoss,
      isDrone: category === MobCategory.Drone,
      isSkinnable: category === MobCategory.Skinnable,
      icon: entry.MobCode.toLowerCase(),
    };
  }
}

/**
 * Maps string category to enum
 */
function mapCategory(categoryStr: string): MobCategory {
  const categoryMap: Record<string, MobCategory> = {
    'Normal': MobCategory.Normal,
    'Enchanted': MobCategory.Enchanted,
    'MiniBoss': MobCategory.MiniBoss,
    'Boss': MobCategory.Boss,
    'MistBoss': MobCategory.MistBoss,
    'Drone': MobCategory.Drone,
    'Skinnable': MobCategory.Skinnable,
  };
  return categoryMap[categoryStr] || MobCategory.Normal;
}

/**
 * Calculates threat level from tier and category
 */
function calculateThreatFromTier(tier: number, category: MobCategory): ThreatLevel {
  if (category === MobCategory.Boss || category === MobCategory.MistBoss) {
    return ThreatLevel.Extreme;
  }
  
  if (category === MobCategory.MiniBoss) {
    return tier >= 7 ? ThreatLevel.Extreme : ThreatLevel.Danger;
  }
  
  if (tier >= 8) return ThreatLevel.Extreme;
  if (tier >= 6) return ThreatLevel.Danger;
  if (tier >= 4) return ThreatLevel.Caution;
  return ThreatLevel.Safe;
}

// Initialize on load
initializeMobDefinitions();

/**
 * Gets mob definition by typeId
 */
export function getMobDefinition(typeId: number): MobDefinition | undefined {
  return MOB_DEFINITIONS[typeId];
}

/**
 * Gets mob name by typeId
 */
export function getMobName(typeId: number): string {
  const def = getMobDefinition(typeId);
  if (!def) {
    return `Unknown Mob (${typeId})`;
  }
  return def.mobName;
}

/**
 * Gets mob icon by typeId
 */
export function getMobIcon(typeId: number): string {
  const def = getMobDefinition(typeId);
  if (!def) {
    return 'unknown';
  }
  return def.icon;
}

/**
 * Determines threat level based on mob health and category
 */
export function determineThreatLevel(mobDef: MobDefinition, health: number, maxHealth: number): ThreatLevel {
  if (mobDef.threatLevel) {
    return mobDef.threatLevel;
  }

  const healthPercentage = (health / maxHealth) * 100;

  if (mobDef.tier >= 8) {
    return ThreatLevel.Extreme;
  }

  if (mobDef.tier >= 6) {
    return healthPercentage > 50 ? ThreatLevel.Extreme : ThreatLevel.Danger;
  }

  if (mobDef.tier >= 4) {
    return ThreatLevel.Danger;
  }

  if (mobDef.tier >= 2) {
    return ThreatLevel.Caution;
  }

  return ThreatLevel.Safe;
}

/**
 * Checks if a mob is a boss
 */
export function isBoss(mobDef: MobDefinition): boolean {
  return mobDef.isBoss === true || mobDef.category === MobCategory.Boss;
}

/**
 * Checks if a mob is a mist boss
 */
export function isMistBoss(mobDef: MobDefinition): boolean {
  return mobDef.isMistBoss === true || mobDef.category === MobCategory.MistBoss;
}

/**
 * Checks if a mob is a drone
 */
export function isDrone(mobDef: MobDefinition): boolean {
  return mobDef.isDrone === true || mobDef.category === MobCategory.Drone;
}

/**
 * Checks if a mob is skinnable
 */
export function isSkinnable(mobDef: MobDefinition): boolean {
  return mobDef.isSkinnable === true || mobDef.category === MobCategory.Skinnable;
}

/**
 * Gets all mobs of a specific category
 */
export function getMobsByCategory(category: MobCategory): MobDefinition[] {
  return Object.values(MOB_DEFINITIONS).filter((mob) => mob.category === category);
}

/**
 * Gets all mobs of a specific tier
 */
export function getMobsByTier(tier: number): MobDefinition[] {
  return Object.values(MOB_DEFINITIONS).filter((mob) => mob.tier === tier);
}

/**
 * Gets all boss mobs
 */
export function getAllBosses(): MobDefinition[] {
  return Object.values(MOB_DEFINITIONS).filter((mob) => isBoss(mob));
}

/**
 * Adds a new mob type mapping
 */
export function addMobDefinition(definition: MobDefinition): void {
  MOB_DEFINITIONS[definition.typeId] = definition;
}

/**
 * Gets total mob count
 */
export function getMobCount(): number {
  return Object.keys(MOB_DEFINITIONS).length;
}
