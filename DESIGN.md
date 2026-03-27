# Albion Online Android Radar - Design Document

## 1. Executive Summary

This document outlines the design for a new, fully functional Android APK for Albion Online that addresses the hardcoded mapping limitations of existing solutions. The application will provide real-time radar functionality with dynamic data management, supporting both floating overlay and full-screen display modes.

## 2. Core Architecture

### 2.1 Technology Stack

| Component | Technology | Purpose |
|-----------|-----------|---------|
| Platform | Android (React Native + Expo) | Cross-platform mobile development |
| Packet Capture | Android VpnService API | Non-root network interception |
| Protocol Parser | Custom Photon Protocol16 decoder | Binary protocol deserialization |
| UI Framework | React Native + NativeWind | Native Android UI components |
| Overlay System | WindowManager + TYPE_APPLICATION_OVERLAY | Floating radar display |
| Data Storage | SQLite (local) + AsyncStorage | Persistent entity and settings storage |
| Data Source | Hybrid (local + remote) | Bundled data with remote update capability |

### 2.2 Key Design Decisions

**Dynamic Data Management:** Instead of hardcoding mob type mappings like QRadar, the application will use a database-driven approach inspired by OpenRadar. Mob and resource definitions will be stored in structured JSON/SQLite format, enabling easy updates without recompiling the APK.

**Hybrid Data Strategy:** The APK will bundle baseline mob and resource data locally. On startup, it will attempt to download updated definitions from a remote server. If the download fails or the device is offline, the app will fall back to the bundled data, ensuring functionality even without internet connectivity.

**Dual Display Modes:** The application will support both floating overlay (for convenience while playing) and full-screen activity (for detailed inspection). Users can toggle between modes based on their preference.

**Priority-Based Feature Implementation:** Development will follow a phased approach, prioritizing resource detection (100% critical), followed by mob detection, dungeons, chests, and finally player detection (best-effort).

## 3. Feature Specification

### 3.1 Priority 1: Resource Detection (100% Critical)

**Supported Resource Types:**
- Standard resources: Ore (T1-T8), Wood (T1-T8), Fiber (T1-T8), Hide (T1-T8), Rock (T1-T8)
- Mist resources: All resource types with mist variants
- Mist gates and wisps with rarity levels: Common, Uncommon, Rare, Epic, Legendary

**Data Captured:**
- Resource ID, type, tier (1-8), enchantment level (0-4), position (X, Y coordinates)
- Remaining charges and respawn information
- Biome-specific variants (Forest, Highland, Mountain, Steppe, Swamp)

**Detection Method:** Packet-based capture from Photon protocol events (NewHarvestableObject, NewSimpleHarvestableObjectList, HarvestableChangeState)

### 3.2 Priority 2: Mob Detection

**Mob Categories:**
- Normal mobs: Standard hostile creatures
- Enchanted mobs: Champion-tier mobs with enhanced stats
- Mini-bosses: Named creatures with VETERAN/ELITE suffixes
- Bosses: World and dungeon bosses
- Mist bosses: Mist-specific boss variants
- Living resources: Animals that drop resources (Skinnable category)
- Drones: Resource drones in Roads of Avalon

**Data Captured:**
- Mob ID, type ID, tier, position, health status
- Threat level classification (Normal, Enchanted, MiniBoss, Boss, MistBoss, Drone)
- Name and localization information

**Detection Method:** TypeID-based lookup from hardcoded mapping table (inherited from QRadar), with dynamic loading capability for future updates

### 3.3 Priority 3: Dungeons and Other Locations

**Supported Locations:**
- Dungeon entrances and exits (from NewRandomDungeonExit events)
- Mist portals (from mob detection heuristics)
- Fishing zones (from NewFishingZoneObject events)
- Wisp cages (special entity detection)

**Data Captured:** Location coordinates, type, entrance/exit status

### 3.4 Priority 4: Chest Detection

**Chest Types:**
- Treasure chests (from NewTreasureChest events)
- Loot chests (from NewLootChest events)
- Rarity indicators (if available in packet data)

**Data Captured:** Chest ID, type, position, rarity level

### 3.5 Priority 5: Player Detection (Best-Effort)

**Player Information:**
- Player ID, nickname, guild, alliance
- Faction affiliation and threat level
- Zone-aware threat assessment (Passive, Faction Warfare, Hostile)

**Limitation:** Albion Online encrypts player movement data, so real-time position tracking is not possible without a MITM proxy. The application will detect player presence and threat level only.

## 4. Technical Implementation Details

### 4.1 Packet Capture Pipeline

```
VpnService (TUN Interface)
    ↓
Port 5056 Filter (UDP packets)
    ↓
Photon Protocol Parser
    ↓
Event Router (Event Code → Handler)
    ↓
Entity Handlers (Players, Mobs, Resources, etc.)
    ↓
Database Update
    ↓
EventBus Broadcast
    ↓
UI Update (Radar Visualization)
```

### 4.2 Photon Protocol Event Mapping

| Event Code | Event Name | Handler Action |
|-----------|-----------|-----------------|
| 1 | Leave | Remove entity from all handlers |
| 3 | Move | Update position (Little-Endian float32) |
| 29 | NewCharacter | Create player entry |
| 38 | NewSimpleHarvestableObjectList | Batch resource spawn |
| 40 | NewHarvestableObject | Individual resource spawn |
| 46 | HarvestableChangeState | Update resource enchantment/charges |
| 71 | NewMob | Create mob entry |
| 91 | RegenerationHealthChanged | Update health status |
| 319 | NewRandomDungeonExit | Dungeon entrance/exit |
| 387 | NewLootChest | Chest spawn |

### 4.3 ID Resolution Strategy

**Resources (Pure Capture):** Server transmits complete resource information (Type ID, Tier, Enchantment, Charges) in NewHarvestableObject events. No lookup required.

**Mobs (Hybrid Approach):** Server transmits only TypeID. Application uses a hardcoded mapping table to resolve TypeID → (Tier, MobCode, Localization). This mapping will be stored in SQLite for easy updates.

**Players (Direct Transmission):** Server transmits player ID, nickname, guild, and faction in NewCharacter events.

### 4.4 Data Storage Architecture

**Local SQLite Database:**
- `mobs` table: TypeID → mob info (tier, code, category, localization)
- `resources` table: Resource type definitions (tier ranges, enchantment combinations)
- `entities` table: Current game state (active players, mobs, resources, chests)
- `settings` table: User preferences (overlay position, zoom level, filters)

**Remote Data Source:**
- JSON endpoint providing updated mob definitions
- Versioning system to detect when updates are available
- Fallback to bundled data if remote fetch fails

### 4.5 Radar Visualization

**Display Modes:**

1. **Floating Overlay:** WindowManager-based overlay rendered on top of the game. Configurable position, size, and transparency. Supports pinch-to-zoom and drag-to-reposition.

2. **Full-Screen Activity:** Dedicated radar screen with enhanced detail view. Accessible via quick-settings tile or notification. Shows detailed entity information and filtering options.

**Rendering:**
- Canvas-based 2D rendering relative to player position
- Rotation matching game camera angle (225 degrees offset)
- Entity icons color-coded by type and threat level
- Real-time updates via EventBus integration

**Performance Optimizations:**
- Viewport culling (render only entities within visible range)
- Batch rendering (group entities by type)
- Bitmap caching for icons
- Configurable update frequency (16ms default)

## 5. Data Management Strategy

### 5.1 Bundled Data

The APK will include baseline mob and resource definitions in `assets/data/`:
- `mobs.json`: ~500 mob type definitions (inherited from QRadar, will be expanded)
- `resources.json`: Resource type definitions and tier/enchantment combinations
- `zones.json`: Zone information and PvP types

### 5.2 Remote Updates

On app startup:
1. Check remote server for data version
2. Compare with local version
3. If newer version available, download and store in SQLite
4. If download fails, use bundled data
5. Periodic background sync (configurable, default: daily)

### 5.3 Update Mechanism

**Endpoint Structure:**
```
GET /api/albion/data/version
Response: { version: "20260327", timestamp: 1711525200 }

GET /api/albion/data/mobs?version=20260327
Response: { mobs: [...], version: "20260327" }
```

**Fallback Strategy:**
- Network error → use local data
- Parse error → use previous version
- Corrupted data → use bundled data

## 6. User Interface Flow

### 6.1 Main Screens

1. **Home Screen:** Quick status, VPN connection indicator, radar toggle
2. **Radar Screen (Full):** Detailed map view with filtering options
3. **Settings Screen:** Overlay configuration, data update settings, filters
4. **Floating Overlay:** Compact radar display over game

### 6.2 User Interactions

- **Start VPN:** User grants VPN permission, app begins packet capture
- **Toggle Overlay:** Quick-settings tile or notification
- **Zoom/Pan:** Pinch-to-zoom and drag gestures
- **Filter Entities:** Toggle resource types, mob categories, etc.
- **View Details:** Tap entity for detailed information

## 7. Security and Performance Considerations

### 7.1 Security

- VpnService requires explicit user permission (displayed at startup)
- No root access required (uses legitimate Android APIs)
- Packet processing runs in background thread to avoid ANR
- No sensitive data stored unencrypted

### 7.2 Performance

- Target: 60 FPS radar updates, 16ms packet processing latency
- Memory optimization: Entity culling, bitmap caching, lazy loading
- Battery optimization: Configurable update frequency, background task throttling
- Network optimization: Gzip compression for remote data, delta updates

## 8. Development Phases

### Phase 1: Core Infrastructure (Week 1)
- VpnService implementation
- Photon Protocol parser
- Basic entity handlers
- SQLite database setup

### Phase 2: Resource Detection (Week 1-2)
- Resource event parsing
- Resource database and lookup
- Basic radar visualization

### Phase 3: Mob Detection (Week 2-3)
- Mob event parsing
- Hardcoded mapping table
- Mob threat classification

### Phase 4: Additional Features (Week 3-4)
- Dungeon detection
- Chest detection
- Player detection

### Phase 5: UI and Polish (Week 4-5)
- Floating overlay implementation
- Full-screen activity
- Settings and filtering
- Performance optimization

### Phase 6: Testing and Deployment (Week 5-6)
- End-to-end testing
- APK build and signing
- Deployment preparation

## 9. Success Metrics

- Resource detection: 100% accuracy for all resource types
- Mob detection: 95%+ accuracy for known mob types
- Overlay responsiveness: <100ms update latency
- Battery impact: <5% additional drain during active use
- Data freshness: Updates available within 24 hours of game patches

## 10. Future Enhancements

- Player position tracking (requires MITM proxy)
- Guild/alliance threat indicators
- Resource respawn time prediction
- Mob loot prediction
- Multi-account support
- Cloud sync of settings and favorites
- Web-based companion app
