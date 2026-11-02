import {
  pushNode,
  pushRichParticle,
  VFXNode,
  VFXState,
} from './VFXSystem';

function hash01(seed: number): number {
  const s = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
  return s - Math.floor(s);
}

// ============================================================================
// STAGE 1: SKELETON ANTICIPATION / PREPARATION EMITTERS
// ============================================================================

export function emitSkeletonAnticipationVfx(
  state: VFXState,
  abilityId: string,
  x: number,
  y: number,
  aimAngle: number,
  isColossus: boolean
): void {
  if (abilityId === 'skeleton_bone_strike') {
    const hiltAngle = aimAngle - 1.05;
    const scale = isColossus ? 1.45 : 1.0;
    const bx = x + Math.cos(hiltAngle) * 18 * scale;
    const by = y + Math.sin(hiltAngle) * 16 * scale;
    pushRichParticle(state, {
      x: bx + (Math.random() - 0.5) * 8,
      y: by + (Math.random() - 0.5) * 8,
      z: 10 * scale,
      vx: Math.cos(aimAngle) * 24,
      vy: Math.sin(aimAngle) * 24,
      vz: 16,
      gravity: 0,
      drag: 3.2,
      size: isColossus ? 5.2 : 3.6,
      endSize: 0.8,
      rotation: aimAngle + 0.4,
      vRot: 7,
      life: 0.14,
      maxLife: 0.14,
      color: isColossus ? '#38BDF8' : '#F8FAFC',
      secondaryColor: '#0EA5E9',
      alpha: 0.92,
      shape: 'BONE_FRAGMENT',
      layer: 'OVER',
      bounceFactor: 0,
    });
    return;
  }

  switch (abilityId) {
    case 'skeleton_bone_slash': {
      // Blade drawn back behind shoulder: ivory bone shards & cyan wind ribbons converge along blade edge
      const backA = aimAngle - 1.45;
      const bladeX = x + Math.cos(backA) * 22;
      const bladeY = y + Math.sin(backA) * 18;
      for (let i = 0; i < 2; i++) {
        const srcA = backA + (Math.random() - 0.5) * 1.3;
        const dist = 18 + Math.random() * 18;
        pushRichParticle(state, {
          x: bladeX + Math.cos(srcA) * dist,
          y: bladeY + Math.sin(srcA) * dist,
          z: 8 + Math.random() * 10,
          vx: 0,
          vy: 0,
          vz: 0,
          gravity: 0,
          drag: 0,
          size: 4.2 + Math.random() * 2,
          endSize: 1.4,
          rotation: srcA,
          vRot: 9,
          life: 0.16,
          maxLife: 0.16,
          color: i === 0 ? '#F8FAFC' : '#38BDF8',
          secondaryColor: '#0284C7',
          alpha: 0.94,
          shape: i === 0 ? 'BONE_FRAGMENT' : 'SPECTRAL_WISP',
          layer: 'OVER',
          bounceFactor: 0,
          convergeToX: bladeX,
          convergeToY: bladeY,
        });
      }
      // Braced heel stone dust
      pushRichParticle(state, {
        x: x - Math.cos(aimAngle) * 11,
        y: y + 11,
        z: 1,
        vx: -Math.cos(aimAngle) * 34,
        vy: -Math.sin(aimAngle) * 24,
        vz: 32,
        gravity: 210,
        drag: 2.5,
        size: 5,
        endSize: 9.5,
        rotation: Math.random() * 6,
        vRot: 2,
        life: 0.24,
        maxLife: 0.24,
        color: '#CBD5E1',
        secondaryColor: '#475569',
        alpha: 0.52,
        shape: 'VAPOR_PLUME',
        layer: 'UNDER',
        bounceFactor: 0,
      });
      break;
    }

    case 'skeleton_bone_spear': {
      // Bone fragments spiral inward and assemble into a barbed javelin in Skeleton's raised hand
      const handX = x + Math.cos(aimAngle - 0.45) * 18;
      const handY = y + Math.sin(aimAngle - 0.45) * 14 - 8;
      const hasAssembly = state.nodes.some(
        (n) => n.kind === 'SKEL_SPEAR_ASSEMBLY' && n.life > 0.04
      );
      if (!hasAssembly) {
        pushNode(state, {
          kind: 'SKEL_SPEAR_ASSEMBLY',
          layer: 'OVER',
          x: handX,
          y: handY,
          angle: aimAngle,
          radius: 34,
          life: 0.2,
          maxLife: 0.2,
          seed: Math.random() * 100,
        });
      }
      for (let i = 0; i < 3; i++) {
        const a = Math.random() * Math.PI * 2;
        const dist = 22 + Math.random() * 20;
        pushRichParticle(state, {
          x: handX + Math.cos(a) * dist,
          y: handY + Math.sin(a) * dist,
          z: 10 + Math.random() * 10,
          vx: 0,
          vy: 0,
          vz: 0,
          gravity: 0,
          drag: 0,
          size: 4.5,
          endSize: 1.5,
          rotation: aimAngle,
          vRot: 12,
          life: 0.16,
          maxLife: 0.16,
          color: '#F1F5F9',
          secondaryColor: '#38BDF8',
          alpha: 0.95,
          shape: 'BONE_FRAGMENT',
          layer: 'OVER',
          bounceFactor: 0,
          convergeToX: handX,
          convergeToY: handY,
        });
      }
      break;
    }

    case 'skeleton_ribcage_shield': {
      // Ribs glow cyan-ivory and detach outward from Skeleton's torso
      for (const side of [-1, 1]) {
        const ribA = side * (0.6 + Math.random() * 0.9);
        pushRichParticle(state, {
          x: x + side * 6,
          y: y - 4,
          z: 8,
          vx: Math.cos(ribA) * 58,
          vy: Math.sin(ribA) * 42,
          vz: 24,
          gravity: 60,
          drag: 3.2,
          size: 5,
          endSize: 2.5,
          rotation: ribA,
          vRot: side * 6,
          life: 0.2,
          maxLife: 0.2,
          color: '#F8FAFC',
          secondaryColor: '#38BDF8',
          alpha: 0.92,
          shape: 'BONE_FRAGMENT',
          layer: 'OVER',
          bounceFactor: 0,
        });
      }
      break;
    }

    case 'skeleton_skeletal_rush': {
      // Crouched sprint stance: wind plumes + floor pebbles kicking backward
      const backA = aimAngle + Math.PI;
      for (let i = 0; i < 2; i++) {
        const sp = backA + (Math.random() - 0.5) * 0.8;
        pushRichParticle(state, {
          x: x + (Math.random() - 0.5) * 10,
          y: y + 10,
          z: 2,
          vx: Math.cos(sp) * (55 + Math.random() * 45),
          vy: Math.sin(sp) * (45 + Math.random() * 35),
          vz: 28 + Math.random() * 25,
          gravity: 240,
          drag: 2.2,
          size: i === 0 ? 4.2 : 6.5,
          endSize: i === 0 ? 2 : 12,
          rotation: sp,
          vRot: 6,
          life: 0.22,
          maxLife: 0.22,
          color: i === 0 ? '#E2E8F0' : '#38BDF8',
          secondaryColor: '#1E293B',
          alpha: i === 0 ? 0.9 : 0.55,
          shape: i === 0 ? 'STONE_DEBRIS' : 'VAPOR_PLUME',
          layer: 'UNDER',
          bounceFactor: 0.3,
        });
      }
      break;
    }

    case 'skeleton_bone_storm': {
      // Loose bone fragments rattle up off the floor around Skeleton before launching into orbit
      for (let i = 0; i < 3; i++) {
        const a = Math.random() * Math.PI * 2;
        const r = 36 + Math.random() * 34;
        pushRichParticle(state, {
          x: x + Math.cos(a) * r,
          y: y + Math.sin(a) * r * 0.78,
          z: 2,
          vx: -Math.sin(a) * 65,
          vy: Math.cos(a) * 50,
          vz: 68 + Math.random() * 35,
          gravity: 140,
          drag: 1.8,
          size: 5.2,
          endSize: 3.6,
          rotation: a,
          vRot: 11,
          life: 0.24,
          maxLife: 0.24,
          color: '#F8FAFC',
          secondaryColor: '#38BDF8',
          alpha: 0.95,
          shape: 'BONE_FRAGMENT',
          layer: 'OVER',
          bounceFactor: 0,
        });
      }
      break;
    }

    case 'skeleton_ult_bone_colossus': {
      // Ground cracks & heavy ancient bones erupt from soil and magnetize directly into Skeleton's frame!
      for (let i = 0; i < 4; i++) {
        const a = Math.random() * Math.PI * 2;
        const r = 56 + Math.random() * 38;
        const isBone = i < 3;
        pushRichParticle(state, {
          x: x + Math.cos(a) * r,
          y: y + Math.sin(a) * r * 0.76,
          z: 3 + Math.random() * 18,
          vx: 0,
          vy: 0,
          vz: 45,
          gravity: 0,
          drag: 0,
          size: isBone ? 6.8 : 5.5,
          endSize: isBone ? 3.2 : 1.5,
          rotation: a,
          vRot: 9,
          life: 0.28,
          maxLife: 0.28,
          color: isBone ? '#F8FAFC' : '#38BDF8',
          secondaryColor: '#0284C7',
          alpha: 0.96,
          shape: isBone ? 'BONE_FRAGMENT' : 'SPECTRAL_WISP',
          layer: 'OVER',
          bounceFactor: 0,
          convergeToX: x,
          convergeToY: y - 10,
        });
      }
      break;
    }

    case 'skeleton_ult_army_of_bones': {
      // Necromantic command ripples & turquoise soul wisps rise from beneath Skeleton
      for (let i = 0; i < 3; i++) {
        const a = Math.random() * Math.PI * 2;
        const r = 24 + Math.random() * 52;
        pushRichParticle(state, {
          x: x + Math.cos(a) * r,
          y: y + Math.sin(a) * r * 0.75,
          z: 2,
          vx: (Math.random() - 0.5) * 18,
          vy: -18,
          vz: 52 + Math.random() * 28,
          gravity: -15,
          drag: 1.6,
          size: 5.5,
          endSize: 1.4,
          rotation: -Math.PI / 2,
          vRot: 5,
          life: 0.3,
          maxLife: 0.3,
          color: i % 2 === 0 ? '#38BDF8' : '#E2E8F0',
          secondaryColor: '#0F172A',
          alpha: 0.9,
          shape: i % 2 === 0 ? 'SPECTRAL_WISP' : 'BONE_FRAGMENT',
          layer: 'OVER',
          bounceFactor: 0,
        });
      }
      break;
    }

    case 'skeleton_ult_reapers_judgment': {
      // Spectral indigo & cyan fragments materialize and converge behind Skeleton to form the giant Scythe!
      const scytheHubX = x - Math.cos(aimAngle) * 20;
      const scytheHubY = y - Math.sin(aimAngle) * 16 - 12;
      for (let i = 0; i < 4; i++) {
        const a = Math.random() * Math.PI * 2;
        const dist = 42 + Math.random() * 32;
        pushRichParticle(state, {
          x: scytheHubX + Math.cos(a) * dist,
          y: scytheHubY + Math.sin(a) * dist * 0.8,
          z: 10 + Math.random() * 14,
          vx: 0,
          vy: 0,
          vz: 0,
          gravity: 0,
          drag: 0,
          size: 6.2,
          endSize: 1.8,
          rotation: a,
          vRot: 8,
          life: 0.24,
          maxLife: 0.24,
          color: i % 2 === 0 ? '#38BDF8' : '#818CF8',
          secondaryColor: '#1E1B4B',
          alpha: 0.95,
          shape: i % 2 === 0 ? 'SPECTRAL_WISP' : 'FLAME_TONGUE',
          layer: 'OVER',
          bounceFactor: 0,
          convergeToX: scytheHubX,
          convergeToY: scytheHubY,
        });
      }
      break;
    }
  }
}

// ============================================================================
// STAGE 2-5: SKELETON EXECUTION, IMPACT, SECONDARY & DISSIPATION SPAWNERS
// ============================================================================

/**
 * Skeleton Basic Attack: Bone Strike (3-Step Swordsmanship OR Bone Colossus Heavy Greatsword Cleave)
 */
export function spawnSkeletonBasicStrikeVfx(
  state: VFXState,
  x: number,
  y: number,
  angle: number,
  range: number,
  comboStep: number,
  isColossus: boolean
): void {
  const flip = comboStep % 2 === 1;
  if (isColossus) {
    pushNode(state, {
      kind: 'SKEL_DARK_GROUND_WAKE',
      layer: 'UNDER',
      x,
      y: y + 6,
      angle,
      radius: range * 1.06,
      life: 0.55,
      maxLife: 0.55,
      seed: Math.random() * 100,
      flip,
    });
    pushNode(state, {
      kind: 'SKEL_COLOSSUS_CLEAVE',
      layer: 'OVER',
      x,
      y,
      angle,
      radius: range * 1.08,
      life: 0.3,
      maxLife: 0.3,
      seed: Math.random() * 100 + comboStep * 13,
      flip,
      isLord: true,
    });
  } else {
    pushNode(state, {
      kind: 'SKEL_BASIC_BLADE_ARC',
      layer: 'OVER',
      x,
      y,
      angle,
      radius: range,
      life: 0.22,
      maxLife: 0.22,
      seed: Math.random() * 100 + comboStep * 17,
      flip,
    });
  }

  // Bone fragments & sharp steel-ivory dust flung off the serrated bone edge
  const count = isColossus ? 12 : 6;
  for (let i = 0; i < count; i++) {
    const spread = angle + (Math.random() - 0.5) * (isColossus ? 1.55 : 1.15);
    const r = range * (0.45 + Math.random() * 0.55);
    const isBone = i % 2 === 0;
    pushRichParticle(state, {
      x: x + Math.cos(spread) * r,
      y: y + Math.sin(spread) * r,
      z: 8 + Math.random() * 10,
      vx: Math.cos(spread) * (65 + Math.random() * 95),
      vy: Math.sin(spread) * (65 + Math.random() * 95),
      vz: 40 + Math.random() * 55,
      gravity: isBone ? 340 : 40,
      drag: 2.5,
      size: isColossus ? 5.8 : 3.8,
      endSize: 1.0,
      rotation: spread,
      vRot: (Math.random() - 0.5) * 14,
      life: 0.26 + Math.random() * 0.14,
      maxLife: 0.4,
      color: isBone ? '#F8FAFC' : '#38BDF8',
      secondaryColor: '#0F172A',
      alpha: 0.94,
      shape: isBone ? 'BONE_FRAGMENT' : 'SPECTRAL_WISP',
      layer: 'OVER',
      bounceFactor: 0.35,
    });
  }
}

/**
 * Normal Skill 1: Bone Slash — Wide directional multi-layered physical cleave + bone dust + flying shards
 */
export function spawnBoneSlashVfx(
  state: VFXState,
  x: number,
  y: number,
  angle: number,
  range: number,
  isColossus: boolean
): void {
  const effectiveR = range * (isColossus ? 1.18 : 1.0);
  // UNDER: Carved stone trench & dust wake beneath the wide sword arc
  pushNode(state, {
    kind: 'SKEL_DARK_GROUND_WAKE',
    layer: 'UNDER',
    x,
    y: y + 6,
    angle,
    radius: effectiveR,
    life: 0.65,
    maxLife: 0.65,
    seed: Math.random() * 100,
  });

  // OVER: Multi-ribbon serrated ivory blade wave + secondary cross-cut trail + wind shear
  pushNode(state, {
    kind: 'SKEL_BONE_SLASH_ARC',
    layer: 'OVER',
    x,
    y,
    angle,
    radius: effectiveR,
    life: 0.34,
    maxLife: 0.34,
    seed: Math.random() * 100,
    isLord: isColossus,
  });

  // Flying bone shards & billowing ivory-dust plumes along the arc
  for (let i = 0; i < 14; i++) {
    const t = i / 13 - 0.5;
    const arcA = angle + t * 1.65;
    const dist = effectiveR * (0.55 + Math.random() * 0.48);
    const isDust = i % 3 === 0;
    pushRichParticle(state, {
      x: x + Math.cos(arcA) * dist,
      y: y + Math.sin(arcA) * dist,
      z: isDust ? 4 : 10,
      vx: Math.cos(arcA) * (85 + Math.random() * 110),
      vy: Math.sin(arcA) * (85 + Math.random() * 110),
      vz: isDust ? 28 : 65 + Math.random() * 55,
      gravity: isDust ? -10 : 350,
      drag: 2.2,
      size: isDust ? 7.5 : 5.0,
      endSize: isDust ? 15 : 1.4,
      rotation: arcA,
      vRot: (Math.random() - 0.5) * 14,
      life: 0.36 + Math.random() * 0.16,
      maxLife: 0.52,
      color: isDust ? '#CBD5E1' : i % 2 === 0 ? '#F8FAFC' : '#38BDF8',
      secondaryColor: '#1E293B',
      alpha: isDust ? 0.56 : 0.95,
      shape: isDust ? 'VAPOR_PLUME' : 'BONE_FRAGMENT',
      layer: isDust ? 'UNDER' : 'OVER',
      bounceFactor: isDust ? 0 : 0.38,
    });
  }
}

/**
 * Normal Skill 2: Bone Spear — Launch burst, mid-flight pierce splinters, and max-range shatter
 */
export function spawnBoneSpearLaunchVfx(
  state: VFXState,
  x: number,
  y: number,
  angle: number
): void {
  const muzzleX = x + Math.cos(angle) * 22;
  const muzzleY = y + Math.sin(angle) * 22;
  for (let i = 0; i < 10; i++) {
    const spread = angle + (Math.random() - 0.5) * 1.1;
    const isVapor = i < 4;
    pushRichParticle(state, {
      x: muzzleX,
      y: muzzleY,
      z: 10,
      vx: Math.cos(spread) * (isVapor ? 65 : 135 + Math.random() * 80),
      vy: Math.sin(spread) * (isVapor ? 65 : 135 + Math.random() * 80),
      vz: 36 + Math.random() * 36,
      gravity: isVapor ? -10 : 280,
      drag: 2.6,
      size: isVapor ? 7 : 4.2,
      endSize: isVapor ? 14 : 1.2,
      rotation: spread,
      vRot: 10,
      life: 0.28 + Math.random() * 0.12,
      maxLife: 0.4,
      color: isVapor ? '#BAE6FD' : '#F8FAFC',
      secondaryColor: '#0284C7',
      alpha: isVapor ? 0.6 : 0.95,
      shape: isVapor ? 'VAPOR_PLUME' : 'BONE_FRAGMENT',
      layer: 'OVER',
      bounceFactor: 0.3,
    });
  }
}

export function spawnBoneSpearPierceVfx(
  state: VFXState,
  x: number,
  y: number,
  angle: number,
  isCrit: boolean
): void {
  pushNode(state, {
    kind: isCrit ? 'IMPACT_BURST_CRIT_SHATTER' : 'IMPACT_BURST_BONE',
    layer: 'OVER',
    x,
    y,
    angle,
    radius: isCrit ? 46 : 34,
    life: 0.26,
    maxLife: 0.26,
    seed: Math.random() * 100,
    isLord: isCrit,
  });

  // Forward-spraying pierced bone splinters
  for (let i = 0; i < 8; i++) {
    const sp = angle + (Math.random() - 0.5) * 1.15;
    pushRichParticle(state, {
      x,
      y,
      z: 10,
      vx: Math.cos(sp) * (110 + Math.random() * 120),
      vy: Math.sin(sp) * (110 + Math.random() * 120),
      vz: 48 + Math.random() * 55,
      gravity: 340,
      drag: 2.3,
      size: 4.6,
      endSize: 1.2,
      rotation: sp,
      vRot: (Math.random() - 0.5) * 16,
      life: 0.3 + Math.random() * 0.12,
      maxLife: 0.42,
      color: i % 2 === 0 ? '#F8FAFC' : '#38BDF8',
      secondaryColor: '#0F172A',
      alpha: 0.96,
      shape: 'BONE_FRAGMENT',
      layer: 'OVER',
      bounceFactor: 0.35,
    });
  }
}

export function spawnBoneSpearShatterVfx(
  state: VFXState,
  x: number,
  y: number,
  angle: number
): void {
  pushNode(state, {
    kind: 'SKEL_SPEAR_SHATTER',
    layer: 'OVER',
    x,
    y,
    angle,
    radius: 44,
    life: 0.34,
    maxLife: 0.34,
    seed: Math.random() * 100,
  });

  for (let i = 0; i < 12; i++) {
    const a = (Math.PI * 2 * i) / 12 + (Math.random() - 0.5) * 0.3;
    const spd = 65 + Math.random() * 115;
    pushRichParticle(state, {
      x,
      y,
      z: 10,
      vx: Math.cos(a) * spd,
      vy: Math.sin(a) * spd,
      vz: 65 + Math.random() * 65,
      gravity: 390,
      drag: 2.0,
      size: 5.2,
      endSize: 1.8,
      rotation: a,
      vRot: (Math.random() - 0.5) * 16,
      life: 0.42 + Math.random() * 0.18,
      maxLife: 0.6,
      color: i % 3 === 0 ? '#38BDF8' : '#F8FAFC',
      secondaryColor: '#1E293B',
      alpha: 0.95,
      shape: i % 4 === 0 ? 'VAPOR_PLUME' : 'BONE_FRAGMENT',
      layer: 'OVER',
      bounceFactor: 0.42,
    });
  }
}

/**
 * Normal Skill 3: Ribcage Shield — Activation, Blocked-Attack Sparks, and Inward Reassembly
 */
export function spawnRibcageShieldActivateVfx(
  state: VFXState,
  x: number,
  y: number,
  duration: number
): void {
  pushNode(state, {
    kind: 'SKEL_RIBCAGE_AEGIS',
    layer: 'UNDER',
    x,
    y,
    angle: 0,
    radius: 42,
    life: duration,
    maxLife: duration,
    seed: Math.random() * 100,
    followPlayer: true,
  });

  for (let i = 0; i < 10; i++) {
    const a = (Math.PI * 2 * i) / 10;
    pushRichParticle(state, {
      x: x + Math.cos(a) * 14,
      y: y + Math.sin(a) * 10,
      z: 10,
      vx: Math.cos(a) * 75,
      vy: Math.sin(a) * 58,
      vz: 36,
      gravity: 120,
      drag: 2.8,
      size: 4.5,
      endSize: 1.5,
      rotation: a,
      vRot: 8,
      life: 0.32,
      maxLife: 0.32,
      color: i % 2 === 0 ? '#F8FAFC' : '#38BDF8',
      secondaryColor: '#0284C7',
      alpha: 0.92,
      shape: i % 2 === 0 ? 'BONE_FRAGMENT' : 'SPECTRAL_WISP',
      layer: 'OVER',
      bounceFactor: 0,
    });
  }
}

export function spawnRibcageShieldBlockVfx(
  state: VFXState,
  x: number,
  y: number,
  impactAngle: number
): void {
  const hitX = x + Math.cos(impactAngle) * 26;
  const hitY = y + Math.sin(impactAngle) * 22;
  pushNode(state, {
    kind: 'PASSIVE_GUARD_FLASH',
    layer: 'OVER',
    x: hitX,
    y: hitY,
    angle: impactAngle,
    radius: 32,
    life: 0.24,
    maxLife: 0.24,
    seed: Math.random() * 100,
  });

  for (let i = 0; i < 8; i++) {
    const sp = impactAngle + (Math.random() - 0.5) * 1.5;
    pushRichParticle(state, {
      x: hitX,
      y: hitY,
      z: 12,
      vx: Math.cos(sp) * (85 + Math.random() * 95),
      vy: Math.sin(sp) * (85 + Math.random() * 95),
      vz: 50 + Math.random() * 45,
      gravity: 300,
      drag: 2.4,
      size: 4.4,
      endSize: 1.0,
      rotation: sp,
      vRot: 14,
      life: 0.28,
      maxLife: 0.28,
      color: i % 2 === 0 ? '#38BDF8' : '#FEF08A',
      secondaryColor: '#0F172A',
      alpha: 0.96,
      shape: i % 3 === 0 ? 'BONE_FRAGMENT' : 'SPECTRAL_WISP',
      layer: 'OVER',
      bounceFactor: 0.3,
    });
  }
}

export function spawnRibcageShieldEndVfx(
  state: VFXState,
  x: number,
  y: number,
  shattered: boolean
): void {
  // Remove lingering ground aura node early if shattered
  if (shattered) {
    for (const n of state.nodes) {
      if (n.kind === 'SKEL_RIBCAGE_AEGIS') {
        n.life = Math.min(n.life, 0.08);
      }
    }
  }

  for (let i = 0; i < 8; i++) {
    const a = (Math.PI * 2 * i) / 8;
    const startX = x + Math.cos(a) * 32;
    const startY = y + Math.sin(a) * 24;
    pushRichParticle(state, {
      x: startX,
      y: startY,
      z: 10,
      vx: shattered ? Math.cos(a) * 95 : 0,
      vy: shattered ? Math.sin(a) * 75 : 0,
      vz: shattered ? 55 : 10,
      gravity: shattered ? 340 : 0,
      drag: 2.0,
      size: 4.8,
      endSize: 1.8,
      rotation: a,
      vRot: 9,
      life: 0.28,
      maxLife: 0.28,
      color: '#F8FAFC',
      secondaryColor: '#38BDF8',
      alpha: 0.92,
      shape: 'BONE_FRAGMENT',
      layer: 'OVER',
      bounceFactor: 0.35,
      convergeToX: shattered ? undefined : x,
      convergeToY: shattered ? undefined : y - 4,
    });
  }
}

/**
 * Normal Skill 4: Skeletal Rush — Articulated Skeletal Afterimages + Dust + Final Cross-Cut Burst
 */
export function spawnSkeletalRushStepVfx(
  state: VFXState,
  x: number,
  y: number,
  angle: number,
  stepIdx: number,
  isColossus: boolean
): void {
  pushNode(state, {
    kind: 'SKEL_RUSH_AFTERIMAGE',
    layer: 'OVER',
    x,
    y,
    angle,
    radius: isColossus ? 32 : 24,
    life: 0.26 + stepIdx * 0.03,
    maxLife: 0.26 + stepIdx * 0.03,
    seed: stepIdx * 17.3,
    isLord: isColossus,
  });

  const backA = angle + Math.PI;
  for (let i = 0; i < 3; i++) {
    const sp = backA + (Math.random() - 0.5) * 0.95;
    const isDust = i === 0;
    pushRichParticle(state, {
      x: x + (Math.random() - 0.5) * 14,
      y: y + (Math.random() - 0.5) * 12,
      z: 6,
      vx: Math.cos(sp) * (45 + Math.random() * 65),
      vy: Math.sin(sp) * (45 + Math.random() * 65),
      vz: isDust ? 22 : 52,
      gravity: isDust ? -8 : 300,
      drag: 2.3,
      size: isDust ? 7.5 : 4.2,
      endSize: isDust ? 15 : 1.2,
      rotation: sp,
      vRot: 10,
      life: 0.32,
      maxLife: 0.32,
      color: isDust ? '#CBD5E1' : i === 1 ? '#F8FAFC' : '#38BDF8',
      secondaryColor: '#0F172A',
      alpha: isDust ? 0.55 : 0.92,
      shape: isDust ? 'VAPOR_PLUME' : 'BONE_FRAGMENT',
      layer: isDust ? 'UNDER' : 'OVER',
      bounceFactor: 0.3,
    });
  }
}

export function spawnSkeletalRushFinishVfx(
  state: VFXState,
  x: number,
  y: number,
  angle: number,
  isColossus: boolean
): void {
  pushNode(state, {
    kind: 'SKEL_RUSH_CROSS_FINISH',
    layer: 'OVER',
    x: x + Math.cos(angle) * 20,
    y: y + Math.sin(angle) * 20,
    angle,
    radius: isColossus ? 66 : 52,
    life: 0.3,
    maxLife: 0.3,
    seed: Math.random() * 100,
    isLord: isColossus,
  });
}

/**
 * Normal Skill 5: Bone Storm — Swirling Ground Vortex + Deflection Sparks + Scatter End
 */
export function spawnBoneStormActivateVfx(
  state: VFXState,
  x: number,
  y: number,
  duration: number
): void {
  pushNode(state, {
    kind: 'SKEL_BONE_STORM_VORTEX',
    layer: 'UNDER',
    x,
    y,
    angle: 0,
    radius: 86,
    life: duration,
    maxLife: duration,
    seed: Math.random() * 100,
    followPlayer: true,
  });

  for (let i = 0; i < 12; i++) {
    const a = (Math.PI * 2 * i) / 12;
    pushRichParticle(state, {
      x: x + Math.cos(a) * 30,
      y: y + Math.sin(a) * 24,
      z: 8,
      vx: -Math.sin(a) * 110,
      vy: Math.cos(a) * 85,
      vz: 42,
      gravity: 80,
      drag: 2.0,
      size: 4.8,
      endSize: 1.6,
      rotation: a,
      vRot: 12,
      life: 0.38,
      maxLife: 0.38,
      color: i % 2 === 0 ? '#F8FAFC' : '#38BDF8',
      secondaryColor: '#0284C7',
      alpha: 0.92,
      shape: i % 2 === 0 ? 'BONE_FRAGMENT' : 'SPECTRAL_WISP',
      layer: 'OVER',
      bounceFactor: 0,
    });
  }
}

export function spawnBoneStormEndVfx(state: VFXState, x: number, y: number): void {
  for (let i = 0; i < 10; i++) {
    const a = (Math.PI * 2 * i) / 10 + Math.random() * 0.25;
    pushRichParticle(state, {
      x: x + Math.cos(a) * 68,
      y: y + Math.sin(a) * 52,
      z: 12,
      vx: Math.cos(a) * (75 + Math.random() * 65),
      vy: Math.sin(a) * (60 + Math.random() * 55),
      vz: 50 + Math.random() * 35,
      gravity: 360,
      drag: 1.9,
      size: 5.2,
      endSize: 1.8,
      rotation: a,
      vRot: 12,
      life: 0.45,
      maxLife: 0.45,
      color: '#F8FAFC',
      secondaryColor: '#334155',
      alpha: 0.92,
      shape: 'BONE_FRAGMENT',
      layer: 'OVER',
      bounceFactor: 0.4,
    });
  }
}

/**
 * Ultimate 1: Bone Colossus — Ascension Impact Shockwave + Persistent Aura + Disassembly Cascade
 */
export function spawnBoneColossusTransformVfx(
  state: VFXState,
  x: number,
  y: number,
  duration: number
): void {
  // UNDER: Cracked stone shockwave crater
  pushNode(state, {
    kind: 'SKEL_COLOSSUS_ASCENSION',
    layer: 'UNDER',
    x,
    y: y + 6,
    angle: 0,
    radius: 145,
    life: 0.85,
    maxLife: 0.85,
    seed: Math.random() * 100,
  });

  // UNDER: Persistent Bone Colossus sovereign runic aura following Skeleton
  pushNode(state, {
    kind: 'SKEL_COLOSSUS_AURA',
    layer: 'UNDER',
    x,
    y,
    angle: 0,
    radius: 62,
    life: duration,
    maxLife: duration,
    seed: Math.random() * 100,
    followPlayer: true,
  });

  // Bursting bone armor plates, stone rubble & cyan soul-fire tongues
  for (let i = 0; i < 24; i++) {
    const a = (Math.PI * 2 * i) / 24 + (Math.random() - 0.5) * 0.2;
    const spd = 85 + Math.random() * 140;
    const mode = i % 3;
    pushRichParticle(state, {
      x: x + Math.cos(a) * 16,
      y: y + Math.sin(a) * 12,
      z: 10,
      vx: Math.cos(a) * spd,
      vy: Math.sin(a) * spd * 0.8,
      vz: 85 + Math.random() * 85,
      gravity: mode === 2 ? -20 : 380,
      drag: 2.0,
      size: mode === 0 ? 6.2 : mode === 1 ? 5.2 : 6.8,
      endSize: 1.6,
      rotation: a,
      vRot: (Math.random() - 0.5) * 12,
      life: 0.52 + Math.random() * 0.2,
      maxLife: 0.72,
      color: mode === 0 ? '#F8FAFC' : mode === 1 ? '#64748B' : '#38BDF8',
      secondaryColor: '#0F172A',
      alpha: 0.95,
      shape: mode === 0 ? 'BONE_FRAGMENT' : mode === 1 ? 'STONE_DEBRIS' : 'FLAME_TONGUE',
      layer: 'OVER',
      bounceFactor: mode === 2 ? 0 : 0.38,
    });
  }
}

export function spawnBoneColossusEndVfx(state: VFXState, x: number, y: number): void {
  for (let i = 0; i < 18; i++) {
    const a = (Math.PI * 2 * i) / 18 + Math.random() * 0.2;
    const isWisp = i % 3 === 0;
    pushRichParticle(state, {
      x: x + (Math.random() - 0.5) * 24,
      y: y + (Math.random() - 0.5) * 18,
      z: 18 + Math.random() * 18,
      vx: Math.cos(a) * (45 + Math.random() * 75),
      vy: Math.sin(a) * (38 + Math.random() * 60),
      vz: 45 + Math.random() * 45,
      gravity: isWisp ? -15 : 370,
      drag: 1.9,
      size: isWisp ? 6 : 5.8,
      endSize: 1.8,
      rotation: a,
      vRot: (Math.random() - 0.5) * 12,
      life: 0.55,
      maxLife: 0.55,
      color: isWisp ? '#38BDF8' : '#F8FAFC',
      secondaryColor: '#1E293B',
      alpha: 0.92,
      shape: isWisp ? 'SPECTRAL_WISP' : 'BONE_FRAGMENT',
      layer: 'OVER',
      bounceFactor: isWisp ? 0 : 0.42,
    });
  }
}

/**
 * Ultimate 2: Army of Bones — Cracked Earth Summon Zones + Warrior Sword Slash + Bone Collapse
 */
export function spawnArmyOfBonesSummonVfx(
  state: VFXState,
  x: number,
  y: number
): void {
  pushNode(state, {
    kind: 'SKEL_ARMY_SUMMON_SIGIL',
    layer: 'UNDER',
    x,
    y: y + 6,
    angle: 0,
    radius: 38,
    life: 1.35,
    maxLife: 1.35,
    seed: Math.random() * 100,
  });

  // Dirt clods & flying bone pieces assembling into the rising Skeletal Warrior
  for (let i = 0; i < 10; i++) {
    const a = (Math.PI * 2 * i) / 10 + Math.random() * 0.3;
    const isBone = i >= 5;
    pushRichParticle(state, {
      x: x + Math.cos(a) * (isBone ? 28 : 8),
      y: y + Math.sin(a) * (isBone ? 22 : 6),
      z: 3,
      vx: isBone ? 0 : Math.cos(a) * (40 + Math.random() * 45),
      vy: isBone ? 0 : Math.sin(a) * (32 + Math.random() * 36),
      vz: isBone ? 30 : 85 + Math.random() * 55,
      gravity: isBone ? 0 : 410,
      drag: 1.8,
      size: isBone ? 4.8 : 4.4,
      endSize: 2.0,
      rotation: a,
      vRot: 10,
      life: isBone ? 0.36 : 0.48,
      maxLife: 0.48,
      color: isBone ? '#F8FAFC' : '#57534E',
      secondaryColor: isBone ? '#38BDF8' : '#1C1917',
      alpha: 0.94,
      shape: isBone ? 'BONE_FRAGMENT' : 'DIRT_CLOD',
      layer: 'OVER',
      bounceFactor: isBone ? 0 : 0.36,
      convergeToX: isBone ? x : undefined,
      convergeToY: isBone ? y - 6 : undefined,
    });
  }
}

export function spawnSkeletonWarriorSlashVfx(
  state: VFXState,
  x: number,
  y: number,
  angle: number
): void {
  pushNode(state, {
    kind: 'SKEL_BASIC_BLADE_ARC',
    layer: 'OVER',
    x,
    y,
    angle,
    radius: 38,
    life: 0.18,
    maxLife: 0.18,
    seed: Math.random() * 100,
  });
}

export function spawnSkeletonWarriorDissolveVfx(
  state: VFXState,
  x: number,
  y: number
): void {
  for (let i = 0; i < 10; i++) {
    const a = (Math.PI * 2 * i) / 10 + Math.random() * 0.3;
    const isSoul = i % 3 === 0;
    pushRichParticle(state, {
      x: x + (Math.random() - 0.5) * 12,
      y: y + (Math.random() - 0.5) * 10,
      z: 10,
      vx: Math.cos(a) * (42 + Math.random() * 58),
      vy: Math.sin(a) * (34 + Math.random() * 48),
      vz: 48 + Math.random() * 42,
      gravity: isSoul ? -18 : 380,
      drag: 2.0,
      size: 4.6,
      endSize: 1.5,
      rotation: a,
      vRot: 12,
      life: 0.46,
      maxLife: 0.46,
      color: isSoul ? '#38BDF8' : '#F1F5F9',
      secondaryColor: '#0F172A',
      alpha: 0.92,
      shape: isSoul ? 'SPECTRAL_WISP' : 'BONE_FRAGMENT',
      layer: 'OVER',
      bounceFactor: isSoul ? 0 : 0.4,
    });
  }
}

/**
 * Ultimate 3: Reaper's Judgment — Giant Spectral Scythe Sweep + Dark Harvest Ground Wake
 */
export function spawnReapersJudgmentSweepVfx(
  state: VFXState,
  x: number,
  y: number,
  angle: number,
  range: number
): void {
  pushNode(state, {
    kind: 'SKEL_DARK_GROUND_WAKE',
    layer: 'UNDER',
    x,
    y: y + 6,
    angle,
    radius: range * 1.05,
    life: 0.85,
    maxLife: 0.85,
    seed: Math.random() * 100,
    isLord: true,
  });

  pushNode(state, {
    kind: 'SKEL_REAPER_SCYTHE_SWEEP',
    layer: 'OVER',
    x,
    y,
    angle,
    radius: range * 1.06,
    life: 0.44,
    maxLife: 0.44,
    seed: Math.random() * 100,
  });

  // Torn spectral wisps, dark-indigo flames & ivory fragments swept outward along the harvest arc
  for (let i = 0; i < 20; i++) {
    const t = i / 19 - 0.5;
    const arcA = angle + t * 2.15;
    const dist = range * (0.52 + Math.random() * 0.52);
    const kindIdx = i % 3;
    pushRichParticle(state, {
      x: x + Math.cos(arcA) * dist,
      y: y + Math.sin(arcA) * dist,
      z: 10 + Math.random() * 12,
      vx: Math.cos(arcA) * (95 + Math.random() * 125),
      vy: Math.sin(arcA) * (95 + Math.random() * 125),
      vz: 42 + Math.random() * 52,
      gravity: kindIdx === 2 ? 320 : -16,
      drag: 2.1,
      size: kindIdx === 2 ? 4.8 : 6.8,
      endSize: 1.2,
      rotation: arcA,
      vRot: (Math.random() - 0.5) * 12,
      life: 0.42 + Math.random() * 0.2,
      maxLife: 0.62,
      color: kindIdx === 0 ? '#38BDF8' : kindIdx === 1 ? '#818CF8' : '#F8FAFC',
      secondaryColor: '#1E1B4B',
      alpha: 0.94,
      shape: kindIdx === 0 ? 'SPECTRAL_WISP' : kindIdx === 1 ? 'FLAME_TONGUE' : 'BONE_FRAGMENT',
      layer: 'OVER',
      bounceFactor: kindIdx === 2 ? 0.35 : 0,
    });
  }
}

// ============================================================================
// PASSIVE ABILITY VISUAL FEEDBACK SPAWNERS (SKELETON & ZOMBIE)
// ============================================================================

/**
 * Skeleton Passive 1: Eternal Framework — Bone guard flash & splinters on physical damage mitigation
 */
export function spawnEternalFrameworkGuardVfx(
  state: VFXState,
  x: number,
  y: number,
  knockAngle: number
): void {
  const guardAngle = knockAngle + Math.PI;
  pushNode(state, {
    kind: 'PASSIVE_GUARD_FLASH',
    layer: 'OVER',
    x: x + Math.cos(guardAngle) * 14,
    y: y + Math.sin(guardAngle) * 12 - 4,
    angle: guardAngle,
    radius: 26,
    life: 0.22,
    maxLife: 0.22,
    seed: Math.random() * 100,
  });

  for (let i = 0; i < 5; i++) {
    const a = guardAngle + (Math.random() - 0.5) * 1.4;
    pushRichParticle(state, {
      x: x + Math.cos(guardAngle) * 12,
      y: y + Math.sin(guardAngle) * 10,
      z: 10,
      vx: Math.cos(a) * (55 + Math.random() * 65),
      vy: Math.sin(a) * (55 + Math.random() * 65),
      vz: 42 + Math.random() * 35,
      gravity: 340,
      drag: 2.4,
      size: 3.8,
      endSize: 1.2,
      rotation: a,
      vRot: 12,
      life: 0.26,
      maxLife: 0.26,
      color: '#F8FAFC',
      secondaryColor: '#475569',
      alpha: 0.9,
      shape: 'BONE_FRAGMENT',
      layer: 'OVER',
      bounceFactor: 0.35,
    });
  }
}

/**
 * Skeleton Passive 2: Bone Mastery — Critical strikes explode with razor bone splinters!
 */
export function spawnBoneMasteryCritSplintersVfx(
  state: VFXState,
  x: number,
  y: number,
  angle: number
): void {
  pushNode(state, {
    kind: 'IMPACT_BURST_CRIT_SHATTER',
    layer: 'OVER',
    x,
    y,
    angle,
    radius: 46,
    life: 0.28,
    maxLife: 0.28,
    seed: Math.random() * 100,
    isLord: true,
  });

  for (let i = 0; i < 10; i++) {
    const a = (Math.PI * 2 * i) / 10 + (Math.random() - 0.5) * 0.28;
    const spd = 85 + Math.random() * 115;
    pushRichParticle(state, {
      x,
      y,
      z: 10,
      vx: Math.cos(a) * spd,
      vy: Math.sin(a) * spd,
      vz: 55 + Math.random() * 50,
      gravity: 330,
      drag: 2.2,
      size: 4.6,
      endSize: 1.2,
      rotation: a,
      vRot: (Math.random() - 0.5) * 16,
      life: 0.32,
      maxLife: 0.32,
      color: i % 2 === 0 ? '#FEF08A' : '#F8FAFC',
      secondaryColor: '#0284C7',
      alpha: 0.96,
      shape: i % 4 === 0 ? 'SPECTRAL_WISP' : 'BONE_FRAGMENT',
      layer: 'OVER',
      bounceFactor: 0.35,
    });
  }
}

/**
 * Zombie Passive 1: Undead Resilience — Gentle emerald regenerative pulse & stitch-heart motes
 */
export function spawnUndeadResiliencePulseVfx(
  state: VFXState,
  x: number,
  y: number,
  isKillSurge: boolean
): void {
  pushNode(state, {
    kind: 'PASSIVE_RESILIENCE_BLOOM',
    layer: 'UNDER',
    x,
    y: y + 6,
    angle: 0,
    radius: isKillSurge ? 44 : 30,
    life: isKillSurge ? 0.65 : 0.48,
    maxLife: isKillSurge ? 0.65 : 0.48,
    seed: Math.random() * 100,
    followPlayer: true,
    isLord: isKillSurge,
  });

  const count = isKillSurge ? 7 : 3;
  for (let i = 0; i < count; i++) {
    const a = (Math.PI * 2 * i) / count + Math.random() * 0.4;
    const r = 10 + Math.random() * 14;
    const isHeart = i === 0;
    pushRichParticle(state, {
      x: x + Math.cos(a) * r,
      y: y + Math.sin(a) * r * 0.7,
      z: 6,
      vx: (Math.random() - 0.5) * 14,
      vy: -14 - Math.random() * 12,
      vz: 28 + Math.random() * 20,
      gravity: -12,
      drag: 1.6,
      size: isHeart ? 5.5 : 3.8,
      endSize: isHeart ? 3.2 : 1.0,
      rotation: 0,
      vRot: 0,
      life: 0.52,
      maxLife: 0.52,
      color: isHeart ? '#4ADE80' : '#BEF264',
      secondaryColor: '#14532D',
      alpha: 0.88,
      shape: isHeart ? 'STITCH_HEART' : 'GLOW_SPORE',
      layer: 'OVER',
      bounceFactor: 0,
    });
  }
}

/**
 * Zombie Passive 2: Plague Carrier — Virulent spore pop & clinging plague bubbles when applying stacks
 */
export function spawnPlagueCarrierInfectVfx(
  state: VFXState,
  x: number,
  y: number,
  stacks: number
): void {
  pushNode(state, {
    kind: 'PASSIVE_PLAGUE_POP',
    layer: 'OVER',
    x,
    y,
    angle: 0,
    radius: 22 + stacks * 5,
    life: 0.28,
    maxLife: 0.28,
    seed: Math.random() * 100 + stacks * 11,
  });

  const count = 3 + stacks * 2;
  for (let i = 0; i < count; i++) {
    const a = (Math.PI * 2 * i) / count + Math.random() * 0.35;
    const isBubble = i % 2 === 0;
    pushRichParticle(state, {
      x: x + Math.cos(a) * 8,
      y: y + Math.sin(a) * 6,
      z: 8,
      vx: Math.cos(a) * (24 + Math.random() * 34),
      vy: Math.sin(a) * (18 + Math.random() * 26) - 8,
      vz: 26 + Math.random() * 24,
      gravity: -10,
      drag: 1.8,
      size: isBubble ? 4.2 + stacks * 0.7 : 3.6,
      endSize: isBubble ? 7.5 : 1.0,
      rotation: 0,
      vRot: 0,
      life: 0.44,
      maxLife: 0.44,
      color: stacks >= 3 ? '#A3E635' : '#4ADE80',
      secondaryColor: '#14532D',
      alpha: 0.9,
      shape: isBubble ? 'POISON_BUBBLE' : 'GLOW_SPORE',
      layer: 'OVER',
      bounceFactor: 0,
    });
  }
}

// ============================================================================
// SKELETON & PASSIVE NODE RENDERER (CALLED BY VFXSystem.drawVFXNode)
// ============================================================================

export function drawSkeletonVfxNode(
  ctx: CanvasRenderingContext2D,
  n: VFXNode,
  time: number,
  ratio: number,
  progress: number
): boolean {
  switch (n.kind) {
    case 'SKEL_BASIC_BLADE_ARC':
    case 'SKEL_COLOSSUS_CLEAVE':
    case 'SKEL_BONE_SLASH_ARC': {
      const isWideSlash = n.kind === 'SKEL_BONE_SLASH_ARC';
      const isColossus = n.kind === 'SKEL_COLOSSUS_CLEAVE' || Boolean(n.isLord);
      const dir = n.flip ? -1 : 1;
      const arcSpan = isWideSlash ? 1.88 : isColossus ? 1.72 : 1.44;
      const sweepProgress = Math.min(1, progress * 1.45);
      const fade = ratio < 0.45 ? ratio / 0.45 : 1;

      ctx.rotate(n.angle);
      ctx.globalAlpha = fade;

      const startA = -dir * (arcSpan * 0.54);
      const curEndA = startA + dir * arcSpan * sweepProgress;

      // Layer 1: Outer cyan-cobalt kinetic shock ribbon (tapered serrated polygon, never a single thin stroke!)
      const steps = 16;
      ctx.fillStyle = isColossus ? 'rgba(56, 189, 248, 0.38)' : 'rgba(14, 165, 233, 0.30)';
      ctx.beginPath();
      for (let i = 0; i <= steps; i++) {
        const t = i / steps;
        const a = startA + (curEndA - startA) * t;
        const jag = Math.sin(t * Math.PI * 9 + n.seed) * (isWideSlash ? 5.5 : 3.5) * Math.sin(t * Math.PI);
        const outerR = n.radius * (0.94 + 0.08 * Math.sin(t * Math.PI)) + jag;
        const px = Math.cos(a) * outerR;
        const py = Math.sin(a) * outerR;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      for (let i = steps; i >= 0; i--) {
        const t = i / steps;
        const a = startA + (curEndA - startA) * t;
        const widthFactor = Math.sin(t * Math.PI) * (isWideSlash ? 0.38 : isColossus ? 0.42 : 0.28);
        const innerR = n.radius * (0.92 - widthFactor);
        ctx.lineTo(Math.cos(a) * innerR, Math.sin(a) * innerR);
      }
      ctx.closePath();
      ctx.fill();

      // Layer 2: Razor-sharp polished bone-ivory primary blade edge
      ctx.fillStyle = '#F8FAFC';
      ctx.strokeStyle = '#0F172A';
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      for (let i = 0; i <= steps; i++) {
        const t = i / steps;
        const a = startA + (curEndA - startA) * t;
        const tooth = (i % 3 === 0 ? 4.5 : 0) * Math.sin(t * Math.PI);
        const outerR = n.radius * 0.96 + tooth;
        const px = Math.cos(a) * outerR;
        const py = Math.sin(a) * outerR;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      for (let i = steps; i >= 0; i--) {
        const t = i / steps;
        const a = startA + (curEndA - startA) * t;
        const innerR = n.radius * (0.95 - Math.sin(t * Math.PI) * (isWideSlash ? 0.22 : 0.16));
        ctx.lineTo(Math.cos(a) * innerR, Math.sin(a) * innerR);
      }
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Layer 3: Inner secondary bone-mastery harmonic wake + leading tip star-glint
      if (isWideSlash || isColossus) {
        ctx.strokeStyle = '#BAE6FD';
        ctx.lineWidth = 2.4;
        ctx.beginPath();
        for (let i = 0; i <= 10; i++) {
          const t = i / 10;
          const a = startA + (curEndA - startA) * t * 0.92;
          const r = n.radius * (0.64 + Math.sin(t * Math.PI) * 0.06);
          if (i === 0) ctx.moveTo(Math.cos(a) * r, Math.sin(a) * r);
          else ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
        }
        ctx.stroke();
      }

      // Leading blade-tip glint cross
      const tipX = Math.cos(curEndA) * (n.radius * 0.96);
      const tipY = Math.sin(curEndA) * (n.radius * 0.96);
      ctx.translate(tipX, tipY);
      ctx.rotate(curEndA);
      ctx.fillStyle = '#FEF08A';
      ctx.beginPath();
      ctx.moveTo(11, 0);
      ctx.lineTo(2, -3);
      ctx.lineTo(0, -10);
      ctx.lineTo(-2, -3);
      ctx.lineTo(-9, 0);
      ctx.lineTo(-2, 3);
      ctx.lineTo(0, 10);
      ctx.lineTo(2, 3);
      ctx.closePath();
      ctx.fill();
      return true;
    }

    case 'SKEL_SPEAR_ASSEMBLY': {
      ctx.rotate(n.angle);
      ctx.globalAlpha = ratio;
      const tighten = 1 - progress * 0.65;
      // 4 converging bone splinters snapping into a spearhead outline
      for (let i = 0; i < 4; i++) {
        const offsetA = ((i - 1.5) * 0.6) * tighten;
        ctx.save();
        ctx.rotate(offsetA);
        ctx.strokeStyle = i % 2 === 0 ? '#F8FAFC' : '#38BDF8';
        ctx.lineWidth = 2.6;
        ctx.beginPath();
        ctx.moveTo(-12 * tighten, (i - 1.5) * 6 * tighten);
        ctx.lineTo(18, 0);
        ctx.stroke();
        ctx.restore();
      }
      return true;
    }

    case 'SKEL_SPEAR_SHATTER': {
      ctx.rotate(n.angle);
      ctx.globalAlpha = ratio;
      const expand = 0.35 + progress * 0.85;
      // Radial jagged bone-splinter crown
      for (let i = 0; i < 8; i++) {
        const a = (Math.PI * 2 * i) / 8 + hash01(n.seed + i) * 0.3;
        const inner = n.radius * 0.18 * expand;
        const outer = n.radius * (0.72 + hash01(n.seed + i * 3) * 0.35) * expand;
        ctx.fillStyle = i % 2 === 0 ? '#F8FAFC' : '#38BDF8';
        ctx.strokeStyle = '#0F172A';
        ctx.lineWidth = 1.3;
        ctx.beginPath();
        ctx.moveTo(Math.cos(a) * outer, Math.sin(a) * outer);
        ctx.lineTo(Math.cos(a + 0.14) * inner, Math.sin(a + 0.14) * inner);
        ctx.lineTo(Math.cos(a - 0.14) * inner, Math.sin(a - 0.14) * inner);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      }
      return true;
    }

    case 'SKEL_RIBCAGE_AEGIS': {
      const fade = n.life < 0.35 ? n.life / 0.35 : Math.min(1, progress * 4);
      ctx.globalAlpha = fade * 0.55;
      ctx.scale(1, 0.72);
      ctx.rotate(time * 0.9);
      // Segmented bone-ward floor sigil under Skeleton (the 3D curved ribcage itself renders around Skeleton in SkeletonRenderer!)
      for (let k = 0; k < 6; k++) {
        const a0 = (Math.PI * 2 * k) / 6 + 0.1;
        const a1 = a0 + 0.72;
        ctx.strokeStyle = k % 2 === 0 ? '#E2E8F0' : '#38BDF8';
        ctx.lineWidth = 3;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.arc(0, 0, n.radius, a0, a1);
        ctx.stroke();
      }
      return true;
    }

    case 'SKEL_RUSH_AFTERIMAGE': {
      // Articulated translucent Skeletal Dash Phantom (skull, ribcage, scarf & drawn bone blade)
      ctx.globalAlpha = ratio * 0.62;
      const facingLeft = Math.cos(n.angle) < -0.15;
      if (facingLeft) ctx.scale(-1, 1);
      const scale = n.isLord ? 1.35 : 1.0;
      ctx.scale(scale, scale);

      // Motion-stretched cobalt scarf ribbon
      ctx.fillStyle = '#38BDF8';
      ctx.beginPath();
      ctx.moveTo(-4, -8);
      ctx.lineTo(-26, -14);
      ctx.lineTo(-22, -4);
      ctx.closePath();
      ctx.fill();

      // Ribcage & skull silhouette
      ctx.strokeStyle = '#E0F2FE';
      ctx.lineWidth = 2.6;
      ctx.beginPath();
      ctx.moveTo(2, -12);
      ctx.lineTo(-4, 4);
      ctx.moveTo(-4, -8);
      ctx.lineTo(7, -7);
      ctx.moveTo(-5, -4);
      ctx.lineTo(6, -3);
      ctx.stroke();

      ctx.fillStyle = '#BAE6FD';
      ctx.beginPath();
      ctx.arc(5, -18, 8.5, 0, Math.PI * 2);
      ctx.fill();

      // Forward-lunging bone blade streak
      ctx.fillStyle = '#F8FAFC';
      ctx.beginPath();
      ctx.moveTo(8, -6);
      ctx.lineTo(34, -10);
      ctx.lineTo(26, -2);
      ctx.closePath();
      ctx.fill();
      return true;
    }

    case 'SKEL_RUSH_CROSS_FINISH': {
      // Twin intersecting bone-blade X-slash at the end of Skeletal Rush
      ctx.rotate(n.angle);
      ctx.globalAlpha = ratio;
      const stretch = 0.55 + progress * 0.65;
      for (const slashTilt of [-0.58, 0.58]) {
        ctx.save();
        ctx.rotate(slashTilt);
        ctx.fillStyle = '#0F172A';
        ctx.beginPath();
        ctx.moveTo(n.radius * stretch, 0);
        ctx.lineTo(0, -6.5 * ratio);
        ctx.lineTo(-n.radius * 0.72 * stretch, 0);
        ctx.lineTo(0, 6.5 * ratio);
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = slashTilt < 0 ? '#F8FAFC' : '#38BDF8';
        ctx.beginPath();
        ctx.moveTo(n.radius * 0.94 * stretch, 0);
        ctx.lineTo(0, -4 * ratio);
        ctx.lineTo(-n.radius * 0.66 * stretch, 0);
        ctx.lineTo(0, 4 * ratio);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      }
      return true;
    }

    case 'SKEL_BONE_STORM_VORTEX': {
      const fade = n.life < 0.4 ? n.life / 0.4 : Math.min(1, progress * 3.5);
      ctx.globalAlpha = fade * 0.46;
      ctx.scale(1, 0.74);
      // Swirling wind-shear ribbons on the floor beneath orbiting Bone Storm fragments
      for (let arm = 0; arm < 4; arm++) {
        const baseA = -time * 5.2 + (Math.PI * 2 * arm) / 4;
        ctx.strokeStyle = arm % 2 === 0 ? '#BAE6FD' : '#E2E8F0';
        ctx.lineWidth = 2.6;
        ctx.beginPath();
        for (let s = 0; s <= 10; s++) {
          const t = s / 10;
          const r = n.radius * (0.35 + t * 0.65);
          const a = baseA + t * 1.45;
          if (s === 0) ctx.moveTo(Math.cos(a) * r, Math.sin(a) * r);
          else ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
        }
        ctx.stroke();
      }
      return true;
    }

    case 'SKEL_COLOSSUS_ASCENSION': {
      ctx.globalAlpha = ratio;
      ctx.scale(1, 0.75);
      const reach = 0.35 + progress * 0.7;
      // Branching stone fissure cracks + jagged ivory bone spikes erupting around transformation point
      ctx.strokeStyle = '#0F172A';
      ctx.lineWidth = 4.5;
      ctx.beginPath();
      for (let b = 0; b < 9; b++) {
        const a = (Math.PI * 2 * b) / 9 + hash01(n.seed + b) * 0.25;
        ctx.moveTo(0, 0);
        const midR = n.radius * 0.5 * reach;
        const endR = n.radius * reach * (0.8 + hash01(n.seed + b * 5) * 0.3);
        ctx.lineTo(Math.cos(a + 0.12) * midR, Math.sin(a + 0.12) * midR);
        ctx.lineTo(Math.cos(a - 0.08) * endR, Math.sin(a - 0.08) * endR);
      }
      ctx.stroke();

      ctx.strokeStyle = '#38BDF8';
      ctx.lineWidth = 2.0;
      ctx.stroke();
      return true;
    }

    case 'SKEL_COLOSSUS_AURA': {
      const fade = n.life < 0.5 ? n.life / 0.5 : Math.min(1, progress * 3);
      ctx.globalAlpha = fade * 0.55;
      ctx.scale(1, 0.72);
      ctx.rotate(time * 1.15);

      // Interlocking serrated bone-crown floor sigil under Bone Colossus
      ctx.fillStyle = 'rgba(14, 165, 233, 0.16)';
      ctx.strokeStyle = '#38BDF8';
      ctx.lineWidth = 2.4;
      ctx.beginPath();
      const pts = 14;
      for (let i = 0; i < pts; i++) {
        const a = (Math.PI * 2 * i) / pts;
        const r = i % 2 === 0 ? n.radius : n.radius * 0.74;
        if (i === 0) ctx.moveTo(Math.cos(a) * r, Math.sin(a) * r);
        else ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
      }
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      return true;
    }

    case 'SKEL_ARMY_SUMMON_SIGIL': {
      const fade = ratio < 0.35 ? ratio / 0.35 : 1;
      ctx.globalAlpha = fade * 0.9;
      ctx.scale(1, 0.72);
      const open = Math.min(1, progress * 3.2);

      // Darkened burial fissure + turquoise necromantic glow + bone-rim shards
      ctx.fillStyle = '#0F172A';
      ctx.strokeStyle = '#38BDF8';
      ctx.lineWidth = 2.4;
      ctx.beginPath();
      for (let i = 0; i < 10; i++) {
        const a = (Math.PI * 2 * i) / 10;
        const r = n.radius * open * (i % 2 === 0 ? 1.0 : 0.62);
        if (i === 0) ctx.moveTo(Math.cos(a) * r, Math.sin(a) * r);
        else ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
      }
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      return true;
    }

    case 'SKEL_REAPER_SCYTHE_SWEEP': {
      // Massive multi-layered dark-indigo & spectral-cyan Death Scythe harvest arc
      ctx.rotate(n.angle);
      const fade = ratio < 0.4 ? ratio / 0.4 : 1;
      ctx.globalAlpha = fade;
      const sweep = Math.min(1, progress * 1.6);
      const startA = -1.28;
      const curEndA = startA + 2.56 * sweep;
      const steps = 20;

      // Layer 1: Deep abyssal indigo shadow cloak wake
      ctx.fillStyle = 'rgba(30, 27, 75, 0.76)';
      ctx.beginPath();
      for (let i = 0; i <= steps; i++) {
        const t = i / steps;
        const a = startA + (curEndA - startA) * t;
        const r = n.radius * (0.98 + Math.sin(t * Math.PI * 7 + n.seed) * 0.05);
        if (i === 0) ctx.moveTo(Math.cos(a) * r, Math.sin(a) * r);
        else ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
      }
      for (let i = steps; i >= 0; i--) {
        const t = i / steps;
        const a = startA + (curEndA - startA) * t;
        const r = n.radius * (0.94 - Math.sin(t * Math.PI) * 0.48);
        ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
      }
      ctx.closePath();
      ctx.fill();

      // Layer 2: Spectral cyan & violet soul-reaping crescent blade band
      ctx.fillStyle = '#38BDF8';
      ctx.strokeStyle = '#E0F2FE';
      ctx.lineWidth = 2.0;
      ctx.beginPath();
      for (let i = 0; i <= steps; i++) {
        const t = i / steps;
        const a = startA + (curEndA - startA) * t;
        const r = n.radius * 0.96;
        if (i === 0) ctx.moveTo(Math.cos(a) * r, Math.sin(a) * r);
        else ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
      }
      for (let i = steps; i >= 0; i--) {
        const t = i / steps;
        const a = startA + (curEndA - startA) * t;
        const r = n.radius * (0.94 - Math.sin(t * Math.PI) * 0.22);
        ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
      }
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Layer 3: Leading Giant Spectral Scythe Head at the forefront of the sweep!
      ctx.save();
      ctx.rotate(curEndA);
      ctx.translate(n.radius * 0.72, 0);
      ctx.fillStyle = '#F8FAFC';
      ctx.strokeStyle = '#1E1B4B';
      ctx.lineWidth = 2.4;
      ctx.beginPath();
      ctx.moveTo(-28, -6);
      ctx.quadraticCurveTo(18, -14, 34, 34);
      ctx.quadraticCurveTo(6, 8, -24, 4);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.restore();
      return true;
    }

    case 'SKEL_DARK_GROUND_WAKE': {
      ctx.rotate(n.angle);
      ctx.globalAlpha = ratio * 0.55;
      const arcSpan = n.isLord ? 1.95 : 1.55;
      ctx.strokeStyle = n.isLord ? '#312E81' : '#1E293B';
      ctx.lineWidth = n.isLord ? 7 : 4.5;
      ctx.lineCap = 'round';
      ctx.beginPath();
      for (let i = 0; i <= 12; i++) {
        const t = i / 12;
        const a = -arcSpan * 0.5 + arcSpan * t;
        const jag = (hash01(n.seed + i * 3.1) - 0.5) * 8;
        const r = n.radius * 0.84 + jag;
        if (i === 0) ctx.moveTo(Math.cos(a) * r, Math.sin(a) * r);
        else ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
      }
      ctx.stroke();
      return true;
    }

    case 'IMPACT_BURST_BONE':
    case 'IMPACT_BURST_CRIT_SHATTER':
    case 'IMPACT_BURST_REAPER': {
      ctx.rotate(n.angle);
      const expand = 0.45 + progress * 0.8;
      ctx.globalAlpha = ratio;
      const spikes = n.kind === 'IMPACT_BURST_CRIT_SHATTER' ? 10 : 8;
      const mainColor =
        n.kind === 'IMPACT_BURST_CRIT_SHATTER'
          ? '#FEF08A'
          : n.kind === 'IMPACT_BURST_REAPER'
          ? '#818CF8'
          : '#38BDF8';

      ctx.fillStyle = '#0F172A';
      ctx.beginPath();
      for (let s = 0; s < spikes * 2; s++) {
        const a = (Math.PI * s) / spikes;
        const asym = Math.cos(a) > 0 ? 1.32 : 0.76;
        const r =
          s % 2 === 0
            ? n.radius * expand * asym * (0.85 + hash01(n.seed + s) * 0.35)
            : n.radius * 0.22 * expand;
        if (s === 0) ctx.moveTo(Math.cos(a) * r, Math.sin(a) * r);
        else ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
      }
      ctx.closePath();
      ctx.fill();

      ctx.scale(0.86, 0.86);
      ctx.fillStyle = mainColor;
      ctx.fill();

      ctx.scale(0.52, 0.52);
      ctx.fillStyle = '#FFFFFF';
      ctx.fill();
      return true;
    }

    case 'PASSIVE_GUARD_FLASH': {
      // Curved interlocking bone-plate guard flash when Eternal Framework or Ribcage Shield mitigates damage
      ctx.rotate(n.angle);
      ctx.globalAlpha = ratio;
      const scale = 0.75 + progress * 0.35;
      ctx.scale(scale, scale);

      for (let rIdx = -1; rIdx <= 1; rIdx++) {
        ctx.strokeStyle = rIdx === 0 ? '#F8FAFC' : '#38BDF8';
        ctx.lineWidth = rIdx === 0 ? 4.2 : 3.0;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.arc(-6, rIdx * 4, 18, -0.78, 0.78);
        ctx.stroke();
      }
      return true;
    }

    case 'PASSIVE_RESILIENCE_BLOOM': {
      // Cozy organic clover-stitch emerald pulse beneath Zombie on Undead Resilience tick/kill-surge
      ctx.globalAlpha = Math.sin(ratio * Math.PI) * (n.isLord ? 0.62 : 0.38);
      ctx.scale(1, 0.72);
      const expand = 0.65 + progress * 0.45;
      ctx.strokeStyle = n.isLord ? '#BEF264' : '#4ADE80';
      ctx.lineWidth = n.isLord ? 3.2 : 2.2;
      ctx.beginPath();
      for (let i = 0; i <= 24; i++) {
        const a = (Math.PI * 2 * i) / 24;
        const petal = 1 + 0.14 * Math.sin(a * 6 + time * 4);
        const r = n.radius * expand * petal;
        if (i === 0) ctx.moveTo(Math.cos(a) * r, Math.sin(a) * r);
        else ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
      }
      ctx.closePath();
      ctx.stroke();
      return true;
    }

    case 'PASSIVE_PLAGUE_POP': {
      // Multi-lobed toxic spore burst when Plague Carrier applies/stacks
      ctx.globalAlpha = ratio * 0.85;
      const expand = 0.5 + progress * 0.7;
      for (let k = 0; k < 5; k++) {
        const a = (Math.PI * 2 * k) / 5 + n.seed;
        const px = Math.cos(a) * n.radius * 0.48 * expand;
        const py = Math.sin(a) * n.radius * 0.38 * expand;
        ctx.fillStyle = k % 2 === 0 ? 'rgba(163, 230, 53, 0.55)' : 'rgba(74, 222, 128, 0.48)';
        ctx.beginPath();
        ctx.arc(px, py, 7 * ratio + 2, 0, Math.PI * 2);
        ctx.fill();
      }
      return true;
    }

    default:
      return false;
  }
}
