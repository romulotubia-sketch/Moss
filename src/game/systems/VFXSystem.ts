/**
 * High-Performance Multi-Layered 2D Procedural Visual Effects (VFX) Engine
 *
 * Designed for 60 FPS mobile landscape gameplay using delta-time Canvas 2D rendering.
 * Zero simplistic single-line crescents, plain circles, or basic expanding rings:
 * Every Zombie ability uses a bespoke 5-stage sequence:
 *   1. Preparation (gathering energy, ground particles, vapor, floor tremors)
 *   2. Main Execution (multi-element organic procedural animations at varied speeds & depths)
 *   3. Impact Effects (directional point-of-contact bursts, flying fragments, debris)
 *   4. Secondary Effects (lingering poison clouds, orbiting spores, sludge residue, persistent sovereign aura)
 *   5. Natural Dissipation (gradual evaporation, scattering, sinking, and fading)
 */

import {
  drawGoblinVfxNode,
  emitGoblinAnticipationVfx,
} from './GoblinVFX';
import {
  drawSkeletonVfxNode,
  emitSkeletonAnticipationVfx,
} from './SkeletonVFX';

export type VFXLayer = 'UNDER' | 'OVER';

export type RichParticleShape =
  | 'TOXIC_DROPLET'
  | 'TORN_ORGANIC_SHARD'
  | 'GLOW_SPORE'
  | 'POISON_BUBBLE'
  | 'VAPOR_PLUME'
  | 'DIRT_CLOD'
  | 'STONE_DEBRIS'
  | 'BONE_FRAGMENT'
  | 'STITCH_HEART'
  | 'SPECTRAL_WISP'
  | 'FLAME_TONGUE'
  | 'STEEL_SPARK'
  | 'FOREST_LEAF';

export interface RichParticle {
  x: number;
  y: number;
  z: number; // height above floor for 2.5D arcing droplets, clods, bones, and shards
  vx: number;
  vy: number;
  vz: number;
  gravity: number;
  drag: number;
  size: number;
  endSize: number;
  rotation: number;
  vRot: number;
  life: number;
  maxLife: number;
  color: string;
  secondaryColor: string;
  alpha: number;
  shape: RichParticleShape;
  layer: VFXLayer;
  bounceFactor: number;
  convergeToX?: number;
  convergeToY?: number;
}

export type VFXNodeKind =
  // Basic Attack (Normal & Sovereign Lord Form)
  | 'BASIC_CLAW_GOUGES'
  | 'SOVEREIGN_VENOM_REND'
  | 'SOVEREIGN_GROUND_SCAR'
  // 1. Flesh Ripper
  | 'FLESH_RIPPER_CLAW_MARKS'
  | 'FLESH_RIPPER_GROUND_TRENCHES'
  // 2. Plague Burst
  | 'PLAGUE_GAS_ERUPTION'
  | 'PLAGUE_LINGERING_MIASMA'
  // 3. Death's Embrace
  | 'DEATH_EMBRACE_GROUND_CRACKS'
  | 'DEATH_EMBRACE_ZOMBIE_ARMS'
  // 4. Rotting Dash
  | 'ROTTING_DASH_AFTERIMAGE'
  | 'ROTTING_DASH_SLUDGE_TRAIL'
  // 5. Undead Regeneration
  | 'REGEN_AURA_GROUND'
  | 'REGEN_ORBITING_SPORES'
  | 'REGEN_INWARD_STREAMS'
  // Ultimate 1: Zombie Apocalypse
  | 'APOCALYPSE_OPEN_CHASM'
  | 'APOCALYPSE_FISSURE_WEB'
  // Ultimate 2: Graveyard Eruption
  | 'GRAVEYARD_TREMOR_CRACKS'
  | 'GRAVEYARD_CATACLYSM_IMPACT'
  | 'GRAVEYARD_SOIL_HAND'
  | 'GRAVEYARD_BONE_LASH'
  // Ultimate 3: Lord of Decay
  | 'LORD_TRANSFORMATION_VORTEX'
  | 'LORD_PERSISTENT_AURA'
  // Multi-Layered Point-of-Contact Impact Bursts
  | 'IMPACT_BURST_CLAW'
  | 'IMPACT_BURST_REND'
  | 'IMPACT_BURST_PLAGUE'
  | 'IMPACT_BURST_SOUL'
  | 'IMPACT_BURST_DASH'
  | 'IMPACT_BURST_SOVEREIGN'
  // Skeleton Multi-Layered Skill & Ultimate VFX Nodes
  | 'SKEL_BASIC_BLADE_ARC'
  | 'SKEL_COLOSSUS_CLEAVE'
  | 'SKEL_BONE_SLASH_ARC'
  | 'SKEL_SPEAR_ASSEMBLY'
  | 'SKEL_SPEAR_SHATTER'
  | 'SKEL_RIBCAGE_AEGIS'
  | 'SKEL_RUSH_AFTERIMAGE'
  | 'SKEL_RUSH_CROSS_FINISH'
  | 'SKEL_BONE_STORM_VORTEX'
  | 'SKEL_COLOSSUS_ASCENSION'
  | 'SKEL_COLOSSUS_AURA'
  | 'SKEL_ARMY_SUMMON_SIGIL'
  | 'SKEL_REAPER_SCYTHE_SWEEP'
  | 'SKEL_DARK_GROUND_WAKE'
  | 'IMPACT_BURST_BONE'
  | 'IMPACT_BURST_CRIT_SHATTER'
  | 'IMPACT_BURST_REAPER'
  // Passive Visual Feedback Nodes (Skeleton & Zombie)
  | 'PASSIVE_GUARD_FLASH'
  | 'PASSIVE_RESILIENCE_BLOOM'
  | 'PASSIVE_PLAGUE_POP'
  // Goblin Multi-Layered Skill, Ultimate & Passive VFX Nodes
  | 'GOB_TWIN_DAGGER_SLASH'
  | 'GOB_FLURRY_SLICE'
  | 'GOB_FLURRY_CROSS_FINISHER'
  | 'GOB_SHADOW_AFTERIMAGE'
  | 'GOB_SHADOWSTEP_RIBBON'
  | 'GOB_BACKSTAB_CROSS'
  | 'GOB_TRAP_BLAST_CORE'
  | 'GOB_TRAP_SCORCH_CRATER'
  | 'GOB_WINDRUNNER_GALE'
  | 'GOB_POISON_COAT_GLEAM'
  | 'GOB_PHANTOM_CONVERGENCE'
  | 'GOB_SHADOW_PORTAL'
  | 'GOB_THIEF_SIPHON_TETHER'
  | 'GOB_THIEF_CROWN_BURST'
  | 'GOB_THOUSAND_LAUNCH_HALO'
  | 'GOB_DAGGER_EMBED_SCAR'
  | 'IMPACT_BURST_DAGGER'
  | 'IMPACT_BURST_BACKSTAB'
  | 'PASSIVE_NIMBLE_EVADE';

export interface VFXNode {
  id: number;
  kind: VFXNodeKind;
  layer: VFXLayer;
  x: number;
  y: number;
  angle: number;
  radius: number;
  life: number;
  maxLife: number;
  seed: number;
  flip?: boolean;
  isLord?: boolean;
  followPlayer?: boolean;
  emitAccum?: number;
  subPoints?: { x: number; y: number; a: number; scale: number; delay: number }[];
}

export interface VFXState {
  nodes: VFXNode[];
  particles: RichParticle[];
  nextId: number;
  lordAmbientTimer: number;
  anticipationEmitTimer: number;
}

const MAX_RICH_PARTICLES = 360;
const MAX_VFX_NODES = 110;

export function createVFXState(): VFXState {
  return {
    nodes: [],
    particles: [],
    nextId: 1,
    lordAmbientTimer: 0,
    anticipationEmitTimer: 0,
  };
}

export function pushNode(state: VFXState, node: Omit<VFXNode, 'id'>): void {
  if (state.nodes.length >= MAX_VFX_NODES) {
    const idx = state.nodes.findIndex((n) => !n.followPlayer);
    if (idx >= 0) state.nodes.splice(idx, 1);
  }
  state.nodes.push({ ...node, id: state.nextId++ });
}

export function pushRichParticle(state: VFXState, p: RichParticle): void {
  if (state.particles.length >= MAX_RICH_PARTICLES) {
    state.particles.shift();
  }
  state.particles.push(p);
}

function hash01(seed: number): number {
  const s = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
  return s - Math.floor(s);
}

// ============================================================================
// STAGE 1: PREPARATION / ANTICIPATION EMITTERS (PER-ABILITY WIND-UP)
// ============================================================================

export function emitAnticipationVfx(
  state: VFXState,
  abilityId: string,
  x: number,
  y: number,
  aimAngle: number,
  isTransformed: boolean
): void {
  if (abilityId.startsWith('skeleton_')) {
    emitSkeletonAnticipationVfx(state, abilityId, x, y, aimAngle, isTransformed);
    return;
  }
  if (abilityId.startsWith('goblin_')) {
    emitGoblinAnticipationVfx(state, abilityId, x, y, aimAngle, isTransformed);
    return;
  }

  const isLord = isTransformed;
  if (abilityId === 'zombie_claw') {
    const handAngle = aimAngle - 0.85;
    const hx = x + Math.cos(handAngle) * 16;
    const hy = y + Math.sin(handAngle) * 16;
    pushRichParticle(state, {
      x: hx + (Math.random() - 0.5) * 8,
      y: hy + (Math.random() - 0.5) * 8,
      z: 8,
      vx: Math.cos(aimAngle) * 18,
      vy: Math.sin(aimAngle) * 18,
      vz: 18,
      gravity: 0,
      drag: 3,
      size: isLord ? 4.8 : 3.4,
      endSize: 0.6,
      rotation: aimAngle,
      vRot: 5,
      life: 0.16,
      maxLife: 0.16,
      color: isLord ? '#A855F7' : '#5EEAD4',
      secondaryColor: '#ECFDF5',
      alpha: 0.9,
      shape: 'TORN_ORGANIC_SHARD',
      layer: 'OVER',
      bounceFactor: 0,
    });
    return;
  }

  switch (abilityId) {
    case 'zombie_flesh_ripper': {
      // Claws pulled back glow with sickly green energy: energy wisps converge into both drawn-back claws + floor dust kicks up
      for (const side of [-1, 1]) {
        const clawAngle = aimAngle + side * 1.38;
        const cx = x + Math.cos(clawAngle) * 19;
        const cy = y + Math.sin(clawAngle) * 19;
        const srcAngle = clawAngle + (Math.random() - 0.5) * 1.4;
        const dist = 20 + Math.random() * 18;
        pushRichParticle(state, {
          x: cx + Math.cos(srcAngle) * dist,
          y: cy + Math.sin(srcAngle) * dist,
          z: 8 + Math.random() * 8,
          vx: 0,
          vy: 0,
          vz: 0,
          gravity: 0,
          drag: 0,
          size: 4.5 + Math.random() * 2.5,
          endSize: 1.5,
          rotation: srcAngle + Math.PI,
          vRot: side * 8,
          life: 0.17,
          maxLife: 0.17,
          color: '#84CC16',
          secondaryColor: '#BEF264',
          alpha: 0.95,
          shape: 'TORN_ORGANIC_SHARD',
          layer: 'OVER',
          bounceFactor: 0,
          convergeToX: cx,
          convergeToY: cy,
        });
      }
      // Scuffed floor pebble/dust under braced back foot
      pushRichParticle(state, {
        x: x - Math.cos(aimAngle) * 10 + (Math.random() - 0.5) * 12,
        y: y - Math.sin(aimAngle) * 10 + 12,
        z: 1,
        vx: -Math.cos(aimAngle) * (25 + Math.random() * 30),
        vy: -Math.sin(aimAngle) * (25 + Math.random() * 30),
        vz: 35 + Math.random() * 25,
        gravity: 220,
        drag: 2.5,
        size: 5,
        endSize: 9,
        rotation: Math.random() * 6,
        vRot: 2,
        life: 0.26,
        maxLife: 0.26,
        color: '#64748B',
        secondaryColor: '#4ADE80',
        alpha: 0.55,
        shape: 'VAPOR_PLUME',
        layer: 'UNDER',
        bounceFactor: 0,
      });
      break;
    }

    case 'zombie_plague_burst': {
      // Zombie crouches and gathers toxic energy; green vapor escapes from his body + bubbling droplets at feet
      for (let i = 0; i < 3; i++) {
        const ventA = (Math.random() - 0.5) * Math.PI * 2;
        pushRichParticle(state, {
          x: x + Math.cos(ventA) * (6 + Math.random() * 10),
          y: y + Math.sin(ventA) * 6,
          z: 6 + Math.random() * 10,
          vx: Math.cos(ventA) * (18 + Math.random() * 24),
          vy: Math.sin(ventA) * 14 - 16,
          vz: 38 + Math.random() * 32,
          gravity: -25,
          drag: 2.2,
          size: 7 + Math.random() * 5,
          endSize: 16,
          rotation: Math.random() * 6.28,
          vRot: (Math.random() - 0.5) * 4,
          life: 0.34,
          maxLife: 0.34,
          color: i === 0 ? '#A3E635' : '#4ADE80',
          secondaryColor: '#166534',
          alpha: 0.72,
          shape: 'VAPOR_PLUME',
          layer: 'OVER',
          bounceFactor: 0,
        });
      }
      // Toxic energy motes being drawn inward toward Zombie's glowing core
      const pullA = Math.random() * Math.PI * 2;
      const pullR = 38 + Math.random() * 22;
      pushRichParticle(state, {
        x: x + Math.cos(pullA) * pullR,
        y: y + Math.sin(pullA) * pullR * 0.75,
        z: 4,
        vx: 0,
        vy: 0,
        vz: 12,
        gravity: 0,
        drag: 0,
        size: 4.5,
        endSize: 1.5,
        rotation: 0,
        vRot: 0,
        life: 0.2,
        maxLife: 0.2,
        color: '#BEF264',
        secondaryColor: '#4D7C0F',
        alpha: 0.9,
        shape: 'GLOW_SPORE',
        layer: 'OVER',
        bounceFactor: 0,
        convergeToX: x,
        convergeToY: y,
      });
      break;
    }

    case 'zombie_deaths_embrace': {
      // Necrotic ground darkening & rising spectral particles around Zombie before underground hands erupt
      for (let i = 0; i < 3; i++) {
        const a = Math.random() * Math.PI * 2;
        const r = 18 + Math.random() * 44;
        pushRichParticle(state, {
          x: x + Math.cos(a) * r,
          y: y + Math.sin(a) * r * 0.75 + 6,
          z: 1,
          vx: (Math.random() - 0.5) * 14,
          vy: -10 - Math.random() * 14,
          vz: 42 + Math.random() * 28,
          gravity: -18,
          drag: 1.5,
          size: 4.8,
          endSize: 1.2,
          rotation: -Math.PI / 2,
          vRot: (Math.random() - 0.5) * 4,
          life: 0.36,
          maxLife: 0.36,
          color: i === 0 ? '#D8B4FE' : '#A855F7',
          secondaryColor: '#3B0764',
          alpha: 0.88,
          shape: 'SPECTRAL_WISP',
          layer: 'OVER',
          bounceFactor: 0,
        });
      }
      break;
    }

    case 'zombie_rotting_dash': {
      // Zombie lowers body before dashing: pressurized toxic vapor & bog sparks vent backward from boots
      const backA = aimAngle + Math.PI + (Math.random() - 0.5) * 0.7;
      pushRichParticle(state, {
        x: x + Math.cos(backA) * 10,
        y: y + Math.sin(backA) * 10 + 10,
        z: 3,
        vx: Math.cos(backA) * (65 + Math.random() * 45),
        vy: Math.sin(backA) * (65 + Math.random() * 45),
        vz: 24,
        gravity: 90,
        drag: 3,
        size: 6.5,
        endSize: 14,
        rotation: Math.random() * 6,
        vRot: 4,
        life: 0.24,
        maxLife: 0.24,
        color: '#2DD4BF',
        secondaryColor: '#115E59',
        alpha: 0.75,
        shape: 'VAPOR_PLUME',
        layer: 'UNDER',
        bounceFactor: 0,
      });
      pushRichParticle(state, {
        x: x + Math.cos(backA) * 8,
        y: y + Math.sin(backA) * 8 + 8,
        z: 5,
        vx: Math.cos(backA) * 95,
        vy: Math.sin(backA) * 95,
        vz: 55,
        gravity: 280,
        drag: 1.5,
        size: 4,
        endSize: 2,
        rotation: backA,
        vRot: 0,
        life: 0.22,
        maxLife: 0.22,
        color: '#A3E635',
        secondaryColor: '#14B8A6',
        alpha: 0.92,
        shape: 'TOXIC_DROPLET',
        layer: 'OVER',
        bounceFactor: 0.3,
      });
      break;
    }

    case 'zombie_undead_regen': {
      // Zombie briefly pauses and glows while green energy particles flow INWARD toward his body
      for (let i = 0; i < 4; i++) {
        const a = Math.random() * Math.PI * 2;
        const r = 46 + Math.random() * 28;
        pushRichParticle(state, {
          x: x + Math.cos(a) * r,
          y: y + Math.sin(a) * r * 0.8,
          z: 6 + Math.random() * 14,
          vx: 0,
          vy: 0,
          vz: 0,
          gravity: 0,
          drag: 0,
          size: 5 + Math.random() * 2,
          endSize: 1.6,
          rotation: a + Math.PI,
          vRot: 4,
          life: 0.22,
          maxLife: 0.22,
          color: i % 2 === 0 ? '#4ADE80' : '#BBF7D0',
          secondaryColor: '#166534',
          alpha: 0.95,
          shape: 'GLOW_SPORE',
          layer: 'OVER',
          bounceFactor: 0,
          convergeToX: x,
          convergeToY: y - 4,
        });
      }
      break;
    }

    case 'zombie_ult_apocalypse': {
      // Ground cracks & trembles around Zombie before chasms split open
      for (let i = 0; i < 3; i++) {
        const a = Math.random() * Math.PI * 2;
        const r = 26 + Math.random() * 42;
        pushRichParticle(state, {
          x: x + Math.cos(a) * r,
          y: y + Math.sin(a) * r + 8,
          z: 2,
          vx: (Math.random() - 0.5) * 26,
          vy: (Math.random() - 0.5) * 26,
          vz: 75 + Math.random() * 55,
          gravity: 380,
          drag: 1.4,
          size: 4.5,
          endSize: 3,
          rotation: Math.random() * 6.28,
          vRot: 8,
          life: 0.34,
          maxLife: 0.34,
          color: '#78350F',
          secondaryColor: '#451A03',
          alpha: 0.95,
          shape: 'DIRT_CLOD',
          layer: 'OVER',
          bounceFactor: 0.35,
        });
      }
      pushRichParticle(state, {
        x: x + (Math.random() - 0.5) * 70,
        y: y + (Math.random() - 0.5) * 55 + 8,
        z: 2,
        vx: (Math.random() - 0.5) * 18,
        vy: -16,
        vz: 48,
        gravity: -15,
        drag: 1.8,
        size: 8,
        endSize: 18,
        rotation: Math.random() * 6,
        vRot: 2,
        life: 0.38,
        maxLife: 0.38,
        color: '#4ADE80',
        secondaryColor: '#FDE68A',
        alpha: 0.65,
        shape: 'VAPOR_PLUME',
        layer: 'OVER',
        bounceFactor: 0,
      });
      break;
    }

    case 'zombie_ult_graveyard': {
      // Ensure spreading glowing tremor cracks exist on the floor during anticipation!
      const hasTremor = state.nodes.some(
        (n) => n.kind === 'GRAVEYARD_TREMOR_CRACKS' && n.life > 0.05
      );
      if (!hasTremor) {
        pushNode(state, {
          kind: 'GRAVEYARD_TREMOR_CRACKS',
          layer: 'UNDER',
          x,
          y: y + 6,
          angle: 0,
          radius: 196,
          life: 0.55,
          maxLife: 0.55,
          seed: Math.random() * 100,
        });
      }
      // Vibrating pebbles & dark spectral mist rising from spreading floor cracks
      for (let i = 0; i < 4; i++) {
        const a = Math.random() * Math.PI * 2;
        const r = 30 + Math.random() * 145;
        const px = x + Math.cos(a) * r;
        const py = y + Math.sin(a) * r * 0.78;
        pushRichParticle(state, {
          x: px,
          y: py,
          z: 1,
          vx: (Math.random() - 0.5) * 20,
          vy: (Math.random() - 0.5) * 20,
          vz: 65 + Math.random() * 55,
          gravity: 400,
          drag: 1.2,
          size: 4 + Math.random() * 3,
          endSize: 2.5,
          rotation: Math.random() * 6.28,
          vRot: 9,
          life: 0.32,
          maxLife: 0.32,
          color: '#64748B',
          secondaryColor: '#1E293B',
          alpha: 0.95,
          shape: 'STONE_DEBRIS',
          layer: 'OVER',
          bounceFactor: 0.4,
        });
      }
      break;
    }

    case 'zombie_ult_lord_of_decay': {
      // Swirling toxic energy cocoon surrounds Zombie during transformation!
      const hasCocoon = state.nodes.some(
        (n) => n.kind === 'LORD_TRANSFORMATION_VORTEX' && n.life > 0.05
      );
      if (!hasCocoon) {
        pushNode(state, {
          kind: 'LORD_TRANSFORMATION_VORTEX',
          layer: 'OVER',
          x,
          y,
          angle: 0,
          radius: 76,
          life: 0.48,
          maxLife: 0.48,
          seed: Math.random() * 100,
          followPlayer: true,
        });
      }
      for (let i = 0; i < 4; i++) {
        const a = Math.random() * Math.PI * 2;
        const r = 52 + Math.random() * 28;
        pushRichParticle(state, {
          x: x + Math.cos(a) * r,
          y: y + Math.sin(a) * r * 0.75,
          z: 4 + Math.random() * 18,
          vx: -Math.sin(a) * 110,
          vy: Math.cos(a) * 85,
          vz: 38,
          gravity: -20,
          drag: 2.2,
          size: 5.5,
          endSize: 1.5,
          rotation: a,
          vRot: 8,
          life: 0.28,
          maxLife: 0.28,
          color: i % 2 === 0 ? '#10B981' : '#C084FC',
          secondaryColor: '#FEF08A',
          alpha: 0.95,
          shape: 'FLAME_TONGUE',
          layer: 'OVER',
          bounceFactor: 0,
          convergeToX: x,
          convergeToY: y - 6,
        });
      }
      break;
    }
  }
}

// ============================================================================
// STAGE 2, 3, 4 & 5: PER-ABILITY MAIN EXECUTION, IMPACT & SECONDARY SPAWNERS
// ============================================================================

/**
 * Zombie Basic Attack — Ragged Spectral Claw Gouges (Normal) OR Sovereign Venom Rend (Lord of Decay)
 */
export function spawnZombieClawVfx(
  state: VFXState,
  x: number,
  y: number,
  angle: number,
  range: number,
  flip: boolean,
  isLord: boolean
): void {
  if (isLord) {
    // Lord of Decay visually transforms Basic Attacks into 4-talon venomous sovereign rends + ground scar!
    pushNode(state, {
      kind: 'SOVEREIGN_GROUND_SCAR',
      layer: 'UNDER',
      x,
      y: y + 6,
      angle,
      radius: range * 1.05,
      life: 0.55,
      maxLife: 0.55,
      seed: Math.random() * 100,
      flip,
    });
    pushNode(state, {
      kind: 'SOVEREIGN_VENOM_REND',
      layer: 'OVER',
      x,
      y,
      angle,
      radius: range * 1.08,
      life: 0.28,
      maxLife: 0.28,
      seed: Math.random() * 100,
      flip,
      isLord: true,
    });

    for (let i = 0; i < 10; i++) {
      const spread = angle + (Math.random() - 0.5) * 1.35;
      const spd = 95 + Math.random() * 145;
      pushRichParticle(state, {
        x: x + Math.cos(spread) * (range * 0.48),
        y: y + Math.sin(spread) * (range * 0.48),
        z: 10 + Math.random() * 10,
        vx: Math.cos(spread) * spd,
        vy: Math.sin(spread) * spd,
        vz: 45 + Math.random() * 55,
        gravity: 260,
        drag: 2.8,
        size: 4.5 + Math.random() * 3,
        endSize: 1.2,
        rotation: spread,
        vRot: (Math.random() - 0.5) * 12,
        life: 0.34,
        maxLife: 0.34,
        color: i % 3 === 0 ? '#C084FC' : '#34D399',
        secondaryColor: '#FEF08A',
        alpha: 0.95,
        shape: i % 2 === 0 ? 'TORN_ORGANIC_SHARD' : 'TOXIC_DROPLET',
        layer: 'OVER',
        bounceFactor: 0.25,
      });
    }
    return;
  }

  pushNode(state, {
    kind: 'BASIC_CLAW_GOUGES',
    layer: 'OVER',
    x,
    y,
    angle,
    radius: range,
    life: 0.22,
    maxLife: 0.22,
    seed: Math.random() * 100,
    flip,
    isLord: false,
  });

  for (let i = 0; i < 6; i++) {
    const spread = angle + (Math.random() - 0.5) * 1.15;
    const spd = 75 + Math.random() * 110;
    pushRichParticle(state, {
      x: x + Math.cos(spread) * (range * 0.52),
      y: y + Math.sin(spread) * (range * 0.52),
      z: 9,
      vx: Math.cos(spread) * spd,
      vy: Math.sin(spread) * spd,
      vz: 32 + Math.random() * 36,
      gravity: 210,
      drag: 3.2,
      size: 3.6 + Math.random() * 2.2,
      endSize: 0.8,
      rotation: spread,
      vRot: (Math.random() - 0.5) * 10,
      life: 0.25,
      maxLife: 0.25,
      color: i % 2 === 0 ? '#5EEAD4' : '#A7F3D0',
      secondaryColor: '#0F766E',
      alpha: 0.92,
      shape: 'TORN_ORGANIC_SHARD',
      layer: 'OVER',
      bounceFactor: 0,
    });
  }
}

/**
 * Normal Skill 1: Flesh Ripper
 * Multiple elongated ragged claw marks raking forward + torn organic energy fragments + oozing ground trenches
 */
export function spawnFleshRipperVfx(
  state: VFXState,
  x: number,
  y: number,
  angle: number,
  range: number,
  isLord = false
): void {
  // UNDER layer: 4 ragged oozing ground claw trenches
  pushNode(state, {
    kind: 'FLESH_RIPPER_GROUND_TRENCHES',
    layer: 'UNDER',
    x,
    y: y + 8,
    angle,
    radius: range,
    life: 1.15,
    maxLife: 1.15,
    seed: Math.random() * 100,
    isLord,
  });

  // OVER layer: 4 elongated, multi-layered jagged claw marks raking forward with staggered reveal & organic dissolve
  pushNode(state, {
    kind: 'FLESH_RIPPER_CLAW_MARKS',
    layer: 'OVER',
    x,
    y,
    angle,
    radius: range,
    life: 0.42,
    maxLife: 0.42,
    seed: Math.random() * 100,
    isLord,
  });

  // Torn organic energy fragments & sickly green droplets flying along the claw rake
  const count = isLord ? 22 : 16;
  for (let i = 0; i < count; i++) {
    const laneOffset = ((i % 4) - 1.5) * 14;
    const perpA = angle + Math.PI / 2;
    const distAlong = 22 + Math.random() * (range * 0.72);
    const px = x + Math.cos(angle) * distAlong + Math.cos(perpA) * laneOffset;
    const py = y + Math.sin(angle) * distAlong + Math.sin(perpA) * laneOffset;
    const flyA = angle + (Math.random() - 0.5) * 0.65;
    const spd = 120 + Math.random() * 165;

    pushRichParticle(state, {
      x: px,
      y: py,
      z: 8 + Math.random() * 14,
      vx: Math.cos(flyA) * spd,
      vy: Math.sin(flyA) * spd,
      vz: 45 + Math.random() * 65,
      gravity: i % 3 === 0 ? 310 : 120,
      drag: 2.8,
      size: 5 + Math.random() * 4,
      endSize: 1.1,
      rotation: flyA + (Math.random() - 0.5) * 0.6,
      vRot: (Math.random() - 0.5) * 14,
      life: 0.34 + Math.random() * 0.18,
      maxLife: 0.5,
      color: i % 3 === 0 ? '#BEF264' : isLord ? '#C084FC' : '#4ADE80',
      secondaryColor: '#14532D',
      alpha: 0.96,
      shape: i % 3 === 0 ? 'TOXIC_DROPLET' : 'TORN_ORGANIC_SHARD',
      layer: 'OVER',
      bounceFactor: 0.25,
    });
  }

  // Torn dust/vapor puffs kicked up at claw tips
  for (let c = 0; c < 5; c++) {
    const a = angle + (c - 2) * 0.28;
    pushRichParticle(state, {
      x: x + Math.cos(a) * (range * 0.75),
      y: y + Math.sin(a) * (range * 0.75),
      z: 4,
      vx: Math.cos(a) * 55,
      vy: Math.sin(a) * 55,
      vz: 24,
      gravity: -10,
      drag: 2.4,
      size: 8,
      endSize: 18,
      rotation: Math.random() * 6.28,
      vRot: (Math.random() - 0.5) * 3,
      life: 0.42,
      maxLife: 0.42,
      color: '#84CC16',
      secondaryColor: '#166534',
      alpha: 0.55,
      shape: 'VAPOR_PLUME',
      layer: 'OVER',
      bounceFactor: 0,
    });
  }
}

/**
 * Normal Skill 2: Plague Burst
 * Thick multi-layered poisonous gas eruption + toxic droplets + bubbles + glowing spores + lingering poison cloud
 */
export function spawnPlagueBurstVfx(
  state: VFXState,
  x: number,
  y: number,
  range: number,
  isLord = false
): void {
  // Secondary Layer (UNDER): Lingering churning poisonous miasma cloud on the ground (lasts 3.8s and evaporates naturally)
  const cloudPuffs: { x: number; y: number; a: number; scale: number; delay: number }[] = [];
  for (let i = 0; i < 12; i++) {
    const a = (Math.PI * 2 * i) / 12 + (Math.random() - 0.5) * 0.3;
    const dist = (0.22 + (i % 3) * 0.24) * range;
    cloudPuffs.push({
      x: Math.cos(a) * dist,
      y: Math.sin(a) * dist * 0.78,
      a,
      scale: 0.75 + Math.random() * 0.5,
      delay: (i % 4) * 0.04,
    });
  }

  pushNode(state, {
    kind: 'PLAGUE_LINGERING_MIASMA',
    layer: 'UNDER',
    x,
    y: y + 6,
    angle: 0,
    radius: range,
    life: 3.8,
    maxLife: 3.8,
    seed: Math.random() * 100,
    isLord,
    emitAccum: 0,
    subPoints: cloudPuffs,
  });

  // Main Layer (OVER): Thick billowing poisonous gas cloud erupting outward with swirling multi-speed lobes
  pushNode(state, {
    kind: 'PLAGUE_GAS_ERUPTION',
    layer: 'OVER',
    x,
    y,
    angle: 0,
    radius: range,
    life: 0.68,
    maxLife: 0.68,
    seed: Math.random() * 100,
    isLord,
    subPoints: cloudPuffs,
  });

  // Arcing toxic liquid droplets splattering across the blast zone
  for (let i = 0; i < 16; i++) {
    const a = (Math.PI * 2 * i) / 16 + (Math.random() - 0.5) * 0.25;
    const spd = 75 + Math.random() * 135;
    pushRichParticle(state, {
      x: x + Math.cos(a) * 12,
      y: y + Math.sin(a) * 10,
      z: 10,
      vx: Math.cos(a) * spd,
      vy: Math.sin(a) * spd * 0.82,
      vz: 95 + Math.random() * 85,
      gravity: 390,
      drag: 1.6,
      size: 4.5 + Math.random() * 3,
      endSize: 2.2,
      rotation: a,
      vRot: 5,
      life: 0.55 + Math.random() * 0.2,
      maxLife: 0.75,
      color: i % 2 === 0 ? '#A3E635' : '#4ADE80',
      secondaryColor: '#14532D',
      alpha: 0.95,
      shape: 'TOXIC_DROPLET',
      layer: 'OVER',
      bounceFactor: 0.32,
    });
  }

  // Floating translucent poison bubbles & glowing infected spores
  for (let i = 0; i < 14; i++) {
    const a = Math.random() * Math.PI * 2;
    const dist = Math.random() * range * 0.78;
    const isBubble = i % 2 === 0;
    pushRichParticle(state, {
      x: x + Math.cos(a) * dist,
      y: y + Math.sin(a) * dist * 0.78,
      z: 6 + Math.random() * 14,
      vx: Math.cos(a) * (22 + Math.random() * 35),
      vy: Math.sin(a) * 18 - 14,
      vz: 28 + Math.random() * 38,
      gravity: -16,
      drag: 1.8,
      size: isBubble ? 5 + Math.random() * 5 : 4 + Math.random() * 2.5,
      endSize: isBubble ? 9.5 : 1.2,
      rotation: 0,
      vRot: 0,
      life: 0.65 + Math.random() * 0.35,
      maxLife: 1.0,
      color: isBubble ? '#BEF264' : isLord ? '#E879F9' : '#ECFCCB',
      secondaryColor: '#365314',
      alpha: 0.9,
      shape: isBubble ? 'POISON_BUBBLE' : 'GLOW_SPORE',
      layer: 'OVER',
      bounceFactor: 0,
    });
  }
}

/**
 * Normal Skill 3: Death's Embrace
 * Darkened cracked earth + spectral particles + 3 individually animated decaying zombie arms per target
 * reaching up, grabbing & restraining the enemy, then sinking back underground.
 */
export function spawnDeathsEmbraceSingleGrabVfx(
  state: VFXState,
  x: number,
  y: number,
  duration: number
): void {
  const armSpecs = [
    { x: -15, y: 5, a: 0.32, scale: 1.0, delay: 0.0 },
    { x: 15, y: 6, a: -0.34, scale: 0.96, delay: 0.06 },
    { x: 1, y: 12, a: 0.04, scale: 0.88, delay: 0.11 },
  ];

  // UNDER: Darkening necrotic ground patch + jagged branching cracks
  pushNode(state, {
    kind: 'DEATH_EMBRACE_GROUND_CRACKS',
    layer: 'UNDER',
    x,
    y: y + 8,
    angle: 0,
    radius: 34,
    life: duration + 0.25,
    maxLife: duration + 0.25,
    seed: Math.random() * 100,
    subPoints: armSpecs,
  });

  // OVER: 3 articulated decaying zombie arms emerging, grabbing inward, holding, and sinking back down
  pushNode(state, {
    kind: 'DEATH_EMBRACE_ZOMBIE_ARMS',
    layer: 'OVER',
    x,
    y: y + 8,
    angle: 0,
    radius: 34,
    life: duration,
    maxLife: duration,
    seed: Math.random() * 100,
    emitAccum: 0,
    subPoints: armSpecs,
  });

  // Dirt clods & spectral smoke erupting as the undead hands punch through the soil
  for (let i = 0; i < 8; i++) {
    const a = Math.random() * Math.PI * 2;
    const isDirt = i < 5;
    pushRichParticle(state, {
      x: x + (Math.random() - 0.5) * 26,
      y: y + 8 + (Math.random() - 0.5) * 10,
      z: 2,
      vx: Math.cos(a) * (32 + Math.random() * 52),
      vy: Math.sin(a) * (24 + Math.random() * 36),
      vz: isDirt ? 85 + Math.random() * 65 : 45 + Math.random() * 35,
      gravity: isDirt ? 410 : -15,
      drag: 1.6,
      size: isDirt ? 4.5 : 7.5,
      endSize: isDirt ? 3 : 15,
      rotation: Math.random() * 6.28,
      vRot: (Math.random() - 0.5) * 9,
      life: 0.42 + Math.random() * 0.18,
      maxLife: 0.6,
      color: isDirt ? '#57534E' : '#A855F7',
      secondaryColor: isDirt ? '#1C1917' : '#3B0764',
      alpha: isDirt ? 0.95 : 0.65,
      shape: isDirt ? 'DIRT_CLOD' : 'VAPOR_PLUME',
      layer: 'OVER',
      bounceFactor: isDirt ? 0.35 : 0,
    });
  }
}

/**
 * Normal Skill 4: Rotting Dash
 * Animated Zombie afterimages + multi-layered toxic vapor + decaying particles + poisonous ground residue
 */
export function spawnRottingDashStepVfx(
  state: VFXState,
  x: number,
  y: number,
  angle: number,
  stepIdx: number,
  poolDuration: number,
  scaleMul: number,
  isLord = false
): void {
  // UNDER: Organic poisonous sludge mire patch left along the dash path
  pushNode(state, {
    kind: 'ROTTING_DASH_SLUDGE_TRAIL',
    layer: 'UNDER',
    x,
    y: y + 8,
    angle,
    radius: 32 * scaleMul,
    life: Math.min(2.4, poolDuration),
    maxLife: Math.min(2.4, poolDuration),
    seed: stepIdx * 19.3 + Math.random() * 10,
    isLord,
  });

  // OVER: Animated stretched Zombie silhouette afterimage phantom
  pushNode(state, {
    kind: 'ROTTING_DASH_AFTERIMAGE',
    layer: 'OVER',
    x,
    y,
    angle,
    radius: 24 * scaleMul,
    life: 0.24 + stepIdx * 0.035,
    maxLife: 0.24 + stepIdx * 0.035,
    seed: stepIdx,
    isLord,
  });

  // Multi-layered swirling toxic vapor plumes + decaying organic fragments
  const backA = angle + Math.PI;
  for (let i = 0; i < 4; i++) {
    const spread = backA + (Math.random() - 0.5) * 1.1;
    const isVapor = i < 2;
    pushRichParticle(state, {
      x: x + (Math.random() - 0.5) * 16,
      y: y + (Math.random() - 0.5) * 16,
      z: 6 + Math.random() * 10,
      vx: Math.cos(spread) * (35 + Math.random() * 55),
      vy: Math.sin(spread) * (35 + Math.random() * 55),
      vz: isVapor ? 24 : 52,
      gravity: isVapor ? -12 : 240,
      drag: 2.4,
      size: isVapor ? 8 + Math.random() * 4 : 4.2,
      endSize: isVapor ? 18 : 1.2,
      rotation: spread,
      vRot: (Math.random() - 0.5) * 8,
      life: 0.36 + Math.random() * 0.16,
      maxLife: 0.52,
      color: isVapor ? '#2DD4BF' : '#A3E635',
      secondaryColor: '#115E59',
      alpha: isVapor ? 0.62 : 0.92,
      shape: isVapor ? 'VAPOR_PLUME' : 'TORN_ORGANIC_SHARD',
      layer: 'OVER',
      bounceFactor: 0.2,
    });
  }
}

/**
 * Normal Skill 5: Undead Regeneration
 * Inward-flowing green energy particles + subtle persistent healing aura + orbiting spores & healing motes
 */
export function spawnUndeadRegenCastVfx(
  state: VFXState,
  x: number,
  y: number,
  duration: number
): void {
  // Remove previous regen nodes so recasting refreshes cleanly
  state.nodes = state.nodes.filter(
    (n) => n.kind !== 'REGEN_AURA_GROUND' && n.kind !== 'REGEN_ORBITING_SPORES'
  );

  // Burst of inward-flowing green energy ribbons converging into Zombie's body
  pushNode(state, {
    kind: 'REGEN_INWARD_STREAMS',
    layer: 'OVER',
    x,
    y,
    angle: 0,
    radius: 68,
    life: 0.52,
    maxLife: 0.52,
    seed: Math.random() * 100,
    followPlayer: true,
  });

  // UNDER: Subtle organic moss-vitality healing aura active throughout the 5s duration
  pushNode(state, {
    kind: 'REGEN_AURA_GROUND',
    layer: 'UNDER',
    x,
    y,
    angle: 0,
    radius: 38,
    life: duration,
    maxLife: duration,
    seed: Math.random() * 100,
    followPlayer: true,
  });

  // OVER: 6 small floating spores & healing motes orbiting Zombie in 3D tilted ellipses
  pushNode(state, {
    kind: 'REGEN_ORBITING_SPORES',
    layer: 'OVER',
    x,
    y,
    angle: 0,
    radius: 30,
    life: duration,
    maxLife: duration,
    seed: Math.random() * 100,
    followPlayer: true,
  });

  for (let i = 0; i < 12; i++) {
    const a = (Math.PI * 2 * i) / 12;
    const r = 52 + (i % 3) * 12;
    pushRichParticle(state, {
      x: x + Math.cos(a) * r,
      y: y + Math.sin(a) * r * 0.8,
      z: 6 + (i % 3) * 6,
      vx: 0,
      vy: 0,
      vz: 0,
      gravity: 0,
      drag: 0,
      size: 5,
      endSize: 1.5,
      rotation: a + Math.PI,
      vRot: 3,
      life: 0.34,
      maxLife: 0.34,
      color: i % 2 === 0 ? '#4ADE80' : '#BEF264',
      secondaryColor: '#14532D',
      alpha: 0.95,
      shape: 'GLOW_SPORE',
      layer: 'OVER',
      bounceFactor: 0,
      convergeToX: x,
      convergeToY: y - 4,
    });
  }
}

export function spawnUndeadRegenTickVfx(
  state: VFXState,
  x: number,
  y: number,
  count = 4
): void {
  // Subtle inward-flowing energy motes + rising mending stitch-hearts on each regeneration pulse
  for (let i = 0; i < count; i++) {
    const a = (Math.PI * 2 * i) / count + Math.random() * 0.6;
    if (i % 2 === 0) {
      const r = 38 + Math.random() * 14;
      pushRichParticle(state, {
        x: x + Math.cos(a) * r,
        y: y + Math.sin(a) * r * 0.78,
        z: 8,
        vx: 0,
        vy: 0,
        vz: 0,
        gravity: 0,
        drag: 0,
        size: 4.4,
        endSize: 1.4,
        rotation: 0,
        vRot: 0,
        life: 0.32,
        maxLife: 0.32,
        color: '#86EFAC',
        secondaryColor: '#166534',
        alpha: 0.9,
        shape: 'GLOW_SPORE',
        layer: 'OVER',
        bounceFactor: 0,
        convergeToX: x,
        convergeToY: y - 4,
      });
    } else {
      pushRichParticle(state, {
        x: x + Math.cos(a) * 16,
        y: y + Math.sin(a) * 10,
        z: 6,
        vx: (Math.random() - 0.5) * 12,
        vy: -14 - Math.random() * 10,
        vz: 34 + Math.random() * 18,
        gravity: -10,
        drag: 1.2,
        size: 5.8,
        endSize: 2.5,
        rotation: 0,
        vRot: 0,
        life: 0.62,
        maxLife: 0.62,
        color: '#4ADE80',
        secondaryColor: '#DCFCE7',
        alpha: 0.92,
        shape: 'STITCH_HEART',
        layer: 'OVER',
        bounceFactor: 0,
      });
    }
  }
}

/**
 * Ultimate 1: Zombie Apocalypse
 * Ground cracks and splits open into yawning glowing chasms; dirt, smoke, green vapor, and spectral particles
 * billow out as each undead minion climbs out with individual timing.
 */
export function spawnApocalypseUltVfx(
  state: VFXState,
  x: number,
  y: number,
  minionCoords: { x: number; y: number }[]
): void {
  // UNDER: Branching fissure web connecting Zombie to all 3 open burial chasms
  pushNode(state, {
    kind: 'APOCALYPSE_FISSURE_WEB',
    layer: 'UNDER',
    x,
    y: y + 6,
    angle: 0,
    radius: 90,
    life: 2.2,
    maxLife: 2.2,
    seed: Math.random() * 100,
    subPoints: minionCoords.map((pt, idx) => ({
      x: pt.x - x,
      y: pt.y - y,
      a: Math.atan2(pt.y - y, pt.x - x),
      scale: 1,
      delay: idx * 0.1,
    })),
  });

  minionCoords.forEach((pt, idx) => {
    // UNDER: Individual yawning earth chasm with glowing necrotic interior
    pushNode(state, {
      kind: 'APOCALYPSE_OPEN_CHASM',
      layer: 'UNDER',
      x: pt.x,
      y: pt.y + 9,
      angle: idx * 0.9,
      radius: 30,
      life: 1.85 + idx * 0.12,
      maxLife: 1.85 + idx * 0.12,
      seed: idx * 31.7,
    });

    // Dirt clods, smoke, green vapor, and spectral embers erupting from each chasm
    for (let p = 0; p < 12; p++) {
      const a = Math.random() * Math.PI * 2;
      const roll = p % 4;
      pushRichParticle(state, {
        x: pt.x + (Math.random() - 0.5) * 20,
        y: pt.y + 8 + (Math.random() - 0.5) * 10,
        z: 2,
        vx: Math.cos(a) * (28 + Math.random() * 62),
        vy: Math.sin(a) * (22 + Math.random() * 44),
        vz: roll === 0 ? 115 + Math.random() * 80 : 48 + Math.random() * 45,
        gravity: roll === 0 ? 430 : -14,
        drag: 1.6,
        size: roll === 0 ? 5 : roll === 3 ? 4.5 : 8.5,
        endSize: roll === 0 ? 3 : roll === 3 ? 1.2 : 18,
        rotation: Math.random() * 6.28,
        vRot: (Math.random() - 0.5) * 9,
        life: 0.55 + Math.random() * 0.25,
        maxLife: 0.8,
        color:
          roll === 0
            ? '#78350F'
            : roll === 1
            ? '#475569'
            : roll === 2
            ? '#4ADE80'
            : '#FDE047',
        secondaryColor: roll === 2 ? '#14532D' : '#1E293B',
        alpha: roll === 1 || roll === 2 ? 0.68 : 0.95,
        shape:
          roll === 0
            ? 'DIRT_CLOD'
            : roll === 3
            ? 'SPECTRAL_WISP'
            : 'VAPOR_PLUME',
        layer: 'OVER',
        bounceFactor: roll === 0 ? 0.36 : 0,
      });
    }
  });
}

/**
 * Ultimate 2: Graveyard Eruption
 * Glowing cracks spread across floor + skeletal hands burst through soil + debris & dust clouds +
 * large, readable cataclysmic dark-energy AoE impact!
 */
export function spawnGraveyardUltVfx(
  state: VFXState,
  x: number,
  y: number,
  range: number,
  tombCoords: { x: number; y: number }[],
  duration: number
): void {
  // UNDER: Spreading glowing violet-emerald fissure domain across the floor
  pushNode(state, {
    kind: 'GRAVEYARD_TREMOR_CRACKS',
    layer: 'UNDER',
    x,
    y: y + 6,
    angle: 0,
    radius: range,
    life: duration,
    maxLife: duration,
    seed: 42.7,
    subPoints: tombCoords.map((t, i) => ({
      x: t.x - x,
      y: t.y - y,
      a: Math.atan2(t.y - y, t.x - x),
      scale: 1,
      delay: i * 0.055,
    })),
  });

  // OVER: Large, readable dark-energy & tectonic spire AoE cataclysm wave!
  pushNode(state, {
    kind: 'GRAVEYARD_CATACLYSM_IMPACT',
    layer: 'OVER',
    x,
    y,
    angle: 0,
    radius: range,
    life: 0.82,
    maxLife: 0.82,
    seed: Math.random() * 100,
  });

  // 10 skeletal hands bursting through soil mounds at staggered timings across the haunted zone!
  for (let h = 0; h < 10; h++) {
    const a = (Math.PI * 2 * h) / 10 + (Math.random() - 0.5) * 0.25;
    const dist = 46 + ((h * 37) % Math.max(60, range - 54));
    const hx = x + Math.cos(a) * dist;
    const hy = y + Math.sin(a) * dist * 0.8;
    pushNode(state, {
      kind: 'GRAVEYARD_SOIL_HAND',
      layer: 'OVER',
      x: hx,
      y: hy + 6,
      angle: (h % 2 === 0 ? 1 : -1) * (0.12 + (h % 3) * 0.08),
      radius: 22,
      life: 1.65 + (h % 4) * 0.22,
      maxLife: 1.65 + (h % 4) * 0.22,
      seed: h * 17.3,
      flip: h % 2 === 1,
    });
  }

  // Stone debris, dust clouds, and bone fragments erupting around each rising tombstone
  tombCoords.forEach((pt, idx) => {
    for (let k = 0; k < 7; k++) {
      const a = Math.random() * Math.PI * 2;
      const isDust = k < 3;
      pushRichParticle(state, {
        x: pt.x + (Math.random() - 0.5) * 24,
        y: pt.y + 8,
        z: 3,
        vx: Math.cos(a) * (35 + Math.random() * 75),
        vy: Math.sin(a) * (28 + Math.random() * 55),
        vz: isDust ? 38 + Math.random() * 30 : 115 + Math.random() * 85,
        gravity: isDust ? -8 : 440,
        drag: 1.5,
        size: isDust ? 10 + Math.random() * 5 : 4.8 + Math.random() * 3,
        endSize: isDust ? 22 : 2.8,
        rotation: Math.random() * 6.28,
        vRot: (Math.random() - 0.5) * 10,
        life: 0.52 + idx * 0.04 + Math.random() * 0.2,
        maxLife: 0.82,
        color: isDust ? '#64748B' : k === 3 ? '#E2E8F0' : '#475569',
        secondaryColor: '#A855F7',
        alpha: isDust ? 0.58 : 0.95,
        shape: isDust ? 'VAPOR_PLUME' : k === 3 ? 'BONE_FRAGMENT' : 'STONE_DEBRIS',
        layer: 'OVER',
        bounceFactor: isDust ? 0 : 0.4,
      });
    }
  });
}

export function spawnGraveyardBoneClawSwipe(
  state: VFXState,
  x: number,
  y: number,
  angle: number,
  flip: boolean
): void {
  pushNode(state, {
    kind: 'GRAVEYARD_BONE_LASH',
    layer: 'OVER',
    x,
    y,
    angle,
    radius: 56,
    life: 0.3,
    maxLife: 0.3,
    seed: Math.random() * 100,
    flip,
  });

  for (let i = 0; i < 5; i++) {
    const a = angle + (Math.random() - 0.5) * 0.9;
    pushRichParticle(state, {
      x: x + Math.cos(a) * 18,
      y: y + Math.sin(a) * 18,
      z: 8,
      vx: Math.cos(a) * (65 + Math.random() * 65),
      vy: Math.sin(a) * (65 + Math.random() * 65),
      vz: 45,
      gravity: 260,
      drag: 2.2,
      size: 4.5,
      endSize: 2,
      rotation: Math.random() * 6.28,
      vRot: 10,
      life: 0.32,
      maxLife: 0.32,
      color: i % 2 === 0 ? '#E2E8F0' : '#D8B4FE',
      secondaryColor: '#581C87',
      alpha: 0.92,
      shape: i % 2 === 0 ? 'BONE_FRAGMENT' : 'SPECTRAL_WISP',
      layer: 'OVER',
      bounceFactor: 0.3,
    });
  }
}

/**
 * Ultimate 3: Lord of Decay
 * Full transformation ascension burst + swirling toxic energy pillars + persistent 10s sovereign aura
 */
export function spawnLordOfDecayAscensionVfx(
  state: VFXState,
  x: number,
  y: number,
  range: number,
  duration = 10.0
): void {
  state.nodes = state.nodes.filter((n) => n.kind !== 'LORD_PERSISTENT_AURA');

  // Shattering transformation vortex + erupting toxic pillars
  pushNode(state, {
    kind: 'LORD_TRANSFORMATION_VORTEX',
    layer: 'OVER',
    x,
    y,
    angle: Math.PI, // signals unleashed burst phase
    radius: range,
    life: 0.72,
    maxLife: 0.72,
    seed: Math.random() * 100,
    followPlayer: true,
  });

  // Persistent multi-layered aura following Zombie throughout the entire 10s transformation
  pushNode(state, {
    kind: 'LORD_PERSISTENT_AURA',
    layer: 'UNDER',
    x,
    y,
    angle: 0,
    radius: 48,
    life: duration,
    maxLife: duration,
    seed: Math.random() * 100,
    followPlayer: true,
  });

  // Swirling toxic flames, golden crown sparks, and dark violet shards
  for (let i = 0; i < 28; i++) {
    const a = (Math.PI * 2 * i) / 28;
    const spd = 85 + (i % 4) * 45;
    pushRichParticle(state, {
      x: x + Math.cos(a) * 14,
      y: y + Math.sin(a) * 12,
      z: 10,
      vx: Math.cos(a) * spd - Math.sin(a) * 55,
      vy: Math.sin(a) * spd * 0.8 + Math.cos(a) * 45,
      vz: 65 + (i % 3) * 35,
      gravity: -22,
      drag: 2.2,
      size: 6 + (i % 3) * 2.5,
      endSize: 1.4,
      rotation: a,
      vRot: 6,
      life: 0.58 + (i % 3) * 0.14,
      maxLife: 0.86,
      color: i % 3 === 0 ? '#10B981' : i % 3 === 1 ? '#C084FC' : '#FDE047',
      secondaryColor: '#064E3B',
      alpha: 0.96,
      shape: i % 4 === 0 ? 'GLOW_SPORE' : 'FLAME_TONGUE',
      layer: 'OVER',
      bounceFactor: 0,
    });
  }
}

// ============================================================================
// STAGE 3: DETAILED POINT-OF-CONTACT IMPACT BURSTS
// ============================================================================

export function spawnSkillImpactBurst(
  state: VFXState,
  x: number,
  y: number,
  angle: number,
  kind:
    | 'IMPACT_BURST_CLAW'
    | 'IMPACT_BURST_REND'
    | 'IMPACT_BURST_PLAGUE'
    | 'IMPACT_BURST_SOUL'
    | 'IMPACT_BURST_DASH'
    | 'IMPACT_BURST_SOVEREIGN'
    | 'IMPACT_BURST_BONE'
    | 'IMPACT_BURST_CRIT_SHATTER'
    | 'IMPACT_BURST_REAPER'
    | 'IMPACT_BURST_DAGGER'
    | 'IMPACT_BURST_BACKSTAB',
  isCrit: boolean
): void {
  const scale = isCrit ? 1.32 : 1.0;
  pushNode(state, {
    kind,
    layer: 'OVER',
    x,
    y,
    angle,
    radius:
      (kind === 'IMPACT_BURST_REND' ||
      kind === 'IMPACT_BURST_SOVEREIGN' ||
      kind === 'IMPACT_BURST_CRIT_SHATTER' ||
      kind === 'IMPACT_BURST_REAPER' ||
      kind === 'IMPACT_BURST_BACKSTAB'
        ? 42
        : 32) * scale,
    life: 0.28,
    maxLife: 0.28,
    seed: Math.random() * 100,
    isLord: isCrit,
  });

  const pCount = isCrit ? 10 : 6;
  for (let i = 0; i < pCount; i++) {
    const spread = angle + (Math.random() - 0.5) * 1.65;
    const spd = (75 + Math.random() * 145) * scale;
    const color =
      kind === 'IMPACT_BURST_REND'
        ? '#84CC16'
        : kind === 'IMPACT_BURST_PLAGUE'
        ? '#A3E635'
        : kind === 'IMPACT_BURST_SOUL'
        ? '#D8B4FE'
        : kind === 'IMPACT_BURST_DASH'
        ? '#2DD4BF'
        : kind === 'IMPACT_BURST_SOVEREIGN'
        ? '#34D399'
        : kind === 'IMPACT_BURST_BONE' || kind === 'IMPACT_BURST_CRIT_SHATTER'
        ? '#F8FAFC'
        : kind === 'IMPACT_BURST_REAPER'
        ? '#38BDF8'
        : kind === 'IMPACT_BURST_BACKSTAB'
        ? '#FB7185'
        : kind === 'IMPACT_BURST_DAGGER'
        ? '#FDE047'
        : '#5EEAD4';

    pushRichParticle(state, {
      x,
      y,
      z: 10,
      vx: Math.cos(spread) * spd,
      vy: Math.sin(spread) * spd,
      vz: 45 + Math.random() * 65,
      gravity:
        kind === 'IMPACT_BURST_PLAGUE' ||
        kind === 'IMPACT_BURST_BONE' ||
        kind === 'IMPACT_BURST_CRIT_SHATTER'
          ? 320
          : 190,
      drag: 2.8,
      size: (4.2 + Math.random() * 2.8) * scale,
      endSize: 1.0,
      rotation: spread,
      vRot: (Math.random() - 0.5) * 12,
      life: 0.28 + Math.random() * 0.12,
      maxLife: 0.4,
      color: isCrit && i % 2 === 0 ? '#FEF08A' : color,
      secondaryColor: '#0F172A',
      alpha: 0.96,
      shape:
        kind === 'IMPACT_BURST_PLAGUE' || kind === 'IMPACT_BURST_DASH'
          ? 'TOXIC_DROPLET'
          : kind === 'IMPACT_BURST_SOUL' || kind === 'IMPACT_BURST_REAPER'
          ? 'SPECTRAL_WISP'
          : kind === 'IMPACT_BURST_BONE' || kind === 'IMPACT_BURST_CRIT_SHATTER'
          ? 'BONE_FRAGMENT'
          : kind === 'IMPACT_BURST_DAGGER' || kind === 'IMPACT_BURST_BACKSTAB'
          ? 'STEEL_SPARK'
          : 'TORN_ORGANIC_SHARD',
      layer: 'OVER',
      bounceFactor: 0.25,
    });
  }
}

export function spawnDissipationBurst(
  state: VFXState,
  x: number,
  y: number,
  color: string,
  style: 'MINION_POOF' | 'LORD_END'
): void {
  const count = style === 'LORD_END' ? 18 : 10;
  for (let i = 0; i < count; i++) {
    const a = (Math.PI * 2 * i) / count + Math.random() * 0.3;
    const isSmoke = i % 2 === 0;
    pushRichParticle(state, {
      x: x + (Math.random() - 0.5) * 14,
      y: y + (Math.random() - 0.5) * 14,
      z: 8,
      vx: Math.cos(a) * (32 + Math.random() * 62),
      vy: Math.sin(a) * (26 + Math.random() * 52) - 10,
      vz: 35 + Math.random() * 35,
      gravity: -16,
      drag: 2.1,
      size: isSmoke ? 7.5 : 4.5,
      endSize: isSmoke ? 16 : 1.0,
      rotation: a,
      vRot: 4,
      life: 0.44 + Math.random() * 0.2,
      maxLife: 0.64,
      color,
      secondaryColor: '#1E293B',
      alpha: isSmoke ? 0.62 : 0.92,
      shape: isSmoke ? 'VAPOR_PLUME' : 'GLOW_SPORE',
      layer: 'OVER',
      bounceFactor: 0,
    });
  }
}

// ============================================================================
// DELTA-TIME UPDATE LOOP (60 FPS FRAME-RATE INDEPENDENT)
// ============================================================================

export function updateVFXSystem(
  state: VFXState,
  dt: number,
  playerX: number,
  playerY: number,
  playerMoving: boolean,
  _playerFacing: number,
  isLordActive: boolean,
  isColossusActive = false
): void {
  // Continuous drifting toxic flames & spores while transformed into Lord of Decay,
  // OR rising cyan soul-sparks & bone-ash motes while transformed into Bone Colossus!
  if (isLordActive || isColossusActive) {
    state.lordAmbientTimer -= dt;
    if (state.lordAmbientTimer <= 0) {
      state.lordAmbientTimer = playerMoving ? 0.048 : 0.08;
      const a = Math.random() * Math.PI * 2;
      const r = 14 + Math.random() * (isColossusActive ? 28 : 20);
      const isSpore = Math.random() < 0.45;
      pushRichParticle(state, {
        x: playerX + Math.cos(a) * r,
        y: playerY + Math.sin(a) * r * 0.75,
        z: 4 + Math.random() * (isColossusActive ? 22 : 14),
        vx: (Math.random() - 0.5) * 22,
        vy: -14 - Math.random() * 18,
        vz: 28 + Math.random() * 24,
        gravity: isColossusActive && isSpore ? 140 : -14,
        drag: 1.5,
        size: isSpore ? 4.2 : 5.8,
        endSize: 1.2,
        rotation: a,
        vRot: (Math.random() - 0.5) * 6,
        life: 0.48,
        maxLife: 0.48,
        color: isColossusActive
          ? isSpore
            ? '#F8FAFC'
            : '#38BDF8'
          : isSpore
          ? '#FEF08A'
          : Math.random() < 0.5
          ? '#10B981'
          : '#C084FC',
        secondaryColor: isColossusActive ? '#0F172A' : '#064E3B',
        alpha: 0.88,
        shape: isColossusActive
          ? isSpore
            ? 'BONE_FRAGMENT'
            : 'SPECTRAL_WISP'
          : isSpore
          ? 'GLOW_SPORE'
          : 'FLAME_TONGUE',
        layer: 'OVER',
        bounceFactor: 0,
      });
    }
  }

  for (let i = state.nodes.length - 1; i >= 0; i--) {
    const n = state.nodes[i];
    n.life -= dt;
    if (n.followPlayer) {
      n.x = playerX;
      n.y = playerY;
    }

    // Secondary ambient emissions from active lingering nodes
    if (n.kind === 'PLAGUE_LINGERING_MIASMA' && n.life > 0.4) {
      n.emitAccum = (n.emitAccum || 0) + dt;
      if (n.emitAccum >= 0.11) {
        n.emitAccum = 0;
        const a = Math.random() * Math.PI * 2;
        const r = Math.random() * n.radius * 0.82;
        const isBubble = Math.random() < 0.55;
        pushRichParticle(state, {
          x: n.x + Math.cos(a) * r,
          y: n.y + Math.sin(a) * r * 0.76,
          z: 2,
          vx: (Math.random() - 0.5) * 14,
          vy: -10 - Math.random() * 10,
          vz: 22 + Math.random() * 18,
          gravity: -8,
          drag: 1.2,
          size: isBubble ? 4 + Math.random() * 3.5 : 3.5,
          endSize: isBubble ? 7.5 : 1.0,
          rotation: 0,
          vRot: 0,
          life: 0.58,
          maxLife: 0.58,
          color: isBubble ? '#A3E635' : '#ECFCCB',
          secondaryColor: '#365314',
          alpha: Math.min(0.82, n.life * 0.5),
          shape: isBubble ? 'POISON_BUBBLE' : 'GLOW_SPORE',
          layer: 'OVER',
          bounceFactor: 0,
        });
      }
    } else if (n.kind === 'DEATH_EMBRACE_ZOMBIE_ARMS' && n.life > 0.25) {
      n.emitAccum = (n.emitAccum || 0) + dt;
      if (n.emitAccum >= 0.16) {
        n.emitAccum = 0;
        pushRichParticle(state, {
          x: n.x + (Math.random() - 0.5) * 24,
          y: n.y + (Math.random() - 0.5) * 10,
          z: 4,
          vx: (Math.random() - 0.5) * 14,
          vy: -14,
          vz: 26,
          gravity: -10,
          drag: 1.5,
          size: 4.5,
          endSize: 1.2,
          rotation: -Math.PI / 2,
          vRot: 3,
          life: 0.42,
          maxLife: 0.42,
          color: '#D8B4FE',
          secondaryColor: '#3B0764',
          alpha: 0.78,
          shape: 'SPECTRAL_WISP',
          layer: 'OVER',
          bounceFactor: 0,
        });
      }
    }

    if (n.life <= 0) {
      state.nodes.splice(i, 1);
    }
  }

  for (let i = state.particles.length - 1; i >= 0; i--) {
    const p = state.particles[i];
    p.life -= dt;
    if (p.life <= 0) {
      state.particles.splice(i, 1);
      continue;
    }

    if (p.convergeToX !== undefined && p.convergeToY !== undefined) {
      // Smooth inward magnetic pull toward Zombie's claws or core
      const pull = Math.min(1, dt * 13);
      p.x += (p.convergeToX - p.x) * pull;
      p.y += (p.convergeToY - p.y) * pull;
      p.z = Math.max(2, p.z * (1 - dt * 4));
    } else {
      const damp = Math.exp(-p.drag * dt);
      p.vx *= damp;
      p.vy *= damp;
      p.x += p.vx * dt;
      p.y += p.vy * dt;

      p.vz -= p.gravity * dt;
      p.z += p.vz * dt;
      if (p.z < 0) {
        p.z = 0;
        if (p.bounceFactor > 0 && Math.abs(p.vz) > 22) {
          p.vz = -p.vz * p.bounceFactor;
          p.vx *= 0.72;
          p.vy *= 0.72;
        } else {
          p.vz = 0;
        }
      }
    }

    p.rotation += p.vRot * dt;
  }
}

// ============================================================================
// MULTI-LAYERED CANVAS RENDERING (UNDER & OVER CHARACTER DEPTH PASSES)
// ============================================================================

export function renderVFXLayer(
  ctx: CanvasRenderingContext2D,
  state: VFXState,
  layer: VFXLayer,
  time: number
): void {
  for (let i = 0; i < state.nodes.length; i++) {
    const n = state.nodes[i];
    if (n.layer === layer) {
      drawVFXNode(ctx, n, time);
    }
  }

  for (let i = 0; i < state.particles.length; i++) {
    const p = state.particles[i];
    if (p.layer === layer) {
      drawRichParticle(ctx, p);
    }
  }
}

function drawJaggedCrackBranch(
  ctx: CanvasRenderingContext2D,
  startX: number,
  startY: number,
  angle: number,
  length: number,
  segments: number,
  seed: number
): void {
  ctx.moveTo(startX, startY);
  let cx = startX;
  let cy = startY;
  for (let s = 1; s <= segments; s++) {
    const t = s / segments;
    const jitter = (hash01(seed + s * 7.3) - 0.5) * 14 * (1 - t * 0.35);
    const perp = angle + Math.PI / 2;
    cx = startX + Math.cos(angle) * (length * t) + Math.cos(perp) * jitter;
    cy = startY + Math.sin(angle) * (length * t) * 0.8 + Math.sin(perp) * jitter * 0.8;
    ctx.lineTo(cx, cy);
  }
}

function drawArticulatedZombieArm(
  ctx: CanvasRenderingContext2D,
  emergeRatio: number,
  gripRatio: number,
  leanAngle: number,
  scale: number,
  seed: number
): void {
  if (emergeRatio <= 0.02) return;
  ctx.save();
  ctx.scale(scale, scale);

  // Clip below ground lip so the arm genuinely rises out of and sinks back into the cracked soil!
  ctx.beginPath();
  ctx.rect(-28, -56, 56, 58);
  ctx.clip();

  // Rim dirt mound at wrist base
  ctx.fillStyle = '#44403C';
  ctx.strokeStyle = '#1C1917';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.ellipse(0, 1, 10 * Math.min(1, emergeRatio * 1.5), 4, 0, Math.PI, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  const sinkOffset = (1 - emergeRatio) * 42;
  const sway = Math.sin(seed * 5 + gripRatio * Math.PI * 3) * 0.08;
  ctx.translate(0, sinkOffset);
  ctx.rotate(leanAngle * (0.4 + gripRatio * 0.85) + sway);

  // Tattered brown cuff at base
  ctx.fillStyle = '#78350F';
  ctx.strokeStyle = '#18181B';
  ctx.lineWidth = 2.2;
  ctx.beginPath();
  ctx.moveTo(-6, 2);
  ctx.lineTo(-7, -7);
  ctx.lineTo(-2, -5);
  ctx.lineTo(3, -8);
  ctx.lineTo(6, -6);
  ctx.lineTo(5, 2);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Decaying undead forearm (curved organic silhouette + exposed pale ulna bone streak)
  ctx.fillStyle = '#6EE7B7';
  ctx.strokeStyle = '#18181B';
  ctx.lineWidth = 2.4;
  ctx.beginPath();
  ctx.moveTo(-4.5, -6);
  ctx.quadraticCurveTo(-6, -18, -3.8, -26);
  ctx.lineTo(4.2, -26);
  ctx.quadraticCurveTo(5.5, -17, 4.2, -6);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Exposed bone highlight along forearm
  ctx.strokeStyle = '#E2E8F0';
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.moveTo(0.5, -9);
  ctx.lineTo(0.8, -21);
  ctx.stroke();

  // Articulated grabbing palm + 4 clawed fingers curling inward to restrain the enemy
  ctx.translate(0, -27);
  const curl = gripRatio * 0.55;
  ctx.rotate(leanAngle > 0 ? curl : -curl);

  ctx.fillStyle = '#86EFAC';
  ctx.strokeStyle = '#18181B';
  ctx.lineWidth = 2.2;
  ctx.beginPath();
  ctx.roundRect(-5.5, -6, 11, 8, 3);
  ctx.fill();
  ctx.stroke();

  // 4 gnarled fingers with dark purple-emerald necrotic claws
  for (let f = -1.5; f <= 1.5; f += 1) {
    const fx = f * 3.1;
    const bend = (leanAngle >= 0 ? 1 : -1) * (2.5 + gripRatio * 4.5);
    ctx.strokeStyle = '#18181B';
    ctx.lineWidth = 3.2;
    ctx.beginPath();
    ctx.moveTo(fx, -5);
    ctx.quadraticCurveTo(fx + bend * 0.4, -11, fx + bend, -13 + Math.abs(f) * 1.2);
    ctx.stroke();

    ctx.strokeStyle = '#C084FC';
    ctx.lineWidth = 1.7;
    ctx.beginPath();
    ctx.moveTo(fx, -5);
    ctx.quadraticCurveTo(fx + bend * 0.4, -11, fx + bend, -13 + Math.abs(f) * 1.2);
    ctx.stroke();
  }

  ctx.restore();
}

function drawVFXNode(ctx: CanvasRenderingContext2D, n: VFXNode, time: number): void {
  const ratio = Math.max(0, Math.min(1, n.life / n.maxLife));
  const progress = 1 - ratio;

  ctx.save();
  ctx.translate(n.x, n.y);

  switch (n.kind) {
    case 'BASIC_CLAW_GOUGES': {
      // 3 distinct ragged, tapered organic claw gouges raking across the target zone
      ctx.rotate(n.angle);
      if (n.flip) ctx.scale(1, -1);

      const reveal = Math.min(1, progress / 0.35);
      const fade = progress < 0.4 ? 1 : (1 - progress) / 0.6;
      ctx.globalAlpha = fade;

      for (let lane = -1; lane <= 1; lane++) {
        const yOff = lane * 10;
        const startX = 12 + Math.abs(lane) * 2;
        const fullLen = (n.radius - 14) * (lane === 0 ? 1.04 : 0.9);
        const curEnd = startX + fullLen * reveal;
        const arch = lane * 6 - 5;

        // Dark ink shadow backing
        ctx.fillStyle = '#042F2E';
        ctx.beginPath();
        ctx.moveTo(startX, yOff);
        ctx.quadraticCurveTo((startX + curEnd) * 0.5, yOff + arch - 4, curEnd, yOff + lane * 4);
        ctx.quadraticCurveTo((startX + curEnd) * 0.5, yOff + arch + 3.5, startX, yOff);
        ctx.fill();

        // Sickly teal-emerald torn energy body
        ctx.fillStyle = lane === 0 ? '#5EEAD4' : '#2DD4BF';
        ctx.beginPath();
        ctx.moveTo(startX + 2, yOff);
        ctx.quadraticCurveTo((startX + curEnd) * 0.5, yOff + arch - 2.4, curEnd + 2, yOff + lane * 4);
        ctx.quadraticCurveTo((startX + curEnd) * 0.5, yOff + arch + 1.8, startX + 2, yOff);
        ctx.fill();

        // Bright white-mint core filament
        ctx.strokeStyle = '#ECFDF5';
        ctx.lineWidth = 1.5 * fade;
        ctx.beginPath();
        ctx.moveTo(startX + 5, yOff);
        ctx.quadraticCurveTo((startX + curEnd) * 0.5, yOff + arch - 0.5, curEnd, yOff + lane * 4);
        ctx.stroke();
      }
      break;
    }

    case 'SOVEREIGN_GROUND_SCAR': {
      ctx.rotate(n.angle);
      if (n.flip) ctx.scale(1, -1);
      ctx.globalAlpha = ratio * 0.72;
      for (let c = -1.5; c <= 1.5; c += 1) {
        const yOff = c * 9;
        ctx.strokeStyle = '#1E1B4B';
        ctx.lineWidth = 4.5;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(16, yOff);
        ctx.quadraticCurveTo(n.radius * 0.55, yOff + c * 4, n.radius * 0.92, yOff + c * 6);
        ctx.stroke();

        ctx.strokeStyle = c % 2 === 0 ? '#10B981' : '#A855F7';
        ctx.lineWidth = 1.8 * ratio;
        ctx.stroke();
      }
      break;
    }

    case 'SOVEREIGN_VENOM_REND': {
      // Empowered Lord of Decay Basic Attack: 4 serrated toxic-emerald & violet sovereign talons
      ctx.rotate(n.angle);
      if (n.flip) ctx.scale(1, -1);
      const reveal = Math.min(1, progress / 0.32);
      const fade = progress < 0.38 ? 1 : (1 - progress) / 0.62;
      ctx.globalAlpha = fade;

      for (let i = 0; i < 4; i++) {
        const lane = i - 1.5;
        const y0 = lane * 10.5;
        const x0 = 12 + Math.abs(lane) * 2;
        const x1 = x0 + (n.radius - 10) * (1 - Math.abs(lane) * 0.06) * reveal;
        const midX = (x0 + x1) * 0.54;
        const midY = y0 + lane * 6.5 - 4;

        ctx.fillStyle = '#2E1065';
        ctx.beginPath();
        ctx.moveTo(x0, y0);
        ctx.quadraticCurveTo(midX, midY - 5.5, x1 + 4, y0 + lane * 5);
        ctx.lineTo(midX + 6, midY + 1);
        ctx.quadraticCurveTo(midX - 6, midY + 4.5, x0, y0);
        ctx.fill();

        ctx.fillStyle = i % 2 === 0 ? '#10B981' : '#C084FC';
        ctx.beginPath();
        ctx.moveTo(x0 + 2, y0);
        ctx.quadraticCurveTo(midX, midY - 3.2, x1 + 3, y0 + lane * 5);
        ctx.quadraticCurveTo(midX, midY + 2.2, x0 + 2, y0);
        ctx.fill();

        ctx.strokeStyle = '#FEF08A';
        ctx.lineWidth = 1.6 * fade;
        ctx.beginPath();
        ctx.moveTo(x0 + 6, y0);
        ctx.quadraticCurveTo(midX, midY - 0.8, x1, y0 + lane * 5);
        ctx.stroke();
      }
      break;
    }

    case 'FLESH_RIPPER_GROUND_TRENCHES': {
      // 4 torn earth & oozing ichor claw trenches left behind on the dungeon floor
      ctx.rotate(n.angle);
      const fade = ratio < 0.35 ? ratio / 0.35 : 1;
      ctx.globalAlpha = fade * 0.8;

      for (let i = 0; i < 4; i++) {
        const lane = i - 1.5;
        const y0 = lane * 12;
        const len = n.radius * (0.94 - Math.abs(lane) * 0.06);

        ctx.strokeStyle = '#1C1917';
        ctx.lineWidth = 5.5;
        ctx.lineCap = 'round';
        ctx.beginPath();
        drawJaggedCrackBranch(ctx, 16, y0, lane * 0.08, len - 18, 5, n.seed + i * 11);
        ctx.stroke();

        ctx.strokeStyle = n.isLord ? '#A855F7' : '#65A30D';
        ctx.lineWidth = 2.2 * fade;
        ctx.stroke();
      }
      break;
    }

    case 'FLESH_RIPPER_CLAW_MARKS': {
      // 4 elongated, jagged, organic claw tear marks with staggered reveal & dissolving torn wisps
      ctx.rotate(n.angle);

      for (let i = 0; i < 4; i++) {
        const lane = i - 1.5;
        const stagger = i * 0.045;
        const localP = Math.max(0, Math.min(1, (progress - stagger) / (1 - stagger * 0.8)));
        if (localP <= 0) continue;

        const reveal = Math.min(1, localP / 0.28);
        const dissolve = localP < 0.36 ? 1 : Math.max(0, (1 - localP) / 0.64);
        const y0 = lane * 13;
        const xStart = 14 + (1 - dissolve) * 18;
        const maxLen = n.radius * (1.04 - Math.abs(lane) * 0.055);
        const xEnd = 14 + maxLen * reveal;
        if (xEnd <= xStart + 4) continue;

        const midX = (xStart + xEnd) * 0.52;
        const curveY = y0 + lane * 7.5 + Math.sin(n.seed + i * 2.1) * 3;
        const halfThick = (5.8 - Math.abs(lane) * 0.6) * dissolve;

        ctx.save();
        ctx.globalAlpha = dissolve;

        // Outer dark organic shadow silhouette with jagged notch
        ctx.fillStyle = '#052E16';
        ctx.beginPath();
        ctx.moveTo(xStart - 2, y0);
        ctx.quadraticCurveTo(midX - 8, curveY - halfThick - 2.5, midX + 6, curveY - halfThick * 0.6);
        ctx.lineTo(midX + 2, curveY - halfThick - 3.2);
        ctx.quadraticCurveTo((midX + xEnd) * 0.5, curveY - halfThick * 0.7, xEnd + 5, y0 + lane * 9);
        ctx.quadraticCurveTo(midX + 6, curveY + halfThick + 2.5, xStart - 2, y0);
        ctx.fill();

        // Sickly chartreuse-green main ragged claw mark
        ctx.fillStyle = n.isLord && i % 2 === 1 ? '#C084FC' : '#84CC16';
        ctx.beginPath();
        ctx.moveTo(xStart, y0);
        ctx.quadraticCurveTo(midX - 6, curveY - halfThick, midX + 5, curveY - halfThick * 0.45);
        ctx.lineTo(midX + 3, curveY - halfThick * 1.05);
        ctx.quadraticCurveTo((midX + xEnd) * 0.52, curveY - halfThick * 0.4, xEnd + 3, y0 + lane * 9);
        ctx.quadraticCurveTo(midX + 4, curveY + halfThick, xStart, y0);
        ctx.fill();

        // Hot acid-lime inner filament
        ctx.strokeStyle = '#ECFCCB';
        ctx.lineWidth = 2.0 * dissolve;
        ctx.beginPath();
        ctx.moveTo(xStart + 6, y0);
        ctx.quadraticCurveTo(midX, curveY - 0.5, xEnd - 2, y0 + lane * 9);
        ctx.stroke();

        ctx.restore();
      }
      break;
    }

    case 'PLAGUE_GAS_ERUPTION': {
      // Multi-layered billowing poisonous cloud eruption (swirling lobes at varied speeds + spiraling fumes)
      const expand = 1 - Math.pow(1 - Math.min(1, progress * 1.45), 3);
      const fade = progress < 0.35 ? 1 : (1 - progress) / 0.65;
      const puffs = n.subPoints || [];

      ctx.save();
      ctx.globalAlpha = fade * 0.85;

      // Swirling toxic gas arms unfurling from Zombie's core
      for (let arm = 0; arm < 4; arm++) {
        const baseA = (Math.PI * 2 * arm) / 4 + progress * 2.2 + n.seed;
        const r1 = n.radius * 0.45 * expand;
        const r2 = n.radius * 0.92 * expand;
        ctx.strokeStyle = arm % 2 === 0 ? '#65A30D' : '#22C55E';
        ctx.lineWidth = (14 - arm * 1.5) * fade;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(Math.cos(baseA) * 10, Math.sin(baseA) * 8);
        ctx.quadraticCurveTo(
          Math.cos(baseA + 0.55) * r1,
          Math.sin(baseA + 0.55) * r1 * 0.8,
          Math.cos(baseA + 1.05) * r2,
          Math.sin(baseA + 1.05) * r2 * 0.78
        );
        ctx.stroke();
      }

      // Billowing organic multi-lobed cloud clusters
      for (let i = 0; i < puffs.length; i++) {
        const pf = puffs[i];
        const swirlA = pf.a + progress * (i % 2 === 0 ? 1.1 : -0.85);
        const dist = Math.hypot(pf.x, pf.y) * expand;
        const px = Math.cos(swirlA) * dist;
        const py = Math.sin(swirlA) * dist * 0.78;
        const pr = (22 + (i % 3) * 8) * pf.scale * (0.65 + expand * 0.45);

        ctx.fillStyle = i % 3 === 0 ? '#365314' : i % 3 === 1 ? '#4D7C0F' : '#15803D';
        ctx.beginPath();
        ctx.arc(px, py, pr, 0, Math.PI * 2);
        ctx.arc(px + pr * 0.48, py - pr * 0.22, pr * 0.72, 0, Math.PI * 2);
        ctx.arc(px - pr * 0.42, py + pr * 0.2, pr * 0.66, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = i % 2 === 0 ? '#A3E635' : '#4ADE80';
        ctx.globalAlpha = fade * 0.48;
        ctx.beginPath();
        ctx.arc(px - pr * 0.12, py - pr * 0.16, pr * 0.62, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = fade * 0.85;
      }
      ctx.restore();
      break;
    }

    case 'PLAGUE_LINGERING_MIASMA': {
      // Secondary lingering poisonous cloud on the ground that gently churns and evaporates naturally
      const env = progress < 0.08 ? progress / 0.08 : ratio < 0.28 ? ratio / 0.28 : 1;
      const puffs = n.subPoints || [];
      ctx.globalAlpha = env * 0.34;

      for (let i = 0; i < puffs.length; i++) {
        const pf = puffs[i];
        const driftA = pf.a + Math.sin(time * 1.2 + i) * 0.18 + time * (i % 2 === 0 ? 0.16 : -0.12);
        const baseD = Math.hypot(pf.x, pf.y) * (1 + (1 - env) * 0.15);
        const px = Math.cos(driftA) * baseD;
        const py = Math.sin(driftA) * baseD * 0.76;
        const pr = (24 + (i % 3) * 7) * pf.scale;

        ctx.fillStyle = i % 2 === 0 ? '#3F6212' : '#166534';
        ctx.beginPath();
        ctx.ellipse(px, py, pr * 1.15, pr * 0.78, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#84CC16';
        ctx.beginPath();
        ctx.ellipse(px - 3, py - 2, pr * 0.65, pr * 0.44, 0, 0, Math.PI * 2);
        ctx.fill();
      }
      break;
    }

    case 'DEATH_EMBRACE_GROUND_CRACKS': {
      const env = progress < 0.1 ? progress / 0.1 : ratio < 0.25 ? ratio / 0.25 : 1;
      ctx.globalAlpha = env;

      // Irregular darkened necrotic earth patch (lobed polygon, NOT a plain circle)
      ctx.fillStyle = 'rgba(24, 10, 42, 0.76)';
      ctx.beginPath();
      const verts = 10;
      for (let v = 0; v <= verts; v++) {
        const a = (Math.PI * 2 * v) / verts;
        const jag = 0.78 + hash01(n.seed + (v % verts) * 5.1) * 0.36;
        const vx = Math.cos(a) * n.radius * jag;
        const vy = Math.sin(a) * n.radius * 0.58 * jag;
        if (v === 0) ctx.moveTo(vx, vy);
        else ctx.lineTo(vx, vy);
      }
      ctx.closePath();
      ctx.fill();

      // Glowing branching cracks radiating from beneath the restrained target
      for (let b = 0; b < 5; b++) {
        const a = (Math.PI * 2 * b) / 5 + n.seed * 0.1;
        ctx.strokeStyle = '#1E1B4B';
        ctx.lineWidth = 3.5;
        ctx.beginPath();
        drawJaggedCrackBranch(ctx, 0, 0, a, n.radius * 0.95, 4, n.seed + b * 9);
        ctx.stroke();

        ctx.strokeStyle = '#C084FC';
        ctx.lineWidth = 1.5 * env;
        ctx.stroke();
      }
      break;
    }

    case 'DEATH_EMBRACE_ZOMBIE_ARMS': {
      // Multiple decaying zombie arms per target with individual emergence, inward grab, and sinking dissipation
      const arms = n.subPoints || [];
      for (let i = 0; i < arms.length; i++) {
        const arm = arms[i];
        const elapsed = n.maxLife - n.life - arm.delay;
        if (elapsed <= 0) continue;
        const dur = Math.max(0.25, n.maxLife - arm.delay);
        const t = Math.min(1, elapsed / dur);

        // Emerge rapidly (0..0.18), hold & restrain (0.18..0.78), sink back underground (0.78..1.0)
        const emerge =
          t < 0.18 ? t / 0.18 : t > 0.78 ? Math.max(0, (1 - t) / 0.22) : 1;
        const grip =
          t < 0.16 ? 0 : t < 0.32 ? (t - 0.16) / 0.16 : t > 0.8 ? (1 - t) / 0.2 : 1;

        ctx.save();
        ctx.translate(arm.x, arm.y);
        drawArticulatedZombieArm(ctx, emerge, grip, arm.a, arm.scale, n.seed + i * 13);
        ctx.restore();
      }
      break;
    }

    case 'ROTTING_DASH_SLUDGE_TRAIL': {
      // Multi-lobed poisonous mire residue left along Zombie's dash path
      const env = ratio < 0.3 ? ratio / 0.3 : 1;
      ctx.globalAlpha = env * 0.62;

      for (let lobe = 0; lobe < 3; lobe++) {
        const a = n.angle + lobe * 2.1 + n.seed;
        const lx = Math.cos(a) * 8;
        const ly = Math.sin(a) * 5;
        const rx = n.radius * (0.72 - lobe * 0.12);
        const ry = rx * 0.62;

        ctx.fillStyle = lobe === 0 ? '#115E59' : '#15803D';
        ctx.beginPath();
        ctx.ellipse(lx, ly, rx, ry, n.angle * 0.3, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = n.isLord ? '#A855F7' : '#2DD4BF';
        ctx.beginPath();
        ctx.ellipse(lx - 2, ly - 1, rx * 0.55, ry * 0.5, 0, 0, Math.PI * 2);
        ctx.fill();
      }
      break;
    }

    case 'ROTTING_DASH_AFTERIMAGE': {
      // Stretched, forward-leaning animated Zombie silhouette phantom trailing toxic streaks
      const fade = ratio;
      ctx.globalAlpha = fade * 0.68;

      const leanX = Math.cos(n.angle) * 6;
      const leanY = Math.sin(n.angle) * 4;
      ctx.translate(leanX, leanY);
      ctx.rotate(Math.cos(n.angle) * 0.22);
      ctx.scale(1.24, 0.82);

      // Trailing cloak silhouette
      ctx.fillStyle = n.isLord ? '#7E22CE' : '#0D9488';
      ctx.beginPath();
      ctx.moveTo(-12, -4);
      ctx.quadraticCurveTo(-20, 14, -10, 16);
      ctx.lineTo(10, 16);
      ctx.quadraticCurveTo(20, 14, 12, -4);
      ctx.closePath();
      ctx.fill();

      // Head silhouette + glowing eyes + sprout
      ctx.fillStyle = n.isLord ? '#C084FC' : '#5EEAD4';
      ctx.beginPath();
      ctx.arc(0, -9, 12.5, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#FEF08A';
      ctx.beginPath();
      ctx.arc(-4, -9, 2.5, 0, Math.PI * 2);
      ctx.arc(4, -9, 2.5, 0, Math.PI * 2);
      ctx.fill();

      // Speed slipstream lines behind phantom
      ctx.strokeStyle = '#99F6E4';
      ctx.lineWidth = 2 * fade;
      for (let s = -1; s <= 1; s++) {
        ctx.beginPath();
        ctx.moveTo(-Math.cos(n.angle) * 8, s * 8 - 4);
        ctx.lineTo(-Math.cos(n.angle) * 28, s * 8 - 4 - Math.sin(n.angle) * 18);
        ctx.stroke();
      }
      break;
    }

    case 'REGEN_INWARD_STREAMS': {
      // Spiraling green vitality ribbons flowing inward into Zombie's heart on cast
      const pull = 1 - progress;
      ctx.globalAlpha = Math.sin(progress * Math.PI) * 0.95;

      for (let s = 0; s < 6; s++) {
        const a0 = (Math.PI * 2 * s) / 6 + progress * 2.4;
        const rOuter = n.radius * (0.25 + pull * 0.75);
        const rInner = Math.max(4, rOuter - 24);

        ctx.strokeStyle = s % 2 === 0 ? '#4ADE80' : '#BEF264';
        ctx.lineWidth = 3;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(Math.cos(a0) * rOuter, Math.sin(a0) * rOuter * 0.76);
        ctx.quadraticCurveTo(
          Math.cos(a0 + 0.45) * ((rOuter + rInner) * 0.5),
          Math.sin(a0 + 0.45) * ((rOuter + rInner) * 0.4),
          Math.cos(a0 + 0.8) * rInner,
          Math.sin(a0 + 0.8) * rInner * 0.76
        );
        ctx.stroke();
      }
      break;
    }

    case 'REGEN_AURA_GROUND': {
      // Subtle organic clover-leaf vitality aura breathing under Zombie throughout Undead Regeneration
      const env = progress < 0.08 ? progress / 0.08 : ratio < 0.15 ? ratio / 0.15 : 1;
      const pulse = 1 + Math.sin(time * 5.5) * 0.07;
      ctx.translate(0, 8);
      ctx.scale(pulse, pulse * 0.68);
      ctx.rotate(time * 0.65);
      ctx.globalAlpha = env * 0.42;

      for (let petal = 0; petal < 6; petal++) {
        const a = (Math.PI * 2 * petal) / 6;
        ctx.save();
        ctx.rotate(a);
        ctx.fillStyle = petal % 2 === 0 ? '#22C55E' : '#4ADE80';
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.quadraticCurveTo(14, -10, n.radius, 0);
        ctx.quadraticCurveTo(14, 10, 0, 0);
        ctx.fill();
        ctx.restore();
      }
      break;
    }

    case 'REGEN_ORBITING_SPORES': {
      // 6 floating glowing spores & healing motes orbiting around Zombie in 2 tilted bands
      const env = progress < 0.08 ? progress / 0.08 : ratio < 0.15 ? ratio / 0.15 : 1;
      ctx.globalAlpha = env;

      for (let m = 0; m < 6; m++) {
        const speed = m % 2 === 0 ? 2.8 : -2.2;
        const orbitA = time * speed + (Math.PI * 2 * m) / 6;
        const rx = n.radius + (m % 2) * 6;
        const ry = 12 + (m % 2) * 5;
        const ox = Math.cos(orbitA) * rx;
        const oy = Math.sin(orbitA) * ry - 6 + Math.sin(time * 4 + m) * 4;

        // Soft trailing tail
        const prevA = orbitA - speed * 0.09;
        ctx.strokeStyle = 'rgba(134, 239, 172, 0.55)';
        ctx.lineWidth = 2.4;
        ctx.beginPath();
        ctx.moveTo(Math.cos(prevA) * rx, Math.sin(prevA) * ry - 6 + Math.sin(time * 4 + m) * 4);
        ctx.lineTo(ox, oy);
        ctx.stroke();

        // Glowing spore halo + core
        ctx.fillStyle = 'rgba(74, 222, 128, 0.35)';
        ctx.beginPath();
        ctx.arc(ox, oy, 6.2, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = m % 2 === 0 ? '#BBF7D0' : '#BEF264';
        ctx.beginPath();
        ctx.arc(ox, oy, 2.8, 0, Math.PI * 2);
        ctx.fill();
      }
      break;
    }

    case 'APOCALYPSE_FISSURE_WEB': {
      const env = progress < 0.1 ? progress / 0.1 : ratio < 0.35 ? ratio / 0.35 : 1;
      ctx.globalAlpha = env * 0.88;
      const pts = n.subPoints || [];

      for (let i = 0; i < pts.length; i++) {
        const pt = pts[i];
        const dist = Math.hypot(pt.x, pt.y);
        ctx.strokeStyle = '#1C1917';
        ctx.lineWidth = 4.5;
        ctx.beginPath();
        drawJaggedCrackBranch(ctx, 0, 0, pt.a, dist, 5, n.seed + i * 17);
        ctx.stroke();

        ctx.strokeStyle = '#4ADE80';
        ctx.lineWidth = 2 * env;
        ctx.stroke();
      }
      break;
    }

    case 'APOCALYPSE_OPEN_CHASM': {
      // Yawning ragged earth chasm with glowing necrotic green depths from which undead minions climb out!
      const openRatio =
        progress < 0.14 ? progress / 0.14 : ratio < 0.25 ? ratio / 0.25 : 1;
      ctx.scale(openRatio, openRatio);

      // Raised broken dirt rim
      ctx.fillStyle = '#57534E';
      ctx.strokeStyle = '#1C1917';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      for (let v = 0; v <= 10; v++) {
        const a = (Math.PI * 2 * v) / 10;
        const jag = 0.85 + hash01(n.seed + (v % 10) * 3.7) * 0.32;
        const vx = Math.cos(a) * n.radius * jag;
        const vy = Math.sin(a) * n.radius * 0.52 * jag;
        if (v === 0) ctx.moveTo(vx, vy);
        else ctx.lineTo(vx, vy);
      }
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Deep dark chasm pit + glowing green subterranean energy
      ctx.fillStyle = '#052E16';
      ctx.beginPath();
      ctx.ellipse(0, 1, n.radius * 0.72, n.radius * 0.36, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = `rgba(74, 222, 128, ${0.55 + Math.sin(time * 9 + n.seed) * 0.2})`;
      ctx.beginPath();
      ctx.ellipse(0, 2, n.radius * 0.48, n.radius * 0.22, 0, 0, Math.PI * 2);
      ctx.fill();
      break;
    }

    case 'GRAVEYARD_TREMOR_CRACKS': {
      // Multiple glowing cracks spreading outward across the dungeon floor
      const spread = Math.min(1, progress / 0.22);
      const fade = ratio < 0.2 ? ratio / 0.2 : 1;
      ctx.globalAlpha = fade;

      // Subtle dark haunted mist domain polygon
      if (n.maxLife > 1.0) {
        ctx.fillStyle = 'rgba(30, 14, 52, 0.34)';
        ctx.beginPath();
        for (let v = 0; v <= 14; v++) {
          const a = (Math.PI * 2 * v) / 14;
          const jag = 0.88 + hash01(n.seed + (v % 14) * 4.3) * 0.2;
          const vx = Math.cos(a) * n.radius * spread * jag;
          const vy = Math.sin(a) * n.radius * 0.82 * spread * jag;
          if (v === 0) ctx.moveTo(vx, vy);
          else ctx.lineTo(vx, vy);
        }
        ctx.closePath();
        ctx.fill();
      }

      const branchCount = 9;
      for (let b = 0; b < branchCount; b++) {
        const a = (Math.PI * 2 * b) / branchCount + 0.18;
        const len = n.radius * (0.72 + (b % 3) * 0.13) * spread;

        ctx.strokeStyle = '#0F172A';
        ctx.lineWidth = 4.5;
        ctx.lineCap = 'round';
        ctx.beginPath();
        drawJaggedCrackBranch(ctx, 0, 0, a, len, 6, n.seed + b * 13);
        ctx.stroke();

        const glowPulse = 0.65 + Math.sin(time * 8 + b) * 0.3;
        ctx.strokeStyle = b % 2 === 0 ? `rgba(216, 180, 254, ${glowPulse})` : `rgba(52, 211, 153, ${glowPulse})`;
        ctx.lineWidth = 2.0 * fade;
        ctx.stroke();
      }
      break;
    }

    case 'GRAVEYARD_CATACLYSM_IMPACT': {
      // Large, readable dark-energy & spectral spire AoE impact wave finishing Graveyard Eruption
      const expand = 1 - Math.pow(1 - Math.min(1, progress * 1.5), 3);
      const fade = progress < 0.3 ? 1 : (1 - progress) / 0.7;
      ctx.globalAlpha = fade;

      const spireCount = 12;
      for (let s = 0; s < spireCount; s++) {
        const a = (Math.PI * 2 * s) / spireCount + progress * 0.25;
        const rBase = n.radius * 0.45 * expand;
        const rTip = n.radius * (s % 2 === 0 ? 1.04 : 0.84) * expand;
        const spreadA = 0.14;

        ctx.fillStyle = s % 2 === 0 ? 'rgba(88, 28, 135, 0.78)' : 'rgba(6, 78, 59, 0.72)';
        ctx.beginPath();
        ctx.moveTo(Math.cos(a - spreadA) * rBase, Math.sin(a - spreadA) * rBase * 0.8);
        ctx.lineTo(Math.cos(a) * rTip, Math.sin(a) * rTip * 0.8 - 14 * fade);
        ctx.lineTo(Math.cos(a + spreadA) * rBase, Math.sin(a + spreadA) * rBase * 0.8);
        ctx.closePath();
        ctx.fill();

        ctx.strokeStyle = s % 2 === 0 ? '#E879F9' : '#34D399';
        ctx.lineWidth = 2 * fade;
        ctx.stroke();
      }
      break;
    }

    case 'GRAVEYARD_SOIL_HAND': {
      // Articulated pale skeletal hand bursting up through a cracked dirt mound and clawing at the air!
      const emerge =
        progress < 0.16 ? progress / 0.16 : ratio < 0.22 ? ratio / 0.22 : 1;
      const clawWave = Math.sin(time * 9 + n.seed) * 0.18;

      ctx.save();
      if (n.flip) ctx.scale(-1, 1);

      ctx.beginPath();
      ctx.rect(-24, -48, 48, 50);
      ctx.clip();

      // Broken soil mound at wrist
      ctx.fillStyle = '#475569';
      ctx.strokeStyle = '#0F172A';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.ellipse(0, 1, 9 * Math.min(1, emerge * 1.4), 3.8, 0, Math.PI, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      ctx.translate(0, (1 - emerge) * 34);
      ctx.rotate(n.angle + clawWave);

      // Radius & ulna forearm bones
      ctx.strokeStyle = '#0F172A';
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.moveTo(-1.5, 2);
      ctx.lineTo(-1, -18);
      ctx.moveTo(1.8, 2);
      ctx.lineTo(1.5, -18);
      ctx.stroke();

      ctx.strokeStyle = '#E2E8F0';
      ctx.lineWidth = 2.2;
      ctx.stroke();

      // Skeletal metacarpals & 4 bony phalanges
      ctx.translate(0, -19);
      for (let f = -1.5; f <= 1.5; f += 1) {
        const fx = f * 2.8;
        const curl = Math.sin(time * 11 + n.seed + f) * 2.2 + 2.5;
        ctx.strokeStyle = '#0F172A';
        ctx.lineWidth = 3.4;
        ctx.beginPath();
        ctx.moveTo(fx * 0.6, 0);
        ctx.quadraticCurveTo(fx * 1.2, -6, fx + curl, -11 + Math.abs(f));
        ctx.stroke();

        ctx.strokeStyle = '#F1F5F9';
        ctx.lineWidth = 1.6;
        ctx.stroke();
      }
      ctx.restore();
      break;
    }

    case 'GRAVEYARD_BONE_LASH': {
      ctx.rotate(n.angle);
      if (n.flip) ctx.scale(1, -1);
      const fade = ratio;
      ctx.globalAlpha = fade;

      for (let b = -1; b <= 1; b++) {
        const y0 = b * 9;
        ctx.fillStyle = '#3B0764';
        ctx.beginPath();
        ctx.moveTo(10, y0);
        ctx.quadraticCurveTo(n.radius * 0.55, y0 + b * 6 - 4, n.radius, y0 + b * 4);
        ctx.quadraticCurveTo(n.radius * 0.55, y0 + b * 6 + 3, 10, y0);
        ctx.fill();

        ctx.strokeStyle = b === 0 ? '#F8FAFC' : '#D8B4FE';
        ctx.lineWidth = 2.2 * fade;
        ctx.beginPath();
        ctx.moveTo(12, y0);
        ctx.quadraticCurveTo(n.radius * 0.55, y0 + b * 6, n.radius - 2, y0 + b * 4);
        ctx.stroke();
      }
      break;
    }

    case 'LORD_TRANSFORMATION_VORTEX': {
      // Swirling multi-ribbon toxic green & dark violet energy cocoon/pillars during Lord of Decay transformation
      const isBurstPhase = n.angle > 1;
      const fade = isBurstPhase ? ratio : Math.min(1, progress * 2.2);
      ctx.globalAlpha = fade;

      const ribbonCount = 5;
      for (let r = 0; r < ribbonCount; r++) {
        const spin = time * (isBurstPhase ? 9 : 12) + (Math.PI * 2 * r) / ribbonCount;
        const rad = isBurstPhase
          ? 22 + progress * (n.radius * 0.88)
          : n.radius * (1 - progress * 0.55);

        ctx.strokeStyle = r % 2 === 0 ? '#10B981' : '#C084FC';
        ctx.lineWidth = (isBurstPhase ? 8 : 5) * fade;
        ctx.lineCap = 'round';
        ctx.beginPath();
        for (let step = 0; step <= 8; step++) {
          const st = step / 8;
          const a = spin + st * 2.2;
          const rr = rad * (1 - st * 0.35);
          const px = Math.cos(a) * rr;
          const py = Math.sin(a) * rr * 0.65 - st * 34;
          if (step === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.stroke();
      }
      break;
    }

    case 'LORD_PERSISTENT_AURA': {
      // Persistent multi-layered sovereign ground sigil & swirling miasma ribbons around transformed Zombie
      const env = progress < 0.05 ? progress / 0.05 : ratio < 0.12 ? ratio / 0.12 : 1;
      ctx.translate(0, 10);
      ctx.scale(1, 0.64);
      ctx.globalAlpha = env * 0.62;

      // Counter-rotating 8-point sovereign decay star
      ctx.save();
      ctx.rotate(time * 0.9);
      ctx.fillStyle = 'rgba(6, 78, 59, 0.55)';
      ctx.strokeStyle = '#10B981';
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      for (let p = 0; p < 16; p++) {
        const a = (Math.PI * 2 * p) / 16;
        const r = p % 2 === 0 ? n.radius : n.radius * 0.64;
        if (p === 0) ctx.moveTo(Math.cos(a) * r, Math.sin(a) * r);
        else ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
      }
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.restore();

      // Inner counter-spinning violet necrotic sigil
      ctx.save();
      ctx.rotate(-time * 1.45);
      ctx.strokeStyle = '#C084FC';
      ctx.lineWidth = 2;
      for (let k = 0; k < 4; k++) {
        const a = (Math.PI * 2 * k) / 4;
        ctx.beginPath();
        ctx.moveTo(Math.cos(a) * 14, Math.sin(a) * 14);
        ctx.lineTo(Math.cos(a + 0.8) * (n.radius * 0.72), Math.sin(a + 0.8) * (n.radius * 0.72));
        ctx.stroke();
      }
      ctx.restore();
      break;
    }

    case 'IMPACT_BURST_CLAW':
    case 'IMPACT_BURST_REND':
    case 'IMPACT_BURST_PLAGUE':
    case 'IMPACT_BURST_SOUL':
    case 'IMPACT_BURST_DASH':
    case 'IMPACT_BURST_SOVEREIGN': {
      // Multi-spike directional impact starburst + cross-tear flash at point of contact (never a plain circle!)
      ctx.rotate(n.angle);
      const expand = 0.45 + progress * 0.75;
      const fade = ratio;
      ctx.globalAlpha = fade;

      const primary =
        n.kind === 'IMPACT_BURST_REND'
          ? '#84CC16'
          : n.kind === 'IMPACT_BURST_PLAGUE'
          ? '#A3E635'
          : n.kind === 'IMPACT_BURST_SOUL'
          ? '#D8B4FE'
          : n.kind === 'IMPACT_BURST_DASH'
          ? '#2DD4BF'
          : n.kind === 'IMPACT_BURST_SOVEREIGN'
          ? '#34D399'
          : '#5EEAD4';

      const spikes = n.kind === 'IMPACT_BURST_REND' || n.kind === 'IMPACT_BURST_SOVEREIGN' ? 9 : 7;
      ctx.fillStyle = '#0F172A';
      ctx.beginPath();
      for (let s = 0; s < spikes * 2; s++) {
        const a = (Math.PI * s) / spikes;
        const asym = Math.cos(a) > 0 ? 1.28 : 0.78;
        const r =
          s % 2 === 0
            ? n.radius * expand * asym * (0.85 + hash01(n.seed + s) * 0.35)
            : n.radius * 0.24 * expand;
        if (s === 0) ctx.moveTo(Math.cos(a) * r, Math.sin(a) * r);
        else ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
      }
      ctx.closePath();
      ctx.fill();

      ctx.scale(0.86, 0.86);
      ctx.fillStyle = n.isLord ? '#FEF08A' : primary;
      ctx.fill();

      ctx.scale(0.5, 0.5);
      ctx.fillStyle = '#FFFFFF';
      ctx.fill();
      break;
    }

    default: {
      if (!drawGoblinVfxNode(ctx, n, time, ratio, progress)) {
        drawSkeletonVfxNode(ctx, n, time, ratio, progress);
      }
      break;
    }
  }

  ctx.restore();
}

function drawRichParticle(ctx: CanvasRenderingContext2D, p: RichParticle): void {
  const ratio = Math.max(0, Math.min(1, p.life / p.maxLife));
  const progress = 1 - ratio;
  const curSize = p.size + (p.endSize - p.size) * progress;
  const fade = ratio < 0.28 ? ratio / 0.28 : 1;
  const drawY = p.y - p.z;

  ctx.save();

  // Subtle floor shadow for airborne physical debris, droplets & bones
  if (p.z > 3 && (p.shape === 'DIRT_CLOD' || p.shape === 'STONE_DEBRIS' || p.shape === 'TOXIC_DROPLET' || p.shape === 'BONE_FRAGMENT')) {
    ctx.fillStyle = `rgba(0, 0, 0, ${0.22 * fade})`;
    ctx.beginPath();
    ctx.ellipse(p.x, p.y + 2, curSize * 0.75, curSize * 0.35, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.globalAlpha = p.alpha * fade;
  ctx.translate(p.x, drawY);
  ctx.rotate(p.rotation);

  switch (p.shape) {
    case 'TOXIC_DROPLET': {
      ctx.fillStyle = p.secondaryColor;
      ctx.beginPath();
      ctx.moveTo(curSize * 1.4, 0);
      ctx.quadraticCurveTo(-curSize * 0.4, -curSize * 0.9, -curSize * 1.1, 0);
      ctx.quadraticCurveTo(-curSize * 0.4, curSize * 0.9, curSize * 1.4, 0);
      ctx.fill();

      ctx.fillStyle = p.color;
      ctx.scale(0.78, 0.78);
      ctx.fill();
      break;
    }

    case 'TORN_ORGANIC_SHARD': {
      ctx.fillStyle = p.color;
      ctx.strokeStyle = p.secondaryColor;
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(curSize * 1.6, 0);
      ctx.lineTo(curSize * 0.2, -curSize * 0.65);
      ctx.lineTo(-curSize * 1.4, -curSize * 0.15);
      ctx.lineTo(-curSize * 0.3, curSize * 0.65);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      break;
    }

    case 'GLOW_SPORE': {
      ctx.fillStyle = p.color;
      ctx.globalAlpha = p.alpha * fade * 0.35;
      ctx.beginPath();
      ctx.arc(0, 0, curSize * 1.7, 0, Math.PI * 2);
      ctx.fill();

      ctx.globalAlpha = p.alpha * fade;
      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath();
      ctx.arc(0, 0, curSize * 0.65, 0, Math.PI * 2);
      ctx.fill();
      break;
    }

    case 'POISON_BUBBLE': {
      ctx.fillStyle = p.secondaryColor;
      ctx.globalAlpha = p.alpha * fade * 0.32;
      ctx.beginPath();
      ctx.arc(0, 0, curSize, 0, Math.PI * 2);
      ctx.fill();

      ctx.globalAlpha = p.alpha * fade * 0.88;
      ctx.strokeStyle = p.color;
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Specular crescent highlight inside bubble
      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath();
      ctx.arc(-curSize * 0.32, -curSize * 0.32, curSize * 0.24, 0, Math.PI * 2);
      ctx.fill();
      break;
    }

    case 'VAPOR_PLUME': {
      // Multi-lobe organic cloudlet (never a single geometric circle!)
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(-curSize * 0.28, 0, curSize * 0.68, 0, Math.PI * 2);
      ctx.arc(curSize * 0.32, -curSize * 0.14, curSize * 0.56, 0, Math.PI * 2);
      ctx.arc(0, curSize * 0.24, curSize * 0.52, 0, Math.PI * 2);
      ctx.fill();
      break;
    }

    case 'DIRT_CLOD':
    case 'STONE_DEBRIS': {
      ctx.fillStyle = p.color;
      ctx.strokeStyle = p.secondaryColor;
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.moveTo(-curSize, -curSize * 0.5);
      ctx.lineTo(curSize * 0.3, -curSize);
      ctx.lineTo(curSize, -curSize * 0.2);
      ctx.lineTo(curSize * 0.6, curSize * 0.9);
      ctx.lineTo(-curSize * 0.7, curSize * 0.7);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      break;
    }

    case 'BONE_FRAGMENT': {
      ctx.strokeStyle = p.secondaryColor;
      ctx.lineWidth = 3.8;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(-curSize, 0);
      ctx.lineTo(curSize, 0);
      ctx.stroke();

      ctx.strokeStyle = p.color;
      ctx.lineWidth = 2.0;
      ctx.stroke();

      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(-curSize, -1.2, 1.8, 0, Math.PI * 2);
      ctx.arc(curSize, 1.2, 1.8, 0, Math.PI * 2);
      ctx.fill();
      break;
    }

    case 'STITCH_HEART': {
      const s = curSize * 0.26;
      ctx.fillStyle = p.color;
      ctx.strokeStyle = '#14532D';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(0, s * 2.2);
      ctx.bezierCurveTo(-s * 3.2, s * 0.2, -s * 3.2, -s * 2.4, 0, -s * 0.8);
      ctx.bezierCurveTo(s * 3.2, -s * 2.4, s * 3.2, s * 0.2, 0, s * 2.2);
      ctx.fill();
      ctx.stroke();
      break;
    }

    case 'SPECTRAL_WISP':
    case 'FLAME_TONGUE': {
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.moveTo(curSize * 1.5, 0);
      ctx.quadraticCurveTo(0, -curSize * 0.75, -curSize * 1.4, -curSize * 0.2);
      ctx.quadraticCurveTo(-curSize * 0.4, 0, -curSize * 1.4, curSize * 0.2);
      ctx.quadraticCurveTo(0, curSize * 0.75, curSize * 1.5, 0);
      ctx.fill();

      ctx.fillStyle = '#FFFFFF';
      ctx.globalAlpha = p.alpha * fade * 0.7;
      ctx.beginPath();
      ctx.arc(curSize * 0.35, 0, curSize * 0.32, 0, Math.PI * 2);
      ctx.fill();
      break;
    }

    case 'STEEL_SPARK': {
      // Needle-sharp metallic spark diamond + white-hot core!
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.moveTo(curSize * 2.1, 0);
      ctx.lineTo(0, -curSize * 0.48);
      ctx.lineTo(-curSize * 1.4, 0);
      ctx.lineTo(0, curSize * 0.48);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath();
      ctx.arc(curSize * 0.35, 0, curSize * 0.28, 0, Math.PI * 2);
      ctx.fill();
      break;
    }

    case 'FOREST_LEAF': {
      // Cute hand-drawn pointed wind leaf
      ctx.fillStyle = p.color;
      ctx.strokeStyle = p.secondaryColor;
      ctx.lineWidth = 1.1;
      ctx.beginPath();
      ctx.moveTo(curSize * 1.3, 0);
      ctx.quadraticCurveTo(0, -curSize * 0.85, -curSize * 1.2, 0);
      ctx.quadraticCurveTo(0, curSize * 0.85, curSize * 1.3, 0);
      ctx.fill();
      ctx.stroke();
      break;
    }
  }

  ctx.restore();
}
