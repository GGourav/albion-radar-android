/**
 * Photon Protocol16 Deserializer
 * Handles binary deserialization of Exit Games' Photon networking protocol
 * Used by Albion Online for client-server communication on UDP port 5056
 */

import { Buffer } from 'buffer';

export enum Protocol16Type {
  Unknown = 0x00,
  Null = 0x2a,
  Byte = 0x62,
  Short = 0x6b,
  Integer = 0x69,
  Float = 0x66,
  String = 0x73,
  ByteArray = 0x78,
  Dictionary = 0x44,
  Hashtable = 0x68,
}

export interface DeserializeResult {
  value: any;
  bytesRead: number;
}

/**
 * Deserializes a single value from a buffer at the given offset
 * Returns the deserialized value and the number of bytes read
 */
export function deserializeValue(buffer: Buffer, offset: number): DeserializeResult {
  if (offset >= buffer.length) {
    throw new Error('Offset exceeds buffer length');
  }

  const typeCode = buffer[offset];

  switch (typeCode) {
    case Protocol16Type.Null:
      return { value: null, bytesRead: 1 };

    case Protocol16Type.Byte:
      return {
        value: buffer.readInt8(offset + 1),
        bytesRead: 2,
      };

    case Protocol16Type.Short:
      return {
        value: buffer.readInt16BE(offset + 1),
        bytesRead: 3,
      };

    case Protocol16Type.Integer:
      return {
        value: buffer.readInt32BE(offset + 1),
        bytesRead: 5,
      };

    case Protocol16Type.Float:
      // NOTE: Albion uses Little-Endian for float32 in Move events (Event 3)
      // but Big-Endian for other data. We default to Big-Endian here.
      return {
        value: buffer.readFloatBE(offset + 1),
        bytesRead: 5,
      };

    case Protocol16Type.String:
      return deserializeString(buffer, offset + 1);

    case Protocol16Type.ByteArray:
      return deserializeByteArray(buffer, offset + 1);

    case Protocol16Type.Dictionary:
      return deserializeDictionary(buffer, offset + 1);

    case Protocol16Type.Hashtable:
      return deserializeHashtable(buffer, offset + 1);

    default:
      // Unknown type, skip 1 byte
      return { value: undefined, bytesRead: 1 };
  }
}

/**
 * Deserializes a UTF-8 string with 16-bit big-endian length prefix
 */
function deserializeString(buffer: Buffer, offset: number): DeserializeResult {
  if (offset + 2 > buffer.length) {
    throw new Error('Not enough data to read string length');
  }

  const length = buffer.readInt16BE(offset);
  if (length < 0) {
    return { value: null, bytesRead: 2 };
  }

  if (offset + 2 + length > buffer.length) {
    throw new Error('Not enough data to read string content');
  }

  const value = buffer.toString('utf8', offset + 2, offset + 2 + length);
  return { value, bytesRead: 2 + length };
}

/**
 * Deserializes a byte array with 32-bit big-endian length prefix
 */
function deserializeByteArray(buffer: Buffer, offset: number): DeserializeResult {
  if (offset + 4 > buffer.length) {
    throw new Error('Not enough data to read byte array length');
  }

  const length = buffer.readInt32BE(offset);
  if (length < 0) {
    return { value: null, bytesRead: 4 };
  }

  if (offset + 4 + length > buffer.length) {
    throw new Error('Not enough data to read byte array content');
  }

  const value = buffer.subarray(offset + 4, offset + 4 + length);
  return { value, bytesRead: 4 + length };
}

/**
 * Deserializes a dictionary (key-value pairs)
 * Format: count (2 bytes) + [key_type + key + value_type + value] * count
 */
function deserializeDictionary(buffer: Buffer, offset: number): DeserializeResult {
  if (offset + 2 > buffer.length) {
    throw new Error('Not enough data to read dictionary count');
  }

  const count = buffer.readInt16BE(offset);
  let currentOffset = offset + 2;
  const dict: Record<string, any> = {};

  for (let i = 0; i < count; i++) {
    // Deserialize key
    const keyResult = deserializeValue(buffer, currentOffset);
    currentOffset += keyResult.bytesRead;

    // Deserialize value
    const valueResult = deserializeValue(buffer, currentOffset);
    currentOffset += valueResult.bytesRead;

    const keyStr = String(keyResult.value);
    dict[keyStr] = valueResult.value;
  }

  return { value: dict, bytesRead: currentOffset - offset };
}

/**
 * Deserializes a hashtable (similar to dictionary but with different format)
 * Format: count (2 bytes) + [key_type + key + value_type + value] * count
 */
function deserializeHashtable(buffer: Buffer, offset: number): DeserializeResult {
  // Hashtable format is similar to dictionary in Protocol16
  return deserializeDictionary(buffer, offset);
}

/**
 * Deserializes an array of values
 * Format: count (2 bytes) + [value_type + value] * count
 */
export function deserializeArray(buffer: Buffer, offset: number): DeserializeResult {
  if (offset + 2 > buffer.length) {
    throw new Error('Not enough data to read array count');
  }

  const count = buffer.readInt16BE(offset);
  let currentOffset = offset + 2;
  const array: any[] = [];

  for (let i = 0; i < count; i++) {
    const result = deserializeValue(buffer, currentOffset);
    currentOffset += result.bytesRead;
    array.push(result.value);
  }

  return { value: array, bytesRead: currentOffset - offset };
}

/**
 * Reads a float32 in Little-Endian format (used for position data in Move events)
 */
export function readFloatLE(buffer: Buffer, offset: number): number {
  return buffer.readFloatLE(offset);
}

/**
 * Reads a float32 in Big-Endian format (default for most Photon data)
 */
export function readFloatBE(buffer: Buffer, offset: number): number {
  return buffer.readFloatBE(offset);
}

/**
 * Reads a 32-bit signed integer in Big-Endian format
 */
export function readInt32BE(buffer: Buffer, offset: number): number {
  return buffer.readInt32BE(offset);
}

/**
 * Reads a 16-bit signed integer in Big-Endian format
 */
export function readInt16BE(buffer: Buffer, offset: number): number {
  return buffer.readInt16BE(offset);
}

/**
 * Reads a single byte
 */
export function readInt8(buffer: Buffer, offset: number): number {
  return buffer.readInt8(offset);
}
