/**
 * Resource Type Definitions
 * Defines all resource types, tiers, enchantments, and biome variants
 */

export enum ResourceType {
  Wood = 0,
  Rock = 6,
  Fiber = 11,
  Hide = 16,
  Ore = 23,
}

export enum ResourceTier {
  T1 = 1,
  T2 = 2,
  T3 = 3,
  T4 = 4,
  T5 = 5,
  T6 = 6,
  T7 = 7,
  T8 = 8,
}

export enum EnchantmentLevel {
  E0 = 0,
  E1 = 1,
  E2 = 2,
  E3 = 3,
  E4 = 4,
}

export enum BiomeType {
  Forest = 'forest',
  Highland = 'highland',
  Mountain = 'mountain',
  Steppe = 'steppe',
  Swamp = 'swamp',
}

export enum MistRarity {
  Common = 'common',
  Uncommon = 'uncommon',
  Rare = 'rare',
  Epic = 'epic',
  Legendary = 'legendary',
}

export interface ResourceDefinition {
  typeId: number;
  typeName: string;
  category: string;
  minTier: number;
  maxTier: number;
  validEnchantments: number[];
  validBiomes?: BiomeType[];
  isMistResource?: boolean;
  icon: string;
}

export interface MistResourceDefinition extends ResourceDefinition {
  isMistResource: true;
  rarities: MistRarity[];
}

/**
 * Resource type definitions
 * Maps typeId ranges to resource information
 */
export const RESOURCE_DEFINITIONS: Record<number, ResourceDefinition> = {
  // Wood (typeId 0-5)
  0: {
    typeId: 0,
    typeName: 'Wood',
    category: 'Logs',
    minTier: 1,
    maxTier: 8,
    validEnchantments: [0, 1, 2, 3, 4],
    validBiomes: [BiomeType.Forest],
    icon: 'logs',
  },

  // Rock (typeId 6-10)
  6: {
    typeId: 6,
    typeName: 'Rock',
    category: 'Stone',
    minTier: 1,
    maxTier: 8,
    validEnchantments: [0, 1, 2, 3, 4],
    validBiomes: [BiomeType.Mountain, BiomeType.Highland],
    icon: 'rock',
  },

  // Fiber (typeId 11-15)
  11: {
    typeId: 11,
    typeName: 'Fiber',
    category: 'Plant',
    minTier: 1,
    maxTier: 8,
    validEnchantments: [0, 1, 2, 3, 4],
    validBiomes: [BiomeType.Steppe],
    icon: 'fiber',
  },

  // Hide (typeId 16-22)
  16: {
    typeId: 16,
    typeName: 'Hide',
    category: 'Animal',
    minTier: 1,
    maxTier: 8,
    validEnchantments: [0, 1, 2, 3, 4],
    validBiomes: [BiomeType.Forest, BiomeType.Highland, BiomeType.Mountain, BiomeType.Steppe, BiomeType.Swamp],
    icon: 'hide',
  },

  // Ore (typeId 23-27)
  23: {
    typeId: 23,
    typeName: 'Ore',
    category: 'Mineral',
    minTier: 1,
    maxTier: 8,
    validEnchantments: [0, 1, 2, 3, 4],
    validBiomes: [BiomeType.Mountain],
    icon: 'ore',
  },
};

/**
 * Mist resource definitions
 * Special resources found in the Mist with rarity levels
 */
export const MIST_RESOURCE_DEFINITIONS: Record<string, MistResourceDefinition> = {
  mist_wood: {
    typeId: 0,
    typeName: 'Mist Wood',
    category: 'Mist Logs',
    minTier: 4,
    maxTier: 8,
    validEnchantments: [0, 1, 2, 3, 4],
    isMistResource: true,
    rarities: [MistRarity.Common, MistRarity.Uncommon, MistRarity.Rare, MistRarity.Epic, MistRarity.Legendary],
    icon: 'mist_logs',
  },

  mist_rock: {
    typeId: 6,
    typeName: 'Mist Rock',
    category: 'Mist Stone',
    minTier: 4,
    maxTier: 8,
    validEnchantments: [0, 1, 2, 3, 4],
    isMistResource: true,
    rarities: [MistRarity.Common, MistRarity.Uncommon, MistRarity.Rare, MistRarity.Epic, MistRarity.Legendary],
    icon: 'mist_rock',
  },

  mist_fiber: {
    typeId: 11,
    typeName: 'Mist Fiber',
    category: 'Mist Plant',
    minTier: 4,
    maxTier: 8,
    validEnchantments: [0, 1, 2, 3, 4],
    isMistResource: true,
    rarities: [MistRarity.Common, MistRarity.Uncommon, MistRarity.Rare, MistRarity.Epic, MistRarity.Legendary],
    icon: 'mist_fiber',
  },

  mist_hide: {
    typeId: 16,
    typeName: 'Mist Hide',
    category: 'Mist Animal',
    minTier: 4,
    maxTier: 8,
    validEnchantments: [0, 1, 2, 3, 4],
    isMistResource: true,
    rarities: [MistRarity.Common, MistRarity.Uncommon, MistRarity.Rare, MistRarity.Epic, MistRarity.Legendary],
    icon: 'mist_hide',
  },

  mist_ore: {
    typeId: 23,
    typeName: 'Mist Ore',
    category: 'Mist Mineral',
    minTier: 4,
    maxTier: 8,
    validEnchantments: [0, 1, 2, 3, 4],
    isMistResource: true,
    rarities: [MistRarity.Common, MistRarity.Uncommon, MistRarity.Rare, MistRarity.Epic, MistRarity.Legendary],
    icon: 'mist_ore',
  },
};

/**
 * Mist gate and wisp definitions
 */
export const MIST_GATE_DEFINITIONS = {
  wisp_common: {
    name: 'Common Wisp',
    rarity: MistRarity.Common,
    icon: 'wisp_common',
  },
  wisp_uncommon: {
    name: 'Uncommon Wisp',
    rarity: MistRarity.Uncommon,
    icon: 'wisp_uncommon',
  },
  wisp_rare: {
    name: 'Rare Wisp',
    rarity: MistRarity.Rare,
    icon: 'wisp_rare',
  },
  wisp_epic: {
    name: 'Epic Wisp',
    rarity: MistRarity.Epic,
    icon: 'wisp_epic',
  },
  wisp_legendary: {
    name: 'Legendary Wisp',
    rarity: MistRarity.Legendary,
    icon: 'wisp_legendary',
  },
};

/**
 * Gets resource definition by typeId
 */
export function getResourceDefinition(typeId: number): ResourceDefinition | undefined {
  // Find the definition that matches this typeId range
  for (const [, def] of Object.entries(RESOURCE_DEFINITIONS)) {
    if (typeId >= def.typeId && typeId < def.typeId + 6) {
      return def;
    }
  }

  return undefined;
}

/**
 * Gets resource name by typeId and tier
 */
export function getResourceName(typeId: number, tier: number): string {
  const def = getResourceDefinition(typeId);
  if (!def) {
    return `Unknown Resource (${typeId})`;
  }

  return `${def.typeName} T${tier}`;
}

/**
 * Gets resource icon by typeId
 */
export function getResourceIcon(typeId: number): string {
  const def = getResourceDefinition(typeId);
  if (!def) {
    return 'unknown';
  }

  return def.icon;
}

/**
 * Checks if a resource is valid (tier and enchantment are valid for the type)
 */
export function isValidResource(typeId: number, tier: number, enchantment: number): boolean {
  const def = getResourceDefinition(typeId);
  if (!def) {
    return false;
  }

  if (tier < def.minTier || tier > def.maxTier) {
    return false;
  }

  if (!def.validEnchantments.includes(enchantment)) {
    return false;
  }

  return true;
}

/**
 * Gets all valid tier/enchantment combinations for a resource type
 */
export function getValidResourceCombinations(typeId: number): Array<{ tier: number; enchantment: number }> {
  const def = getResourceDefinition(typeId);
  if (!def) {
    return [];
  }

  const combinations: Array<{ tier: number; enchantment: number }> = [];

  for (let tier = def.minTier; tier <= def.maxTier; tier++) {
    for (const enchantment of def.validEnchantments) {
      combinations.push({ tier, enchantment });
    }
  }

  return combinations;
}
