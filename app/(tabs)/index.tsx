import { ScrollView, Text, View, TouchableOpacity, Switch, Alert } from 'react-native';
import { ScreenContainer } from '@/components/screen-container';
import { RadarView } from '@/components/radar-view';
import { useState, useEffect } from 'react';
import { useRadar } from '@/hooks/use-radar';
import { Mob } from '@/lib/entities/entity-manager';
import { getMobName } from '@/lib/data/mob-types';

/**
 * Home Screen - Albion Online Radar
 * Displays real-time radar with resources, mobs, and other entities
 */
export default function HomeScreen() {
  const {
    isRunning,
    vpnPermission,
    resources,
    mobs,
    chests,
    stats,
    error,
    start,
    stop,
    clearEntities,
  } = useRadar({ debugMode: __DEV__ });

  const [showResources, setShowResources] = useState(true);
  const [showMobs, setShowMobs] = useState(true);
  const [showChests, setShowChests] = useState(true);

  const handleVpnToggle = async (value: boolean) => {
    if (value) {
      try {
        await start();
      } catch (err) {
        Alert.alert('Error', 'Failed to start VPN service');
      }
    } else {
      await stop();
    }
  };

  useEffect(() => {
    if (error) {
      Alert.alert('Radar Error', error);
    }
  }, [error]);

  const getMobInfo = (mob: Mob) => {
    const name = getMobName(mob.typeId);
    const healthPercent = Math.round((mob.health / mob.maxHealth) * 100);
    return { name, healthPercent };
  };

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
                <View className="flex-row items-center gap-2">
                  <View
                    className={`w-2 h-2 rounded-full ${
                      isRunning ? 'bg-green-500' : 'bg-red-500'
                    }`}
                  />
                  <Text className="text-xs text-muted">
                    {isRunning
                      ? `Active - ${stats.packetsProcessed} packets`
                      : vpnPermission === 'denied'
                      ? 'Permission Denied'
                      : 'Disconnected'}
                  </Text>
                </View>
              </View>
              {isRunning ? (
                <TouchableOpacity
                  className="bg-red-500 px-4 py-2 rounded-lg"
                  onPress={() => handleVpnToggle(false)}
                >
                  <Text className="text-white font-semibold">Stop</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  className="bg-primary px-4 py-2 rounded-lg"
                  onPress={() => handleVpnToggle(true)}
                >
                  <Text className="text-white font-semibold">Start</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* Radar Display */}
          <View className="bg-surface rounded-lg p-4 border border-border items-center">
            <Text className="text-sm font-semibold text-foreground mb-3">
              Live Radar {isRunning ? '(Active)' : '(Inactive)'}
            </Text>
            <RadarView
              resources={showResources ? resources : []}
              mobs={showMobs ? mobs : []}
              chests={showChests ? chests : []}
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

            <View className="flex-row justify-between mt-2">
              <Text className="text-xs text-muted">Packets: {stats.packetsProcessed}</Text>
              <Text className="text-xs text-muted">Events: {stats.eventsProcessed}</Text>
              <Text className="text-xs text-muted">Errors: {stats.errors}</Text>
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

            <TouchableOpacity
              className="bg-surface border border-border px-4 py-2 rounded-lg mt-2"
              onPress={clearEntities}
            >
              <Text className="text-foreground font-semibold text-center">Clear Entities</Text>
            </TouchableOpacity>
          </View>

          {/* Recent Mobs */}
          <View className="bg-surface rounded-lg p-4 border border-border gap-2">
            <Text className="text-base font-semibold text-foreground mb-2">Recent Mobs</Text>
            
            {mobs.length === 0 ? (
              <Text className="text-xs text-muted text-center py-4">
                {isRunning ? 'Waiting for mob data...' : 'Start VPN to detect mobs'}
              </Text>
            ) : (
              mobs.slice(0, 5).map((mob) => {
                const info = getMobInfo(mob);
                return (
                  <View key={mob.id} className="flex-row justify-between py-1">
                    <Text className="text-xs text-foreground">{info.name}</Text>
                    <Text className="text-xs text-muted">{info.healthPercent}% HP</Text>
                  </View>
                );
              })
            )}
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
                <Text className="text-xs text-foreground">Mist Resource</Text>
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
          </View>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
