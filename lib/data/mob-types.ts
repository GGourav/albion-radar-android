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

/**
 * Mob type mapping (inherited from QRadar)
 * Maps TypeID to mob information
 * This is a sample set; the full mapping should be loaded from data files
 */
export const MOB_DEFINITIONS: Record<number, MobDefinition> = {
  // Tier 1 Skinnable Animals
  1: {
    typeId: 1,
    mobCode: 'Deer',
    mobName: 'Deer',
    tier: 1,
    category: MobCategory.Skinnable,
    threatLevel: ThreatLevel.Safe,
    isSkinnable: true,
    icon: 'deer',
  },

  2: {
    typeId: 2,
    mobCode: 'Rabbit',
    mobName: 'Rabbit',
    tier: 1,
    category: MobCategory.Skinnable,
    threatLevel: ThreatLevel.Safe,
    isSkinnable: true,
    icon: 'rabbit',
  },

  // Tier 2 Mobs
  3: {
    typeId: 3,
    mobCode: 'Wolf',
    mobName: 'Wolf',
    tier: 2,
    category: MobCategory.Normal,
    threatLevel: ThreatLevel.Caution,
    icon: 'wolf',
  },

  4: {
    typeId: 4,
    mobCode: 'Bear',
    mobName: 'Bear',
    tier: 2,
    category: MobCategory.Normal,
    threatLevel: ThreatLevel.Caution,
    icon: 'bear',
  },

  // Tier 3 Mobs
  111: {
    typeId: 111,
    mobCode: 'Veilweaver',
    mobName: 'Veilweaver',
    tier: 3,
    category: MobCategory.Normal,
    threatLevel: ThreatLevel.Danger,
    icon: 'veilweaver',
  },

  // Tier 4 Mobs
  112: {
    typeId: 112,
    mobCode: 'Gorgon',
    mobName: 'Gorgon',
    tier: 4,
    category: MobCategory.Normal,
    threatLevel: ThreatLevel.Danger,
    icon: 'gorgon',
  },

  // Tier 4 Dragons
  304: {
    typeId: 304,
    mobCode: 'Fairydragon',
    mobName: 'Fairy Dragon',
    tier: 4,
    category: MobCategory.Normal,
    threatLevel: ThreatLevel.Extreme,
    icon: 'fairydragon',
  },

  // Bosses
  1337: {
    typeId: 1337,
    mobCode: 'Nameless',
    mobName: 'Nameless Boss',
    tier: 8,
    category: MobCategory.Boss,
    threatLevel: ThreatLevel.Extreme,
    isBoss: true,
    icon: 'nameless',
  },

  // Mist Bosses
  2000: {
    typeId: 2000,
    mobCode: 'MistBoss',
    mobName: 'Mist Boss',
    tier: 8,
    category: MobCategory.MistBoss,
    threatLevel: ThreatLevel.Extreme,
    isMistBoss: true,
    icon: 'mistboss',
  },

  // Drones
  3000: {
    typeId: 3000,
    mobCode: 'Drone',
    mobName: 'Resource Drone',
    tier: 5,
    category: MobCategory.Drone,
    threatLevel: ThreatLevel.Caution,
    isDrone: true,
    icon: 'drone',
  },
};

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
  // If mob is already defined with a threat level, use that
  if (mobDef.threatLevel) {
    return mobDef.threatLevel;
  }

  // Otherwise, determine based on tier and health percentage
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
 * Loads mob definitions from external source
 * In production, this would fetch from a remote server or load from a file
 */
export async function loadMobDefinitionsFromSource(source: string): Promise<void> {
  try {
    console.log(`Loading mob definitions from ${source}`);
    // TODO: Implement loading logic
  } catch (error) {
    console.error('Failed to load mob definitions:', error);
  }
}
