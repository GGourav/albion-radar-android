# Albion Online Android Radar - Project TODO

## Phase 1: Core Infrastructure

- [x] VpnService implementation (packet capture setup)
- [x] Android VPN permission handling and UI flow
- [x] Photon Protocol16 deserializer implementation
- [x] UDP packet filtering for port 5056
- [ ] SQLite database schema and initialization
- [x] Entity handler base classes and event routing system
- [x] EventBus integration for real-time UI updates

## Phase 2: Resource Detection (Priority 1 - 100% Critical)

- [x] Resource event parser (NewHarvestableObject, NewSimpleHarvestableObjectList)
- [x] HarvestableChangeState handler (enchantment and charge updates)
- [x] Resource type definitions (Ore, Wood, Fiber, Hide, Rock)
- [x] Tier and enchantment level detection (T1-T8, E0-E4)
- [x] Mist resource detection and rarity classification
- [x] Mist gate and wisp detection with rarity levels
- [x] Biome-specific resource variants (Forest, Highland, Mountain, Steppe, Swamp)
- [ ] Resource database schema and queries
- [ ] Basic radar visualization for resources
- [ ] Resource filtering UI

## Phase 3: Mob Detection (Priority 2)

- [x] Mob event parser (NewMob, MobChangeState)
- [x] Hardcoded mob type mapping table (TypeID → mob info)
- [x] Mob threat classification (Normal, Enchanted, MiniBoss, Boss, MistBoss, Drone)
- [x] Health and enchantment level tracking
- [ ] Mob database schema and queries
- [ ] Mob icon rendering on radar
- [ ] Mob threat level color coding
- [ ] Mob filtering UI

## Phase 4: Additional Features (Priority 3-4)

- [ ] Dungeon entrance/exit detection (NewRandomDungeonExit)
- [ ] Fishing zone detection (NewFishingZoneObject)
- [ ] Mist portal detection (heuristic-based)
- [ ] Wisp cage detection
- [ ] Chest detection (NewTreasureChest, NewLootChest)
- [ ] Chest rarity indicators
- [ ] Player detection (NewCharacter)
- [ ] Player threat assessment (zone-aware)
- [ ] Guild and alliance detection

## Phase 5: UI and Display Modes

- [x] Floating overlay implementation (WindowManager)
- [x] Overlay position and size configuration
- [x] Overlay transparency and opacity controls
- [x] Full-screen radar activity
- [x] Radar zoom and pan controls
- [x] Entity detail view
- [x] Settings screen
- [x] Filter configuration UI
- [x] VPN status indicator
- [x] Quick-settings tile for overlay toggle

## Phase 6: Data Management

- [x] Bundled data loading (mobs.json, resources.json, zones.json)
- [x] Remote data endpoint integration
- [x] Version checking and update detection
- [x] Delta update mechanism
- [x] Fallback to bundled data on network error
- [x] Background sync scheduler
- [x] Data validation and error handling
- [x] SQLite migration system

## Phase 7: Performance and Optimization

- [ ] Viewport culling (render only visible entities)
- [ ] Batch rendering optimization
- [ ] Bitmap caching for icons
- [ ] Memory profiling and optimization
- [ ] Battery usage optimization
- [ ] Network bandwidth optimization
- [ ] Update frequency tuning
- [ ] Latency measurements and optimization

## Phase 8: Testing and Deployment

- [ ] Unit tests for protocol parser
- [ ] Integration tests for entity handlers
- [ ] End-to-end testing with live Albion Online
- [ ] Performance testing and benchmarking
- [ ] Battery drain testing
- [ ] Network resilience testing
- [ ] APK signing and build configuration
- [ ] Release notes and documentation
- [ ] Deployment to Play Store (optional)

## Bugs and Issues

(None logged yet)

## Notes

- Resource detection is 100% critical for v1 release
- Mob detection is high priority but can use initial hardcoded mapping
- Player detection is best-effort (position tracking not possible without MITM)
- Data updates expected frequently (possibly with each game patch)
- Hybrid data strategy (local + remote) ensures offline functionality
