import {
  AnimPhase,
  EnemyKind,
  EnemyState,
  FloatingText,
  HazardZone,
  LobbyNpcDef,
  MinionState,
  Obstacle,
  Particle,
  PickupItem,
  PlayerState,
  Projectile,
  RoomData,
  RoomType,
  SkillAimPreview,
  SlashEffect,
} from '../types';
import { computeZombieRigPose } from './AnimationController';
import {
  drawFallingDaggerProjectile,
  drawGoblinExplosiveTrap,
  drawGoblinHero,
  drawThousandDaggersTelegraph,
} from './GoblinRenderer';
import {
  drawBoneSpearProjectile,
  drawReaperWaveProjectile,
  drawSkeletonHero,
  drawSkeletonWarriorMinion,
} from './SkeletonRenderer';
import { renderVFXLayer, VFXState } from './VFXSystem';

// Reference 16:9 vertical height (650 world units -> ~1155x650 on 16:9 landscape screens)
const BASE_LANDSCAPE_WORLD_HEIGHT = 650;

export function computeLandscapeWorldScale(viewW: number, viewH: number): number {
  if (viewH <= 0 || viewW <= 0) return 1;
  // Uniform scale preserves exact 1:1 sprite aspect ratio (zero stretching, zero cropping)
  return Math.max(0.45, Math.min(1.35, viewH / BASE_LANDSCAPE_WORLD_HEIGHT));
}

export interface RenderWorldState {
  room: RoomData;
  player: PlayerState;
  enemies: EnemyState[];
  minions: MinionState[];
  hazards: HazardZone[];
  projectiles: Projectile[];
  slashes: SlashEffect[];
  particles: Particle[];
  floatingTexts: FloatingText[];
  pickups: PickupItem[];
  vfx: VFXState;
  cameraX: number;
  cameraY: number;
  joystickMoving: boolean;
  skillAimPreview: SkillAimPreview | null;
  time: number;
}

export function renderGameWorld(
  ctx: CanvasRenderingContext2D,
  viewW: number,
  viewH: number,
  world: RenderWorldState
): void {
  const { room, player, time } = world;
  const worldScale = computeLandscapeWorldScale(viewW, viewH);

  // 1. Clear outer sanctuary void
  ctx.fillStyle = '#0F1419';
  ctx.fillRect(0, 0, viewW, viewH);

  ctx.save();
  ctx.translate(viewW / 2, viewH / 2);
  ctx.scale(worldScale, worldScale);
  ctx.translate(-world.cameraX, -world.cameraY);

  // 2. Room Floor & Mossy Flagstones
  drawRoomEnvironment(ctx, room, time);

  // 3. Floor Hazards (Springs, Boss Telegraphs, Organic Poisonous Mire Residue)
  for (const h of world.hazards) {
    if (h.kind !== 'TOMBSTONE') {
      drawHazardZone(ctx, h, time);
    }
  }

  // 3b. Hand-Drawn Multi-Layered VFX — UNDER-ENTITY DEPTH LAYER
  renderVFXLayer(ctx, world.vfx, 'UNDER', time);

  // 4. Enemy Attack Telegraphs on the floor (clear, readable, non-overwhelming)
  for (const e of world.enemies) {
    if (!e.dead && e.aiState === 'TELEGRAPH') {
      drawEnemyTelegraph(ctx, e, time);
    }
  }

  // 4b. MOBA Player Directional Foot Bearing & Skill Aim Ground Indicator
  if (!player.isDead && player.goblinVanishTimer <= 0) {
    drawPlayerMobaIndicators(ctx, player, world.joystickMoving, world.skillAimPreview);
  }

  // 5. Hub Interactive Floor Rings & Platforms (if in Sanctuary Hub)
  if (room.hubStations) {
    for (const st of room.hubStations) {
      drawHubStationFloor(ctx, st, player, time);
    }
  }

  // 6. Flat Ground Pickups (XP, Gold, Hearts, Soul Orbs)
  for (const p of world.pickups) {
    if (p.kind !== 'TREASURE_CHEST') {
      drawPickup(ctx, p, time);
    }
  }

  // 7. Vertical Y-Sorted Standing Entities (Obstacles, Trees, Furniture, NPCs, Tombstones, Chests, Minions, Enemies, Player)
  const depthQueue: { sortY: number; draw: () => void }[] = [];

  for (const obs of room.obstacles) {
    depthQueue.push({
      sortY: obs.y + obs.h,
      draw: () => drawObstacle(ctx, obs, time),
    });
  }

  if (room.npcs) {
    for (const npc of room.npcs) {
      depthQueue.push({
        sortY: npc.y + 15,
        draw: () => drawLobbyNpc(ctx, npc, player, time),
      });
    }
  }

  for (const h of world.hazards) {
    if (h.kind === 'TOMBSTONE') {
      depthQueue.push({
        sortY: h.y + 8,
        draw: () => drawHazardZone(ctx, h, time),
      });
    }
  }

  for (const p of world.pickups) {
    if (p.kind === 'TREASURE_CHEST') {
      depthQueue.push({
        sortY: p.y + 14,
        draw: () => drawPickup(ctx, p, time),
      });
    }
  }

  for (const m of world.minions) {
    depthQueue.push({
      sortY: m.y + 12,
      draw: () => drawMinion(ctx, m, time),
    });
  }

  const isGoblinPlayer = player.heroId === 'goblin';
  for (const e of world.enemies) {
    depthQueue.push({
      sortY: e.y + e.radius * 0.72,
      draw: () => drawEnemy(ctx, e, time, isGoblinPlayer),
    });
  }

  depthQueue.push({
    sortY: player.y + 16,
    draw: () =>
      player.heroId === 'goblin'
        ? drawGoblinHero(ctx, player, time)
        : player.heroId === 'skeleton'
        ? drawSkeletonHero(ctx, player, time)
        : drawZombieHero(ctx, player, time),
  });

  depthQueue.sort((a, b) => a.sortY - b.sortY);
  for (let i = 0; i < depthQueue.length; i++) {
    depthQueue[i].draw();
  }

  // 8. World-Space Proximity Labels for Lobby Stations & NPCs (always crisp above foliage)
  if (room.hubStations) {
    for (const st of room.hubStations) {
      drawHubStationLabel(ctx, st, player);
    }
  }

  // 11. Enemy Slash Trails & Projectiles
  for (const s of world.slashes) {
    drawSlashEffect(ctx, s);
  }

  // 11b. Hand-Drawn Multi-Layered VFX — OVER-ENTITY DEPTH LAYER
  renderVFXLayer(ctx, world.vfx, 'OVER', time);

  // 12. Projectiles
  for (const proj of world.projectiles) {
    drawProjectile(ctx, proj, time);
  }

  // 13. Ambient & Enemy Particles
  for (const pt of world.particles) {
    const ratio = Math.max(0, pt.life / pt.maxLife);
    ctx.globalAlpha = ratio * pt.alpha;
    ctx.fillStyle = pt.color;
    ctx.beginPath();
    ctx.arc(pt.x, pt.y, pt.size * (0.5 + ratio * 0.5), 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;

  // 14. Cozy Ambient Lantern Glow & Floating Spores
  drawLanternLighting(ctx, room, time);

  // 16. Floating Damage & Healing Numbers
  for (const ft of world.floatingTexts) {
    const ratio = Math.max(0, ft.life / ft.maxLife);
    ctx.save();
    ctx.globalAlpha = Math.min(1, ratio * 1.4);
    ctx.font = `700 ${ft.size}px "JetBrains Mono", monospace`;
    ctx.textAlign = 'center';
    ctx.lineWidth = 3.5;
    ctx.strokeStyle = '#0F1419';
    ctx.strokeText(ft.text, ft.x, ft.y);
    ctx.fillStyle = ft.color;
    ctx.fillText(ft.text, ft.x, ft.y);
    ctx.restore();
  }

  ctx.restore();
}

function drawRoomEnvironment(ctx: CanvasRenderingContext2D, room: RoomData, time: number): void {
  const wall = 48;

  // Outer stone wall block
  ctx.fillStyle = '#252D36';
  ctx.strokeStyle = '#14191F';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.roundRect(0, 0, room.width, room.height, 16);
  ctx.fill();
  ctx.stroke();

  // Inner floor base
  const floorBase = room.type === RoomType.HUB ? '#232B2A' : room.type === RoomType.HEALING ? '#1F2C28' : '#1E242B';
  ctx.fillStyle = floorBase;
  ctx.fillRect(wall, wall, room.width - wall * 2, room.height - wall * 2);

  // Flagstone grid tiles with deterministic cozy variation
  const tile = 64;
  for (let gx = wall; gx < room.width - wall; gx += tile) {
    for (let gy = wall; gy < room.height - wall; gy += tile) {
      const tw = Math.min(tile, room.width - wall - gx);
      const th = Math.min(tile, room.height - wall - gy);
      const hash = ((gx * 31 + gy * 17) % 13) / 13;

      ctx.fillStyle = hash > 0.65 ? 'rgba(255,255,255,0.022)' : hash < 0.25 ? 'rgba(0,0,0,0.09)' : 'transparent';
      if (ctx.fillStyle !== 'transparent') {
        ctx.fillRect(gx + 2, gy + 2, tw - 4, th - 4);
      }

      ctx.strokeStyle = 'rgba(12, 16, 20, 0.38)';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(gx, gy, tw, th);

      // Occasional tiny moss patch on tile corners
      if (hash > 0.84) {
        ctx.fillStyle = 'rgba(74, 222, 128, 0.14)';
        ctx.beginPath();
        ctx.arc(gx + 8, gy + 8, 5, 0, Math.PI * 2);
        ctx.arc(gx + 13, gy + 6, 3.5, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  // Cozy Sanctuary Garden Decor Patches (Wooden Decks, Woven Rug, Stepping Stones, Wildflowers)
  if (room.decorPatches) {
    for (const patch of room.decorPatches) {
      ctx.save();
      if (patch.kind === 'WOOD_DECK') {
        const pw = patch.w || 220;
        const ph = patch.h || 180;
        ctx.fillStyle = '#3B281B';
        ctx.strokeStyle = '#1E130C';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.roundRect(patch.x, patch.y, pw, ph, 14);
        ctx.fill();
        ctx.stroke();

        // Warm horizontal plank seams
        ctx.strokeStyle = 'rgba(20, 12, 7, 0.42)';
        ctx.lineWidth = 1.5;
        for (let py = patch.y + 24; py < patch.y + ph - 10; py += 24) {
          ctx.beginPath();
          ctx.moveTo(patch.x + 8, py);
          ctx.lineTo(patch.x + pw - 8, py);
          ctx.stroke();
        }
      } else if (patch.kind === 'RUG') {
        const rw = patch.w || 270;
        const rh = patch.h || 190;
        ctx.fillStyle = '#522429';
        ctx.strokeStyle = '#D97706';
        ctx.lineWidth = 3.5;
        ctx.beginPath();
        ctx.roundRect(patch.x, patch.y, rw, rh, 14);
        ctx.fill();
        ctx.stroke();

        // Inner golden embroidery trim
        ctx.strokeStyle = 'rgba(251, 191, 36, 0.35)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.roundRect(patch.x + 10, patch.y + 10, rw - 20, rh - 20, 9);
        ctx.stroke();
      } else if (patch.kind === 'PATH_STONE') {
        const r = patch.r || 20;
        ctx.fillStyle = '#39464E';
        ctx.strokeStyle = '#1B2329';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.ellipse(patch.x, patch.y, r * 1.25, r * 0.82, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = 'rgba(255,255,255,0.06)';
        ctx.beginPath();
        ctx.ellipse(patch.x - r * 0.2, patch.y - r * 0.15, r * 0.65, r * 0.4, 0, 0, Math.PI * 2);
        ctx.fill();
      } else if (patch.kind === 'FLOWER_TUFT') {
        const sway = Math.sin(time * 2.4 + patch.x * 0.05) * 2;
        ctx.fillStyle = '#15803D';
        ctx.beginPath();
        ctx.ellipse(patch.x - 5, patch.y + 2, 7, 3.5, -0.4, 0, Math.PI * 2);
        ctx.ellipse(patch.x + 5, patch.y + 2, 7, 3.5, 0.4, 0, Math.PI * 2);
        ctx.fill();

        const petalColor = patch.color || '#F472B6';
        ctx.fillStyle = petalColor;
        for (let a = 0; a < 5; a++) {
          const ang = (Math.PI * 2 * a) / 5 + time * 0.3;
          ctx.beginPath();
          ctx.arc(
            patch.x + sway + Math.cos(ang) * 4.2,
            patch.y - 2 + Math.sin(ang) * 4.2,
            2.7,
            0,
            Math.PI * 2
          );
          ctx.fill();
        }
        ctx.fillStyle = '#FEF08A';
        ctx.beginPath();
        ctx.arc(patch.x + sway, patch.y - 2, 2.2, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }
  }

  // Wall bevel border
  ctx.strokeStyle = '#384452';
  ctx.lineWidth = 4;
  ctx.strokeRect(wall, wall, room.width - wall * 2, room.height - wall * 2);

  // North Exit Portal / Crypt Gate
  const px = room.portalPos.x;
  const py = wall;
  ctx.save();
  // Stone archway
  ctx.fillStyle = '#333F4D';
  ctx.strokeStyle = '#11161B';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.roundRect(px - 68, py - 34, 136, 42, 10);
  ctx.fill();
  ctx.stroke();

  if (room.portalOpen) {
    const pulse = 0.75 + Math.sin(time * 4) * 0.2;
    const grad = ctx.createRadialGradient(px, py + 12, 6, px, py + 12, 54);
    grad.addColorStop(0, `rgba(52, 211, 153, ${0.85 * pulse})`);
    grad.addColorStop(0.6, `rgba(16, 185, 129, ${0.35 * pulse})`);
    grad.addColorStop(1, 'rgba(16, 185, 129, 0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(px, py + 14, 54, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#ECFDF5';
    ctx.font = '700 10.5px "Plus Jakarta Sans", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(room.type === RoomType.HUB ? 'DUNGEON ENTRANCE' : 'NEXT ROOM', px, py - 10);
  } else {
    // Locked bramble bars during combat
    ctx.strokeStyle = '#EF4444';
    ctx.lineWidth = 3;
    for (let b = -36; b <= 36; b += 18) {
      ctx.beginPath();
      ctx.moveTo(px + b, py - 26);
      ctx.lineTo(px + b, py + 8);
      ctx.stroke();
    }
  }
  ctx.restore();

  // Event NPC / Cauldron centerpiece in Event Room
  if (room.type === RoomType.EVENT) {
    const cx = room.width / 2;
    const cy = room.height / 2 - 20;
    ctx.save();
    ctx.fillStyle = '#1E293B';
    ctx.strokeStyle = '#0F172A';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(cx, cy, 28, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#34D399';
    ctx.beginPath();
    ctx.arc(cx, cy - 2, 20, 0, Math.PI * 2);
    ctx.fill();

    if (!room.eventResolved) {
      ctx.fillStyle = '#FDE68A';
      ctx.font = '600 12px "Plus Jakarta Sans", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Approach & Tap Action Button', cx, cy - 42);
    }
    ctx.restore();
  }
}

function drawHubStationFloor(
  ctx: CanvasRenderingContext2D,
  st: NonNullable<RoomData['hubStations']>[number],
  player: PlayerState,
  time: number
): void {
  const dist = Math.hypot(player.x - st.x, player.y - st.y);
  const near = dist <= st.radius + 46;
  const isNpc = st.id.startsWith('NPC_');

  ctx.save();
  if (isNpc) {
    if (near) {
      ctx.strokeStyle = st.color;
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 4]);
      ctx.beginPath();
      ctx.arc(st.x, st.y + 8, st.radius * 0.78, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
    }
    ctx.restore();
    return;
  }

  // Outer runic circle
  const pulse = 0.85 + Math.sin(time * 3.5) * 0.15;
  ctx.strokeStyle = near ? st.color : 'rgba(255,255,255,0.18)';
  ctx.lineWidth = near ? 3 : 1.75;
  ctx.beginPath();
  ctx.arc(st.x, st.y, st.radius, 0, Math.PI * 2);
  ctx.stroke();

  if (near) {
    const glow = ctx.createRadialGradient(st.x, st.y, 6, st.x, st.y, st.radius);
    glow.addColorStop(0, `${st.color}33`);
    glow.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(st.x, st.y, st.radius, 0, Math.PI * 2);
    ctx.fill();
  }

  if (st.id === 'CAMPFIRE_HEAL') {
    // Stone hearth ring + crossed logs + layered cozy fire
    ctx.fillStyle = '#334155';
    for (let i = 0; i < 8; i++) {
      const a = (Math.PI * 2 * i) / 8;
      ctx.beginPath();
      ctx.arc(st.x + Math.cos(a) * 20, st.y + 4 + Math.sin(a) * 14, 5.5, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = '#5C3A21';
    ctx.save();
    ctx.translate(st.x, st.y + 4);
    ctx.rotate(0.35);
    ctx.fillRect(-16, -3.5, 32, 7);
    ctx.rotate(-0.7);
    ctx.fillRect(-16, -3.5, 32, 7);
    ctx.restore();

    const flicker = Math.sin(time * 11) * 2.8;
    ctx.fillStyle = '#EA580C';
    ctx.beginPath();
    ctx.arc(st.x, st.y - 1, 15 + flicker * 0.35, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#FB923C';
    ctx.beginPath();
    ctx.arc(st.x + flicker * 0.25, st.y - 4, 10.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#FEF08A';
    ctx.beginPath();
    ctx.arc(st.x, st.y - 5, 5.5, 0, Math.PI * 2);
    ctx.fill();
  } else if (st.id === 'HERO_SELECT_AREA') {
    // Carved Sanctuary Hero Pedestal + Floating Emerald Crest
    ctx.fillStyle = '#334155';
    ctx.strokeStyle = '#0F172A';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.ellipse(st.x, st.y + 4, 28, 19, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#475569';
    ctx.beginPath();
    ctx.ellipse(st.x, st.y, 21, 13, 0, 0, Math.PI * 2);
    ctx.fill();

    const bob = Math.sin(time * 3.2) * 3.5;
    ctx.fillStyle = `rgba(52, 211, 153, ${0.9 * pulse})`;
    ctx.strokeStyle = '#064E3B';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(st.x, st.y - 22 + bob);
    ctx.lineTo(st.x + 11, st.y - 9 + bob);
    ctx.lineTo(st.x, st.y + 4 + bob);
    ctx.lineTo(st.x - 11, st.y - 9 + bob);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  } else if (st.id === 'SKILL_PREP_AREA') {
    // Etched Combat Training Sigil + Floating Azure Spell Crystal
    ctx.fillStyle = '#1E293B';
    ctx.strokeStyle = '#0F172A';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.roundRect(st.x - 24, st.y - 16, 48, 32, 10);
    ctx.fill();
    ctx.stroke();

    const bob = Math.sin(time * 3.6 + 1.2) * 3.5;
    ctx.fillStyle = `rgba(56, 189, 248, ${0.92 * pulse})`;
    ctx.strokeStyle = '#0C4A6E';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(st.x, st.y - 8 + bob, 9.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#E0F2FE';
    ctx.beginPath();
    ctx.arc(st.x - 2.5, st.y - 10.5 + bob, 3, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function drawHubStationLabel(
  ctx: CanvasRenderingContext2D,
  st: NonNullable<RoomData['hubStations']>[number],
  player: PlayerState
): void {
  const dist = Math.hypot(player.x - st.x, player.y - st.y);
  const near = dist <= st.radius + 46;
  const isNpc = st.id.startsWith('NPC_');

  ctx.save();
  const labelY = isNpc ? st.y - 34 : st.y + st.radius + 15;
  ctx.font = '700 12px "Plus Jakarta Sans", sans-serif';
  ctx.textAlign = 'center';
  ctx.lineWidth = 3.5;
  ctx.strokeStyle = 'rgba(15, 20, 25, 0.9)';
  ctx.strokeText(st.label, st.x, labelY);
  ctx.fillStyle = near ? '#FFFFFF' : 'rgba(243, 239, 230, 0.88)';
  ctx.fillText(st.label, st.x, labelY);

  if (near) {
    const subY = isNpc ? st.y - 49 : st.y + st.radius + 30;
    ctx.font = '600 11px "Plus Jakarta Sans", sans-serif';
    ctx.strokeText(st.sublabel, st.x, subY);
    ctx.fillStyle = st.color;
    ctx.fillText(st.sublabel, st.x, subY);
  }
  ctx.restore();
}

function drawLobbyNpc(
  ctx: CanvasRenderingContext2D,
  npc: LobbyNpcDef,
  player: PlayerState,
  time: number
): void {
  const dist = Math.hypot(player.x - npc.x, player.y - npc.y);
  const near = dist <= 82;
  const bob = Math.sin(time * 3.1 + npc.x * 0.03) * 2.2;
  const blink = Math.sin(time * 1.9 + npc.y * 0.05) > 0.96;

  ctx.save();
  ctx.translate(npc.x, npc.y);

  // Soft ground shadow
  ctx.fillStyle = 'rgba(0, 0, 0, 0.36)';
  ctx.beginPath();
  ctx.ellipse(0, 14, 17, 7, 0, 0, Math.PI * 2);
  ctx.fill();

  if (npc.appearance === 'OWL_KEEPER') {
    // Barnaby: Plump tawny owl in a cozy teal cloak holding a warm lantern staff
    ctx.fillStyle = '#0F766E';
    ctx.strokeStyle = '#091E1C';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.ellipse(0, 2 + bob * 0.5, 16, 15, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Feathered belly
    ctx.fillStyle = '#FDE68A';
    ctx.beginPath();
    ctx.ellipse(0, 5 + bob * 0.5, 10, 9, 0, 0, Math.PI * 2);
    ctx.fill();

    // Owl head & ear tufts
    ctx.fillStyle = '#92400E';
    ctx.beginPath();
    ctx.arc(0, -11 + bob, 13, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Eyes & golden beak
    ctx.fillStyle = '#FEF3C7';
    ctx.beginPath();
    ctx.arc(-4.5, -11 + bob, 4.2, 0, Math.PI * 2);
    ctx.arc(4.5, -11 + bob, 4.2, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#0F172A';
    if (blink) {
      ctx.fillRect(-7, -11 + bob, 5, 1.5);
      ctx.fillRect(2, -11 + bob, 5, 1.5);
    } else {
      ctx.beginPath();
      ctx.arc(-4.5, -11 + bob, 2, 0, Math.PI * 2);
      ctx.arc(4.5, -11 + bob, 2, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.fillStyle = '#F59E0B';
    ctx.beginPath();
    ctx.moveTo(0, -8 + bob);
    ctx.lineTo(-3, -11 + bob);
    ctx.lineTo(3, -11 + bob);
    ctx.closePath();
    ctx.fill();

    // Wooden lantern staff on right side
    ctx.strokeStyle = '#78350F';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(16, 13);
    ctx.lineTo(18, -18 + bob * 0.4);
    ctx.stroke();

    ctx.fillStyle = '#FBBF24';
    ctx.beginPath();
    ctx.arc(18, -19 + bob * 0.4, 5, 0, Math.PI * 2);
    ctx.fill();
  } else if (npc.appearance === 'SPROUT_HERBALIST') {
    // Pip: Cute rosy forest spirit with curled emerald leaf hat & daisy
    ctx.fillStyle = '#065F46';
    ctx.strokeStyle = '#052E16';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.roundRect(-12, -4 + bob * 0.5, 24, 18, 9);
    ctx.fill();
    ctx.stroke();

    // Round cream face
    ctx.fillStyle = '#ECFCCB';
    ctx.beginPath();
    ctx.arc(0, -11 + bob, 11.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Rosy cheeks & eyes
    ctx.fillStyle = 'rgba(244, 114, 182, 0.55)';
    ctx.beginPath();
    ctx.arc(-6, -9 + bob, 2.5, 0, Math.PI * 2);
    ctx.arc(6, -9 + bob, 2.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#14532D';
    if (!blink) {
      ctx.beginPath();
      ctx.arc(-4, -12 + bob, 1.8, 0, Math.PI * 2);
      ctx.arc(4, -12 + bob, 1.8, 0, Math.PI * 2);
      ctx.fill();
    }

    // Leaf cap & swaying stem blossom
    ctx.fillStyle = '#22C55E';
    ctx.beginPath();
    ctx.ellipse(0, -20 + bob, 14, 6, -0.12, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    const sway = Math.sin(time * 4) * 2.5;
    ctx.strokeStyle = '#16A34A';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, -24 + bob);
    ctx.quadraticCurveTo(4, -31 + bob, 6 + sway, -32 + bob);
    ctx.stroke();
    ctx.fillStyle = '#FBBF24';
    ctx.beginPath();
    ctx.arc(6 + sway, -32 + bob, 3.5, 0, Math.PI * 2);
    ctx.fill();
  } else {
    // Master Bramble: Wise moss-shelled tortoise instructor with spectacles & bamboo staff
    ctx.fillStyle = '#1E3A8A';
    ctx.strokeStyle = '#0F172A';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.ellipse(0, 1 + bob * 0.4, 17, 14, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Moss-rimmed shell back
    ctx.fillStyle = '#15803D';
    ctx.beginPath();
    ctx.arc(0, -2 + bob * 0.4, 14, Math.PI, 0);
    ctx.fill();

    // Friendly sage head & round spectacles
    ctx.fillStyle = '#84CC16';
    ctx.beginPath();
    ctx.arc(0, -12 + bob, 11, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.strokeStyle = '#FDE047';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.arc(-4, -12 + bob, 3.3, 0, Math.PI * 2);
    ctx.arc(4, -12 + bob, 3.3, 0, Math.PI * 2);
    ctx.stroke();

    // Bamboo training staff
    ctx.strokeStyle = '#D97706';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(-17, 13);
    ctx.lineTo(-15, -21 + bob * 0.3);
    ctx.stroke();
  }

  // Cozy speech bubble badge when player is nearby
  if (near) {
    ctx.fillStyle = '#FFFFFF';
    ctx.strokeStyle = '#0F172A';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(12, -32 + bob, 20, 14, 6);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#0F172A';
    ctx.beginPath();
    ctx.arc(17.5, -25 + bob, 1.4, 0, Math.PI * 2);
    ctx.arc(22, -25 + bob, 1.4, 0, Math.PI * 2);
    ctx.arc(26.5, -25 + bob, 1.4, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}

function drawObstacle(ctx: CanvasRenderingContext2D, obs: Obstacle, time: number): void {
  ctx.save();

  if (obs.kind === 'TREE') {
    const cx = obs.x + obs.w / 2;
    const baseY = obs.y + obs.h;
    const sway = Math.sin(time * 1.8 + obs.x * 0.02) * 3;

    // Wide soft canopy ground shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.32)';
    ctx.beginPath();
    ctx.ellipse(cx, baseY - 4, 48, 20, 0, 0, Math.PI * 2);
    ctx.fill();

    // Warm hand-drawn oak trunk & roots
    ctx.fillStyle = '#5C3A21';
    ctx.strokeStyle = '#241409';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.roundRect(cx - 14, obs.y - 18, 28, obs.h + 16, 8);
    ctx.fill();
    ctx.stroke();

    // Hanging cozy fairy lantern from lower branch
    const lx = cx + 26 + sway * 0.7;
    const ly = obs.y - 6;
    ctx.strokeStyle = '#3E2723';
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.moveTo(cx + 22, obs.y - 20);
    ctx.lineTo(lx, ly - 4);
    ctx.stroke();
    ctx.fillStyle = '#FBBF24';
    ctx.beginPath();
    ctx.arc(lx, ly, 4.5, 0, Math.PI * 2);
    ctx.fill();

    // Multi-layered lush swaying foliage puffs
    const puffs = [
      { dx: -24, dy: -34, r: 28, col: '#14532D' },
      { dx: 24, dy: -32, r: 27, col: '#14532D' },
      { dx: 0, dy: -52, r: 34, col: '#166534' },
      { dx: -16, dy: -44, r: 26, col: '#15803D' },
      { dx: 18, dy: -42, r: 25, col: '#15803D' },
      { dx: 0, dy: -58, r: 24, col: '#22C55E' },
    ];
    for (const pf of puffs) {
      ctx.fillStyle = pf.col;
      ctx.beginPath();
      ctx.arc(cx + pf.dx + sway, obs.y + pf.dy, pf.r, 0, Math.PI * 2);
      ctx.fill();
    }

    // Tiny warm canopy blossoms
    ctx.fillStyle = '#FDE047';
    ctx.beginPath();
    ctx.arc(cx - 18 + sway, obs.y - 46, 3, 0, Math.PI * 2);
    ctx.arc(cx + 14 + sway, obs.y - 54, 2.8, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#F472B6';
    ctx.beginPath();
    ctx.arc(cx + 4 + sway, obs.y - 36, 3, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
    return;
  }

  // Ground drop shadow for standard props & furniture
  ctx.fillStyle = 'rgba(0, 0, 0, 0.34)';
  ctx.beginPath();
  ctx.roundRect(obs.x + 4, obs.y + 8, obs.w, obs.h, 10);
  ctx.fill();

  if (obs.kind === 'PILLAR') {
    ctx.fillStyle = '#36414E';
    ctx.strokeStyle = '#151A21';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.roundRect(obs.x, obs.y, obs.w, obs.h, 12);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#475569';
    ctx.beginPath();
    ctx.roundRect(obs.x + 8, obs.y + 6, obs.w - 16, obs.h - 18, 8);
    ctx.fill();

    // Mossy cap accent
    ctx.fillStyle = '#22C55E';
    ctx.globalAlpha = 0.45;
    ctx.beginPath();
    ctx.arc(obs.x + 16, obs.y + 14, 9, 0, Math.PI * 2);
    ctx.arc(obs.x + 26, obs.y + 11, 6, 0, Math.PI * 2);
    ctx.fill();
  } else if (obs.kind === 'FLOWER_BED') {
    // Timber & stone garden planter box overflowing with colorful flowers
    ctx.fillStyle = '#5C3A24';
    ctx.strokeStyle = '#23140B';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.roundRect(obs.x, obs.y, obs.w, obs.h, 10);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#291D16';
    ctx.beginPath();
    ctx.roundRect(obs.x + 6, obs.y + 6, obs.w - 12, obs.h - 12, 6);
    ctx.fill();

    const colors = ['#F472B6', '#FBBF24', '#60A5FA', '#34D399', '#A78BFA'];
    for (let i = 0; i < 4; i++) {
      const fx = obs.x + 16 + ((obs.w - 32) * i) / 3;
      const fy = obs.y + obs.h * 0.48 + (i % 2 === 0 ? -3 : 3);
      const sway = Math.sin(time * 2.6 + i) * 1.5;
      ctx.fillStyle = '#16A34A';
      ctx.beginPath();
      ctx.arc(fx, fy + 2, 6.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = colors[(i + Math.floor(obs.x)) % colors.length];
      ctx.beginPath();
      ctx.arc(fx + sway, fy - 1, 4.8, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#FEF9C3';
      ctx.beginPath();
      ctx.arc(fx + sway, fy - 1, 1.8, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (obs.kind === 'BENCH') {
    // Cozy carved wooden hearth bench with warm stitched cushion
    ctx.fillStyle = '#6B4226';
    ctx.strokeStyle = '#241409';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.roundRect(obs.x, obs.y, obs.w, obs.h, 9);
    ctx.fill();
    ctx.stroke();

    // Backrest bar
    ctx.fillStyle = '#4E2F1A';
    ctx.beginPath();
    ctx.roundRect(obs.x + 4, obs.y - 6, obs.w - 8, 12, 5);
    ctx.fill();
    ctx.stroke();

    // Cozy crimson seat cushion
    ctx.fillStyle = '#9F1239';
    ctx.beginPath();
    ctx.roundRect(obs.x + 10, obs.y + 8, obs.w - 20, obs.h - 14, 5);
    ctx.fill();
  } else if (obs.kind === 'BOOKSHELF') {
    // Sanctuary oak bookshelf with colorful spell tomes & brass candle
    ctx.fillStyle = '#4A2E1B';
    ctx.strokeStyle = '#1E1108';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.roundRect(obs.x, obs.y - 12, obs.w, obs.h + 12, 8);
    ctx.fill();
    ctx.stroke();

    const bookColors = ['#10B981', '#F59E0B', '#38BDF8', '#F43F5E', '#A78BFA', '#34D399'];
    for (let b = 0; b < 6; b++) {
      ctx.fillStyle = bookColors[b % bookColors.length];
      ctx.fillRect(obs.x + 10 + b * 14, obs.y - 4, 10, 22);
    }

    // Warm candle on top corner
    ctx.fillStyle = '#FEF3C7';
    ctx.fillRect(obs.x + obs.w - 18, obs.y - 20, 6, 9);
    ctx.fillStyle = '#FBBF24';
    ctx.beginPath();
    ctx.arc(obs.x + obs.w - 15, obs.y - 23, 3.5 + Math.sin(time * 9) * 0.6, 0, Math.PI * 2);
    ctx.fill();
  } else if (obs.kind === 'WEAPON_RACK') {
    // East Training Grounds wooden rack with practice blades & buckler
    ctx.fillStyle = '#5C3A21';
    ctx.strokeStyle = '#23140A';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.roundRect(obs.x, obs.y, obs.w, obs.h, 8);
    ctx.fill();
    ctx.stroke();

    // Crossed practice blades & azure shield emblem
    ctx.strokeStyle = '#CBD5E1';
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.moveTo(obs.x + 18, obs.y + obs.h - 8);
    ctx.lineTo(obs.x + 38, obs.y + 6);
    ctx.moveTo(obs.x + 38, obs.y + obs.h - 8);
    ctx.lineTo(obs.x + 18, obs.y + 6);
    ctx.stroke();

    ctx.fillStyle = '#0284C7';
    ctx.strokeStyle = '#E0F2FE';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(obs.x + obs.w - 26, obs.y + obs.h * 0.5, 11, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  } else if (obs.kind === 'CRATE') {
    ctx.fillStyle = '#6B442A';
    ctx.strokeStyle = '#24150B';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.roundRect(obs.x, obs.y, obs.w, obs.h, 8);
    ctx.fill();
    ctx.stroke();

    ctx.strokeStyle = '#4A2E1B';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(obs.x + 6, obs.y + 6);
    ctx.lineTo(obs.x + obs.w - 6, obs.y + obs.h - 6);
    ctx.stroke();
  } else {
    // Cozy Wooden Alchemist Table
    ctx.fillStyle = '#5C3A24';
    ctx.strokeStyle = '#1F120A';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.roundRect(obs.x, obs.y, obs.w, obs.h, 8);
    ctx.fill();
    ctx.stroke();

    // Tiny potion flask on table
    ctx.fillStyle = '#34D399';
    ctx.beginPath();
    ctx.arc(obs.x + obs.w * 0.35, obs.y + obs.h * 0.45, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#F59E0B';
    ctx.beginPath();
    ctx.arc(obs.x + obs.w * 0.68, obs.y + obs.h * 0.52, 5.5, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function drawHazardZone(ctx: CanvasRenderingContext2D, h: HazardZone, time: number): void {
  ctx.save();
  const alpha = Math.min(1, h.life / 0.5);

  if (h.spawnDelay && h.spawnDelay > 0) {
    ctx.restore();
    return;
  }

  if (h.kind === 'POISON_PUDDLE') {
    // Organic multi-lobed bubbling poisonous mire residue (never a plain circle!)
    ctx.save();
    ctx.translate(h.x, h.y);
    ctx.globalAlpha = 0.62 * alpha;

    ctx.fillStyle = '#0F766E';
    ctx.beginPath();
    for (let v = 0; v <= 12; v++) {
      const a = (Math.PI * 2 * v) / 12;
      const wobble = 0.82 + Math.sin(v * 2.7 + h.x * 0.1 + time * 2.6) * 0.18;
      const rx = Math.cos(a) * h.radius * wobble;
      const ry = Math.sin(a) * h.radius * 0.68 * wobble;
      if (v === 0) ctx.moveTo(rx, ry);
      else ctx.lineTo(rx, ry);
    }
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = '#134E4A';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Inner bright toxic sheen lobes
    ctx.fillStyle = '#2DD4BF';
    ctx.globalAlpha = 0.42 * alpha;
    ctx.beginPath();
    ctx.ellipse(-h.radius * 0.18, -2, h.radius * 0.48, h.radius * 0.3, 0.2, 0, Math.PI * 2);
    ctx.ellipse(h.radius * 0.22, 3, h.radius * 0.34, h.radius * 0.22, -0.3, 0, Math.PI * 2);
    ctx.fill();

    // Animated rising poison bubbles on the mire surface
    ctx.globalAlpha = 0.85 * alpha;
    for (let b = 0; b < 3; b++) {
      const bPhase = (time * 1.6 + b * 0.37 + h.x * 0.03) % 1;
      const bx = Math.sin(b * 2.4 + h.y) * (h.radius * 0.48);
      const by = Math.cos(b * 1.9 + h.x) * (h.radius * 0.28) - bPhase * 6;
      const br = 2 + Math.sin(bPhase * Math.PI) * 3.2;
      ctx.strokeStyle = '#BEF264';
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.arc(bx, by, br, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.restore();
  } else if (h.kind === 'SPECTRAL_GRAB') {
    ctx.globalAlpha = alpha;
    const reach = Math.sin(Math.min(1, (h.maxLife - h.life) * 5) * Math.PI * 0.5);
    for (let f = -1; f <= 1; f++) {
      ctx.strokeStyle = '#C084FC';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(h.x + f * 9, h.y + 8);
      ctx.quadraticCurveTo(h.x + f * 14, h.y - 8 * reach, h.x + f * 6, h.y - 20 * reach);
      ctx.stroke();
    }
  } else if (h.kind === 'TOMBSTONE') {
    const progress = 1 - Math.max(0, Math.min(1, h.life / h.maxLife));
    const rise = progress < 0.11 ? progress / 0.11 : progress > 0.9 ? (1 - progress) / 0.1 : 1;
    const styleIdx = Math.abs(Math.round(h.x + h.y)) % 3;
    const tilt = ((Math.round(h.x) % 5) - 2) * 0.055;
    const emergeJitter = rise < 1 ? Math.sin(time * 55 + h.x) * 2.5 * (1 - rise) : 0;

    ctx.save();
    ctx.translate(h.x + emergeJitter, h.y + 8);
    // Cracked soil mound at base of tombstone
    ctx.fillStyle = '#334155';
    ctx.strokeStyle = '#0F172A';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(0, 1, 20 * Math.min(1, rise * 1.4), 6, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.beginPath();
    ctx.rect(-36, -64, 72, 66);
    ctx.clip(); // Erupt and sink cleanly into the burial crater!

    ctx.translate(0, (1 - rise) * 46);
    ctx.rotate(tilt);

    // Hand-drawn carved mossy headstone variants
    ctx.fillStyle = '#475569';
    ctx.strokeStyle = '#0F172A';
    ctx.lineWidth = 3;

    if (styleIdx === 0) {
      // Variant 0: Classic Arched Crypt Headstone +Moss Cap
      ctx.beginPath();
      ctx.roundRect(-15, -36, 30, 38, [14, 14, 3, 3]);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#22C55E';
      ctx.beginPath();
      ctx.arc(-8, -32, 5.5, 0, Math.PI * 2);
      ctx.arc(-2, -35, 4, 0, Math.PI * 2);
      ctx.fill();
    } else if (styleIdx === 1) {
      // Variant 1: Ornate Gothic Cross Monument
      ctx.beginPath();
      ctx.roundRect(-7, -42, 14, 44, 3);
      ctx.roundRect(-16, -31, 32, 11, 3);
      ctx.fill();
      ctx.stroke();
    } else {
      // Variant 2: Pointed Runic Obelisk
      ctx.beginPath();
      ctx.moveTo(0, -45);
      ctx.lineTo(13, -30);
      ctx.lineTo(15, 2);
      ctx.lineTo(-15, 2);
      ctx.lineTo(-13, -30);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }

    // Glowing haunted violet rune etching + floating spirit candle flame
    const runePulse = 0.7 + Math.sin(time * 6 + h.x) * 0.3;
    ctx.strokeStyle = `rgba(216, 180, 254, ${runePulse})`;
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    ctx.moveTo(0, -25);
    ctx.lineTo(0, -11);
    ctx.moveTo(-5.5, -19);
    ctx.lineTo(5.5, -19);
    ctx.stroke();

    // Tiny cozy spectral lantern-flame hovering above headstone
    ctx.fillStyle = '#E879F9';
    ctx.beginPath();
    ctx.arc(11, -38 + Math.sin(time * 5 + h.y) * 2.5, 3.8, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  } else if (h.kind === 'BOSS_VINE_TELEGRAPH') {
    const progress = 1 - Math.max(0, h.life / h.maxLife);
    ctx.fillStyle = 'rgba(239, 68, 68, 0.16)';
    ctx.beginPath();
    ctx.arc(h.x, h.y, h.radius, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = 'rgba(245, 158, 11, 0.32)';
    ctx.beginPath();
    ctx.arc(h.x, h.y, h.radius * progress, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#F87171';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(h.x, h.y, h.radius, 0, Math.PI * 2);
    ctx.stroke();
  } else if (h.kind === 'HEALING_SPRING') {
    const pulse = 0.9 + Math.sin(time * 3) * 0.06;
    const grad = ctx.createRadialGradient(h.x, h.y, 10, h.x, h.y, h.radius);
    grad.addColorStop(0, 'rgba(74, 222, 128, 0.55)');
    grad.addColorStop(0.7, 'rgba(20, 184, 166, 0.28)');
    grad.addColorStop(1, 'rgba(20, 184, 166, 0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(h.x, h.y, h.radius * pulse, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#4ADE80';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(h.x, h.y, h.radius * 0.72, 0, Math.PI * 2);
    ctx.stroke();
  } else if (h.kind === 'GOBLIN_TRAP') {
    drawGoblinExplosiveTrap(ctx, h, time);
  } else if (h.kind === 'THOUSAND_DAGGERS_ZONE') {
    drawThousandDaggersTelegraph(ctx, h, time);
  }
  ctx.restore();
}

function drawEnemyTelegraph(ctx: CanvasRenderingContext2D, e: EnemyState, _time: number): void {
  ctx.save();
  ctx.fillStyle = 'rgba(244, 63, 94, 0.18)';
  ctx.strokeStyle = 'rgba(251, 113, 133, 0.75)';
  ctx.lineWidth = 2;

  if (e.telegraphType === 'CONE') {
    ctx.beginPath();
    ctx.moveTo(e.x, e.y);
    ctx.arc(e.x, e.y, e.telegraphRange, e.telegraphAngle - 0.85, e.telegraphAngle + 0.85);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  } else if (e.telegraphType === 'CIRCLE' || e.telegraphType === 'RING') {
    ctx.beginPath();
    ctx.arc(e.x, e.y, e.telegraphRange, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  } else if (e.telegraphType === 'LINE') {
    ctx.translate(e.x, e.y);
    ctx.rotate(e.telegraphAngle);
    ctx.beginPath();
    ctx.roundRect(0, -14, e.telegraphRange, 28, 8);
    ctx.fill();
    ctx.stroke();
  }
  ctx.restore();
}

function drawPickup(ctx: CanvasRenderingContext2D, p: PickupItem, time: number): void {
  const bob = Math.sin(time * 5 + p.bobOffset) * 3;
  ctx.save();
  ctx.translate(p.x, p.y + bob);

  if (p.kind === 'TREASURE_CHEST') {
    ctx.fillStyle = p.opened ? '#475569' : '#B45309';
    ctx.strokeStyle = '#1C1917';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.roundRect(-24, -18, 48, 36, 8);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#FBBF24';
    ctx.fillRect(-24, -4, 48, 6);
    ctx.fillRect(-5, -8, 10, 14);

    if (!p.opened) {
      ctx.fillStyle = '#FEF3C7';
      ctx.font = '600 12px "Plus Jakarta Sans", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Walk Near or Tap Action', 0, -28);
    }
  } else if (p.kind === 'XP') {
    ctx.fillStyle = '#34D399';
    ctx.strokeStyle = '#064E3B';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, -7);
    ctx.lineTo(6, 0);
    ctx.lineTo(0, 7);
    ctx.lineTo(-6, 0);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  } else if (p.kind === 'GOLD') {
    ctx.fillStyle = '#FBBF24';
    ctx.strokeStyle = '#78350F';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, 6.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  } else if (p.kind === 'HEART') {
    ctx.fillStyle = '#FB7185';
    ctx.strokeStyle = '#881337';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(-3.5, -2, 5, 0, Math.PI * 2);
    ctx.arc(3.5, -2, 5, 0, Math.PI * 2);
    ctx.lineTo(0, 7);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  } else if (p.kind === 'ENERGY') {
    ctx.fillStyle = '#C084FC';
    ctx.strokeStyle = '#4C1D95';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, 6.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }

  ctx.restore();
}

function drawMinion(ctx: CanvasRenderingContext2D, m: MinionState, time: number): void {
  if (m.kind === 'SKELETON_WARRIOR') {
    drawSkeletonWarriorMinion(ctx, m, time);
    return;
  }

  ctx.save();
  ctx.translate(m.x, m.y);

  const totalSpawn = m.spawnDuration || 0.75;
  if (m.spawnAnim > 0) {
    // Individual Chasm-Climbing Emergence Sequence:
    // 0.0..0.32: Undead hands punch out & grip the chasm rim
    // 0.32..0.82: Head & shoulders heave upward side-to-side out of the pit
    // 0.82..1.0: Vault hop onto solid ground!
    const climbP = 1 - Math.max(0, Math.min(1, m.spawnAnim / totalSpawn));

    ctx.save();
    ctx.beginPath();
    ctx.rect(-28, -46, 56, 56);
    ctx.clip();

    // Hands gripping the dirt rim while hauling body out
    const handGripAlpha = climbP < 0.15 ? climbP / 0.15 : 1;
    ctx.globalAlpha = handGripAlpha;
    ctx.fillStyle = '#86EFAC';
    ctx.strokeStyle = '#18181B';
    ctx.lineWidth = 2;
    const gripSpread = climbP < 0.78 ? 11 : 11 - ((climbP - 0.78) / 0.22) * 4;
    ctx.beginPath();
    ctx.arc(-gripSpread, 8, 4.2, 0, Math.PI * 2);
    ctx.arc(gripSpread, 8, 4.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    if (climbP > 0.24) {
      const bodyP = (climbP - 0.24) / 0.76;
      const heaveSway = Math.sin(bodyP * Math.PI * 3) * 3.5 * (1 - bodyP);
      const hopArc = bodyP > 0.75 ? Math.sin(((bodyP - 0.75) / 0.25) * Math.PI) * -9 : 0;
      const sinkY = (1 - Math.min(1, bodyP * 1.15)) * 28 + hopArc;

      ctx.translate(heaveSway, sinkY);

      // Tattered tunic torso
      ctx.fillStyle = '#78350F';
      ctx.strokeStyle = '#18181B';
      ctx.lineWidth = 2.4;
      ctx.beginPath();
      ctx.roundRect(-9, -2, 18, 13, 5);
      ctx.fill();
      ctx.stroke();

      // Stitched undead head
      ctx.fillStyle = '#86EFAC';
      ctx.beginPath();
      ctx.arc(0, -7, 9.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Glowing amber eyes
      ctx.fillStyle = '#F59E0B';
      ctx.beginPath();
      ctx.arc(-3.2, -7, 2.1, 0, Math.PI * 2);
      ctx.arc(3.2, -7, 2.1, 0, Math.PI * 2);
      ctx.fill();

      // Sprout leaf popping up
      ctx.strokeStyle = '#4ADE80';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, -16);
      ctx.lineTo(3, -21);
      ctx.stroke();
    }

    ctx.restore();
    ctx.restore();
    return;
  }

  const attackRatio = m.attackFlash > 0 ? m.attackFlash / 0.22 : 0;
  const lungeX = Math.cos(m.facingAngle) * attackRatio * 8;
  const lungeY = Math.sin(m.facingAngle) * attackRatio * 8;
  const bob = Math.abs(Math.sin(m.walkCycle)) * 3.5;
  const stride = Math.sin(m.walkCycle) * 4;

  // Ground shadow
  ctx.fillStyle = 'rgba(0,0,0,0.34)';
  ctx.beginPath();
  ctx.ellipse(lungeX * 0.5, 13, 11, 5, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.translate(lungeX, lungeY - bob);
  ctx.rotate(Math.cos(m.facingAngle) * attackRatio * 0.18 + Math.sin(m.walkCycle) * 0.06);

  // Animated shambling little boots
  ctx.fillStyle = '#451A03';
  ctx.strokeStyle = '#18181B';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(-4.5, 11 + stride * 0.5, 3.2, 0, Math.PI * 2);
  ctx.arc(4.5, 11 - stride * 0.5, 3.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Tattered mini-zombie tunic body
  ctx.fillStyle = '#78350F';
  ctx.strokeStyle = '#18181B';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(-9, -2);
  ctx.lineTo(-11, 10);
  ctx.lineTo(-4, 8);
  ctx.lineTo(0, 11);
  ctx.lineTo(5, 8);
  ctx.lineTo(11, 10);
  ctx.lineTo(9, -2);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Cute stitched undead head
  const lookX = Math.cos(m.facingAngle) * 1.8;
  const lookY = Math.sin(m.facingAngle) * 1.2;
  ctx.fillStyle = m.attackFlash > 0 ? '#BEF264' : '#86EFAC';
  ctx.beginPath();
  ctx.arc(0, -6, 9.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Cheek stitch
  ctx.strokeStyle = '#334155';
  ctx.lineWidth = 1.3;
  ctx.beginPath();
  ctx.moveTo(-6.5, -4.5);
  ctx.lineTo(-3.5, -3);
  ctx.stroke();

  // Glowing amber eyes
  ctx.fillStyle = '#F59E0B';
  ctx.beginPath();
  ctx.arc(-3.2 + lookX, -6 + lookY, 2.1, 0, Math.PI * 2);
  ctx.arc(3.2 + lookX, -6 + lookY, 2.1, 0, Math.PI * 2);
  ctx.fill();

  // Swaying sprout leaf
  ctx.strokeStyle = '#4ADE80';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, -15);
  ctx.quadraticCurveTo(2, -19, 3 + Math.sin(time * 6 + m.walkCycle) * 2, -21);
  ctx.stroke();

  // Outstretched shambling / claw-slashing undead hands!
  for (const side of [-1, 1]) {
    const armA =
      m.facingAngle +
      side * (attackRatio > 0 ? 0.25 - attackRatio * 0.5 : 0.52) +
      Math.sin(m.walkCycle + side) * 0.14;
    const reach = 12 + attackRatio * 6;
    const hx = Math.cos(armA) * reach;
    const hy = Math.sin(armA) * reach + 1;

    ctx.save();
    ctx.translate(hx, hy);
    ctx.rotate(armA);
    ctx.fillStyle = '#86EFAC';
    ctx.strokeStyle = '#18181B';
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.arc(0, 0, 3.6, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.strokeStyle = attackRatio > 0 ? '#FEF08A' : '#5EEAD4';
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.moveTo(2, -1.8);
    ctx.lineTo(6.5, -2.2);
    ctx.moveTo(2, 1.8);
    ctx.lineTo(6.5, 2.2);
    ctx.stroke();
    ctx.restore();
  }

  ctx.restore();
}

function drawEnemy(
  ctx: CanvasRenderingContext2D,
  e: EnemyState,
  time: number,
  showPredatorMark = false
): void {
  ctx.save();
  ctx.translate(e.x, e.y);

  if (e.dead) {
    const s = 1 - e.deathAnim * 0.6;
    ctx.globalAlpha = Math.max(0, 1 - e.deathAnim);
    ctx.scale(s, s);
    ctx.rotate(e.deathAnim * 1.4);
  }

  // Shadow
  ctx.fillStyle = 'rgba(0,0,0,0.36)';
  ctx.beginPath();
  ctx.ellipse(0, e.radius * 0.72, e.radius * 0.85, e.radius * 0.36, 0, 0, Math.PI * 2);
  ctx.fill();

  const isPoisoned = e.poisonTimer > 0 && !e.dead;
  const isRooted = e.rootTimer > 0 && !e.dead;
  const isWeakenedPrey =
    showPredatorMark && !e.dead && e.hp / Math.max(1, e.maxHp) < 0.45;
  const hitReact = e.hitReactionTimer || 0;

  // Opportunistic Predator Weakened-Prey Ring (<45% HP when playing as Goblin)
  if (isWeakenedPrey) {
    const pulse = 0.52 + Math.sin(time * 7 + e.x) * 0.16;
    ctx.strokeStyle = `rgba(251, 113, 133, ${pulse})`;
    ctx.lineWidth = 1.9;
    ctx.setLineDash([5, 4]);
    ctx.beginPath();
    ctx.ellipse(0, e.radius * 0.68, e.radius * 1.05, e.radius * 0.46, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  // Infected puddle glow beneath poisoned enemies
  if (isPoisoned) {
    ctx.fillStyle = `rgba(132, 204, 22, ${0.22 + Math.sin(time * 7 + e.x) * 0.08})`;
    ctx.beginPath();
    ctx.ellipse(0, e.radius * 0.65, e.radius * 0.95, e.radius * 0.42, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  // Struggle jitter when restrained by Death's Embrace + directional recoil shudder on hit!
  const rootTrembleX = isRooted ? Math.sin(time * 42 + e.y) * 1.8 : 0;
  const hitAngle = e.lastHitAngle || 0;
  const hitJolt = hitReact > 0 ? (hitReact / 0.24) : 0;
  const recoilX = Math.cos(hitAngle) * hitJolt * 5 + rootTrembleX;
  const recoilY = Math.sin(hitAngle) * hitJolt * 3.5;

  const hop = isRooted ? 0 : Math.abs(Math.sin(e.walkCycle)) * 4;
  ctx.save();
  ctx.translate(recoilX, recoilY - hop);
  if (hitJolt > 0) {
    const squash = 1 + Math.sin(hitJolt * Math.PI) * 0.16;
    ctx.scale(squash, 2 - squash);
  }

  const isFlashing = e.hurtFlash > 0;

  if (e.kind === EnemyKind.TRAINING_DUMMY) {
    const wobble = e.hurtFlash > 0 ? Math.sin(time * 45) * 0.22 : 0;
    ctx.rotate(wobble);
    ctx.fillStyle = '#78350F';
    ctx.fillRect(-4, 4, 8, 18);
    ctx.fillStyle = isFlashing ? '#FFFFFF' : '#D97706';
    ctx.strokeStyle = '#1C1917';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(0, -4, 16, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    // Straw hat
    ctx.fillStyle = '#FBBF24';
    ctx.beginPath();
    ctx.ellipse(0, -16, 20, 6, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  } else if (e.kind === EnemyKind.MOSS_SLIME) {
    const squash = 1 + Math.sin(e.walkCycle * 2) * 0.08;
    ctx.scale(squash, 2 - squash);
    ctx.fillStyle = isFlashing ? '#FFFFFF' : '#22C55E';
    ctx.strokeStyle = '#052E16';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(0, 0, e.radius, Math.PI, 0);
    ctx.quadraticCurveTo(e.radius, e.radius * 0.8, 0, e.radius * 0.8);
    ctx.quadraticCurveTo(-e.radius, e.radius * 0.8, -e.radius, 0);
    ctx.fill();
    ctx.stroke();

    // Cute slime eyes
    ctx.fillStyle = '#052E16';
    ctx.beginPath();
    ctx.arc(-6, -2, 2.8, 0, Math.PI * 2);
    ctx.arc(6, -2, 2.8, 0, Math.PI * 2);
    ctx.fill();
  } else if (e.kind === EnemyKind.GLOOM_SHROOM) {
    // Stem
    ctx.fillStyle = isFlashing ? '#FFFFFF' : '#E2E8F0';
    ctx.strokeStyle = '#1E1B4B';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.roundRect(-9, -2, 18, 18, 6);
    ctx.fill();
    ctx.stroke();
    // Spotted purple cap
    ctx.fillStyle = isFlashing ? '#FFFFFF' : '#9333EA';
    ctx.beginPath();
    ctx.arc(0, -6, 20, Math.PI, 0);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#E9D5FF';
    ctx.beginPath();
    ctx.arc(-8, -14, 3.5, 0, Math.PI * 2);
    ctx.arc(7, -15, 4, 0, Math.PI * 2);
    ctx.fill();

    // Glowing eyes
    ctx.fillStyle = '#FDE047';
    ctx.beginPath();
    ctx.arc(-4, 3, 2.3, 0, Math.PI * 2);
    ctx.arc(4, 3, 2.3, 0, Math.PI * 2);
    ctx.fill();
  } else if (e.kind === EnemyKind.BONE_SCUTTLER) {
    ctx.fillStyle = isFlashing ? '#FFFFFF' : '#CBD5E1';
    ctx.strokeStyle = '#0F172A';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(0, -4, 15, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    // Angry cute eye sockets
    ctx.fillStyle = '#EF4444';
    ctx.beginPath();
    ctx.arc(-5, -4, 2.8, 0, Math.PI * 2);
    ctx.arc(5, -4, 2.8, 0, Math.PI * 2);
    ctx.fill();
    // Little buckler shield
    ctx.fillStyle = '#64748B';
    ctx.beginPath();
    ctx.arc(-14, 4, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  } else if (e.kind === EnemyKind.EMBER_IMP) {
    // Flutter wings
    const wingY = Math.sin(time * 18) * 5;
    ctx.fillStyle = '#7C2D12';
    ctx.beginPath();
    ctx.moveTo(-10, -2);
    ctx.lineTo(-24, -10 + wingY);
    ctx.lineTo(-16, 6);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(10, -2);
    ctx.lineTo(24, -10 + wingY);
    ctx.lineTo(16, 6);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = isFlashing ? '#FFFFFF' : '#EA580C';
    ctx.strokeStyle = '#270E05';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(0, -2, 15, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#FEF08A';
    ctx.beginPath();
    ctx.arc(-5, -3, 2.6, 0, Math.PI * 2);
    ctx.arc(5, -3, 2.6, 0, Math.PI * 2);
    ctx.fill();
  } else if (e.kind === EnemyKind.BRAMBLE_KNIGHT) {
    ctx.fillStyle = isFlashing ? '#FFFFFF' : '#475569';
    ctx.strokeStyle = '#0F172A';
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.roundRect(-22, -24, 44, 44, 14);
    ctx.fill();
    ctx.stroke();

    // Mossy pauldrons
    ctx.fillStyle = '#16A34A';
    ctx.beginPath();
    ctx.arc(-20, -14, 10, 0, Math.PI * 2);
    ctx.arc(20, -14, 10, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Glowing visor slit
    ctx.fillStyle = '#F59E0B';
    ctx.fillRect(-10, -10, 20, 4);
  } else if (e.kind === EnemyKind.CRYPT_WARDEN_BOSS) {
    // Mossbound Crypt Warden Boss
    ctx.fillStyle = isFlashing ? '#FFFFFF' : '#334155';
    ctx.strokeStyle = '#090D12';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.roundRect(-34, -36, 68, 66, 18);
    ctx.fill();
    ctx.stroke();

    // Runic shoulder stones
    ctx.fillStyle = '#15803D';
    ctx.beginPath();
    ctx.arc(-32, -20, 15, 0, Math.PI * 2);
    ctx.arc(32, -20, 15, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Glowing Amber Lantern Core in chest
    const corePulse = 10 + Math.sin(time * 6) * 2;
    ctx.fillStyle = '#F59E0B';
    ctx.beginPath();
    ctx.arc(0, 4, corePulse, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#FEF3C7';
    ctx.beginPath();
    ctx.arc(0, 4, corePulse * 0.5, 0, Math.PI * 2);
    ctx.fill();

    // Helmet eyes
    ctx.fillStyle = '#FB923C';
    ctx.fillRect(-12, -20, 8, 4);
    ctx.fillRect(4, -20, 8, 4);
  }

  // Visible Enemy Status & Hit Overlays:
  // 1) Diagonal claw rend scar flash during hit reaction
  if (hitJolt > 0.2 && !e.dead) {
    ctx.save();
    ctx.rotate(hitAngle);
    ctx.strokeStyle = `rgba(190, 242, 100, ${hitJolt})`;
    ctx.lineWidth = 2.6;
    ctx.beginPath();
    ctx.moveTo(-8, -7);
    ctx.lineTo(9, -2);
    ctx.moveTo(-7, 2);
    ctx.lineTo(8, 7);
    ctx.stroke();
    ctx.restore();
  }

  // 2) Visible Plague Infection on Poisoned Enemies (intensifies with Plague Carrier stacks 1..3!)
  if (isPoisoned) {
    const stacks = Math.max(1, e.poisonStacks || 1);
    ctx.fillStyle = `rgba(132, 204, 22, ${0.22 + stacks * 0.08})`;
    ctx.beginPath();
    ctx.arc(0, -2, e.radius * (0.86 + stacks * 0.04), 0, Math.PI * 2);
    ctx.fill();

    // Glowing toxic spore pustules clinging to body + rising poison bubbles
    const bubbleCount = 2 + stacks;
    for (let b = 0; b < bubbleCount; b++) {
      const cyc = (time * 1.9 + b * 0.31 + e.x * 0.02) % 1;
      const bx = Math.sin(b * 2.3 + e.y) * (e.radius * 0.58);
      const by = 4 - cyc * (e.radius * 1.5);
      const br = 2.0 + Math.sin(cyc * Math.PI) * (1.8 + stacks * 0.45);
      ctx.fillStyle = b === 0 ? '#BEF264' : 'rgba(163, 230, 53, 0.55)';
      ctx.strokeStyle = '#ECFCCB';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.arc(bx, by, br, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }

    // Subtle orbiting virulent spore motes when Plague Carrier stacks >= 2
    if (stacks >= 2) {
      for (let s = 0; s < stacks; s++) {
        const sa = time * 4.2 + (Math.PI * 2 * s) / stacks;
        const sx = Math.cos(sa) * (e.radius + 5);
        const sy = Math.sin(sa) * (e.radius * 0.55) - 2;
        ctx.fillStyle = '#A3E635';
        ctx.beginPath();
        ctx.arc(sx, sy, 2.2, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  // 3) Visible Undead Claws Clamped Around Enemy Body During Death's Embrace Restraint
  if (isRooted) {
    for (const side of [-1, 1]) {
      ctx.strokeStyle = '#18181B';
      ctx.lineWidth = 4.2;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(side * (e.radius * 0.92), e.radius * 0.48);
      ctx.quadraticCurveTo(side * (e.radius * 0.5), e.radius * 0.1, side * 4, e.radius * 0.22);
      ctx.stroke();

      ctx.strokeStyle = '#86EFAC';
      ctx.lineWidth = 2.2;
      ctx.stroke();
    }
  }

  ctx.restore();

  // Enemy Overhead Health Bar (non-Boss, damaged or Elite)
  if (!e.dead && !e.isBoss && e.kind !== EnemyKind.TRAINING_DUMMY && (e.hp < e.maxHp || e.isElite)) {
    const bw = e.isElite ? 54 : 36;
    const bh = e.isElite ? 6 : 4.5;
    const by = -e.radius - 16;
    ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
    ctx.fillRect(-bw / 2 - 1, by - 1, bw + 2, bh + 2);
    ctx.fillStyle = e.poisonTimer > 0 ? '#84CC16' : e.isElite ? '#F59E0B' : '#EF4444';
    ctx.fillRect(-bw / 2, by, bw * Math.max(0, e.hp / e.maxHp), bh);
  }

  ctx.restore();
}

function drawZombieHero(ctx: CanvasRenderingContext2D, player: PlayerState, time: number): void {
  const pose = computeZombieRigPose(player);
  const isLord = player.lordOfDecayTimer > 0;
  const heroScale = isLord ? 1.26 : 1.0;

  ctx.save();
  ctx.translate(player.x, player.y);

  // 1. Sovereign Ground Aura (Lord of Decay)
  if (isLord) {
    const pulse = 42 + Math.sin(time * 7) * 5;
    const grad = ctx.createRadialGradient(0, 6, 8, 0, 6, pulse);
    grad.addColorStop(0, 'rgba(16, 185, 129, 0.48)');
    grad.addColorStop(0.6, 'rgba(168, 85, 247, 0.28)');
    grad.addColorStop(1, 'rgba(16, 185, 129, 0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.ellipse(0, 6, pulse, pulse * 0.68, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  // Ground shadow
  ctx.fillStyle = 'rgba(0, 0, 0, 0.44)';
  ctx.beginPath();
  ctx.ellipse(0, 17, 17 * heroScale, 7 * heroScale, 0, 0, Math.PI * 2);
  ctx.fill();

  // Apply lunge offset toward facing direction
  const lungeX = Math.cos(player.facingAngle) * pose.lungeOffset;
  const lungeY = Math.sin(player.facingAngle) * pose.lungeOffset;
  ctx.translate(lungeX, lungeY + pose.bobY);
  ctx.rotate(pose.tiltAngle);
  ctx.scale(pose.scaleX * heroScale, pose.scaleY * heroScale);

  // Dynamic Character Body Glow (Infected Plague Glow / Regenerative Pulse / Sovereign Aura)
  if (pose.bodyGlowAlpha > 0.02 && pose.bodyGlowColor) {
    const glowGrad = ctx.createRadialGradient(0, -3, 4, 0, -3, 28);
    glowGrad.addColorStop(0, pose.bodyGlowColor);
    glowGrad.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.save();
    ctx.globalAlpha = pose.bodyGlowAlpha;
    ctx.fillStyle = glowGrad;
    ctx.beginPath();
    ctx.arc(0, -3, 28, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  const hurtWhite = player.hurtFlash > 0.11;
  const isRegen = player.regenTimer > 0;
  const hpRatio = player.hp / Math.max(1, player.maxHp);

  // 2. Patched Brown Explorer Cloak (or Tattered Necro-Sovereign Mantle in Lord of Decay!)
  const flare = pose.cloakFlare * 5.5;
  if (isLord) {
    // Flowing tattered royal necro-mantle with animated spectral tails
    const wave = Math.sin(time * 9) * 2.5;
    ctx.fillStyle = hurtWhite ? '#FFFFFF' : '#1E1B4B';
    ctx.strokeStyle = '#090D12';
    ctx.lineWidth = 2.8;
    ctx.beginPath();
    ctx.moveTo(-14, -5);
    ctx.quadraticCurveTo(-21 - flare, 13, -15 - flare * 0.5, 19 + wave * 0.5);
    ctx.lineTo(-7, 14);
    ctx.lineTo(0, 20 - wave * 0.5);
    ctx.lineTo(7, 14);
    ctx.lineTo(15 + flare * 0.5, 19 + wave * 0.5);
    ctx.quadraticCurveTo(21 + flare, 13, 14, -5);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Glowing toxic heart-core & necrotic rib lines on chest
    if (!hurtWhite) {
      const coreBeat = 3.8 + Math.sin(time * 10) * 1.1;
      ctx.fillStyle = '#10B981';
      ctx.beginPath();
      ctx.arc(0, 6, coreBeat + 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#FEF08A';
      ctx.beginPath();
      ctx.arc(0, 6, coreBeat * 0.55, 0, Math.PI * 2);
      ctx.fill();

      // Spiked spectral shoulder pauldrons
      ctx.fillStyle = '#581C87';
      ctx.strokeStyle = '#34D399';
      ctx.lineWidth = 1.6;
      for (const side of [-1, 1]) {
        ctx.beginPath();
        ctx.moveTo(side * 10, -3);
        ctx.lineTo(side * 19, -7);
        ctx.lineTo(side * 16, 3);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      }
    }
  } else {
    ctx.fillStyle = hurtWhite ? '#FFFFFF' : '#6D4C3D';
    ctx.strokeStyle = '#18181B';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(-13, -4);
    ctx.quadraticCurveTo(-18 - flare, 14, -9 - flare * 0.4, 16);
    ctx.lineTo(9 + flare * 0.4, 16);
    ctx.quadraticCurveTo(18 + flare, 14, 13, -4);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Little stitched green patch on cloak
    if (!hurtWhite) {
      ctx.fillStyle = '#65A30D';
      ctx.fillRect(-10, 4, 6, 6);
    }
  }

  // Scarf collar
  ctx.fillStyle = hurtWhite ? '#FFFFFF' : isLord ? '#7E22CE' : '#854D0E';
  ctx.strokeStyle = '#18181B';
  ctx.lineWidth = 2.6;
  ctx.beginPath();
  ctx.ellipse(0, 1, 13, 6, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // 3. Cute Stitched Zombie Head
  ctx.fillStyle = hurtWhite ? '#FFFFFF' : isLord ? '#6EE7B7' : '#9DC0A8';
  ctx.beginPath();
  ctx.arc(0, -9, 13.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Tousled dark explorer hair back/fringe
  if (!hurtWhite) {
    ctx.fillStyle = isLord ? '#064E3B' : '#3B2F2F';
    ctx.beginPath();
    ctx.arc(0, -12, 13.5, Math.PI * 1.08, Math.PI * 1.92);
    ctx.lineTo(8, -14);
    ctx.lineTo(2, -17);
    ctx.lineTo(-4, -14);
    ctx.closePath();
    ctx.fill();
  }

  // Cheek stitch mark + Dynamic Injury Scuffs that visibly mend & disappear during Undead Regeneration!
  ctx.strokeStyle = isRegen ? '#4ADE80' : '#334155';
  ctx.lineWidth = isRegen ? 2.0 : 1.5;
  ctx.beginPath();
  ctx.moveTo(-9, -7);
  ctx.lineTo(-5, -5);
  ctx.stroke();

  if (hpRatio < 0.78 && !hurtWhite) {
    // Battle wound scuffs when injured; during Undead Regeneration they glow bright green and seal shut!
    const woundFade = isRegen ? Math.max(0, Math.sin(time * 12) * 0.5 + 0.3) : Math.min(1, (0.85 - hpRatio) * 1.8);
    ctx.save();
    ctx.globalAlpha = woundFade;
    ctx.strokeStyle = isRegen ? '#86EFAC' : '#881337';
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.moveTo(5, -14);
    ctx.lineTo(9, -11);
    ctx.moveTo(4, 7);
    ctx.lineTo(9, 10);
    ctx.stroke();
    ctx.restore();
  }

  // Eyes (face slightly toward aim vector!)
  const lookX = Math.cos(player.facingAngle) * 2.4;
  const lookY = Math.sin(player.facingAngle) * 1.6;
  const blinking = !isLord && Math.sin(time * 1.7) > 0.985;

  if (blinking) {
    ctx.strokeStyle = '#064E3B';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-7 + lookX, -8 + lookY);
    ctx.lineTo(-2 + lookX, -8 + lookY);
    ctx.moveTo(2 + lookX, -8 + lookY);
    ctx.lineTo(7 + lookX, -8 + lookY);
    ctx.stroke();
  } else {
    ctx.fillStyle = isLord ? '#FDE047' : '#34D399';
    ctx.beginPath();
    ctx.arc(-4.8 + lookX, -8.5 + lookY, isLord ? 3.5 : 3.2, 0, Math.PI * 2);
    ctx.arc(4.8 + lookX, -8.5 + lookY, isLord ? 3.5 : 3.2, 0, Math.PI * 2);
    ctx.fill();

    // Blazing ocular energy wisps in Lord of Decay form
    if (isLord) {
      ctx.strokeStyle = 'rgba(52, 211, 153, 0.85)';
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.moveTo(-5.5 + lookX, -9 + lookY);
      ctx.quadraticCurveTo(-11, -14, -13, -17 + Math.sin(time * 12) * 2);
      ctx.moveTo(5.5 + lookX, -9 + lookY);
      ctx.quadraticCurveTo(11, -14, 13, -17 + Math.cos(time * 12) * 2);
      ctx.stroke();
    }

    ctx.fillStyle = '#ECFDF5';
    ctx.beginPath();
    ctx.arc(-4.8 + lookX, -9 + lookY, 1.3, 0, Math.PI * 2);
    ctx.arc(4.8 + lookX, -9 + lookY, 1.3, 0, Math.PI * 2);
    ctx.fill();
  }

  // Cute snaggletooth grin
  ctx.strokeStyle = '#1E293B';
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.arc(lookX * 0.7, -3.5 + lookY * 0.5, 3.5, 0.15, Math.PI - 0.15);
  ctx.stroke();

  // 4. Signature Swaying Head Sprout (or Horned Necro-Sovereign Crown in Lord of Decay!)
  ctx.save();
  ctx.translate(0, -22);
  ctx.rotate(pose.sproutSway);
  if (isLord) {
    // Horned Sovereign Decay Crown + hovering emerald soul gem
    ctx.fillStyle = '#F59E0B';
    ctx.strokeStyle = '#18181B';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-10, 2);
    ctx.lineTo(-13, -8);
    ctx.lineTo(-5, -3);
    ctx.lineTo(0, -12);
    ctx.lineTo(5, -3);
    ctx.lineTo(13, -8);
    ctx.lineTo(10, 2);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Floating emerald soul crystal above crown apex
    const gemY = -16 + Math.sin(time * 8) * 1.8;
    ctx.fillStyle = '#34D399';
    ctx.beginPath();
    ctx.moveTo(0, gemY - 4);
    ctx.lineTo(3.2, gemY);
    ctx.lineTo(0, gemY + 4);
    ctx.lineTo(-3.2, gemY);
    ctx.closePath();
    ctx.fill();
  } else {
    ctx.strokeStyle = '#22C55E';
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    ctx.moveTo(0, 1);
    ctx.quadraticCurveTo(1, -6, 0, -9);
    ctx.stroke();

    ctx.fillStyle = isRegen ? '#BEF264' : '#4ADE80';
    ctx.strokeStyle = '#14532D';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.ellipse(-5, -9, 5, 2.8, -0.4, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    ctx.ellipse(5, -9, 5, 2.8, 0.4, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }
  ctx.restore();

  // 5. Articulated Spectral Claws with Dynamic Sickly Green / Sovereign Glow!
  drawZombieClawHand(
    ctx,
    player.facingAngle + pose.leftArmAngle,
    isLord,
    pose.clawGlowIntensity,
    pose.clawGlowColor
  );
  drawZombieClawHand(
    ctx,
    player.facingAngle + pose.rightArmAngle,
    isLord,
    pose.clawGlowIntensity,
    pose.clawGlowColor
  );

  ctx.restore();
}

function drawZombieClawHand(
  ctx: CanvasRenderingContext2D,
  worldAngle: number,
  isLord: boolean,
  clawGlowIntensity: number,
  clawGlowColor: string
): void {
  const dist = isLord ? 20 : 16 + clawGlowIntensity * 2.5;
  const hx = Math.cos(worldAngle) * dist;
  const hy = Math.sin(worldAngle) * dist + 2;

  ctx.save();
  ctx.translate(hx, hy);
  ctx.rotate(worldAngle);

  // Sickly green / necrotic energy aura around claws during Flesh Ripper wind-up & execution!
  if (clawGlowIntensity > 0.08 || isLord) {
    ctx.save();
    ctx.globalAlpha = Math.min(0.85, (isLord ? 0.45 : 0) + clawGlowIntensity * 0.65);
    ctx.fillStyle = clawGlowColor;
    ctx.beginPath();
    ctx.ellipse(4, 0, 11 + clawGlowIntensity * 5, 7 + clawGlowIntensity * 3, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // Bandaged hand
  ctx.fillStyle = isLord ? '#6EE7B7' : '#9DC0A8';
  ctx.strokeStyle = '#18181B';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(0, 0, isLord ? 5.6 : 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // 3 claws normally (elongated when glowing!), 4 venomous talons in Lord of Decay!
  const talonCount = isLord ? 4 : 3;
  const clawLen = (isLord ? 12.5 : 8.5) + clawGlowIntensity * 5.5;
  ctx.strokeStyle = clawGlowIntensity > 0.35 ? clawGlowColor : isLord ? '#34D399' : '#2DD4BF';
  ctx.lineWidth = isLord || clawGlowIntensity > 0.35 ? 2.6 : 2.2;
  ctx.lineCap = 'round';

  for (let i = 0; i < talonCount; i++) {
    const c = i - (talonCount - 1) / 2;
    ctx.beginPath();
    ctx.moveTo(3, c * 2.4);
    ctx.quadraticCurveTo(clawLen * 0.55, c * 3.1 - 0.6, clawLen, c * 3.3);
    ctx.stroke();
  }
  ctx.restore();
}

function drawSlashEffect(ctx: CanvasRenderingContext2D, s: SlashEffect): void {
  const ratio = Math.max(0, s.life / s.maxLife);
  ctx.save();
  ctx.translate(s.x, s.y);

  if (s.style === 'NOVA') {
    const progress = 1 - ratio;
    const currentR = s.radius * (0.25 + progress * 0.75);
    ctx.globalAlpha = ratio * 0.8;
    ctx.strokeStyle = s.colorPrimary;
    ctx.lineWidth = 10 * ratio;
    ctx.beginPath();
    ctx.arc(0, 0, currentR, 0, Math.PI * 2);
    ctx.stroke();

    ctx.fillStyle = s.colorSecondary;
    ctx.globalAlpha = ratio * 0.18;
    ctx.beginPath();
    ctx.arc(0, 0, currentR, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    return;
  }

  ctx.rotate(s.angle);
  if (s.flip) ctx.scale(1, -1);

  ctx.globalAlpha = Math.min(1, ratio * 1.3);

  // Outer sweeping crescent arc
  ctx.strokeStyle = s.colorPrimary;
  ctx.lineWidth = (s.style === 'TWIN_RIP' ? 14 : 9) * ratio;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.arc(0, 0, s.radius * 0.82, -s.arc * 0.5, s.arc * 0.5);
  ctx.stroke();

  // Inner claw scratch ribbons
  ctx.strokeStyle = s.colorSecondary;
  ctx.lineWidth = 3.5 * ratio;
  ctx.beginPath();
  ctx.arc(0, 0, s.radius * 0.68, -s.arc * 0.42, s.arc * 0.45);
  ctx.stroke();

  if (s.style === 'TWIN_RIP' || s.style === 'SKELETAL_SWIPE') {
    ctx.beginPath();
    ctx.arc(0, 0, s.radius * 0.94, -s.arc * 0.45, s.arc * 0.42);
    ctx.stroke();
  }

  ctx.restore();
}

function drawProjectile(ctx: CanvasRenderingContext2D, proj: Projectile, time: number): void {
  if (proj.visualKind === 'BONE_SPEAR') {
    drawBoneSpearProjectile(ctx, proj, time);
    return;
  }
  if (proj.visualKind === 'REAPER_WAVE') {
    drawReaperWaveProjectile(ctx, proj, time);
    return;
  }
  if (proj.visualKind === 'FALLING_DAGGER') {
    drawFallingDaggerProjectile(ctx, proj, time);
    return;
  }

  ctx.save();
  ctx.fillStyle = proj.color;
  ctx.strokeStyle = '#0F172A';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(proj.x, proj.y, proj.radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = '#FFFFFF';
  ctx.globalAlpha = 0.7;
  ctx.beginPath();
  ctx.arc(proj.x - proj.radius * 0.25, proj.y - proj.radius * 0.25, proj.radius * 0.38, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawLanternLighting(ctx: CanvasRenderingContext2D, room: RoomData, time: number): void {
  ctx.save();
  for (let i = 0; i < room.lanterns.length; i++) {
    const l = room.lanterns[i];
    const pulse = 1 + Math.sin(time * 3.5 + i) * 0.06;
    const r = 135 * pulse;
    const grad = ctx.createRadialGradient(l.x, l.y, 4, l.x, l.y, r);
    grad.addColorStop(0, 'rgba(251, 191, 36, 0.22)');
    grad.addColorStop(0.5, 'rgba(245, 158, 11, 0.08)');
    grad.addColorStop(1, 'rgba(245, 158, 11, 0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(l.x, l.y, r, 0, Math.PI * 2);
    ctx.fill();

    // Small lantern sconce core
    ctx.fillStyle = '#FDE68A';
    ctx.beginPath();
    ctx.arc(l.x, l.y, 4.5, 0, Math.PI * 2);
    ctx.fill();
  }

  // Gentle drifting cozy fireflies
  for (let f = 0; f < 10; f++) {
    const fx = 90 + ((Math.sin(time * 0.35 + f * 4.1) * 0.5 + 0.5) * (room.width - 180));
    const fy = 90 + ((Math.cos(time * 0.28 + f * 2.7) * 0.5 + 0.5) * (room.height - 180));
    const fa = 0.25 + (Math.sin(time * 2.6 + f) * 0.5 + 0.5) * 0.45;
    ctx.fillStyle = f % 2 === 0 ? `rgba(167, 243, 208, ${fa})` : `rgba(253, 230, 138, ${fa})`;
    ctx.beginPath();
    ctx.arc(fx, fy, 2.2, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function drawPlayerMobaIndicators(
  ctx: CanvasRenderingContext2D,
  player: PlayerState,
  joystickMoving: boolean,
  skillAimPreview: SkillAimPreview | null
): void {
  ctx.save();
  ctx.translate(player.x, player.y + 8);

  // 1. Subtle 360° hero foot ring + forward directional chevron
  ctx.strokeStyle = joystickMoving ? 'rgba(52, 211, 153, 0.42)' : 'rgba(148, 163, 184, 0.2)';
  ctx.lineWidth = 1.8;
  ctx.beginPath();
  ctx.arc(0, 0, 23, 0, Math.PI * 2);
  ctx.stroke();

  ctx.save();
  ctx.rotate(player.facingAngle);
  ctx.fillStyle = joystickMoving ? 'rgba(52, 211, 153, 0.85)' : 'rgba(52, 211, 153, 0.45)';
  ctx.beginPath();
  ctx.moveTo(31, 0);
  ctx.lineTo(24, -5);
  ctx.lineTo(26, 0);
  ctx.lineTo(24, 5);
  ctx.closePath();
  ctx.fill();
  ctx.restore();

  // 2. Active MOBA Hold-to-Aim Ground Telegraph (displayed while holding skill button, cast upon release!)
  if (skillAimPreview) {
    const { angle, range, style } = skillAimPreview;
    if (style === 'DIRECTIONAL_CONE') {
      ctx.fillStyle = 'rgba(132, 204, 22, 0.16)';
      ctx.strokeStyle = 'rgba(163, 230, 53, 0.78)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.arc(0, 0, range, angle - 0.88, angle + 0.88);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    } else if (style === 'DIRECTIONAL_ARROW') {
      ctx.save();
      ctx.rotate(angle);
      ctx.fillStyle = 'rgba(45, 212, 191, 0.18)';
      ctx.strokeStyle = 'rgba(94, 234, 212, 0.85)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(16, -15);
      ctx.lineTo(range - 26, -15);
      ctx.lineTo(range - 26, -24);
      ctx.lineTo(range, 0);
      ctx.lineTo(range - 26, 24);
      ctx.lineTo(range - 26, 15);
      ctx.lineTo(16, 15);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    } else if (style === 'AOE_RING') {
      ctx.fillStyle = 'rgba(52, 211, 153, 0.11)';
      ctx.strokeStyle = 'rgba(52, 211, 153, 0.65)';
      ctx.setLineDash([8, 6]);
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, 0, range, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.setLineDash([]);
    } else if (style === 'SELF') {
      ctx.strokeStyle = 'rgba(74, 222, 128, 0.72)';
      ctx.setLineDash([5, 5]);
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, 0, 32, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
    }
  }

  ctx.restore();
}

