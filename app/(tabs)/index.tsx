import { ScrollView, Text, View, TouchableOpacity, Switch } from 'react-native';
import { ScreenContainer } from '@/components/screen-container';
import { RadarView } from '@/components/radar-view';
import { useState, useEffect } from 'react';
import { Resource } from '@/lib/entities/entity-manager';
import { Mob } from '@/lib/entities/entity-manager';
import { Chest } from '@/lib/entities/entity-manager';
import { createResourceManager } from '@/lib/resources/resource-manager';
import { createMobManager } from '@/lib/mobs/mob-manager';
import { createEntityManager } from '@/lib/entities/entity-manager';
import { createEventProcessor } from '@/lib/events/event-processor';

/**
 * Home Screen - Albion Online Radar
 * Displays real-time radar with resources, mobs, and other entities
 */
export default function HomeScreen() {
  const [resources, setResources] = useState<Resource[]>([]);
  const [mobs, setMobs] = useState<Mob[]>([]);
  const [chests, setChests] = useState<Chest[]>([]);
  const [showResources, setShowResources] = useState(true);
  const [showMobs, setShowMobs] = useState(true);
  const [showChests, setShowChests] = useState(true);
  const [vpnActive, setVpnActive] = useState(false);
  const [stats, setStats] = useState({
    resourceCount: 0,
    mobCount: 0,
    chestCount: 0,
  });

  // Initialize managers
  useEffect(() => {
    const entityManager = createEntityManager();
    const resourceManager = createResourceManager();
    const mobManager = createMobManager();
    const eventProcessor = createEventProcessor(entityManager);

    // Subscribe to entity updates
    entityManager.on('resource-added', (resource: Resource) => {
      setResources((prev) => {
        const updated = prev.filter((r) => r.id !== resource.id);
        return [...updated, resource];
      });
    });

    entityManager.on('mob-added', (mob: Mob) => {
      setMobs((prev) => {
        const updated = prev.filter((m) => m.id !== mob.id);
        return [...updated, mob];
      });
    });

    entityManager.on('chest-added', (chest: Chest) => {
      setChests((prev) => {
        const updated = prev.filter((c) => c.id !== chest.id);
        return [...updated, chest];
      });
    });

    // Subscribe to stats updates
    const updateStats = () => {
      const entityStats = entityManager.getStats();
      setStats({
        resourceCount: entityStats.resourceCount,
        mobCount: entityStats.mobCount,
        chestCount: entityStats.chestCount,
      });
    };

    entityManager.on('resource-added', updateStats);
    entityManager.on('resource-removed', updateStats);
    entityManager.on('mob-added', updateStats);
    entityManager.on('mob-removed', updateStats);
    entityManager.on('chest-added', updateStats);
    entityManager.on('chest-removed', updateStats);

    // Add sample data for testing
    const sampleResources: Resource[] = [
      {
        id: 1,
        typeId: 0,
        tier: 4,
        enchantment: 0,
        charges: 100,
        position: { x: 100, y: 100 },
        timestamp: Date.now(),
      },
      {
        id: 2,
        typeId: 0,
        tier: 5,
        enchantment: 2,
        charges: 100,
        position: { x: 150, y: 80 },
        timestamp: Date.now(),
      },
      {
        id: 3,
        typeId: 23,
        tier: 6,
        enchantment: 1,
        charges: 100,
        position: { x: 80, y: 120 },
        timestamp: Date.now(),
      },
    ];

    const sampleMobs: Mob[] = [
      {
        id: 101,
        typeId: 112,
        health: 500,
        maxHealth: 1000,
        enchantment: 0,
        position: { x: 200, y: 150 },
        timestamp: Date.now(),
      },
      {
        id: 102,
        typeId: 3,
        health: 300,
        maxHealth: 500,
        enchantment: 0,
        position: { x: 50, y: 50 },
        timestamp: Date.now(),
      },
    ];

    const sampleChests: Chest[] = [
      {
        id: 201,
        chestType: 1,
        position: { x: 180, y: 200 },
        timestamp: Date.now(),
      },
    ];

    // Add sample data to managers
    sampleResources.forEach((r) => entityManager.addResource(r));
    sampleMobs.forEach((m) => entityManager.addMob(m));
    sampleChests.forEach((c) => entityManager.addChest(c));

    // Update initial stats
    updateStats();

    return () => {
      entityManager.removeAllListeners();
    };
  }, []);

  return (
    <ScreenContainer className="p-4">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} showsVerticalScrollIndicator={false}>
        <View className="gap-4">
          {/* Header */}
          <View className="items-center gap-2 mb-4">
            <Text className="text-3xl font-bold text-foreground">Albion Radar</Text>
            <Text className="text-sm text-muted">Real-time entity detection</Text>
          </View>

          {/* VPN Status */}
          <View className="bg-surface rounded-lg p-4 border border-border">
            <View className="flex-row items-center justify-between">
              <View className="gap-1">
                <Text className="text-base font-semibold text-foreground">VPN Service</Text>
                <Text className="text-xs text-muted">{vpnActive ? 'Connected' : 'Disconnected'}</Text>
              </View>
              <Switch value={vpnActive} onValueChange={setVpnActive} />
            </View>
          </View>

          {/* Radar Display */}
          <View className="bg-surface rounded-lg p-4 border border-border items-center">
            <Text className="text-sm font-semibold text-foreground mb-3">Live Radar</Text>
            <RadarView
              resources={resources}
              mobs={mobs}
              chests={chests}
              playerPosition={{ x: 0, y: 0 }}
              showResources={showResources}
              showMobs={showMobs}
              showChests={showChests}
              width={280}
              height={280}
            />
          </View>

          {/* Entity Statistics */}
          <View className="bg-surface rounded-lg p-4 border border-border gap-3">
            <Text className="text-base font-semibold text-foreground">Statistics</Text>

            <View className="flex-row gap-3">
              <View className="flex-1 bg-background rounded-lg p-3 items-center">
                <Text className="text-2xl font-bold text-primary">{stats.resourceCount}</Text>
                <Text className="text-xs text-muted mt-1">Resources</Text>
              </View>

              <View className="flex-1 bg-background rounded-lg p-3 items-center">
                <Text className="text-2xl font-bold text-warning">{stats.mobCount}</Text>
                <Text className="text-xs text-muted mt-1">Mobs</Text>
              </View>

              <View className="flex-1 bg-background rounded-lg p-3 items-center">
                <Text className="text-2xl font-bold text-success">{stats.chestCount}</Text>
                <Text className="text-xs text-muted mt-1">Chests</Text>
              </View>
            </View>
          </View>

          {/* Display Options */}
          <View className="bg-surface rounded-lg p-4 border border-border gap-3">
            <Text className="text-base font-semibold text-foreground">Display Options</Text>

            <View className="flex-row items-center justify-between">
              <Text className="text-sm text-foreground">Show Resources</Text>
              <Switch value={showResources} onValueChange={setShowResources} />
            </View>

            <View className="flex-row items-center justify-between">
              <Text className="text-sm text-foreground">Show Mobs</Text>
              <Switch value={showMobs} onValueChange={setShowMobs} />
            </View>

            <View className="flex-row items-center justify-between">
              <Text className="text-sm text-foreground">Show Chests</Text>
              <Switch value={showChests} onValueChange={setShowChests} />
            </View>
          </View>

          {/* Legend */}
          <View className="bg-surface rounded-lg p-4 border border-border gap-2">
            <Text className="text-base font-semibold text-foreground mb-2">Legend</Text>

            <View className="gap-2">
              <View className="flex-row items-center gap-2">
                <View className="w-3 h-3 rounded-full bg-green-500" />
                <Text className="text-xs text-foreground">Normal Resource</Text>
              </View>

              <View className="flex-row items-center gap-2">
                <View className="w-3 h-3 rounded-full bg-blue-500" />
                <Text className="text-xs text-foreground">Mist Resource (Common)</Text>
              </View>

              <View className="flex-row items-center gap-2">
                <View className="w-3 h-3 rounded-full bg-yellow-500" />
                <Text className="text-xs text-foreground">Mob (Normal)</Text>
              </View>

              <View className="flex-row items-center gap-2">
                <View className="w-3 h-3 rounded-full bg-red-500" />
                <Text className="text-xs text-foreground">Mob (High Threat)</Text>
              </View>

              <View className="flex-row items-center gap-2">
                <View className="w-3 h-3" style={{ backgroundColor: '#FFD700' }} />
                <Text className="text-xs text-foreground">Chest</Text>
              </View>
            </View>
          </View>

          {/* Action Buttons */}
          <View className="gap-2 mb-4">
            <TouchableOpacity className="bg-primary px-6 py-3 rounded-full active:opacity-80">
              <Text className="text-background font-semibold text-center">Start Overlay</Text>
            </TouchableOpacity>

            <TouchableOpacity className="bg-surface border border-border px-6 py-3 rounded-full active:opacity-80">
              <Text className="text-foreground font-semibold text-center">Settings</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
