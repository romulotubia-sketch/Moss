import { getAbilityById } from '../data/abilities';
import { ActiveActionAnim, AnimPhase, PlayerState } from '../types';

export interface RigPose {
  bobY: number;
  scaleX: number;
  scaleY: number;
  tiltAngle: number;
  lungeOffset: number;
  leftArmAngle: number;
  rightArmAngle: number;
  sproutSway: number;
  cloakFlare: number;
  clawGlowIntensity: number;
  clawGlowColor: string;
  bodyGlowColor: string | null;
  bodyGlowAlpha: number;
}

export function isBasicAttackAbility(abilityId: string): boolean {
  return (
    abilityId === 'zombie_claw' ||
    abilityId === 'skeleton_bone_strike' ||
    abilityId === 'goblin_twin_daggers'
  );
}

export function startAbilityAnimation(
  player: PlayerState,
  abilityId: string,
  aimAngle: number
): void {
  const def = getAbilityById(abilityId);
  const isBasic = isBasicAttackAbility(abilityId);
  const transformMul =
    player.lordOfDecayTimer > 0
      ? isBasic
        ? 1.45
        : 1.15
      : player.boneColossusTimer > 0
      ? isBasic
        ? 1.15
        : 1.1
      : player.windrunnerTimer > 0 && isBasic
      ? 1.18
      : 1.0;
  const speedFactor = isBasic ? player.stats.attackSpeed * transformMul : transformMul;

  player.facingAngle = aimAngle;
  player.activeAnim = {
    abilityId,
    phase: AnimPhase.ANTICIPATION,
    phaseTimer: 0,
    phaseDuration: Math.max(0.03, def.anticipationTime / speedFactor),
    executedHit: false,
    aimAngle,
    comboIndex: player.comboStep,
  };

  if (abilityId === 'zombie_claw') {
    player.comboStep = (player.comboStep + 1) % 2;
  } else if (abilityId === 'skeleton_bone_strike') {
    player.comboStep = (player.comboStep + 1) % 3;
  } else if (abilityId === 'goblin_twin_daggers') {
    player.comboStep = (player.comboStep + 1) % 4;
  }
}

/**
 * Advances the 3-phase animation state machine (Anticipation -> Execution -> Recovery).
 * Returns the ActiveActionAnim on the exact frame Execution begins so CombatSystem triggers hitboxes & VFX synchronously.
 */
export function updateAbilityAnimation(player: PlayerState, dt: number): ActiveActionAnim | null {
  const anim = player.activeAnim;
  if (!anim) return null;

  const def = getAbilityById(anim.abilityId);
  const isBasic = isBasicAttackAbility(anim.abilityId);
  const transformMul =
    player.lordOfDecayTimer > 0
      ? isBasic
        ? 1.45
        : 1.15
      : player.boneColossusTimer > 0
      ? isBasic
        ? 1.15
        : 1.1
      : player.windrunnerTimer > 0 && isBasic
      ? 1.18
      : 1.0;
  const speedFactor = isBasic ? player.stats.attackSpeed * transformMul : transformMul;

  anim.phaseTimer += dt;

  if (anim.phase === AnimPhase.ANTICIPATION && anim.phaseTimer >= anim.phaseDuration) {
    anim.phase = AnimPhase.EXECUTION;
    anim.phaseTimer = 0;
    anim.phaseDuration = Math.max(0.05, def.executionTime / speedFactor);
    return anim; // Signal execution frame!
  }

  if (anim.phase === AnimPhase.EXECUTION && anim.phaseTimer >= anim.phaseDuration) {
    anim.phase = AnimPhase.RECOVERY;
    anim.phaseTimer = 0;
    anim.phaseDuration = Math.max(0.04, def.recoveryTime / speedFactor);
    return null;
  }

  if (anim.phase === AnimPhase.RECOVERY && anim.phaseTimer >= anim.phaseDuration) {
    player.activeAnim = null;
    return null;
  }

  return null;
}

export function computeZombieRigPose(player: PlayerState): RigPose {
  const isMoving = Math.hypot(player.vx, player.vy) > 12;
  const isLord = player.lordOfDecayTimer > 0;

  const pose: RigPose = {
    bobY: 0,
    scaleX: 1,
    scaleY: 1,
    tiltAngle: 0,
    lungeOffset: 0,
    leftArmAngle: -0.45,
    rightArmAngle: 0.45,
    sproutSway: Math.sin(player.idleTime * 3.2) * 0.18,
    cloakFlare: isLord ? 0.35 : 0,
    clawGlowIntensity: isLord ? 0.55 : 0,
    clawGlowColor: isLord ? '#34D399' : '#84CC16',
    bodyGlowColor: null,
    bodyGlowAlpha: 0,
  };

  // Continuous regenerative body pulse while Undead Regeneration is active
  if (player.regenTimer > 0) {
    pose.bodyGlowColor = '#4ADE80';
    pose.bodyGlowAlpha = 0.22 + Math.abs(Math.sin(player.idleTime * 6.5)) * 0.2;
  }

  if (player.isDead) {
    const t = Math.min(1, player.deathTimer / 0.9);
    pose.tiltAngle = t * 1.45;
    pose.bobY = t * 8;
    pose.scaleY = 1 - t * 0.28;
    pose.scaleX = 1 + t * 0.18;
    return pose;
  }

  // Base Idle vs Walking cycle
  if (isMoving) {
    const w = player.walkCycle;
    pose.bobY = -Math.abs(Math.sin(w)) * 5.2;
    pose.tiltAngle = Math.sin(w) * 0.11;
    pose.scaleX = 1 + Math.sin(w * 2) * 0.04;
    pose.scaleY = 1 - Math.sin(w * 2) * 0.04;
    pose.leftArmAngle = -0.5 + Math.sin(w) * 0.45;
    pose.rightArmAngle = 0.5 - Math.sin(w) * 0.45;
    pose.sproutSway = Math.sin(w - 0.5) * 0.32;
    pose.cloakFlare = Math.max(pose.cloakFlare, 0.35 + Math.abs(Math.cos(w)) * 0.25);
  } else {
    const b = player.idleTime * 2.8;
    pose.bobY = Math.sin(b) * 2.1;
    pose.scaleX = 1 + Math.sin(b) * 0.025;
    pose.scaleY = 1 - Math.sin(b) * 0.025;
    pose.tiltAngle = Math.sin(b * 0.5) * 0.035;
    pose.leftArmAngle = -0.42 + Math.sin(b) * 0.08;
    pose.rightArmAngle = 0.42 - Math.sin(b) * 0.08;
  }

  // Dodge Roll hop override
  if (player.dodgeTimer > 0) {
    const p = player.dodgeTimer / 0.22;
    pose.bobY = -Math.sin(p * Math.PI) * 11;
    pose.scaleX = 1.14;
    pose.scaleY = 0.86;
    pose.cloakFlare = 0.9;
  }

  // Damage reaction recoil
  if (player.hurtFlash > 0) {
    pose.tiltAngle -= 0.22 * (player.hurtFlash / 0.22);
    pose.scaleX = 1.12;
    pose.scaleY = 0.88;
  }

  // 3-Phase Expressive Ability Animation Pose Layer
  const anim = player.activeAnim;
  if (anim) {
    const t = Math.min(1, anim.phaseTimer / Math.max(0.01, anim.phaseDuration));
    const isRightSwipe = anim.comboIndex % 2 === 1;

    switch (anim.abilityId) {
      case 'zombie_claw': {
        if (anim.phase === AnimPhase.ANTICIPATION) {
          pose.lungeOffset = -6 * t;
          pose.scaleX = 0.94;
          pose.scaleY = 1.07;
          pose.clawGlowIntensity = Math.max(pose.clawGlowIntensity, 0.45 * t);
          pose.clawGlowColor = isLord ? '#C084FC' : '#34D399';
          if (isRightSwipe) {
            pose.rightArmAngle = 1.55 * t;
          } else {
            pose.leftArmAngle = -1.55 * t;
          }
        } else if (anim.phase === AnimPhase.EXECUTION) {
          pose.lungeOffset = (isLord ? 13 : 9) * (1 - t * 0.3);
          pose.scaleX = isLord ? 1.16 : 1.1;
          pose.scaleY = 0.91;
          pose.cloakFlare = isLord ? 0.95 : 0.65;
          pose.clawGlowIntensity = isLord ? 1.0 : 0.65 * (1 - t);
          pose.clawGlowColor = isLord ? '#C084FC' : '#34D399';
          if (isRightSwipe) {
            pose.rightArmAngle = 1.55 - 2.55 * t;
          } else {
            pose.leftArmAngle = -1.55 + 2.55 * t;
          }
        } else if (anim.phase === AnimPhase.RECOVERY) {
          pose.lungeOffset = 6 * (1 - t);
          if (isRightSwipe) {
            pose.rightArmAngle = -1.0 * (1 - t) + 0.45 * t;
          } else {
            pose.leftArmAngle = 1.0 * (1 - t) - 0.45 * t;
          }
        }
        break;
      }

      case 'zombie_flesh_ripper': {
        // Flesh Ripper: Pulls claw arm far back as claws glow with sickly green energy, then tears forward!
        if (anim.phase === AnimPhase.ANTICIPATION) {
          const ease = 1 - Math.pow(1 - t, 2);
          pose.lungeOffset = -11 * ease;
          pose.tiltAngle = -0.28 * ease;
          pose.scaleX = 1.12;
          pose.scaleY = 0.89;
          pose.rightArmAngle = 0.45 + 1.65 * ease; // Pulls dominant claw arm far behind shoulder!
          pose.leftArmAngle = -0.45 - 0.95 * ease;
          pose.clawGlowIntensity = 0.35 + 0.65 * ease;
          pose.clawGlowColor = '#84CC16'; // Sickly necrotic green glow!
        } else if (anim.phase === AnimPhase.EXECUTION) {
          pose.lungeOffset = 17 * Math.sin(t * Math.PI);
          pose.tiltAngle = 0.22 * (1 - t);
          pose.scaleX = 1.22 - 0.12 * t;
          pose.scaleY = 0.86 + 0.1 * t;
          pose.rightArmAngle = 2.1 - 3.65 * Math.min(1, t * 1.35);
          pose.leftArmAngle = -1.4 + 2.65 * Math.min(1, t * 1.25);
          pose.cloakFlare = 1.1;
          pose.clawGlowIntensity = 1.0 * (1 - t * 0.55);
          pose.clawGlowColor = '#84CC16';
        } else {
          pose.lungeOffset = 5 * (1 - t);
          pose.clawGlowIntensity = 0.45 * (1 - t);
          pose.clawGlowColor = '#84CC16';
        }
        break;
      }

      case 'zombie_plague_burst': {
        // Plague Burst: Zombie crouches low, trembles, and glows with infected green energy before erupting!
        if (anim.phase === AnimPhase.ANTICIPATION) {
          const tremor = Math.sin(t * 36) * 0.04;
          pose.bobY = 7.5 * t; // Deep crouch downward!
          pose.scaleX = 1 + 0.24 * t;
          pose.scaleY = 1 - 0.25 * t;
          pose.tiltAngle = tremor;
          pose.leftArmAngle = -0.12;
          pose.rightArmAngle = 0.12;
          pose.bodyGlowColor = '#84CC16';
          pose.bodyGlowAlpha = 0.18 + 0.52 * t;
          pose.clawGlowIntensity = 0.6 * t;
          pose.clawGlowColor = '#A3E635';
        } else if (anim.phase === AnimPhase.EXECUTION) {
          pose.bobY = -4 * (1 - t);
          pose.scaleX = 1.26 - 0.24 * t;
          pose.scaleY = 0.82 + 0.18 * t;
          pose.leftArmAngle = -1.7;
          pose.rightArmAngle = 1.7;
          pose.cloakFlare = 1.25;
          pose.bodyGlowColor = '#A3E635';
          pose.bodyGlowAlpha = 0.7 * (1 - t);
        }
        break;
      }

      case 'zombie_deaths_embrace': {
        if (anim.phase === AnimPhase.ANTICIPATION) {
          pose.bobY = -8 * t;
          pose.leftArmAngle = -1.65 * t;
          pose.rightArmAngle = 1.65 * t;
          pose.clawGlowIntensity = 0.85 * t;
          pose.clawGlowColor = '#C084FC';
          pose.bodyGlowColor = '#A855F7';
          pose.bodyGlowAlpha = 0.35 * t;
        } else if (anim.phase === AnimPhase.EXECUTION) {
          pose.bobY = 6 * (1 - t); // Slams hands downward to summon underground arms!
          pose.scaleX = 1.18;
          pose.scaleY = 0.83;
          pose.leftArmAngle = -0.75;
          pose.rightArmAngle = 0.75;
          pose.cloakFlare = 1.0;
          pose.clawGlowIntensity = 0.8 * (1 - t);
          pose.clawGlowColor = '#C084FC';
        }
        break;
      }

      case 'zombie_rotting_dash': {
        // Rotting Dash: Lowers body before dashing, then stretches & leans sharply forward!
        const leanSign = Math.cos(anim.aimAngle) >= 0 ? 1 : -1;
        if (anim.phase === AnimPhase.ANTICIPATION) {
          pose.bobY = 7.0 * t; // Lowers body into sprinter crouch!
          pose.lungeOffset = -7 * t;
          pose.scaleX = 1 + 0.2 * t;
          pose.scaleY = 1 - 0.24 * t;
          pose.tiltAngle = -0.14 * leanSign * t;
          pose.leftArmAngle = -1.35 * t;
          pose.rightArmAngle = 1.35 * t;
          pose.bodyGlowColor = '#2DD4BF';
          pose.bodyGlowAlpha = 0.38 * t;
        } else if (anim.phase === AnimPhase.EXECUTION) {
          pose.bobY = 2;
          pose.lungeOffset = 16 * (1 - t * 0.35);
          pose.scaleX = 1.34 - 0.22 * t; // Stretches along acceleration!
          pose.scaleY = 0.75 + 0.18 * t;
          pose.tiltAngle = 0.32 * leanSign * (1 - t * 0.3); // Leans forward!
          pose.leftArmAngle = -2.35;
          pose.rightArmAngle = 2.35;
          pose.cloakFlare = 1.45;
          pose.bodyGlowColor = '#2DD4BF';
          pose.bodyGlowAlpha = 0.45 * (1 - t);
        } else {
          pose.scaleX = 1.12 - 0.12 * t;
          pose.scaleY = 0.92 + 0.08 * t;
        }
        break;
      }

      case 'zombie_undead_regen': {
        // Undead Regeneration: Briefly pauses, draws hands inward, and glows warmly!
        if (anim.phase === AnimPhase.ANTICIPATION) {
          pose.bobY = -2.5 * t;
          pose.scaleX = 1 + 0.06 * t;
          pose.scaleY = 1 + 0.06 * t;
          pose.leftArmAngle = 0.22 * t;
          pose.rightArmAngle = -0.22 * t;
          pose.bodyGlowColor = '#4ADE80';
          pose.bodyGlowAlpha = 0.65 * t;
          pose.clawGlowIntensity = 0.7 * t;
          pose.clawGlowColor = '#86EFAC';
        } else if (anim.phase === AnimPhase.EXECUTION) {
          pose.bobY = -3 * (1 - t);
          pose.scaleX = 1.1 - 0.08 * t;
          pose.scaleY = 1.08 - 0.08 * t;
          pose.leftArmAngle = -0.95 * t;
          pose.rightArmAngle = 0.95 * t;
          pose.cloakFlare = 0.7;
          pose.bodyGlowColor = '#4ADE80';
          pose.bodyGlowAlpha = 0.75 * (1 - t * 0.5);
        }
        break;
      }

      case 'zombie_ult_apocalypse':
      case 'zombie_ult_graveyard': {
        if (anim.phase === AnimPhase.ANTICIPATION) {
          pose.bobY = -12 * t;
          pose.leftArmAngle = -1.75 * t;
          pose.rightArmAngle = 1.75 * t;
          pose.cloakFlare = 0.9 * t;
          pose.clawGlowIntensity = 0.95 * t;
          pose.clawGlowColor = anim.abilityId === 'zombie_ult_apocalypse' ? '#FBBF24' : '#C084FC';
          pose.bodyGlowColor = pose.clawGlowColor;
          pose.bodyGlowAlpha = 0.45 * t;
        } else if (anim.phase === AnimPhase.EXECUTION) {
          pose.bobY = 5 * (1 - t);
          pose.scaleX = 1.2;
          pose.scaleY = 0.82;
          pose.leftArmAngle = -0.85;
          pose.rightArmAngle = 0.85;
          pose.cloakFlare = 1.25;
          pose.bodyGlowColor = anim.abilityId === 'zombie_ult_apocalypse' ? '#FBBF24' : '#C084FC';
          pose.bodyGlowAlpha = 0.6 * (1 - t);
        }
        break;
      }

      case 'zombie_ult_lord_of_decay': {
        // Full Transformation Animation: Levitates in swirling toxic energy, then bursts into Sovereign stature!
        if (anim.phase === AnimPhase.ANTICIPATION) {
          pose.bobY = -15 * Math.sin(t * Math.PI * 0.5);
          pose.scaleX = 0.94 + Math.sin(t * 28) * 0.04;
          pose.scaleY = 1.08;
          pose.leftArmAngle = -0.2;
          pose.rightArmAngle = 0.2;
          pose.cloakFlare = 1.1 * t;
          pose.bodyGlowColor = '#10B981';
          pose.bodyGlowAlpha = 0.75 * t;
          pose.clawGlowIntensity = 1.0 * t;
          pose.clawGlowColor = '#34D399';
        } else if (anim.phase === AnimPhase.EXECUTION) {
          pose.bobY = -4 * (1 - t);
          pose.scaleX = 1.28 - 0.18 * t;
          pose.scaleY = 1.22 - 0.16 * t;
          pose.leftArmAngle = -1.75;
          pose.rightArmAngle = 1.75;
          pose.cloakFlare = 1.5;
          pose.bodyGlowColor = '#34D399';
          pose.bodyGlowAlpha = 0.85 * (1 - t * 0.6);
          pose.clawGlowIntensity = 1.0;
          pose.clawGlowColor = '#C084FC';
        }
        break;
      }
    }
  }

  return pose;
}
