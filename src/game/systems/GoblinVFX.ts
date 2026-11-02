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
// STAGE 1: GOBLIN ANTICIPATION / PREPARATION EMITTERS
// ============================================================================

export function emitGoblinAnticipationVfx(
  state: VFXState,
  abilityId: string,
  x: number,
  y: number,
  aimAngle: number,
  isPoisonCoated: boolean
): void {
  if (abilityId === 'goblin_twin_daggers') {
    const side = Math.random() < 0.5 ? -1 : 1;
    const handA = aimAngle + side * 0.95;
    const hx = x + Math.cos(handA) * 14;
    const hy = y + Math.sin(handA) * 12;
    pushRichParticle(state, {
      x: hx + (Math.random() - 0.5) * 5,
      y: hy + (Math.random() - 0.5) * 5,
      z: 9,
      vx: Math.cos(aimAngle) * 26,
      vy: Math.sin(aimAngle) * 26,
      vz: 14,
      gravity: 0,
      drag: 3.5,
      size: 3.2,
      endSize: 0.7,
      rotation: aimAngle,
      vRot: side * 8,
      life: 0.12,
      maxLife: 0.12,
      color: isPoisonCoated ? '#A3E635' : '#FEF08A',
      secondaryColor: isPoisonCoated ? '#15803D' : '#E2E8F0',
      alpha: 0.9,
      shape: isPoisonCoated ? 'TOXIC_DROPLET' : 'STEEL_SPARK',
      layer: 'OVER',
      bounceFactor: 0,
    });
    return;
  }

  switch (abilityId) {
    case 'goblin_dagger_flurry': {
      // Twin-dagger metallic glints + crouched sprinter dust at feet
      for (const side of [-1, 1]) {
        const ba = aimAngle + side * 1.25;
        const bx = x + Math.cos(ba) * 15;
        const by = y + Math.sin(ba) * 13;
        pushRichParticle(state, {
          x: bx,
          y: by,
          z: 8,
          vx: (Math.random() - 0.5) * 24,
          vy: (Math.random() - 0.5) * 24,
          vz: 24,
          gravity: 80,
          drag: 3,
          size: 4.0,
          endSize: 0.8,
          rotation: ba,
          vRot: side * 12,
          life: 0.15,
          maxLife: 0.15,
          color: isPoisonCoated ? '#BEF264' : '#FDE047',
          secondaryColor: '#F8FAFC',
          alpha: 0.95,
          shape: 'STEEL_SPARK',
          layer: 'OVER',
          bounceFactor: 0,
        });
      }
      pushRichParticle(state, {
        x: x - Math.cos(aimAngle) * 8 + (Math.random() - 0.5) * 10,
        y: y + 12,
        z: 1,
        vx: -Math.cos(aimAngle) * 34,
        vy: -Math.sin(aimAngle) * 22,
        vz: 26,
        gravity: 180,
        drag: 2.5,
        size: 4.5,
        endSize: 8.5,
        rotation: Math.random() * 6.28,
        vRot: 2,
        life: 0.22,
        maxLife: 0.22,
        color: '#94A3B8',
        secondaryColor: '#475569',
        alpha: 0.55,
        shape: 'VAPOR_PLUME',
        layer: 'UNDER',
        bounceFactor: 0,
      });
      break;
    }

    case 'goblin_shadowstep': {
      // Dissolving dark shadow motes & ground shadow distortion pulling inward
      for (let i = 0; i < 3; i++) {
        const a = Math.random() * Math.PI * 2;
        const r = 18 + Math.random() * 14;
        pushRichParticle(state, {
          x: x + Math.cos(a) * r,
          y: y + Math.sin(a) * r * 0.7,
          z: 4 + Math.random() * 10,
          vx: 0,
          vy: 0,
          vz: 18,
          gravity: 0,
          drag: 0,
          size: 5.2,
          endSize: 1.4,
          rotation: a,
          vRot: 6,
          life: 0.15,
          maxLife: 0.15,
          color: i === 0 ? '#A855F7' : '#1E1B4B',
          secondaryColor: '#34D399',
          alpha: 0.88,
          shape: 'SPECTRAL_WISP',
          layer: 'OVER',
          bounceFactor: 0,
          convergeToX: x,
          convergeToY: y,
        });
      }
      break;
    }

    case 'goblin_explosive_trap': {
      // Brass tinkering sparks as Goblin crouches to assemble the trap
      for (let i = 0; i < 2; i++) {
        const tx = x + Math.cos(aimAngle) * 14;
        const ty = y + Math.sin(aimAngle) * 12;
        const spA = aimAngle + (Math.random() - 0.5) * 1.8;
        pushRichParticle(state, {
          x: tx,
          y: ty,
          z: 6,
          vx: Math.cos(spA) * (35 + Math.random() * 45),
          vy: Math.sin(spA) * (35 + Math.random() * 45),
          vz: 42,
          gravity: 260,
          drag: 2.6,
          size: 3.4,
          endSize: 0.8,
          rotation: spA,
          vRot: 10,
          life: 0.18,
          maxLife: 0.18,
          color: '#FB923C',
          secondaryColor: '#FEF08A',
          alpha: 0.95,
          shape: 'STEEL_SPARK',
          layer: 'OVER',
          bounceFactor: 0.3,
        });
      }
      break;
    }

    case 'goblin_windrunner': {
      // Swirling wind currents & leaves gathering around Goblin's feet
      for (let i = 0; i < 2; i++) {
        const a = Math.random() * Math.PI * 2;
        const r = 18 + Math.random() * 12;
        pushRichParticle(state, {
          x: x + Math.cos(a) * r,
          y: y + Math.sin(a) * r * 0.65 + 6,
          z: 2,
          vx: -Math.sin(a) * 65,
          vy: Math.cos(a) * 45,
          vz: 38,
          gravity: -12,
          drag: 1.8,
          size: 4.2,
          endSize: 1.2,
          rotation: a,
          vRot: 8,
          life: 0.24,
          maxLife: 0.24,
          color: i === 0 ? '#5EEAD4' : '#4ADE80',
          secondaryColor: '#0F766E',
          alpha: 0.85,
          shape: i === 0 ? 'SPECTRAL_WISP' : 'FOREST_LEAF',
          layer: 'OVER',
          bounceFactor: 0,
        });
      }
      break;
    }

    case 'goblin_poisoned_blades': {
      // Dripping luminous green nightshade droplets as daggers scrape together
      for (let i = 0; i < 2; i++) {
        pushRichParticle(state, {
          x: x + Math.cos(aimAngle) * 14 + (Math.random() - 0.5) * 8,
          y: y + Math.sin(aimAngle) * 12 + (Math.random() - 0.5) * 8,
          z: 12,
          vx: (Math.random() - 0.5) * 24,
          vy: (Math.random() - 0.5) * 20,
          vz: 16,
          gravity: 290,
          drag: 1.8,
          size: 3.8,
          endSize: 1.5,
          rotation: 0,
          vRot: 0,
          life: 0.26,
          maxLife: 0.26,
          color: '#A3E635',
          secondaryColor: '#166534',
          alpha: 0.94,
          shape: 'TOXIC_DROPLET',
          layer: 'OVER',
          bounceFactor: 0.25,
        });
      }
      break;
    }

    case 'goblin_ult_phantom_frenzy': {
      // Fierce inward vortex of emerald wind & dark shadow wisps
      for (let i = 0; i < 4; i++) {
        const a = Math.random() * Math.PI * 2;
        const r = 34 + Math.random() * 24;
        pushRichParticle(state, {
          x: x + Math.cos(a) * r,
          y: y + Math.sin(a) * r * 0.72,
          z: 6 + Math.random() * 12,
          vx: 0,
          vy: 0,
          vz: 24,
          gravity: 0,
          drag: 0,
          size: 5.5,
          endSize: 1.5,
          rotation: a + Math.PI / 2,
          vRot: 10,
          life: 0.2,
          maxLife: 0.2,
          color: i % 2 === 0 ? '#34D399' : '#1E1B4B',
          secondaryColor: '#FACC15',
          alpha: 0.92,
          shape: i % 2 === 0 ? 'STEEL_SPARK' : 'SPECTRAL_WISP',
          layer: 'OVER',
          bounceFactor: 0,
          convergeToX: x,
          convergeToY: y,
        });
      }
      break;
    }

    case 'goblin_ult_king_of_thieves': {
      // Dark emerald & royal purple aura flames rising around Goblin before vanishing
      for (let i = 0; i < 4; i++) {
        const a = Math.random() * Math.PI * 2;
        const r = 10 + Math.random() * 18;
        pushRichParticle(state, {
          x: x + Math.cos(a) * r,
          y: y + Math.sin(a) * r * 0.7,
          z: 4,
          vx: (Math.random() - 0.5) * 18,
          vy: -18 - Math.random() * 18,
          vz: 48,
          gravity: -20,
          drag: 1.6,
          size: 5.8,
          endSize: 1.4,
          rotation: -Math.PI / 2,
          vRot: 4,
          life: 0.26,
          maxLife: 0.26,
          color: i % 2 === 0 ? '#A855F7' : '#10B981',
          secondaryColor: '#FACC15',
          alpha: 0.9,
          shape: 'FLAME_TONGUE',
          layer: 'OVER',
          bounceFactor: 0,
        });
      }
      break;
    }

    case 'goblin_ult_thousand_daggers': {
      // Enchanted golden-emerald daggers materializing & shooting skyward!
      for (let i = 0; i < 3; i++) {
        const a = Math.random() * Math.PI * 2;
        const r = 16 + Math.random() * 16;
        pushRichParticle(state, {
          x: x + Math.cos(a) * r,
          y: y + Math.sin(a) * r * 0.65,
          z: 18 + Math.random() * 12,
          vx: Math.cos(a) * 14,
          vy: -25,
          vz: 145 + Math.random() * 65,
          gravity: -40,
          drag: 0.8,
          size: 5.2,
          endSize: 2.0,
          rotation: -Math.PI / 2,
          vRot: 0,
          life: 0.24,
          maxLife: 0.24,
          color: '#FACC15',
          secondaryColor: '#34D399',
          alpha: 0.96,
          shape: 'STEEL_SPARK',
          layer: 'OVER',
          bounceFactor: 0,
        });
      }
      break;
    }
  }
}

// ============================================================================
// STAGE 2, 3, 4 & 5: GOBLIN MULTI-LAYERED ATTACK, SKILL & ULTIMATE EMITTERS
// ============================================================================

/**
 * Basic Attack: Twin Dagger Strikes
 * Alternating right-dagger -> left-dagger -> right-dagger -> twin cross-finisher!
 */
export function spawnGoblinTwinDaggerVfx(
  state: VFXState,
  x: number,
  y: number,
  angle: number,
  range: number,
  comboIndex: number,
  isPoisonCoated: boolean,
  isStolenMight: boolean
): void {
  const step = comboIndex % 4;
  const isFinisher = step === 3;
  const flip = step === 1;

  pushNode(state, {
    kind: isFinisher ? 'GOB_FLURRY_CROSS_FINISHER' : 'GOB_TWIN_DAGGER_SLASH',
    layer: 'OVER',
    x,
    y,
    angle,
    radius: range * (isFinisher ? 1.14 : 1.0),
    life: isFinisher ? 0.22 : 0.16,
    maxLife: isFinisher ? 0.22 : 0.16,
    seed: Math.random() * 100,
    flip,
    isLord: isPoisonCoated,
  });

  // Metallic sparks + optional venomous droplets along the dagger arc
  const sparkCount = isFinisher ? 9 : 5;
  for (let i = 0; i < sparkCount; i++) {
    const spread = angle + (Math.random() - 0.5) * (isFinisher ? 1.45 : 1.05);
    const dist = range * (0.45 + Math.random() * 0.5);
    const sx = x + Math.cos(spread) * dist;
    const sy = y + Math.sin(spread) * dist;
    const isVenomDrop = isPoisonCoated && i % 2 === 0;

    pushRichParticle(state, {
      x: sx,
      y: sy,
      z: 8,
      vx: Math.cos(spread + (flip ? -0.4 : 0.4)) * (65 + Math.random() * 85),
      vy: Math.sin(spread + (flip ? -0.4 : 0.4)) * (65 + Math.random() * 85),
      vz: 28 + Math.random() * 38,
      gravity: isVenomDrop ? 280 : 180,
      drag: 2.8,
      size: isFinisher ? 4.4 : 3.4,
      endSize: 0.8,
      rotation: spread,
      vRot: (Math.random() - 0.5) * 14,
      life: 0.19 + Math.random() * 0.08,
      maxLife: 0.27,
      color: isVenomDrop
        ? '#A3E635'
        : isStolenMight
        ? '#E879F9'
        : isFinisher
        ? '#FACC15'
        : '#F8FAFC',
      secondaryColor: isVenomDrop ? '#15803D' : '#F59E0B',
      alpha: 0.95,
      shape: isVenomDrop ? 'TOXIC_DROPLET' : 'STEEL_SPARK',
      layer: 'OVER',
      bounceFactor: 0.25,
    });
  }
}

/**
 * Normal Skill 1: Dagger Flurry (Individual multi-angle rapid slice + finisher)
 */
export function spawnDaggerFlurryStrikeVfx(
  state: VFXState,
  x: number,
  y: number,
  baseAngle: number,
  range: number,
  hitNumber: number,
  isFinalHit: boolean,
  isPoisonCoated: boolean
): void {
  const angleOffset = isFinalHit
    ? 0
    : ((hitNumber % 2 === 0 ? 1 : -1) * (0.12 + (hitNumber % 3) * 0.09));
  const strikeAngle = baseAngle + angleOffset;

  if (isFinalHit) {
    pushNode(state, {
      kind: 'GOB_FLURRY_CROSS_FINISHER',
      layer: 'OVER',
      x: x + Math.cos(baseAngle) * 12,
      y: y + Math.sin(baseAngle) * 10,
      angle: baseAngle,
      radius: range * 1.18,
      life: 0.26,
      maxLife: 0.26,
      seed: Math.random() * 100,
      isLord: isPoisonCoated,
    });
  } else {
    pushNode(state, {
      kind: 'GOB_FLURRY_SLICE',
      layer: 'OVER',
      x,
      y,
      angle: strikeAngle,
      radius: range * (0.92 + (hitNumber % 2) * 0.1),
      life: 0.16,
      maxLife: 0.16,
      seed: hitNumber * 17.3 + Math.random() * 20,
      flip: hitNumber % 2 === 1,
      isLord: isPoisonCoated,
    });
  }

  // Subtle Goblin speed afterimage on alternating flurry beats
  if (hitNumber % 2 === 0 || isFinalHit) {
    pushNode(state, {
      kind: 'GOB_SHADOW_AFTERIMAGE',
      layer: 'UNDER',
      x: x - Math.cos(baseAngle) * 6,
      y: y - Math.sin(baseAngle) * 5,
      angle: strikeAngle,
      radius: 20,
      life: 0.18,
      maxLife: 0.18,
      seed: hitNumber,
      isLord: false, // emerald-gold speed tint
    });
  }

  // Sparks & footwork dust
  const sparks = isFinalHit ? 10 : 4;
  for (let i = 0; i < sparks; i++) {
    const spA = strikeAngle + (Math.random() - 0.5) * 1.2;
    const d = range * (0.4 + Math.random() * 0.55);
    pushRichParticle(state, {
      x: x + Math.cos(spA) * d,
      y: y + Math.sin(spA) * d,
      z: 9,
      vx: Math.cos(spA) * (85 + Math.random() * 95),
      vy: Math.sin(spA) * (85 + Math.random() * 95),
      vz: 32 + Math.random() * 35,
      gravity: 210,
      drag: 2.6,
      size: isFinalHit ? 4.6 : 3.5,
      endSize: 0.8,
      rotation: spA,
      vRot: 12,
      life: 0.2,
      maxLife: 0.2,
      color: isPoisonCoated && i % 2 === 0 ? '#A3E635' : i % 2 === 0 ? '#FEF08A' : '#F8FAFC',
      secondaryColor: '#F59E0B',
      alpha: 0.95,
      shape: isPoisonCoated && i % 2 === 0 ? 'TOXIC_DROPLET' : 'STEEL_SPARK',
      layer: 'OVER',
      bounceFactor: 0.2,
    });
  }
}

/**
 * Normal Skill 2: Shadowstep
 * Dark dissolve burst -> ground shadow wake + faint Goblin afterimages -> surprise backstab burst!
 */
export function spawnShadowstepVfx(
  state: VFXState,
  startX: number,
  startY: number,
  endX: number,
  endY: number,
  strikeAngle: number,
  foundTarget: boolean
): void {
  // 1. Ground shadow distortion ribbon along travel path
  const midPoints: { x: number; y: number; a: number; scale: number; delay: number }[] = [];
  const steps = 4;
  for (let s = 0; s <= steps; s++) {
    const t = s / steps;
    const px = startX + (endX - startX) * t;
    const py = startY + (endY - startY) * t;
    midPoints.push({ x: px - startX, y: py - startY, a: strikeAngle, scale: 0.85 + t * 0.2, delay: t * 0.06 });

    if (s > 0 && s < steps) {
      pushNode(state, {
        kind: 'GOB_SHADOW_AFTERIMAGE',
        layer: 'UNDER',
        x: px,
        y: py,
        angle: strikeAngle,
        radius: 20,
        life: 0.24 + t * 0.08,
        maxLife: 0.32,
        seed: s * 13,
        isLord: true, // twilight shadow silhouette
      });
    }
  }

  pushNode(state, {
    kind: 'GOB_SHADOWSTEP_RIBBON',
    layer: 'UNDER',
    x: startX,
    y: startY,
    angle: Math.atan2(endY - startY, endX - startX),
    radius: Math.hypot(endX - startX, endY - startY),
    life: 0.38,
    maxLife: 0.38,
    seed: Math.random() * 100,
    subPoints: midPoints,
  });

  // 2. Origin & Destination dark shadow smoke + emerald-violet wisps
  for (const pt of [
    { x: startX, y: startY, count: 10 },
    { x: endX, y: endY, count: 14 },
  ]) {
    for (let i = 0; i < pt.count; i++) {
      const a = (Math.PI * 2 * i) / pt.count + Math.random() * 0.3;
      const isSmoke = i % 2 === 0;
      pushRichParticle(state, {
        x: pt.x + (Math.random() - 0.5) * 10,
        y: pt.y + (Math.random() - 0.5) * 10,
        z: 6,
        vx: Math.cos(a) * (40 + Math.random() * 75),
        vy: Math.sin(a) * (32 + Math.random() * 60),
        vz: 32 + Math.random() * 35,
        gravity: -15,
        drag: 2.3,
        size: isSmoke ? 7.5 : 4.6,
        endSize: isSmoke ? 15 : 1.0,
        rotation: a,
        vRot: 5,
        life: 0.34,
        maxLife: 0.34,
        color: isSmoke ? '#1E1B4B' : i % 3 === 0 ? '#34D399' : '#C084FC',
        secondaryColor: '#0F172A',
        alpha: isSmoke ? 0.75 : 0.95,
        shape: isSmoke ? 'VAPOR_PLUME' : 'SPECTRAL_WISP',
        layer: 'OVER',
        bounceFactor: 0,
      });
    }
  }

  // 3. Surprise Backstab Twin-Dagger Cross Slash at destination!
  pushNode(state, {
    kind: 'GOB_BACKSTAB_CROSS',
    layer: 'OVER',
    x: endX + Math.cos(strikeAngle) * (foundTarget ? 22 : 16),
    y: endY + Math.sin(strikeAngle) * (foundTarget ? 22 : 16),
    angle: strikeAngle,
    radius: foundTarget ? 62 : 48,
    life: 0.28,
    maxLife: 0.28,
    seed: Math.random() * 100,
    isLord: foundTarget,
  });
}

/**
 * Normal Skill 3: Explosive Trap (Placement, Dismantle & Multi-Layered Detonation)
 */
export function spawnExplosiveTrapPlaceVfx(state: VFXState, x: number, y: number): void {
  for (let i = 0; i < 8; i++) {
    const a = (Math.PI * 2 * i) / 8;
    pushRichParticle(state, {
      x: x + Math.cos(a) * 8,
      y: y + Math.sin(a) * 6,
      z: 4,
      vx: Math.cos(a) * 42,
      vy: Math.sin(a) * 32,
      vz: 32,
      gravity: 220,
      drag: 2.4,
      size: i % 2 === 0 ? 3.8 : 5.2,
      endSize: i % 2 === 0 ? 1.0 : 9.0,
      rotation: a,
      vRot: 6,
      life: 0.26,
      maxLife: 0.26,
      color: i % 2 === 0 ? '#FBBF24' : '#64748B',
      secondaryColor: '#1E293B',
      alpha: 0.82,
      shape: i % 2 === 0 ? 'STEEL_SPARK' : 'VAPOR_PLUME',
      layer: 'OVER',
      bounceFactor: 0.25,
    });
  }
}

export function spawnExplosiveTrapDetonateVfx(
  state: VFXState,
  x: number,
  y: number,
  blastRadius: number
): void {
  // Scorched crater & shockwave ring on floor
  pushNode(state, {
    kind: 'GOB_TRAP_SCORCH_CRATER',
    layer: 'UNDER',
    x,
    y,
    angle: Math.random() * Math.PI * 2,
    radius: blastRadius * 0.85,
    life: 1.85,
    maxLife: 1.85,
    seed: Math.random() * 100,
  });

  // Multi-layered fiery-alchemical blast core + shockwave
  pushNode(state, {
    kind: 'GOB_TRAP_BLAST_CORE',
    layer: 'OVER',
    x,
    y,
    angle: 0,
    radius: blastRadius,
    life: 0.38,
    maxLife: 0.38,
    seed: Math.random() * 100,
  });

  // Flying brass shrapnel fragments, flame tongues, and lingering dark smoke plumes!
  for (let i = 0; i < 24; i++) {
    const a = (Math.PI * 2 * i) / 24 + (Math.random() - 0.5) * 0.22;
    const kindMod = i % 3;
    const spd =
      kindMod === 0
        ? 110 + Math.random() * 130 // Shrapnel
        : kindMod === 1
        ? 75 + Math.random() * 90 // Flame tongue
        : 32 + Math.random() * 55; // Lingering smoke

    pushRichParticle(state, {
      x: x + (Math.random() - 0.5) * 14,
      y: y + (Math.random() - 0.5) * 12,
      z: 6,
      vx: Math.cos(a) * spd,
      vy: Math.sin(a) * spd * 0.82,
      vz: kindMod === 2 ? 42 + Math.random() * 32 : 65 + Math.random() * 75,
      gravity: kindMod === 0 ? 340 : kindMod === 1 ? -20 : -14,
      drag: kindMod === 0 ? 2.1 : 1.9,
      size: kindMod === 0 ? 4.8 : kindMod === 1 ? 7.2 : 9.5,
      endSize: kindMod === 2 ? 21 : 1.2,
      rotation: a,
      vRot: (Math.random() - 0.5) * 14,
      life: kindMod === 2 ? 0.72 + Math.random() * 0.24 : 0.36 + Math.random() * 0.14,
      maxLife: kindMod === 2 ? 0.96 : 0.5,
      color:
        kindMod === 0
          ? '#FDE047'
          : kindMod === 1
          ? i % 2 === 0
            ? '#FB923C'
            : '#84CC16'
          : '#334155',
      secondaryColor: '#0F172A',
      alpha: kindMod === 2 ? 0.65 : 0.96,
      shape: kindMod === 0 ? 'STEEL_SPARK' : kindMod === 1 ? 'FLAME_TONGUE' : 'VAPOR_PLUME',
      layer: 'OVER',
      bounceFactor: kindMod === 0 ? 0.38 : 0,
    });
  }
}

/**
 * Normal Skill 4: Windrunner (Activation, Sprint Step Streaks & Fadeout)
 */
export function spawnWindrunnerActivateVfx(
  state: VFXState,
  x: number,
  y: number,
  duration: number
): void {
  state.nodes = state.nodes.filter((n) => n.kind !== 'GOB_WINDRUNNER_GALE');
  pushNode(state, {
    kind: 'GOB_WINDRUNNER_GALE',
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

  for (let i = 0; i < 14; i++) {
    const a = (Math.PI * 2 * i) / 14;
    const isLeaf = i % 3 === 0;
    pushRichParticle(state, {
      x: x + Math.cos(a) * 12,
      y: y + Math.sin(a) * 10,
      z: 5,
      vx: Math.cos(a) * 85 - Math.sin(a) * 55,
      vy: Math.sin(a) * 65 + Math.cos(a) * 42,
      vz: 45 + Math.random() * 35,
      gravity: isLeaf ? 65 : -12,
      drag: 2.0,
      size: isLeaf ? 4.8 : 5.5,
      endSize: 1.2,
      rotation: a,
      vRot: 9,
      life: 0.44,
      maxLife: 0.44,
      color: isLeaf ? '#4ADE80' : '#5EEAD4',
      secondaryColor: '#0F766E',
      alpha: 0.9,
      shape: isLeaf ? 'FOREST_LEAF' : 'SPECTRAL_WISP',
      layer: 'OVER',
      bounceFactor: 0,
    });
  }
}

export function spawnWindrunnerEndVfx(state: VFXState, x: number, y: number): void {
  for (let i = 0; i < 10; i++) {
    const a = (Math.PI * 2 * i) / 10;
    pushRichParticle(state, {
      x: x + Math.cos(a) * 16,
      y: y + Math.sin(a) * 12,
      z: 6,
      vx: Math.cos(a) * 48,
      vy: Math.sin(a) * 38,
      vz: 28,
      gravity: -8,
      drag: 2.2,
      size: 4.5,
      endSize: 1.0,
      rotation: a,
      vRot: 6,
      life: 0.36,
      maxLife: 0.36,
      color: i % 2 === 0 ? '#5EEAD4' : '#86EFAC',
      secondaryColor: '#115E59',
      alpha: 0.75,
      shape: i % 3 === 0 ? 'FOREST_LEAF' : 'SPECTRAL_WISP',
      layer: 'OVER',
      bounceFactor: 0,
    });
  }
}

/**
 * Normal Skill 5: Poisoned Blades (Blade Coating Splash & Venomous Enemy Infection)
 */
export function spawnPoisonedBladesCoatVfx(state: VFXState, x: number, y: number): void {
  pushNode(state, {
    kind: 'GOB_POISON_COAT_GLEAM',
    layer: 'OVER',
    x,
    y,
    angle: 0,
    radius: 44,
    life: 0.42,
    maxLife: 0.42,
    seed: Math.random() * 100,
    followPlayer: true,
  });

  for (let i = 0; i < 14; i++) {
    const a = (Math.PI * 2 * i) / 14;
    const isVapor = i % 3 === 0;
    pushRichParticle(state, {
      x: x + Math.cos(a) * 10,
      y: y + Math.sin(a) * 8,
      z: 10,
      vx: Math.cos(a) * (42 + Math.random() * 48),
      vy: Math.sin(a) * (34 + Math.random() * 38),
      vz: isVapor ? 45 : 55,
      gravity: isVapor ? -18 : 310,
      drag: 2.0,
      size: isVapor ? 6.8 : 4.2,
      endSize: isVapor ? 14 : 1.4,
      rotation: a,
      vRot: 5,
      life: 0.4,
      maxLife: 0.4,
      color: i % 2 === 0 ? '#A3E635' : '#4ADE80',
      secondaryColor: '#14532D',
      alpha: isVapor ? 0.65 : 0.95,
      shape: isVapor ? 'VAPOR_PLUME' : 'TOXIC_DROPLET',
      layer: 'OVER',
      bounceFactor: isVapor ? 0 : 0.3,
    });
  }
}

/**
 * Ultimate 1: Phantom Frenzy (Multi-Angle Dash Slash + Final 4-Clone Convergence!)
 */
export function spawnPhantomFrenzyDashVfx(
  state: VFXState,
  fromX: number,
  fromY: number,
  toX: number,
  toY: number,
  strikeAngle: number,
  strikeIdx: number
): void {
  // Shadow-wind streak connecting previous dash spot to current strike spot
  pushNode(state, {
    kind: 'GOB_SHADOWSTEP_RIBBON',
    layer: 'UNDER',
    x: fromX,
    y: fromY,
    angle: Math.atan2(toY - fromY, toX - fromX),
    radius: Math.hypot(toX - fromX, toY - fromY),
    life: 0.24,
    maxLife: 0.24,
    seed: strikeIdx * 19.7,
  });

  // Detailed Goblin phantom afterimage posed mid-slash!
  pushNode(state, {
    kind: 'GOB_SHADOW_AFTERIMAGE',
    layer: 'OVER',
    x: toX,
    y: toY,
    angle: strikeAngle,
    radius: 22,
    life: 0.32,
    maxLife: 0.32,
    seed: strikeIdx * 11.3,
    isLord: strikeIdx % 2 === 1,
  });

  // Wide phantom twin-dagger slice
  pushNode(state, {
    kind: 'GOB_FLURRY_SLICE',
    layer: 'OVER',
    x: toX,
    y: toY,
    angle: strikeAngle,
    radius: 78,
    life: 0.22,
    maxLife: 0.22,
    seed: strikeIdx * 31.1,
    flip: strikeIdx % 2 === 1,
    isLord: true,
  });

  for (let i = 0; i < 6; i++) {
    const a = strikeAngle + (Math.random() - 0.5) * 1.4;
    pushRichParticle(state, {
      x: toX + Math.cos(strikeAngle) * 20,
      y: toY + Math.sin(strikeAngle) * 16,
      z: 10,
      vx: Math.cos(a) * (75 + Math.random() * 95),
      vy: Math.sin(a) * (75 + Math.random() * 95),
      vz: 38,
      gravity: 160,
      drag: 2.5,
      size: 4.2,
      endSize: 0.9,
      rotation: a,
      vRot: 12,
      life: 0.24,
      maxLife: 0.24,
      color: i % 2 === 0 ? '#34D399' : '#FEF08A',
      secondaryColor: '#064E3B',
      alpha: 0.95,
      shape: 'STEEL_SPARK',
      layer: 'OVER',
      bounceFactor: 0,
    });
  }
}

export function spawnPhantomFrenzyConvergenceVfx(
  state: VFXState,
  centerX: number,
  centerY: number,
  radius: number
): void {
  pushNode(state, {
    kind: 'GOB_PHANTOM_CONVERGENCE',
    layer: 'OVER',
    x: centerX,
    y: centerY,
    angle: 0,
    radius,
    life: 0.44,
    maxLife: 0.44,
    seed: Math.random() * 100,
  });

  for (let i = 0; i < 22; i++) {
    const a = (Math.PI * 2 * i) / 22;
    const spd = 95 + (i % 3) * 48;
    pushRichParticle(state, {
      x: centerX,
      y: centerY,
      z: 10,
      vx: Math.cos(a) * spd,
      vy: Math.sin(a) * spd * 0.8,
      vz: 55 + (i % 3) * 25,
      gravity: 140,
      drag: 2.3,
      size: 5.0,
      endSize: 1.0,
      rotation: a,
      vRot: 10,
      life: 0.36,
      maxLife: 0.36,
      color: i % 3 === 0 ? '#34D399' : i % 3 === 1 ? '#FACC15' : '#A855F7',
      secondaryColor: '#0F172A',
      alpha: 0.96,
      shape: i % 2 === 0 ? 'STEEL_SPARK' : 'SPECTRAL_WISP',
      layer: 'OVER',
      bounceFactor: 0,
    });
  }
}

/**
 * Ultimate 2: King of Thieves (Shadow Portal Backstab + Vitality/Strength Siphon + Finale)
 */
export function spawnKingOfThievesPortalAmbushVfx(
  state: VFXState,
  portalX: number,
  portalY: number,
  enemyX: number,
  enemyY: number,
  strikeAngle: number
): void {
  // 1. Jagged dark-purple & emerald Shadow Portal behind the enemy!
  pushNode(state, {
    kind: 'GOB_SHADOW_PORTAL',
    layer: 'UNDER',
    x: portalX,
    y: portalY,
    angle: strikeAngle,
    radius: 30,
    life: 0.42,
    maxLife: 0.42,
    seed: Math.random() * 100,
  });

  // 2. Posed Goblin ambush silhouette lunging out of the shadow portal
  pushNode(state, {
    kind: 'GOB_SHADOW_AFTERIMAGE',
    layer: 'OVER',
    x: portalX + Math.cos(strikeAngle) * 8,
    y: portalY + Math.sin(strikeAngle) * 8,
    angle: strikeAngle,
    radius: 22,
    life: 0.28,
    maxLife: 0.28,
    seed: Math.random() * 100,
    isLord: true,
  });

  // 3. Royal Backstab Cross Slash on enemy
  pushNode(state, {
    kind: 'GOB_BACKSTAB_CROSS',
    layer: 'OVER',
    x: enemyX,
    y: enemyY,
    angle: strikeAngle,
    radius: 58,
    life: 0.26,
    maxLife: 0.26,
    seed: Math.random() * 100,
    isLord: true,
  });

  // 4. Stolen Vitality & Strength energy tether + converging essence orbs returning to Goblin!
  pushNode(state, {
    kind: 'GOB_THIEF_SIPHON_TETHER',
    layer: 'OVER',
    x: enemyX,
    y: enemyY,
    angle: Math.atan2(portalY - enemyY, portalX - enemyX),
    radius: Math.max(24, Math.hypot(portalX - enemyX, portalY - enemyY)),
    life: 0.34,
    maxLife: 0.34,
    seed: Math.random() * 100,
    followPlayer: false,
    subPoints: [{ x: portalX - enemyX, y: portalY - enemyY, a: 0, scale: 1, delay: 0 }],
  });

  for (let i = 0; i < 8; i++) {
    const offA = (Math.PI * 2 * i) / 8;
    pushRichParticle(state, {
      x: enemyX + Math.cos(offA) * 14,
      y: enemyY + Math.sin(offA) * 12,
      z: 10,
      vx: 0,
      vy: 0,
      vz: 18,
      gravity: 0,
      drag: 0,
      size: 4.8,
      endSize: 1.6,
      rotation: offA,
      vRot: 8,
      life: 0.28,
      maxLife: 0.28,
      color: i % 2 === 0 ? '#4ADE80' : '#C084FC',
      secondaryColor: '#FACC15',
      alpha: 0.96,
      shape: i % 3 === 0 ? 'GLOW_SPORE' : 'SPECTRAL_WISP',
      layer: 'OVER',
      bounceFactor: 0,
      convergeToX: portalX,
      convergeToY: portalY,
    });
  }
}

export function spawnKingOfThievesFinaleVfx(state: VFXState, x: number, y: number): void {
  pushNode(state, {
    kind: 'GOB_THIEF_CROWN_BURST',
    layer: 'OVER',
    x,
    y,
    angle: 0,
    radius: 105,
    life: 0.48,
    maxLife: 0.48,
    seed: Math.random() * 100,
    followPlayer: true,
  });

  for (let i = 0; i < 20; i++) {
    const a = (Math.PI * 2 * i) / 20;
    pushRichParticle(state, {
      x: x + Math.cos(a) * 14,
      y: y + Math.sin(a) * 12,
      z: 10,
      vx: Math.cos(a) * (65 + (i % 3) * 35),
      vy: Math.sin(a) * (55 + (i % 3) * 28),
      vz: 55,
      gravity: -16,
      drag: 2.1,
      size: 5.4,
      endSize: 1.2,
      rotation: a,
      vRot: 8,
      life: 0.42,
      maxLife: 0.42,
      color: i % 3 === 0 ? '#FACC15' : i % 3 === 1 ? '#C084FC' : '#34D399',
      secondaryColor: '#1E1B4B',
      alpha: 0.95,
      shape: i % 2 === 0 ? 'FLAME_TONGUE' : 'STEEL_SPARK',
      layer: 'OVER',
      bounceFactor: 0,
    });
  }
}

/**
 * Ultimate 3: Thousand Daggers (Skyward Enchanted Barrage Launch & Per-Dagger Floor Impact)
 */
export function spawnThousandDaggersLaunchVfx(state: VFXState, x: number, y: number): void {
  pushNode(state, {
    kind: 'GOB_THOUSAND_LAUNCH_HALO',
    layer: 'OVER',
    x,
    y,
    angle: 0,
    radius: 56,
    life: 0.45,
    maxLife: 0.45,
    seed: Math.random() * 100,
    followPlayer: true,
  });

  for (let i = 0; i < 16; i++) {
    const a = (Math.PI * 2 * i) / 16;
    pushRichParticle(state, {
      x: x + Math.cos(a) * 22,
      y: y + Math.sin(a) * 16,
      z: 20,
      vx: Math.cos(a) * 28,
      vy: Math.sin(a) * 18 - 30,
      vz: 240 + (i % 3) * 55,
      gravity: -20,
      drag: 0.6,
      size: 5.5,
      endSize: 2.2,
      rotation: -Math.PI / 2,
      vRot: 0,
      life: 0.34,
      maxLife: 0.34,
      color: i % 2 === 0 ? '#FACC15' : '#34D399',
      secondaryColor: '#F8FAFC',
      alpha: 0.96,
      shape: 'STEEL_SPARK',
      layer: 'OVER',
      bounceFactor: 0,
    });
  }
}

export function spawnFallingDaggerImpactVfx(
  state: VFXState,
  x: number,
  y: number,
  hitEnemy: boolean
): void {
  // Embedded glowing dagger in flagstone that dissolves into enchanted particles!
  pushNode(state, {
    kind: 'GOB_DAGGER_EMBED_SCAR',
    layer: 'OVER',
    x,
    y,
    angle: (Math.random() - 0.5) * 0.28,
    radius: hitEnemy ? 34 : 26,
    life: 0.58,
    maxLife: 0.58,
    seed: Math.random() * 100,
    isLord: hitEnemy,
  });

  const count = hitEnemy ? 7 : 4;
  for (let i = 0; i < count; i++) {
    const a = (Math.PI * 2 * i) / count + Math.random() * 0.4;
    const isStone = i % 3 === 0;
    pushRichParticle(state, {
      x,
      y,
      z: 4,
      vx: Math.cos(a) * (45 + Math.random() * 65),
      vy: Math.sin(a) * (38 + Math.random() * 52),
      vz: 48 + Math.random() * 45,
      gravity: isStone ? 340 : 180,
      drag: 2.4,
      size: isStone ? 3.8 : 4.2,
      endSize: 1.0,
      rotation: a,
      vRot: 12,
      life: 0.28,
      maxLife: 0.28,
      color: isStone ? '#94A3B8' : i % 2 === 0 ? '#FDE047' : '#34D399',
      secondaryColor: '#0F172A',
      alpha: 0.92,
      shape: isStone ? 'STONE_DEBRIS' : 'STEEL_SPARK',
      layer: 'OVER',
      bounceFactor: 0.35,
    });
  }
}

/**
 * Passive 1 & Windrunner: Nimble Reflexes Evasion Feedback
 */
export function spawnNimbleReflexesEvadeVfx(
  state: VFXState,
  x: number,
  y: number,
  sidestepAngle: number,
  isWindrunner: boolean
): void {
  // Afterimage left at original spot before sidestep
  pushNode(state, {
    kind: 'GOB_SHADOW_AFTERIMAGE',
    layer: 'UNDER',
    x,
    y,
    angle: sidestepAngle,
    radius: 20,
    life: 0.28,
    maxLife: 0.28,
    seed: Math.random() * 100,
    isLord: false,
  });

  // Crisp wind-slipstream ring
  pushNode(state, {
    kind: 'PASSIVE_NIMBLE_EVADE',
    layer: 'OVER',
    x,
    y,
    angle: sidestepAngle,
    radius: 32,
    life: 0.26,
    maxLife: 0.26,
    seed: Math.random() * 100,
    isLord: isWindrunner,
  });

  // Dust & wind particles
  for (let i = 0; i < 8; i++) {
    const a = sidestepAngle + Math.PI + (Math.random() - 0.5) * 1.4;
    pushRichParticle(state, {
      x,
      y: y + 8,
      z: 3,
      vx: Math.cos(a) * (55 + Math.random() * 65),
      vy: Math.sin(a) * (45 + Math.random() * 55),
      vz: 28,
      gravity: i % 2 === 0 ? -10 : 190,
      drag: 2.3,
      size: i % 2 === 0 ? 4.8 : 5.5,
      endSize: i % 2 === 0 ? 1.2 : 10,
      rotation: a,
      vRot: 7,
      life: 0.28,
      maxLife: 0.28,
      color: i % 2 === 0 ? '#5EEAD4' : '#CBD5E1',
      secondaryColor: '#0F766E',
      alpha: 0.85,
      shape: i % 2 === 0 ? 'SPECTRAL_WISP' : 'VAPOR_PLUME',
      layer: 'OVER',
      bounceFactor: 0,
    });
  }
}

// ============================================================================
// CUSTOM PROCEDURAL CANVAS RENDERER FOR ALL GOBLIN VFX NODES
// ============================================================================

function drawTwinDaggerRibbon(
  ctx: CanvasRenderingContext2D,
  radius: number,
  arcSpan: number,
  reveal: number,
  fade: number,
  isPoison: boolean,
  primarySteel: string,
  accentEdge: string
): void {
  const startA = -arcSpan * 0.5;
  const curEndA = startA + arcSpan * reveal;

  // 1. Dark ink outer backing ribbon
  ctx.strokeStyle = '#0F172A';
  ctx.lineWidth = 11 * fade;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.arc(0, 0, radius * 0.84, startA, curEndA);
  ctx.stroke();

  // 2. Primary forged-steel / venom / twilight arc
  ctx.strokeStyle = isPoison ? '#84CC16' : primarySteel;
  ctx.lineWidth = 7.2 * fade;
  ctx.beginPath();
  ctx.arc(0, 0, radius * 0.85, startA + 0.04, curEndA);
  ctx.stroke();

  // 3. Secondary inner speed-edge filament
  ctx.strokeStyle = isPoison ? '#4ADE80' : accentEdge;
  ctx.lineWidth = 3.2 * fade;
  ctx.beginPath();
  ctx.arc(0, 0, radius * 0.68, startA + 0.12, curEndA - 0.05);
  ctx.stroke();

  // 4. Razor white-hot leading tip glint!
  const tipX = Math.cos(curEndA) * radius * 0.85;
  const tipY = Math.sin(curEndA) * radius * 0.85;
  ctx.fillStyle = '#FFFFFF';
  ctx.beginPath();
  ctx.arc(tipX, tipY, 3.5 * fade, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = '#FFFFFF';
  ctx.lineWidth = 1.8 * fade;
  ctx.beginPath();
  ctx.arc(0, 0, radius * 0.87, Math.max(startA, curEndA - 0.45), curEndA);
  ctx.stroke();
}

export function drawGoblinVfxNode(
  ctx: CanvasRenderingContext2D,
  n: VFXNode,
  time: number,
  ratio: number,
  progress: number
): boolean {
  switch (n.kind) {
    case 'GOB_TWIN_DAGGER_SLASH': {
      ctx.rotate(n.angle);
      if (n.flip) ctx.scale(1, -1);
      const reveal = Math.min(1, progress / 0.35);
      const fade = progress < 0.35 ? 1 : (1 - progress) / 0.65;
      ctx.globalAlpha = fade;
      drawTwinDaggerRibbon(
        ctx,
        n.radius,
        1.75,
        reveal,
        fade,
        Boolean(n.isLord),
        '#E2E8F0',
        '#FACC15'
      );
      return true;
    }

    case 'GOB_FLURRY_SLICE': {
      ctx.rotate(n.angle);
      if (n.flip) ctx.scale(1, -1);
      const reveal = Math.min(1, progress / 0.3);
      const fade = progress < 0.35 ? 1 : (1 - progress) / 0.65;
      ctx.globalAlpha = fade;
      drawTwinDaggerRibbon(
        ctx,
        n.radius,
        1.95,
        reveal,
        fade,
        false,
        n.isLord ? '#34D399' : '#FDE047',
        n.isLord ? '#A855F7' : '#F8FAFC'
      );

      // Forward needle thrust streak through the arc center
      ctx.strokeStyle = n.isLord ? '#A7F3D0' : '#FEF9C3';
      ctx.lineWidth = 2.6 * fade;
      ctx.beginPath();
      ctx.moveTo(14, 0);
      ctx.lineTo(n.radius * (0.4 + reveal * 0.68), 0);
      ctx.stroke();
      return true;
    }

    case 'GOB_FLURRY_CROSS_FINISHER':
    case 'GOB_BACKSTAB_CROSS': {
      const isBackstab = n.kind === 'GOB_BACKSTAB_CROSS';
      ctx.rotate(n.angle);
      const reveal = Math.min(1, progress / 0.32);
      const fade = progress < 0.38 ? 1 : (1 - progress) / 0.62;
      ctx.globalAlpha = fade;

      const cPrimary = isBackstab
        ? n.isLord
          ? '#C084FC'
          : '#FB7185'
        : n.isLord
        ? '#84CC16'
        : '#FACC15';
      const cCore = isBackstab ? '#FEF08A' : '#FFFFFF';

      // Crossing twin-dagger X-gashes!
      const len = n.radius * (0.45 + 0.65 * reveal);
      for (const sign of [-1, 1]) {
        ctx.save();
        ctx.rotate(sign * 0.44);

        ctx.fillStyle = '#0F172A';
        ctx.beginPath();
        ctx.moveTo(-len * 0.32, 0);
        ctx.quadraticCurveTo(len * 0.25, -6.5 * fade, len * 0.9, 0);
        ctx.quadraticCurveTo(len * 0.25, 6.5 * fade, -len * 0.32, 0);
        ctx.fill();

        ctx.fillStyle = cPrimary;
        ctx.beginPath();
        ctx.moveTo(-len * 0.26, 0);
        ctx.quadraticCurveTo(len * 0.25, -4.2 * fade, len * 0.86, 0);
        ctx.quadraticCurveTo(len * 0.25, 4.2 * fade, -len * 0.26, 0);
        ctx.fill();

        ctx.strokeStyle = cCore;
        ctx.lineWidth = 2.0 * fade;
        ctx.beginPath();
        ctx.moveTo(-len * 0.18, 0);
        ctx.lineTo(len * 0.8, 0);
        ctx.stroke();

        ctx.restore();
      }

      // Center star glint
      ctx.fillStyle = cCore;
      ctx.beginPath();
      ctx.arc(len * 0.22, 0, 5.5 * fade, 0, Math.PI * 2);
      ctx.fill();
      return true;
    }

    case 'GOB_SHADOW_AFTERIMAGE': {
      // Hand-drawn Goblin silhouette afterimage with pointed ears, hood, and glowing eyes!
      ctx.globalAlpha = ratio * 0.58;
      const facingLeft = Math.cos(n.angle) < -0.15;
      if (facingLeft) ctx.scale(-1, 1);
      ctx.rotate(0.18);

      const silhouetteFill = n.isLord ? '#2E1065' : '#0F766E';
      const rimStroke = n.isLord ? '#C084FC' : '#5EEAD4';

      ctx.fillStyle = silhouetteFill;
      ctx.strokeStyle = rimStroke;
      ctx.lineWidth = 1.8;

      // Cloak/Torso
      ctx.beginPath();
      ctx.roundRect(-9, -4, 18, 16, 6);
      ctx.fill();
      ctx.stroke();

      // Head + Long Pointed Goblin Ears!
      ctx.beginPath();
      ctx.moveTo(-11, -9);
      ctx.lineTo(-22, -14);
      ctx.lineTo(-10, -5);
      ctx.moveTo(11, -9);
      ctx.lineTo(22, -14);
      ctx.lineTo(10, -5);
      ctx.fill();
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(0, -9, 11.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Glowing rogue eye trails
      ctx.fillStyle = '#FACC15';
      ctx.beginPath();
      ctx.arc(-2.5, -9, 2, 0, Math.PI * 2);
      ctx.arc(4.5, -9, 2, 0, Math.PI * 2);
      ctx.fill();
      return true;
    }

    case 'GOB_SHADOWSTEP_RIBBON': {
      ctx.rotate(n.angle);
      ctx.globalAlpha = ratio * 0.72;
      const dist = n.radius;

      // Dark shadow smear on ground
      ctx.strokeStyle = '#1E1B4B';
      ctx.lineWidth = 16 * ratio;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.quadraticCurveTo(dist * 0.5, Math.sin(n.seed) * 14, dist, 0);
      ctx.stroke();

      // Inner emerald-violet shadow filament
      ctx.strokeStyle = '#A855F7';
      ctx.lineWidth = 4.5 * ratio;
      ctx.beginPath();
      ctx.moveTo(4, -3);
      ctx.quadraticCurveTo(dist * 0.5, Math.sin(n.seed) * 10, dist - 4, 2);
      ctx.stroke();

      ctx.strokeStyle = '#34D399';
      ctx.lineWidth = 2.2 * ratio;
      ctx.beginPath();
      ctx.moveTo(8, 3);
      ctx.quadraticCurveTo(dist * 0.5, -Math.sin(n.seed) * 8, dist - 6, -2);
      ctx.stroke();
      return true;
    }

    case 'GOB_TRAP_SCORCH_CRATER': {
      ctx.rotate(n.angle);
      ctx.globalAlpha = Math.min(0.68, ratio * 0.85);

      // Jagged scorched blast mark on flagstones
      ctx.fillStyle = '#0F172A';
      ctx.beginPath();
      for (let i = 0; i < 14; i++) {
        const a = (Math.PI * 2 * i) / 14;
        const r = n.radius * (i % 2 === 0 ? 0.92 : 0.62) * (0.85 + hash01(n.seed + i) * 0.25);
        if (i === 0) ctx.moveTo(Math.cos(a) * r, Math.sin(a) * r * 0.75);
        else ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r * 0.75);
      }
      ctx.closePath();
      ctx.fill();

      // Fading glowing ember fissures in center
      if (ratio > 0.35) {
        ctx.strokeStyle = `rgba(251, 146, 60, ${(ratio - 0.35) * 1.1})`;
        ctx.lineWidth = 2;
        for (let c = 0; c < 4; c++) {
          const ca = (Math.PI * c) / 2 + 0.3;
          ctx.beginPath();
          ctx.moveTo(0, 0);
          ctx.lineTo(Math.cos(ca) * n.radius * 0.45, Math.sin(ca) * n.radius * 0.34);
          ctx.stroke();
        }
      }
      return true;
    }

    case 'GOB_TRAP_BLAST_CORE': {
      const expand = 0.28 + progress * 0.82;
      const fade = progress < 0.25 ? 1 : (1 - progress) / 0.75;
      ctx.globalAlpha = fade;

      // Outer alchemical shockwave wave with broken segments
      ctx.strokeStyle = '#FB923C';
      ctx.lineWidth = 6 * fade;
      ctx.setLineDash([16, 8]);
      ctx.beginPath();
      ctx.ellipse(0, 0, n.radius * expand, n.radius * expand * 0.78, time * 2, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);

      // Multi-lobed fiery-lime alchemical detonation star
      const lobes = 10;
      ctx.fillStyle = '#EA580C';
      ctx.beginPath();
      for (let i = 0; i < lobes * 2; i++) {
        const a = (Math.PI * i) / lobes + progress * 0.6;
        const r =
          i % 2 === 0
            ? n.radius * expand * 0.88 * (0.85 + hash01(n.seed + i) * 0.3)
            : n.radius * expand * 0.42;
        if (i === 0) ctx.moveTo(Math.cos(a) * r, Math.sin(a) * r * 0.82);
        else ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r * 0.82);
      }
      ctx.closePath();
      ctx.fill();

      ctx.scale(0.68, 0.68);
      ctx.fillStyle = '#FEF08A';
      ctx.fill();

      ctx.scale(0.5, 0.5);
      ctx.fillStyle = '#FFFFFF';
      ctx.fill();
      return true;
    }

    case 'GOB_WINDRUNNER_GALE': {
      const fade = Math.min(1, n.life * 2.5);
      ctx.globalAlpha = 0.62 * fade;

      // 3 counter-rotating wind slipstream ribbons under Goblin's feet
      for (let w = 0; w < 3; w++) {
        const rot = time * (6.5 + w * 1.8) + (w * Math.PI * 2) / 3;
        const rx = n.radius * (0.72 + w * 0.16);
        const ry = rx * 0.58;
        ctx.strokeStyle = w === 1 ? '#4ADE80' : '#5EEAD4';
        ctx.lineWidth = 2.4 - w * 0.4;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.ellipse(0, 8, rx, ry, 0, rot, rot + 1.85);
        ctx.stroke();
      }
      return true;
    }

    case 'GOB_POISON_COAT_GLEAM': {
      const fade = ratio;
      ctx.globalAlpha = fade;
      const r = n.radius * (0.45 + progress * 0.65);

      ctx.strokeStyle = '#84CC16';
      ctx.lineWidth = 3.5 * fade;
      ctx.beginPath();
      ctx.moveTo(-r, -8);
      ctx.quadraticCurveTo(0, -22, r, -6);
      ctx.moveTo(-r * 0.85, 4);
      ctx.quadraticCurveTo(0, -10, r * 0.85, 6);
      ctx.stroke();
      return true;
    }

    case 'GOB_PHANTOM_CONVERGENCE': {
      const fade = progress < 0.35 ? 1 : (1 - progress) / 0.65;
      const rushIn = Math.min(1, progress / 0.38);
      ctx.globalAlpha = fade;

      // 4 Phantom Goblin clones lunging inward from X-diagonals to the center!
      for (let c = 0; c < 4; c++) {
        const ca = Math.PI * 0.25 + (Math.PI * 0.5 * c);
        const dist = n.radius * 0.82 * (1 - rushIn * 0.78);
        const cx = Math.cos(ca) * dist;
        const cy = Math.sin(ca) * dist * 0.78;

        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(ca + Math.PI);

        // Phantom slash lance toward center
        ctx.fillStyle = c % 2 === 0 ? '#34D399' : '#FACC15';
        ctx.beginPath();
        ctx.moveTo(-14, 0);
        ctx.lineTo(18, -5 * fade);
        ctx.lineTo(44, 0);
        ctx.lineTo(18, 5 * fade);
        ctx.closePath();
        ctx.fill();

        // Compact phantom Goblin head + ears silhouette
        ctx.fillStyle = '#1E1B4B';
        ctx.strokeStyle = '#5EEAD4';
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        ctx.arc(0, 0, 9, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.restore();
      }

      // Central convergence X-shockwave burst
      if (progress > 0.22) {
        const p2 = (progress - 0.22) / 0.78;
        ctx.strokeStyle = '#FEF08A';
        ctx.lineWidth = 5 * (1 - p2);
        for (const s of [-1, 1]) {
          ctx.beginPath();
          ctx.moveTo(-n.radius * 0.75 * p2, -n.radius * 0.55 * p2 * s);
          ctx.lineTo(n.radius * 0.75 * p2, n.radius * 0.55 * p2 * s);
          ctx.stroke();
        }
      }
      return true;
    }

    case 'GOB_SHADOW_PORTAL': {
      const openScale = progress < 0.2 ? progress / 0.2 : ratio < 0.28 ? ratio / 0.28 : 1;
      ctx.scale(openScale, openScale * 0.65);
      ctx.globalAlpha = Math.min(1, ratio * 1.4);

      // Jagged twilight shadow rift on floor
      ctx.fillStyle = '#090514';
      ctx.strokeStyle = '#A855F7';
      ctx.lineWidth = 3;
      ctx.beginPath();
      for (let i = 0; i < 12; i++) {
        const a = (Math.PI * 2 * i) / 12 + time * 3;
        const r = n.radius * (i % 2 === 0 ? 1.08 : 0.74);
        if (i === 0) ctx.moveTo(Math.cos(a) * r, Math.sin(a) * r);
        else ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
      }
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Inner emerald thief-eye core swirl
      ctx.strokeStyle = '#34D399';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, 0, n.radius * 0.52, time * 5, time * 5 + Math.PI * 1.4);
      ctx.stroke();
      return true;
    }

    case 'GOB_THIEF_SIPHON_TETHER': {
      const sub = n.subPoints && n.subPoints[0];
      if (!sub) return true;
      ctx.globalAlpha = ratio * 0.92;

      const ctrlX = sub.x * 0.5 - sub.y * 0.32;
      const ctrlY = sub.y * 0.5 + sub.x * 0.32 - 14;

      ctx.strokeStyle = '#A855F7';
      ctx.lineWidth = 5.5 * ratio;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.quadraticCurveTo(ctrlX, ctrlY, sub.x, sub.y);
      ctx.stroke();

      ctx.strokeStyle = '#4ADE80';
      ctx.lineWidth = 2.4 * ratio;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.quadraticCurveTo(ctrlX, ctrlY - 4, sub.x, sub.y);
      ctx.stroke();
      return true;
    }

    case 'GOB_THIEF_CROWN_BURST': {
      const fade = ratio;
      ctx.globalAlpha = fade;

      // Expanding dark-emerald & gold thief's crown emblem above Goblin
      const cy = -34 - progress * 10;
      ctx.save();
      ctx.translate(0, cy);
      const s = 0.85 + progress * 0.35;
      ctx.scale(s, s);

      ctx.fillStyle = '#FACC15';
      ctx.strokeStyle = '#1E1B4B';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(-16, 6);
      ctx.lineTo(-19, -8);
      ctx.lineTo(-8, -1);
      ctx.lineTo(0, -13);
      ctx.lineTo(8, -1);
      ctx.lineTo(19, -8);
      ctx.lineTo(16, 6);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Emerald crown jewel
      ctx.fillStyle = '#10B981';
      ctx.beginPath();
      ctx.arc(0, -1, 3.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // Ground absorption pulse
      ctx.strokeStyle = '#C084FC';
      ctx.lineWidth = 4 * fade;
      ctx.setLineDash([12, 8]);
      ctx.beginPath();
      ctx.ellipse(0, 6, n.radius * (0.35 + progress * 0.65), n.radius * 0.45 * (0.35 + progress * 0.65), 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
      return true;
    }

    case 'GOB_THOUSAND_LAUNCH_HALO': {
      const fade = ratio;
      ctx.globalAlpha = fade;
      const rise = progress * 48;

      // Spinning halo of 8 enchanted golden-emerald daggers rising skyward!
      for (let d = 0; d < 8; d++) {
        const a = (Math.PI * 2 * d) / 8 + progress * 4.5;
        const dx = Math.cos(a) * n.radius * (0.65 + progress * 0.35);
        const dy = Math.sin(a) * n.radius * 0.42 - 22 - rise;

        ctx.save();
        ctx.translate(dx, dy);
        ctx.fillStyle = d % 2 === 0 ? '#FACC15' : '#34D399';
        ctx.strokeStyle = '#0F172A';
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        ctx.moveTo(0, -12);
        ctx.lineTo(3.5, 0);
        ctx.lineTo(0, 4);
        ctx.lineTo(-3.5, 0);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.restore();
      }
      return true;
    }

    case 'GOB_DAGGER_EMBED_SCAR': {
      // Shockwave ripple on impact + embedded enchanted dagger dissolving into golden motes!
      if (progress < 0.45) {
        const pWave = progress / 0.45;
        ctx.globalAlpha = (1 - pWave) * 0.85;
        ctx.strokeStyle = n.isLord ? '#FACC15' : '#34D399';
        ctx.lineWidth = 3 * (1 - pWave);
        ctx.beginPath();
        ctx.ellipse(0, 2, n.radius * pWave, n.radius * 0.62 * pWave, 0, 0, Math.PI * 2);
        ctx.stroke();
      }

      const dissolve = ratio < 0.45 ? ratio / 0.45 : 1;
      ctx.globalAlpha = dissolve;

      // Tiny stone crack
      ctx.strokeStyle = '#0F172A';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(-7, 2);
      ctx.lineTo(7, -1);
      ctx.moveTo(-3, -3);
      ctx.lineTo(4, 4);
      ctx.stroke();

      // Embedded curved rogue dagger sticking out of floor
      ctx.rotate(n.angle);
      ctx.fillStyle = '#E2E8F0';
      ctx.strokeStyle = '#18181B';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, 1);
      ctx.lineTo(-3.5, -11);
      ctx.lineTo(3.5, -11);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Brass crossguard & wrapped hilt
      ctx.strokeStyle = '#F59E0B';
      ctx.lineWidth = 2.6;
      ctx.beginPath();
      ctx.moveTo(-5.5, -11);
      ctx.lineTo(5.5, -11);
      ctx.stroke();

      ctx.strokeStyle = '#78350F';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(0, -11);
      ctx.lineTo(0, -18);
      ctx.stroke();

      ctx.fillStyle = '#34D399';
      ctx.beginPath();
      ctx.arc(0, -19, 2.3, 0, Math.PI * 2);
      ctx.fill();
      return true;
    }

    case 'IMPACT_BURST_DAGGER':
    case 'IMPACT_BURST_BACKSTAB': {
      const isBackstab = n.kind === 'IMPACT_BURST_BACKSTAB';
      ctx.rotate(n.angle);
      const expand = 0.42 + progress * 0.78;
      ctx.globalAlpha = ratio;

      const spikes = isBackstab ? 8 : 6;
      ctx.fillStyle = '#0F172A';
      ctx.beginPath();
      for (let s = 0; s < spikes * 2; s++) {
        const a = (Math.PI * s) / spikes;
        const asym = Math.cos(a) > 0 ? 1.35 : 0.75;
        const r =
          s % 2 === 0
            ? n.radius * expand * asym * (0.85 + hash01(n.seed + s) * 0.3)
            : n.radius * 0.22 * expand;
        if (s === 0) ctx.moveTo(Math.cos(a) * r, Math.sin(a) * r);
        else ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
      }
      ctx.closePath();
      ctx.fill();

      ctx.scale(0.84, 0.84);
      ctx.fillStyle = isBackstab ? '#FB7185' : n.isLord ? '#FACC15' : '#E2E8F0';
      ctx.fill();

      ctx.scale(0.5, 0.5);
      ctx.fillStyle = '#FFFFFF';
      ctx.fill();
      return true;
    }

    case 'PASSIVE_NIMBLE_EVADE': {
      ctx.rotate(n.angle);
      ctx.globalAlpha = ratio * 0.9;
      const r = n.radius * (0.55 + progress * 0.6);

      ctx.strokeStyle = n.isLord ? '#4ADE80' : '#5EEAD4';
      ctx.lineWidth = 3.5 * ratio;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.arc(0, 0, r, -1.25, 1.25);
      ctx.stroke();

      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 1.8 * ratio;
      ctx.beginPath();
      ctx.arc(0, 0, r * 0.78, -0.9, 0.9);
      ctx.stroke();
      return true;
    }

    default:
      return false;
  }
}
