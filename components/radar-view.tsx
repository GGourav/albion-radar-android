/**
 * Radar View Component
 * Displays game entities (resources, mobs, players, chests) on a 2D canvas
 * Supports zoom, pan, and real-time updates
 */

import React, { useEffect, useRef, useState } from 'react';
import { View, GestureResponderEvent } from 'react-native';
import { Resource } from '@/lib/entities/entity-manager';
import { Mob } from '@/lib/entities/entity-manager';
import { Player } from '@/lib/entities/entity-manager';
import { Chest } from '@/lib/entities/entity-manager';
import { getResourceIcon } from '@/lib/data/resource-types';
import { getMobIcon } from '@/lib/data/mob-types';

export interface RadarViewProps {
  resources?: Resource[];
  mobs?: Mob[];
  players?: Player[];
  chests?: Chest[];
  playerPosition?: { x: number; y: number };
  zoom?: number;
  onZoomChange?: (zoom: number) => void;
  showResources?: boolean;
  showMobs?: boolean;
  showPlayers?: boolean;
  showChests?: boolean;
  width?: number;
  height?: number;
}

interface RadarState {
  zoom: number;
  panX: number;
  panY: number;
  lastTouchDistance?: number;
}

export const RadarView = React.forwardRef<any, RadarViewProps>(
  (
    {
      resources = [],
      mobs = [],
      players = [],
      chests = [],
      playerPosition = { x: 0, y: 0 },
      zoom: initialZoom = 1,
      onZoomChange,
      showResources = true,
      showMobs = true,
      showPlayers = true,
      showChests = true,
      width = 300,
      height = 300,
    },
    ref
  ) => {
    const canvasRef = useRef<any>(null);
    const [radarState, setRadarState] = useState<RadarState>({
      zoom: initialZoom,
      panX: 0,
      panY: 0,
    });

    /**
     * Draws a resource on the canvas
     */
    const drawResource = (ctx: CanvasRenderingContext2D, resource: Resource) => {
      const x = (resource.position.x - playerPosition.x) * radarState.zoom + width / 2 + radarState.panX;
      const y = (resource.position.y - playerPosition.y) * radarState.zoom + height / 2 + radarState.panY;

      // Skip if off-screen
      if (x < -20 || x > width + 20 || y < -20 || y > height + 20) {
        return;
      }

      // Color by enchantment level
      let color = '#4CAF50'; // Green for normal
      if (resource.enchantment > 0) {
        const rarityColors: Record<number, string> = {
          1: '#2196F3', // Blue - Common
          2: '#9C27B0', // Purple - Uncommon
          3: '#FF9800', // Orange - Rare
          4: '#F44336', // Red - Epic
          5: '#FFD700', // Gold - Legendary
        };
        color = rarityColors[resource.enchantment] || '#4CAF50';
      }

      // Draw resource marker
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(x, y, 4, 0, Math.PI * 2);
      ctx.fill();

      // Draw tier indicator
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 8px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(String(resource.tier), x, y);
    };

    /**
     * Draws a mob on the canvas
     */
    const drawMob = (ctx: CanvasRenderingContext2D, mob: Mob) => {
      const x = (mob.position.x - playerPosition.x) * radarState.zoom + width / 2 + radarState.panX;
      const y = (mob.position.y - playerPosition.y) * radarState.zoom + height / 2 + radarState.panY;

      // Skip if off-screen
      if (x < -20 || x > width + 20 || y < -20 || y > height + 20) {
        return;
      }

      // Color by threat level
      const healthPercentage = (mob.health / mob.maxHealth) * 100;
      let color = '#FFC107'; // Yellow for normal
      if (healthPercentage < 30) {
        color = '#4CAF50'; // Green - Low threat
      } else if (healthPercentage < 60) {
        color = '#FF9800'; // Orange - Medium threat
      } else {
        color = '#F44336'; // Red - High threat
      }

      // Draw mob marker (square)
      ctx.fillStyle = color;
      ctx.fillRect(x - 5, y - 5, 10, 10);

      // Draw health bar
      ctx.fillStyle = '#333333';
      ctx.fillRect(x - 6, y + 8, 12, 2);
      ctx.fillStyle = color;
      ctx.fillRect(x - 6, y + 8, (12 * healthPercentage) / 100, 2);
    };

    /**
     * Draws a player on the canvas
     * Note: Players don't have position data (encrypted by server)
     * This is a placeholder for future implementation
     */
    const drawPlayer = (ctx: CanvasRenderingContext2D, player: Player) => {
      // TODO: Implement when position data is available
    };

    /**
     * Draws a chest on the canvas
     */
    const drawChest = (ctx: CanvasRenderingContext2D, chest: Chest) => {
      const x = (chest.position.x - playerPosition.x) * radarState.zoom + width / 2 + radarState.panX;
      const y = (chest.position.y - playerPosition.y) * radarState.zoom + height / 2 + radarState.panY;

      // Skip if off-screen
      if (x < -20 || x > width + 20 || y < -20 || y > height + 20) {
        return;
      }

      // Draw chest marker (triangle)
      ctx.fillStyle = '#FFD700';
      ctx.beginPath();
      ctx.moveTo(x, y - 6);
      ctx.lineTo(x + 6, y + 6);
      ctx.lineTo(x - 6, y + 6);
      ctx.closePath();
      ctx.fill();
    };

    /**
     * Draws the player at the center
     */
    const drawPlayerCenter = (ctx: CanvasRenderingContext2D) => {
      const x = width / 2;
      const y = height / 2;

      // Draw player circle
      ctx.fillStyle = '#00FF00';
      ctx.beginPath();
      ctx.arc(x, y, 6, 0, Math.PI * 2);
      ctx.fill();

      // Draw direction indicator (triangle pointing up)
      ctx.fillStyle = '#00FF00';
      ctx.beginPath();
      ctx.moveTo(x, y - 10);
      ctx.lineTo(x - 4, y - 2);
      ctx.lineTo(x + 4, y - 2);
      ctx.closePath();
      ctx.fill();
    };

    /**
     * Draws grid lines
     */
    const drawGrid = (ctx: CanvasRenderingContext2D) => {
      ctx.strokeStyle = '#CCCCCC';
      ctx.lineWidth = 0.5;

      const gridSize = 100 * radarState.zoom;
      const startX = (radarState.panX % gridSize) - gridSize;
      const startY = (radarState.panY % gridSize) - gridSize;

      // Vertical lines
      for (let x = startX; x < width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }

      // Horizontal lines
      for (let y = startY; y < height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }
    };

    /**
     * Renders the radar
     */
    const renderRadar = () => {
      if (!canvasRef.current) {
        return;
      }

      const ctx = canvasRef.current.getContext('2d');
      if (!ctx) {
        return;
      }

      // Clear canvas
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, width, height);

      // Draw grid
      drawGrid(ctx);

      // Draw entities
      if (showResources) {
        resources.forEach((resource) => drawResource(ctx, resource));
      }

      if (showMobs) {
        mobs.forEach((mob) => drawMob(ctx, mob));
      }

      if (showChests) {
        chests.forEach((chest) => drawChest(ctx, chest));
      }

      // Players are not rendered (position data is encrypted)
      // if (showPlayers) {
      //   players.forEach((player) => drawPlayer(ctx, player));
      // }

      // Draw player at center
      drawPlayerCenter(ctx);

      // Draw border
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 1;
      ctx.strokeRect(0, 0, width, height);
    };

    /**
     * Handles pinch-to-zoom gesture
     */
    const handlePinch = (e: GestureResponderEvent) => {
      // TODO: Implement pinch-to-zoom using react-native-gesture-handler
    };

    /**
     * Handles pan gesture
     */
    const handlePan = (e: GestureResponderEvent) => {
      // TODO: Implement pan using react-native-gesture-handler
    };

    // Re-render when props change
    useEffect(() => {
      renderRadar();
    }, [resources, mobs, players, chests, playerPosition, radarState, showResources, showMobs, showPlayers, showChests]);

    return (
      <View
        ref={ref}
        className="bg-white rounded-lg border border-gray-300 overflow-hidden"
        style={{ width, height }}
        onTouchMove={handlePan}
      >
        {/* Canvas rendering will be handled by a native component in production */}
      </View>
    );
  }
);

RadarView.displayName = 'RadarView';
