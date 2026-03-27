import { ScrollView, Text, View, TouchableOpacity, Switch } from 'react-native';
import { ScreenContainer } from '@/components/screen-container';
import { useState } from 'react';

/**
 * Settings Screen
 * Allows users to configure radar options, data sources, and display preferences
 */
export default function SettingsScreen() {
  const [dataSource, setDataSource] = useState<'local' | 'remote' | 'hybrid'>('hybrid');
  const [autoUpdate, setAutoUpdate] = useState(true);
  const [updateFrequency, setUpdateFrequency] = useState<'hourly' | 'daily' | 'weekly'>('daily');
  const [overlayMode, setOverlayMode] = useState<'floating' | 'fullscreen'>('floating');
  const [overlayOpacity, setOverlayOpacity] = useState(0.8);
  const [showTierFilter, setShowTierFilter] = useState(false);
  const [selectedTiers, setSelectedTiers] = useState<number[]>([1, 2, 3, 4, 5, 6, 7, 8]);

  const toggleTier = (tier: number) => {
    if (selectedTiers.includes(tier)) {
      setSelectedTiers(selectedTiers.filter((t) => t !== tier));
    } else {
      setSelectedTiers([...selectedTiers, tier]);
    }
  };

  return (
    <ScreenContainer className="p-4">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} showsVerticalScrollIndicator={false}>
        <View className="gap-4">
          {/* Header */}
          <View className="items-center gap-2 mb-4">
            <Text className="text-2xl font-bold text-foreground">Settings</Text>
          </View>

          {/* Data Source Section */}
          <View className="bg-surface rounded-lg p-4 border border-border gap-3">
            <Text className="text-base font-semibold text-foreground">Data Source</Text>

            <View className="gap-2">
              <TouchableOpacity
                onPress={() => setDataSource('local')}
                className={`p-3 rounded-lg border ${
                  dataSource === 'local' ? 'bg-primary border-primary' : 'bg-background border-border'
                }`}
              >
                <Text className={`font-medium ${dataSource === 'local' ? 'text-background' : 'text-foreground'}`}>
                  Local Data
                </Text>
                <Text className={`text-xs mt-1 ${dataSource === 'local' ? 'text-background opacity-80' : 'text-muted'}`}>
                  Use bundled mob and resource definitions
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setDataSource('remote')}
                className={`p-3 rounded-lg border ${
                  dataSource === 'remote' ? 'bg-primary border-primary' : 'bg-background border-border'
                }`}
              >
                <Text className={`font-medium ${dataSource === 'remote' ? 'text-background' : 'text-foreground'}`}>
                  Remote Data
                </Text>
                <Text className={`text-xs mt-1 ${dataSource === 'remote' ? 'text-background opacity-80' : 'text-muted'}`}>
                  Download latest definitions from server
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setDataSource('hybrid')}
                className={`p-3 rounded-lg border ${
                  dataSource === 'hybrid' ? 'bg-primary border-primary' : 'bg-background border-border'
                }`}
              >
                <Text className={`font-medium ${dataSource === 'hybrid' ? 'text-background' : 'text-foreground'}`}>
                  Hybrid (Recommended)
                </Text>
                <Text className={`text-xs mt-1 ${dataSource === 'hybrid' ? 'text-background opacity-80' : 'text-muted'}`}>
                  Local fallback with remote updates
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Auto Update Section */}
          <View className="bg-surface rounded-lg p-4 border border-border gap-3">
            <View className="flex-row items-center justify-between">
              <Text className="text-base font-semibold text-foreground">Auto Update</Text>
              <Switch value={autoUpdate} onValueChange={setAutoUpdate} />
            </View>

            {autoUpdate && (
              <View className="gap-2 pt-2">
                <Text className="text-sm text-muted">Update Frequency</Text>
                <View className="flex-row gap-2">
                  {(['hourly', 'daily', 'weekly'] as const).map((freq) => (
                    <TouchableOpacity
                      key={freq}
                      onPress={() => setUpdateFrequency(freq)}
                      className={`flex-1 p-2 rounded border ${
                        updateFrequency === freq ? 'bg-primary border-primary' : 'bg-background border-border'
                      }`}
                    >
                      <Text
                        className={`text-xs font-medium text-center capitalize ${
                          updateFrequency === freq ? 'text-background' : 'text-foreground'
                        }`}
                      >
                        {freq}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}
          </View>

          {/* Overlay Settings */}
          <View className="bg-surface rounded-lg p-4 border border-border gap-3">
            <Text className="text-base font-semibold text-foreground">Overlay Settings</Text>

            <View className="gap-2">
              <Text className="text-sm text-muted">Display Mode</Text>
              <View className="flex-row gap-2">
                {(['floating', 'fullscreen'] as const).map((mode) => (
                  <TouchableOpacity
                    key={mode}
                    onPress={() => setOverlayMode(mode)}
                    className={`flex-1 p-2 rounded border ${
                      overlayMode === mode ? 'bg-primary border-primary' : 'bg-background border-border'
                    }`}
                  >
                    <Text
                      className={`text-xs font-medium text-center capitalize ${
                        overlayMode === mode ? 'text-background' : 'text-foreground'
                      }`}
                    >
                      {mode}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {overlayMode === 'floating' && (
              <View className="gap-2 pt-2">
                <View className="flex-row items-center justify-between">
                  <Text className="text-sm text-muted">Opacity: {Math.round(overlayOpacity * 100)}%</Text>
                </View>
                <View className="h-2 bg-background rounded-full overflow-hidden">
                  <View
                    className="h-full bg-primary"
                    style={{ width: `${overlayOpacity * 100}%` }}
                  />
                </View>
              </View>
            )}
          </View>

          {/* Tier Filter */}
          <View className="bg-surface rounded-lg p-4 border border-border gap-3">
            <TouchableOpacity
              onPress={() => setShowTierFilter(!showTierFilter)}
              className="flex-row items-center justify-between"
            >
              <Text className="text-base font-semibold text-foreground">Resource Tier Filter</Text>
              <Text className="text-primary font-semibold">{showTierFilter ? '−' : '+'}</Text>
            </TouchableOpacity>

            {showTierFilter && (
              <View className="gap-2 pt-2">
                <View className="flex-row flex-wrap gap-2">
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((tier) => (
                    <TouchableOpacity
                      key={tier}
                      onPress={() => toggleTier(tier)}
                      className={`px-3 py-2 rounded border ${
                        selectedTiers.includes(tier) ? 'bg-primary border-primary' : 'bg-background border-border'
                      }`}
                    >
                      <Text
                        className={`text-sm font-medium ${
                          selectedTiers.includes(tier) ? 'text-background' : 'text-foreground'
                        }`}
                      >
                        T{tier}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}
          </View>

          {/* About Section */}
          <View className="bg-surface rounded-lg p-4 border border-border gap-2">
            <Text className="text-base font-semibold text-foreground">About</Text>
            <Text className="text-xs text-muted">Albion Online Radar v1.0.0</Text>
            <Text className="text-xs text-muted">Powered by Photon Protocol Parser</Text>
          </View>

          {/* Action Buttons */}
          <View className="gap-2 mb-4">
            <TouchableOpacity className="bg-primary px-6 py-3 rounded-full active:opacity-80">
              <Text className="text-background font-semibold text-center">Save Settings</Text>
            </TouchableOpacity>

            <TouchableOpacity className="bg-error px-6 py-3 rounded-full active:opacity-80">
              <Text className="text-background font-semibold text-center">Reset to Defaults</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
