/**
 * Photon Packet Parser
 * Parses Photon protocol packets and extracts game events
 */

import { Buffer } from 'buffer';
import { deserializeValue, deserializeArray, readFloatLE, readInt32BE, readInt16BE } from './protocol16';

export enum PhotonEventCode {
  Leave = 1,
  Move = 3,
  NewCharacter = 29,
  NewSimpleHarvestableObjectList = 38,
  NewHarvestableObject = 40,
  HarvestableChangeState = 46,
  NewMob = 71,
  RegenerationHealthChanged = 91,
  NewRandomDungeonExit = 319,
  NewLootChest = 387,
  NewTreasureChest = 388,
  NewFishingZoneObject = 389,
}

export interface PhotonEvent {
  eventCode: number;
  parameters: Record<number, any>;
  timestamp?: number;
}

export interface PhotonCommand {
  commandType: number;
  channelId: number;
  commandFlags: number;
  commandSequence: number;
  data: Buffer;
}

/**
 * Parses a Photon UDP packet and extracts events
 * Photon packet structure:
 * - Byte 0: Photon protocol version (0x3C = 60)
 * - Byte 1: Message type and flags
 * - Bytes 2-3: Channel ID (big-endian)
 * - Bytes 4-5: Command flags (big-endian)
 * - Bytes 6-9: Command sequence (big-endian)
 * - Bytes 10+: Command data (variable length)
 */
export function parsePhotonPacket(buffer: Buffer): PhotonCommand[] {
  const commands: PhotonCommand[] = [];

  if (buffer.length < 12) {
    return commands; // Packet too small
  }

  const protocolVersion = buffer[0];
  if (protocolVersion !== 0x3c) {
    return commands; // Not a Photon packet
  }

  const messageTypeAndFlags = buffer[1];
  const messageType = (messageTypeAndFlags >> 4) & 0x0f;
  const flags = messageTypeAndFlags & 0x0f;

  const channelId = buffer.readInt16BE(2);
  const commandFlags = buffer.readInt16BE(4);
  const commandSequence = buffer.readInt32BE(6);

  // Parse commands based on message type
  if (messageType === 6 || messageType === 7) {
    // Reliable (6) or Unreliable (7) command
    let offset = 10;

    while (offset < buffer.length) {
      const commandLength = buffer.readInt32BE(offset);
      offset += 4;

      if (offset + commandLength > buffer.length) {
        break;
      }

      const commandData = buffer.subarray(offset, offset + commandLength);
      commands.push({
        commandType: messageType,
        channelId,
        commandFlags,
        commandSequence,
        data: commandData,
      });

      offset += commandLength;
    }
  }

  return commands;
}

/**
 * Parses a Photon command and extracts events
 * Command structure:
 * - Byte 0: Command code (0xFD = Event, 0xFE = Operation Response, 0xFF = Operation Request)
 * - Byte 1: Command flags
 * - Bytes 2-3: Command ID or Event code (big-endian)
 * - Bytes 4+: Parameters (variable length)
 */
export function parsePhotonCommand(command: PhotonCommand): PhotonEvent[] {
  const events: PhotonEvent[] = [];
  const data = command.data;

  if (data.length < 4) {
    return events;
  }

  const commandCode = data[0];
  const commandFlags = data[1];
  const commandId = data.readInt16BE(2);

  // Parse events (0xFD)
  if (commandCode === 0xfd) {
    const eventCode = commandId;
    let offset = 4;

    // Parse parameters (dictionary format)
    const parameters: Record<number, any> = {};

    if (offset < data.length) {
      const paramCount = data[offset];
      offset += 1;

      for (let i = 0; i < paramCount; i++) {
        // Read parameter key (byte)
        const paramKey = data[offset];
        offset += 1;

        // Read parameter value
        try {
          const result = deserializeValue(data, offset);
          parameters[paramKey] = result.value;
          offset += result.bytesRead;
        } catch (e) {
          // Skip malformed parameter
          break;
        }
      }
    }

    events.push({
      eventCode,
      parameters,
    });
  }

  return events;
}

/**
 * Extracts position data from Move event (Event 3)
 * Position is encoded as two float32 values in Little-Endian format
 * Parameter 1: X coordinate
 * Parameter 2: Y coordinate
 */
export function extractPositionFromMoveEvent(event: PhotonEvent): { x: number; y: number } | null {
  if (event.eventCode !== PhotonEventCode.Move) {
    return null;
  }

  const positionData = event.parameters[1];
  if (!positionData || !(positionData instanceof Buffer) || positionData.length < 8) {
    return null;
  }

  const x = readFloatLE(positionData, 0);
  const y = readFloatLE(positionData, 4);

  return { x, y };
}

/**
 * Extracts resource data from NewHarvestableObject event (Event 40)
 * Parameters:
 * - 0: Object ID
 * - 5: Type ID
 * - 7: Tier
 * - 8: Position array [X, Y]
 * - 10: Charges
 * - 11: Enchantment level
 */
export function extractResourceFromEvent(event: PhotonEvent): {
  objectId: number;
  typeId: number;
  tier: number;
  position: { x: number; y: number };
  charges: number;
  enchantment: number;
} | null {
  if (event.eventCode !== PhotonEventCode.NewHarvestableObject) {
    return null;
  }

  const objectId = event.parameters[0];
  const typeId = event.parameters[5];
  const tier = event.parameters[7];
  const positionArray = event.parameters[8];
  const charges = event.parameters[10];
  const enchantment = event.parameters[11];

  if (!positionArray || !Array.isArray(positionArray) || positionArray.length < 2) {
    return null;
  }

  return {
    objectId,
    typeId,
    tier,
    position: { x: positionArray[0], y: positionArray[1] },
    charges,
    enchantment,
  };
}

/**
 * Extracts mob data from NewMob event (Event 71)
 * Parameters:
 * - 0: Mob ID
 * - 1: Type ID
 * - 2: Health
 * - 3: Max health
 * - 4: Position array [X, Y]
 * - 5: Enchantment level
 */
export function extractMobFromEvent(event: PhotonEvent): {
  mobId: number;
  typeId: number;
  health: number;
  maxHealth: number;
  position: { x: number; y: number };
  enchantment: number;
} | null {
  if (event.eventCode !== PhotonEventCode.NewMob) {
    return null;
  }

  const mobId = event.parameters[0];
  const typeId = event.parameters[1];
  const health = event.parameters[2];
  const maxHealth = event.parameters[3];
  const positionArray = event.parameters[4];
  const enchantment = event.parameters[5];

  if (!positionArray || !Array.isArray(positionArray) || positionArray.length < 2) {
    return null;
  }

  return {
    mobId,
    typeId,
    health,
    maxHealth,
    position: { x: positionArray[0], y: positionArray[1] },
    enchantment,
  };
}

/**
 * Extracts player data from NewCharacter event (Event 29)
 * Parameters:
 * - 0: Player ID
 * - 1: Character name
 * - 2: Guild ID (optional)
 * - 3: Alliance ID (optional)
 * - 4: Faction flag (optional)
 */
export function extractPlayerFromEvent(event: PhotonEvent): {
  playerId: number;
  characterName: string;
  guildId?: number;
  allianceId?: number;
  factionFlag?: number;
} | null {
  if (event.eventCode !== PhotonEventCode.NewCharacter) {
    return null;
  }

  const playerId = event.parameters[0];
  const characterName = event.parameters[1];
  const guildId = event.parameters[2];
  const allianceId = event.parameters[3];
  const factionFlag = event.parameters[4];

  return {
    playerId,
    characterName,
    guildId,
    allianceId,
    factionFlag,
  };
}

/**
 * Extracts chest data from NewTreasureChest event (Event 388)
 * Parameters:
 * - 0: Chest ID
 * - 1: Chest type
 * - 2: Position array [X, Y]
 */
export function extractChestFromEvent(event: PhotonEvent): {
  chestId: number;
  chestType: number;
  position: { x: number; y: number };
} | null {
  if (event.eventCode !== PhotonEventCode.NewTreasureChest && event.eventCode !== 387) {
    return null;
  }

  const chestId = event.parameters[0];
  const chestType = event.parameters[1];
  const positionArray = event.parameters[2];

  if (!positionArray || !Array.isArray(positionArray) || positionArray.length < 2) {
    return null;
  }

  return {
    chestId,
    chestType,
    position: { x: positionArray[0], y: positionArray[1] },
  };
}
