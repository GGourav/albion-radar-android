/**
 * useRadar Hook
 * React hook for managing radar state and packet processing
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { createEntityManager, Resource, Mob, Player, Chest } from '@/lib/entities/entity-manager';
import { createPacketProcessor, PacketProcessor } from '@/lib/packet-processor';

export interface RadarState {
  isRunning: boolean;
  vpnPermission: 'unknown' | 'granted' | 'denied';
  resources: Resource[];
  mobs: Mob[];
  players: Player[];
  chests: Chest[];
  stats: {
    packetsProcessed: number;
    eventsProcessed: number;
    errors: number;
    resourceCount: number;
    mobCount: number;
    playerCount: number;
    chestCount: number;
  };
  error: string | null;
}

export interface UseRadarOptions {
  debugMode?: boolean;
  autoStart?: boolean;
}

export function useRadar(options: UseRadarOptions = {}) {
  const [state, setState] = useState<RadarState>({
    isRunning: false,
    vpnPermission: 'unknown',
    resources: [],
    mobs: [],
    players: [],
    chests: [],
    stats: {
      packetsProcessed: 0,
      eventsProcessed: 0,
      errors: 0,
      resourceCount: 0,
      mobCount: 0,
      playerCount: 0,
      chestCount: 0,
    },
    error: null,
  });

  const processorRef = useRef<PacketProcessor | null>(null);
  const entityManagerRef = useRef<ReturnType<typeof createEntityManager> | null>(null);

  useEffect(() => {
    const entityManager = createEntityManager();
    const processor = createPacketProcessor(entityManager, {
      debugMode: options.debugMode,
    });

    entityManagerRef.current = entityManager;
    processorRef.current = processor;

    entityManager.on('resource-added', (resource: Resource) => {
      setState((prev) => ({
        ...prev,
        resources: [...prev.resources.filter((r) => r.id !== resource.id), resource],
        stats: { ...prev.stats, resourceCount: entityManager.getStats().resourceCount },
      }));
    });

    entityManager.on('resource-removed', (id: number) => {
      setState((prev) => ({
        ...prev,
        resources: prev.resources.filter((r) => r.id !== id),
        stats: { ...prev.stats, resourceCount: entityManager.getStats().resourceCount },
      }));
    });

    entityManager.on('mob-added', (mob: Mob) => {
      setState((prev) => ({
        ...prev,
        mobs: [...prev.mobs.filter((m) => m.id !== mob.id), mob],
        stats: { ...prev.stats, mobCount: entityManager.getStats().mobCount },
      }));
    });

    entityManager.on('mob-removed', (id: number) => {
      setState((prev) => ({
        ...prev,
        mobs: prev.mobs.filter((m) => m.id !== id),
        stats: { ...prev.stats, mobCount: entityManager.getStats().mobCount },
      }));
    });

    entityManager.on('player-added', (player: Player) => {
      setState((prev) => ({
        ...prev,
        players: [...prev.players.filter((p) => p.id !== player.id), player],
        stats: { ...prev.stats, playerCount: entityManager.getStats().playerCount },
      }));
    });

    entityManager.on('player-removed', (id: number) => {
      setState((prev) => ({
        ...prev,
        players: prev.players.filter((p) => p.id !== id),
        stats: { ...prev.stats, playerCount: entityManager.getStats().playerCount },
      }));
    });

    entityManager.on('chest-added', (chest: Chest) => {
      setState((prev) => ({
        ...prev,
        chests: [...prev.chests.filter((c) => c.id !== chest.id), chest],
        stats: { ...prev.stats, chestCount: entityManager.getStats().chestCount },
      }));
    });

    entityManager.on('chest-removed', (id: number) => {
      setState((prev) => ({
        ...prev,
        chests: prev.chests.filter((c) => c.id !== id),
        stats: { ...prev.stats, chestCount: entityManager.getStats().chestCount },
      }));
    });

    entityManager.on('vpn-error', (error: { code: string; message: string }) => {
      setState((prev) => ({
        ...prev,
        error: error.message,
      }));
    });

    return () => {
      processor.stop();
      entityManager.removeAllListeners();
    };
  }, [options.debugMode]);

  const start = useCallback(async () => {
    if (!processorRef.current) {
      setState((prev) => ({ ...prev, error: 'Processor not initialized' }));
      return;
    }

    try {
      setState((prev) => ({ ...prev, error: null, vpnPermission: 'unknown' }));
      await processorRef.current.start();
      setState((prev) => ({
        ...prev,
        isRunning: true,
        vpnPermission: 'granted',
      }));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      setState((prev) => ({
        ...prev,
        error: message,
        vpnPermission: message.includes('permission') ? 'denied' : prev.vpnPermission,
      }));
    }
  }, []);

  const stop = useCallback(async () => {
    if (!processorRef.current) return;

    try {
      await processorRef.current.stop();
      setState((prev) => ({ ...prev, isRunning: false }));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      setState((prev) => ({ ...prev, error: message }));
    }
  }, []);

  const clearEntities = useCallback(() => {
    if (!entityManagerRef.current) return;
    entityManagerRef.current.clear();
    setState((prev) => ({
      ...prev,
      resources: [],
      mobs: [],
      players: [],
      chests: [],
      stats: {
        ...prev.stats,
        resourceCount: 0,
        mobCount: 0,
        playerCount: 0,
        chestCount: 0,
      },
    }));
  }, []);

  return {
    ...state,
    start,
    stop,
    clearEntities,
  };
          }
