import { AnimPhase, HazardZone, PlayerState, Projectile } from '../types';

interface GoblinPose {
  bobY: number;
  jumpZ: number;
  scaleX: number;
  scaleY: number;
  torsoTilt: number;
  lungeX: number;
  lungeY: number;
  rightArmAngle: number;
  rightDaggerAngle: number;
  leftArmAngle: number;
  leftDaggerAngle: number;
  earPerk: number; // positive = perked up, negative = pinned back for speed/crouch
  scarfWave: number;
  grinIntensity: number; // 0 = cheeky smirk, 1 = wide mischievous grin
  daggerGlow: number;
  daggerGlowColor: string;
  spinAngle: number;
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * Math.max(0, Math.min(1, t));
}

function computeGoblinRigPose(player: PlayerState, time: number): GoblinPose {
  const speed = Math.hypot(player.vx, player.vy);
  const isMoving = speed > 12;
  const isWindrunner = player.windrunnerTimer > 0;
  const isPoisonCoated = player.poisonedBladesTimer > 0;
  const isStolenMight = player.kingOfThievesBuffTimer > 0;
  const aim = player.facingAngle;

  // Energetic nimble idle & agile runner lean
  const moveSign = Math.cos(aim) >= 0 ? 1 : -1;
  const runLean = isMoving ? moveSign * (isWindrunner ? 0.24 : 0.14) : 0;

  const pose: GoblinPose = {
    bobY: isMoving
      ? Math.abs(Math.sin(player.walkCycle * 1.15)) * (isWindrunner ? 5.2 : 4.2)
      : Math.sin(time * 3.8) * 1.6,
    jumpZ: 0,
    scaleX: isMoving ? 1 + Math.sin(player.walkCycle * 2) * 0.04 : 1 + Math.sin(time * 3.8) * 0.02,
    scaleY: isMoving ? 1 - Math.sin(player.walkCycle * 2) * 0.04 : 1 - Math.sin(time * 3.8) * 0.02,
    torsoTilt: runLean + (isMoving ? Math.sin(player.walkCycle) * 0.07 : Math.sin(time * 2.1) * 0.03),
    lungeX: 0,
    lungeY: 0,
    rightArmAngle:
      aim + 0.58 + (isMoving ? Math.sin(player.walkCycle) * 0.28 : Math.sin(time * 3.2) * 0.07),
    rightDaggerAngle: 0.2,
    leftArmAngle:
      aim - 0.68 + (isMoving ? -Math.sin(player.walkCycle) * 0.28 : -Math.sin(time * 3.2) * 0.07),
    leftDaggerAngle: Math.PI - 0.25, // Reverse assassin grip on off-hand!
    earPerk: isWindrunner
      ? -0.32
      : isMoving
      ? -0.16 + Math.sin(player.walkCycle * 2) * 0.08
      : Math.sin(time * 2.6) * 0.07 + (Math.sin(time * 7.3) > 0.92 ? 0.18 : 0),
    scarfWave: isWindrunner ? 1.75 : isMoving ? 1.15 : 0.38,
    grinIntensity: isStolenMight ? 0.85 : 0.25,
    daggerGlow: isPoisonCoated ? 0.92 : isStolenMight ? 0.6 : 0.2,
    daggerGlowColor: isPoisonCoated ? '#84CC16' : isStolenMight ? '#C084FC' : '#FACC15',
    spinAngle: 0,
  };

  // Nimble Dodge / Passive Evade sidestep acrobatics
  if (player.dodgeTimer > 0 || player.nimbleEvadeTimer > 0) {
    pose.jumpZ = 7;
    pose.scaleX = 1.18;
    pose.scaleY = 0.82;
    pose.torsoTilt = (player.dodgeDirX >= 0 ? 1 : -1) * 0.34;
    pose.earPerk = -0.38;
    pose.scarfWave = 1.9;
  }

  // Hurt recoil
  if (player.hurtFlash > 0) {
    pose.torsoTilt -= 0.26 * (player.hurtFlash / 0.22);
    pose.scaleX = 1.14;
    pose.scaleY = 0.86;
    pose.earPerk = -0.42;
  }

  // Death collapse
  if (player.isDead) {
    const dt = Math.min(1, player.deathTimer / 0.85);
    pose.torsoTilt = dt * 1.5;
    pose.bobY = -dt * 7;
    pose.scaleX = 1 + dt * 0.18;
    pose.scaleY = 1 - dt * 0.26;
    pose.earPerk = -0.5;
    return pose;
  }

  const anim = player.activeAnim;
  if (!anim) return pose;

  const p = Math.max(0, Math.min(1, anim.phaseTimer / Math.max(0.01, anim.phaseDuration)));
  const a = anim.aimAngle;

  switch (anim.abilityId) {
    case 'goblin_twin_daggers': {
      // Rapid alternating Right -> Left -> Right -> Twin Cross-Finisher!
      const step = anim.comboIndex % 4;
      const isFinisher = step === 3;
      const useLeft = step === 1;

      if (anim.phase === AnimPhase.ANTICIPATION) {
        pose.scaleX = 0.94;
        pose.scaleY = 1.06;
        pose.earPerk = -0.22 * p;
        if (isFinisher) {
          pose.rightArmAngle = lerp(a + 0.5, a + 1.65, p);
          pose.leftArmAngle = lerp(a - 0.5, a - 1.65, p);
          pose.grinIntensity = 0.9;
        } else if (useLeft) {
          pose.leftArmAngle = lerp(a - 0.65, a - 1.55, p);
          pose.leftDaggerAngle = 0.25;
        } else {
          pose.rightArmAngle = lerp(a + 0.55, a + 1.55, p);
        }
      } else if (anim.phase === AnimPhase.EXECUTION) {
        const snap = 1 - Math.pow(1 - p, 3);
        pose.lungeX = Math.cos(a) * (isFinisher ? 11 : 7) * Math.sin(p * Math.PI);
        pose.lungeY = Math.sin(a) * (isFinisher ? 9 : 5.5) * Math.sin(p * Math.PI);
        pose.scaleX = isFinisher ? 1.18 : 1.12;
        pose.scaleY = 0.88;
        pose.scarfWave = 1.45;
        pose.daggerGlow = 1.0;

        if (isFinisher) {
          pose.rightArmAngle = lerp(a + 1.65, a - 1.15, snap);
          pose.leftArmAngle = lerp(a - 1.65, a + 1.15, snap);
          pose.leftDaggerAngle = 0.2;
          pose.torsoTilt = moveSign * 0.26;
          pose.grinIntensity = 1.0;
        } else if (useLeft) {
          pose.leftArmAngle = lerp(a - 1.55, a + 1.25, snap);
          pose.leftDaggerAngle = 0.25;
          pose.torsoTilt = -0.2;
        } else {
          pose.rightArmAngle = lerp(a + 1.55, a - 1.25, snap);
          pose.torsoTilt = 0.2;
        }
      } else {
        pose.torsoTilt = lerp(pose.torsoTilt, 0, p);
      }
      break;
    }

    case 'goblin_dagger_flurry': {
      if (anim.phase === AnimPhase.ANTICIPATION) {
        // Low predator crouch with both daggers drawn back
        pose.bobY = -5.5 * p;
        pose.scaleX = 1 + 0.18 * p;
        pose.scaleY = 1 - 0.2 * p;
        pose.rightArmAngle = a + 1.6 * p;
        pose.leftArmAngle = a - 1.6 * p;
        pose.earPerk = -0.35 * p;
        pose.grinIntensity = 0.85;
        pose.daggerGlow = 0.9;
      } else if (anim.phase === AnimPhase.EXECUTION) {
        // Blinding alternating flurry oscillations + lunging cross finish!
        const osc = Math.sin(p * Math.PI * 10);
        pose.lungeX = Math.cos(a) * (8 + Math.sin(p * Math.PI) * 8);
        pose.lungeY = Math.sin(a) * (6 + Math.sin(p * Math.PI) * 6);
        pose.scaleX = 1.16;
        pose.scaleY = 0.86;
        pose.rightArmAngle = a + osc * 1.45;
        pose.leftArmAngle = a - osc * 1.45;
        pose.leftDaggerAngle = 0.2;
        pose.torsoTilt = osc * 0.18;
        pose.scarfWave = 1.85;
        pose.grinIntensity = 1.0;
        pose.daggerGlow = 1.0;
      }
      break;
    }

    case 'goblin_shadowstep': {
      if (anim.phase === AnimPhase.ANTICIPATION) {
        // Crouches into ground shadow
        pose.bobY = -7 * p;
        pose.scaleX = 1.22;
        pose.scaleY = 0.74;
        pose.earPerk = -0.4;
        pose.daggerGlow = 0.95;
        pose.daggerGlowColor = '#C084FC';
      } else if (anim.phase === AnimPhase.EXECUTION) {
        // Surprise twin-blade backstab strike!
        const snap = 1 - Math.pow(1 - p, 3);
        pose.lungeX = Math.cos(a) * 12 * (1 - p * 0.4);
        pose.lungeY = Math.sin(a) * 10 * (1 - p * 0.4);
        pose.rightArmAngle = lerp(a + 1.6, a - 1.1, snap);
        pose.leftArmAngle = lerp(a - 1.6, a + 1.1, snap);
        pose.leftDaggerAngle = 0.2;
        pose.grinIntensity = 1.0;
        pose.daggerGlow = 1.0;
        pose.daggerGlowColor = '#C084FC';
      }
      break;
    }

    case 'goblin_explosive_trap': {
      if (anim.phase === AnimPhase.ANTICIPATION) {
        // Crouches low bringing hands together in front to tinker trap
        pose.bobY = -6.5 * p;
        pose.scaleX = 1.14;
        pose.scaleY = 0.84;
        pose.rightArmAngle = a + 0.22;
        pose.leftArmAngle = a - 0.22;
        pose.earPerk = 0.22;
      } else if (anim.phase === AnimPhase.EXECUTION) {
        // Nimble toss/plant & cheeky back-hop!
        pose.jumpZ = Math.sin(p * Math.PI) * 6;
        pose.rightArmAngle = a + 0.85 * p;
        pose.leftArmAngle = a - 0.85 * p;
        pose.grinIntensity = 0.95;
      }
      break;
    }

    case 'goblin_windrunner': {
      if (anim.phase === AnimPhase.ANTICIPATION) {
        pose.bobY = -5 * p;
        pose.scaleX = 1.15;
        pose.scaleY = 0.84;
        pose.earPerk = -0.35;
      } else if (anim.phase === AnimPhase.EXECUTION) {
        pose.jumpZ = Math.sin(p * Math.PI) * 9;
        pose.scaleX = 0.92;
        pose.scaleY = 1.1;
        pose.scarfWave = 2.0;
        pose.earPerk = 0.3;
        pose.grinIntensity = 0.9;
      }
      break;
    }

    case 'goblin_poisoned_blades': {
      if (anim.phase === AnimPhase.ANTICIPATION) {
        // Brings both daggers inward to coat them in glowing toxin!
        pose.rightArmAngle = a + 0.18;
        pose.leftArmAngle = a - 0.18;
        pose.leftDaggerAngle = 0.15;
        pose.daggerGlow = p;
        pose.daggerGlowColor = '#84CC16';
        pose.grinIntensity = 0.85;
      } else if (anim.phase === AnimPhase.EXECUTION) {
        // Flourishes freshly coated venomous blades outward!
        pose.rightArmAngle = lerp(a + 0.18, a + 1.25, p);
        pose.leftArmAngle = lerp(a - 0.18, a - 1.25, p);
        pose.daggerGlow = 1.0;
        pose.daggerGlowColor = '#84CC16';
        pose.grinIntensity = 1.0;
      }
      break;
    }

    case 'goblin_ult_phantom_frenzy': {
      if (anim.phase === AnimPhase.ANTICIPATION) {
        // Crosses both daggers tightly over chest as wind & shadow coil inward
        pose.bobY = -6 * p;
        pose.scaleX = 1.16;
        pose.scaleY = 0.83;
        pose.rightArmAngle = Math.PI * 0.78;
        pose.leftArmAngle = Math.PI * 0.22;
        pose.earPerk = -0.4;
        pose.daggerGlow = 1.0;
        pose.daggerGlowColor = '#34D399';
      } else if (anim.phase === AnimPhase.EXECUTION) {
        const dashOsc = Math.sin(p * Math.PI * 14);
        pose.scaleX = 1.2;
        pose.scaleY = 0.82;
        pose.rightArmAngle = a + dashOsc * 1.5;
        pose.leftArmAngle = a - dashOsc * 1.5;
        pose.leftDaggerAngle = 0.2;
        pose.scarfWave = 2.2;
        pose.grinIntensity = 1.0;
        pose.daggerGlow = 1.0;
        pose.daggerGlowColor = '#34D399';
      }
      break;
    }

    case 'goblin_ult_king_of_thieves': {
      if (anim.phase === AnimPhase.ANTICIPATION) {
        // Raises both daggers triumphantly overhead in dark green & purple aura!
        pose.jumpZ = 6 * p;
        pose.rightArmAngle = -Math.PI / 2 + 0.38;
        pose.leftArmAngle = -Math.PI / 2 - 0.38;
        pose.leftDaggerAngle = 0.1;
        pose.earPerk = 0.32;
        pose.grinIntensity = 1.0;
        pose.daggerGlow = 1.0;
        pose.daggerGlowColor = '#C084FC';
      } else if (anim.phase === AnimPhase.EXECUTION) {
        const ambushOsc = Math.sin(p * Math.PI * 10);
        pose.rightArmAngle = a + ambushOsc * 1.35;
        pose.leftArmAngle = a - ambushOsc * 1.35;
        pose.leftDaggerAngle = 0.2;
        pose.scarfWave = 2.0;
        pose.grinIntensity = 1.0;
        pose.daggerGlow = 1.0;
        pose.daggerGlowColor = '#C084FC';
      }
      break;
    }

    case 'goblin_ult_thousand_daggers': {
      if (anim.phase === AnimPhase.ANTICIPATION) {
        // Leaps & spins mid-air summoning enchanted daggers!
        pose.jumpZ = Math.sin(p * Math.PI * 0.5) * 22;
        pose.spinAngle = p * Math.PI * 2;
        pose.rightArmAngle = -0.35;
        pose.leftArmAngle = -Math.PI + 0.35;
        pose.grinIntensity = 1.0;
        pose.daggerGlow = 1.0;
        pose.daggerGlowColor = '#FACC15';
      } else if (anim.phase === AnimPhase.EXECUTION) {
        // Acrobatic aerial throwing stance before landing!
        pose.jumpZ = (1 - p) * 22;
        pose.rightArmAngle = a + 0.3;
        pose.leftArmAngle = a - 0.3;
        pose.scarfWave = 2.1;
        pose.grinIntensity = 1.0;
        pose.daggerGlow = 1.0;
        pose.daggerGlowColor = '#FACC15';
      }
      break;
    }
  }

  return pose;
}

/**
 * Renders the playable Goblin Hero in a cute, mischievous, hand-drawn 2D cozy fantasy style
 * matching Zombie and Skeleton (bold #18181B ink outlines, expressive chibi silhouette, zero pixel art).
 */
export function drawGoblinHero(
  ctx: CanvasRenderingContext2D,
  player: PlayerState,
  time: number
): void {
  const pose = computeGoblinRigPose(player, time);
  const isWindrunner = player.windrunnerTimer > 0;
  const isPoisonCoated = player.poisonedBladesTimer > 0;
  const isStolenMight = player.kingOfThievesBuffTimer > 0;
  const hurtWhite = player.hurtFlash > 0.11;

  // Compact, nimble Goblin proportions (0.94 scale compared to Zombie/Skeleton 1.0)
  const heroScale = 0.94;

  ctx.save();
  ctx.translate(player.x, player.y);

  // Semi-translucent twilight vanish state during shadow-ambush dashes
  if (player.goblinVanishTimer > 0) {
    ctx.globalAlpha = 0.42;
  }

  // 1. Ground Shadow (shrinks slightly when Goblin leaps into the air!)
  const shadowScale = Math.max(0.55, 1 - pose.jumpZ * 0.015);
  ctx.fillStyle = isStolenMight ? 'rgba(88, 28, 135, 0.45)' : 'rgba(0, 0, 0, 0.36)';
  ctx.beginPath();
  ctx.ellipse(pose.lungeX * 0.45, 16, 15.5 * shadowScale, 6.8 * shadowScale, 0, 0, Math.PI * 2);
  ctx.fill();

  // Soft Stolen Might or Windrunner aura ring beneath boots
  if (isStolenMight || isWindrunner) {
    ctx.save();
    ctx.globalAlpha = 0.28 + Math.sin(time * 7) * 0.08;
    ctx.fillStyle = isStolenMight ? '#C084FC' : '#2DD4BF';
    ctx.beginPath();
    ctx.ellipse(0, 15, 20, 8.5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  ctx.scale(heroScale, heroScale);
  ctx.translate(pose.lungeX, pose.lungeY - pose.bobY - pose.jumpZ);
  ctx.rotate(pose.torsoTilt + pose.spinAngle * 0.12);
  ctx.scale(pose.scaleX, pose.scaleY);

  const lookX = Math.cos(player.facingAngle) * 2.5;
  const lookY = Math.sin(player.facingAngle) * 1.7;
  const isMoving = Math.hypot(player.vx, player.vy) > 12;
  const stride = isMoving ? Math.sin(player.walkCycle * 1.15) * 4.8 : 0;

  // 2. Fluttering Forest-Rogue Bandana Scarf Tails behind shoulders
  ctx.save();
  const tailDir = -Math.cos(player.facingAngle);
  const wave1 = Math.sin(time * 9.5 + player.walkCycle) * 4.2 * pose.scarfWave;
  const wave2 = Math.cos(time * 8.2 + player.walkCycle) * 3.5 * pose.scarfWave;
  ctx.fillStyle = hurtWhite ? '#FFFFFF' : isStolenMight ? '#6B21A8' : '#9A3412';
  ctx.strokeStyle = '#18181B';
  ctx.lineWidth = 2.3;
  ctx.lineJoin = 'round';
  ctx.beginPath();
  ctx.moveTo(tailDir * 4, -2);
  ctx.quadraticCurveTo(tailDir * 15 + wave1, 1 + wave2 * 0.5, tailDir * 22 + wave1, 7 + wave2);
  ctx.lineTo(tailDir * 17 + wave1 * 0.7, 11 + wave2);
  ctx.quadraticCurveTo(tailDir * 10, 5, tailDir * 2, 2);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.restore();

  // 3. Nimble Wrapped Rogue Boots (4-directional / 360° energetic footwork)
  ctx.fillStyle = hurtWhite ? '#FFFFFF' : '#3F2312';
  ctx.strokeStyle = '#18181B';
  ctx.lineWidth = 2.4;
  // Left boot
  ctx.beginPath();
  ctx.ellipse(-5.5, 14 + stride * 0.55, 4.6, 3.2, -0.15, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  // Right boot
  ctx.beginPath();
  ctx.ellipse(5.5, 14 - stride * 0.55, 4.6, 3.2, 0.15, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // 4. Adventurer Rogue Tunic, Leather Vest & Bouncing Belt Pouches!
  ctx.fillStyle = hurtWhite ? '#FFFFFF' : '#293832';
  ctx.strokeStyle = '#18181B';
  ctx.lineWidth = 2.7;
  ctx.lineJoin = 'round';
  ctx.beginPath();
  ctx.moveTo(-10.5, -3);
  ctx.quadraticCurveTo(-13, 7, -11.5, 13.5);
  ctx.lineTo(-4, 12);
  ctx.lineTo(0, 14.5);
  ctx.lineTo(4.5, 12);
  ctx.lineTo(11.5, 13.5);
  ctx.quadraticCurveTo(13, 7, 10.5, -3);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  if (!hurtWhite) {
    // Warm leather hooded collar mantle
    ctx.fillStyle = '#5C341E';
    ctx.strokeStyle = '#18181B';
    ctx.lineWidth = 2.3;
    ctx.beginPath();
    ctx.moveTo(-11, -3);
    ctx.lineTo(-6, 3.5);
    ctx.lineTo(0, 1.5);
    ctx.lineTo(6, 3.5);
    ctx.lineTo(11, -3);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Diagonal adventurer chest bandolier + tiny glowing potion vial!
    ctx.strokeStyle = '#78350F';
    ctx.lineWidth = 2.6;
    ctx.beginPath();
    ctx.moveTo(-8, -1);
    ctx.lineTo(8, 9);
    ctx.stroke();

    // Tiny alchemical vial clipped to bandolier
    ctx.fillStyle = isPoisonCoated ? '#A3E635' : '#34D399';
    ctx.strokeStyle = '#18181B';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(-2.2, 3.2, 2.7, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Leather belt + brass rogue buckle
    ctx.fillStyle = '#451A03';
    ctx.fillRect(-10.5, 7.2, 21, 3.2);
    ctx.fillStyle = '#FBBF24';
    ctx.strokeStyle = '#18181B';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.roundRect(-2.6, 6.6, 5.2, 4.4, 1);
    ctx.fill();
    ctx.stroke();

    // Two plump side adventurer pouches that bounce slightly with stride!
    const pouchBounce = stride * 0.22;
    ctx.fillStyle = '#854D0E';
    ctx.strokeStyle = '#18181B';
    ctx.lineWidth = 1.9;
    ctx.beginPath();
    ctx.roundRect(-13.2, 6.8 + pouchBounce, 5.4, 5.8, 2);
    ctx.roundRect(7.8, 6.8 - pouchBounce, 5.4, 5.8, 2);
    ctx.fill();
    ctx.stroke();
  }

  // 5. Back Dagger Arm (drawn behind head if aimed upward)
  const drawLeftBehind = Math.sin(pose.leftArmAngle) < -0.15;
  const drawRightBehind = Math.sin(pose.rightArmAngle) < -0.15;

  if (drawLeftBehind) {
    drawGoblinDaggerArm(
      ctx,
      pose.leftArmAngle,
      pose.leftDaggerAngle,
      true,
      isPoisonCoated,
      pose.daggerGlow,
      pose.daggerGlowColor,
      hurtWhite,
      time
    );
  }
  if (drawRightBehind) {
    drawGoblinDaggerArm(
      ctx,
      pose.rightArmAngle,
      pose.rightDaggerAngle,
      false,
      isPoisonCoated,
      pose.daggerGlow,
      pose.daggerGlowColor,
      hurtWhite,
      time
    );
  }

  // 6. Cute Chibi Goblin Head & Iconic Expressive Pointed Ears!
  const skinFill = hurtWhite ? '#FFFFFF' : '#74C655';
  const earInnerFill = hurtWhite ? '#FFFFFF' : '#4D9043';

  // Left & Right Long Pointed Goblin Ears (drawn just behind/integrated with round head)
  for (const side of [-1, 1]) {
    ctx.save();
    ctx.translate(side * 10.5, -8.5);
    const earTilt = side * (-0.22 - pose.earPerk) + lookY * 0.04 * side;
    ctx.rotate(earTilt);

    // Outer pointed goblin ear
    ctx.fillStyle = skinFill;
    ctx.strokeStyle = '#18181B';
    ctx.lineWidth = 2.6;
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(0, -4.2);
    ctx.quadraticCurveTo(side * 9, -6.2, side * 14.5, -2.2);
    ctx.quadraticCurveTo(side * 8.5, 3.8, 0, 3.4);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Inner ear fold detail
    if (!hurtWhite) {
      ctx.fillStyle = earInnerFill;
      ctx.beginPath();
      ctx.moveTo(side * 1.5, -1.6);
      ctx.quadraticCurveTo(side * 7.5, -2.8, side * 11.2, -1.2);
      ctx.quadraticCurveTo(side * 7, 1.8, side * 1.5, 1.4);
      ctx.closePath();
      ctx.fill();

      // Cute brass adventurer ear-ring on Goblin's left ear!
      if (side === -1) {
        ctx.strokeStyle = '#FACC15';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(-6.5, 1.8, 2.3, 0, Math.PI * 2);
        ctx.stroke();
      }
    }
    ctx.restore();
  }

  // Round Cozy Chibi Goblin Head
  ctx.fillStyle = skinFill;
  ctx.strokeStyle = '#18181B';
  ctx.lineWidth = 2.8;
  ctx.beginPath();
  ctx.arc(0, -9.2, 12.8, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  if (!hurtWhite) {
    // Soft sunlit forehead highlight
    ctx.fillStyle = 'rgba(217, 249, 157, 0.45)';
    ctx.beginPath();
    ctx.ellipse(-3.5, -15.5, 6.2, 2.8, -0.25, 0, Math.PI * 2);
    ctx.fill();

    // Stylish rogue forehead bandana / hood brim with brass rivet!
    ctx.fillStyle = isStolenMight ? '#581C87' : '#52301C';
    ctx.strokeStyle = '#18181B';
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    ctx.arc(0, -9.5, 13.0, Math.PI * 1.08, Math.PI * 1.92);
    ctx.quadraticCurveTo(0, -13.2, -12.4, -12.8);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Gold trim stitch on bandana
    ctx.fillStyle = '#FACC15';
    ctx.beginPath();
    ctx.arc(6.5, -16.2, 1.7, 0, Math.PI * 2);
    ctx.fill();

    // Warm cheek blush spots
    ctx.fillStyle = 'rgba(22, 163, 74, 0.35)';
    ctx.beginPath();
    ctx.ellipse(-7.5 + lookX * 0.35, -5.8 + lookY * 0.3, 2.6, 1.5, 0, 0, Math.PI * 2);
    ctx.ellipse(7.5 + lookX * 0.35, -5.8 + lookY * 0.3, 2.6, 1.5, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  // 7. Expressive Mischievous Eyes, Rogue Brows & Cheeky Fang Grin!
  const isBlinking = !player.activeAnim && Math.sin(time * 2.9 + 1.1) > 0.965;

  if (player.hurtFlash > 0.05) {
    // Wincing >< eyes on hit
    ctx.strokeStyle = '#18181B';
    ctx.lineWidth = 2.2;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(-6.5, -11);
    ctx.lineTo(-3, -8.8);
    ctx.lineTo(-6.5, -6.8);
    ctx.moveTo(6.5, -11);
    ctx.lineTo(3, -8.8);
    ctx.lineTo(6.5, -6.8);
    ctx.stroke();
  } else if (isBlinking) {
    ctx.strokeStyle = '#18181B';
    ctx.lineWidth = 2.2;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(-6.8 + lookX * 0.5, -9 + lookY * 0.5);
    ctx.lineTo(-2.2 + lookX * 0.5, -9 + lookY * 0.5);
    ctx.moveTo(2.2 + lookX * 0.5, -9 + lookY * 0.5);
    ctx.lineTo(6.8 + lookX * 0.5, -9 + lookY * 0.5);
    ctx.stroke();
  } else {
    for (const side of [-1, 1]) {
      const ex = side * 4.5 + lookX * 0.72;
      const ey = -9.0 + lookY * 0.58;

      // Dark eye socket outline + bright golden-amber iris!
      ctx.fillStyle = '#18181B';
      ctx.beginPath();
      ctx.ellipse(ex, ey, 3.2, 3.5, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = isStolenMight ? '#E879F9' : '#FACC15';
      ctx.beginPath();
      ctx.ellipse(ex, ey + 0.2, 2.3, 2.5, 0, 0, Math.PI * 2);
      ctx.fill();

      // Sharp mischievous pupil + crisp white catchlight
      ctx.fillStyle = '#18181B';
      ctx.beginPath();
      ctx.arc(ex + lookX * 0.18, ey + 0.2, 1.15, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath();
      ctx.arc(ex - 0.85, ey - 1.0, 0.95, 0, Math.PI * 2);
      ctx.fill();

      // Expressive angled mischievous eyebrow!
      ctx.strokeStyle = '#18181B';
      ctx.lineWidth = 2.1;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(ex - side * 2.8, ey - 3.0);
      ctx.lineTo(ex + side * 2.6, ey - 4.3);
      ctx.stroke();
    }
  }

  // Cute upturned goblin button-nose
  if (!hurtWhite) {
    ctx.fillStyle = '#3F7D32';
    ctx.beginPath();
    ctx.ellipse(lookX * 0.65, -6.7 + lookY * 0.5, 1.6, 1.1, 0, 0, Math.PI * 2);
    ctx.fill();

    // Cheeky lopsided smirk + tiny white fang!
    const mx = lookX * 0.5;
    const my = -3.8 + lookY * 0.45;
    ctx.strokeStyle = '#18181B';
    ctx.lineWidth = 2.0;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(mx - 3.6, my + 0.3);
    ctx.quadraticCurveTo(mx + 0.5, my + 1.8 + pose.grinIntensity * 1.4, mx + 4.2, my - 1.1);
    ctx.stroke();

    // Tiny cute goblin fang peeking from smirk corner
    ctx.fillStyle = '#F8FAFC';
    ctx.strokeStyle = '#18181B';
    ctx.lineWidth = 1.1;
    ctx.beginPath();
    ctx.moveTo(mx + 1.6, my + 0.3);
    ctx.lineTo(mx + 2.8, my - 2.1);
    ctx.lineTo(mx + 3.8, my - 0.3);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }

  // Floating golden-violet Thief Crown icon above Goblin while Stolen Might buff is active!
  if (isStolenMight && !hurtWhite) {
    ctx.save();
    ctx.translate(0, -27 + Math.sin(time * 6) * 1.5);
    ctx.fillStyle = '#FACC15';
    ctx.strokeStyle = '#18181B';
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.moveTo(-6.5, 2.5);
    ctx.lineTo(-8, -3.5);
    ctx.lineTo(-3, -0.5);
    ctx.lineTo(0, -5);
    ctx.lineTo(3, -0.5);
    ctx.lineTo(8, -3.5);
    ctx.lineTo(6.5, 2.5);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }

  // 8. Front Dagger Arms (drawn in front of body/head)
  if (!drawLeftBehind) {
    drawGoblinDaggerArm(
      ctx,
      pose.leftArmAngle,
      pose.leftDaggerAngle,
      true,
      isPoisonCoated,
      pose.daggerGlow,
      pose.daggerGlowColor,
      hurtWhite,
      time
    );
  }
  if (!drawRightBehind) {
    drawGoblinDaggerArm(
      ctx,
      pose.rightArmAngle,
      pose.rightDaggerAngle,
      false,
      isPoisonCoated,
      pose.daggerGlow,
      pose.daggerGlowColor,
      hurtWhite,
      time
    );
  }

  ctx.restore();
}

function drawGoblinDaggerArm(
  ctx: CanvasRenderingContext2D,
  armAngle: number,
  daggerLocalAngle: number,
  isOffHand: boolean,
  isPoisonCoated: boolean,
  glowIntensity: number,
  glowColor: string,
  hurtWhite: boolean,
  time: number
): void {
  const reach = isOffHand ? 14.5 : 15.5;
  const hx = Math.cos(armAngle) * reach;
  const hy = Math.sin(armAngle) * reach + 1.5;

  ctx.save();
  ctx.translate(hx, hy);
  ctx.rotate(armAngle + daggerLocalAngle);

  // Subtle weapon aura / venomous sheen around blade
  if ((glowIntensity > 0.25 || isPoisonCoated) && !hurtWhite) {
    ctx.save();
    ctx.globalAlpha = Math.min(0.68, (isPoisonCoated ? 0.42 : 0.15) + glowIntensity * 0.35);
    ctx.fillStyle = isPoisonCoated ? '#84CC16' : glowColor;
    ctx.beginPath();
    ctx.ellipse(9, 0, 10, 4.2, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // Wrapped hilt pommel behind hand
  ctx.fillStyle = hurtWhite ? '#FFFFFF' : '#78350F';
  ctx.strokeStyle = '#18181B';
  ctx.lineWidth = 1.9;
  ctx.beginPath();
  ctx.roundRect(-6.5, -1.8, 6, 3.6, 1.5);
  ctx.fill();
  ctx.stroke();

  // Brass crossguard
  ctx.fillStyle = hurtWhite ? '#FFFFFF' : '#F59E0B';
  ctx.beginPath();
  ctx.roundRect(1.5, -4.6, 2.8, 9.2, 1.2);
  ctx.fill();
  ctx.stroke();

  // Curved Rogue Dagger Blade (compact, lethal, distinct bevel!)
  ctx.fillStyle = hurtWhite ? '#FFFFFF' : '#E2E8F0';
  ctx.strokeStyle = '#18181B';
  ctx.lineWidth = 2.2;
  ctx.lineJoin = 'round';
  ctx.beginPath();
  ctx.moveTo(4, -3.2);
  ctx.quadraticCurveTo(11.5, -3.6, 17.5, -0.6); // Keen curved spine to needle point
  ctx.quadraticCurveTo(11.5, 3.6, 4, 2.8);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  if (!hurtWhite) {
    // Inner steel fuller bevel OR luminous green venom coating!
    ctx.strokeStyle = isPoisonCoated ? '#84CC16' : '#94A3B8';
    ctx.lineWidth = isPoisonCoated ? 2.2 : 1.3;
    ctx.beginPath();
    ctx.moveTo(5.5, -0.4);
    ctx.quadraticCurveTo(11, -0.8, 15.5, -0.5);
    ctx.stroke();

    // Animated dripping green poison bead on blade tip when Poisoned Blades is active!
    if (isPoisonCoated) {
      const drip = (time * 3.5 + (isOffHand ? 0.5 : 0)) % 1;
      ctx.fillStyle = '#A3E635';
      ctx.beginPath();
      ctx.arc(15.5, 1.5 + drip * 4.5, 1.7 * (1 - drip * 0.5), 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // Cute Goblin green hand gripping the hilt
  ctx.fillStyle = hurtWhite ? '#FFFFFF' : '#74C655';
  ctx.strokeStyle = '#18181B';
  ctx.lineWidth = 2.1;
  ctx.beginPath();
  ctx.arc(-0.5, 0, 4.1, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  ctx.restore();
}

/**
 * Renders Goblin's partially concealed world-space Explosive Trap on the dungeon floor.
 */
export function drawGoblinExplosiveTrap(
  ctx: CanvasRenderingContext2D,
  h: HazardZone,
  time: number
): void {
  const isTriggered = (h.triggeredTimer || 0) > 0;
  const isArmed = (h.armedTimer || 0) <= 0;

  ctx.save();
  ctx.translate(h.x, h.y);
  // Partially concealed subtle opacity until triggered!
  ctx.globalAlpha = isTriggered ? 1.0 : 0.84;

  // Faint friendly detection ring so the Goblin player knows its trigger perimeter
  ctx.strokeStyle = isTriggered ? 'rgba(251, 146, 60, 0.82)' : 'rgba(250, 204, 21, 0.22)';
  ctx.lineWidth = isTriggered ? 2.4 : 1.4;
  ctx.setLineDash([5, 5]);
  ctx.beginPath();
  ctx.ellipse(0, 0, 44, 32, 0, 0, Math.PI * 2);
  ctx.stroke();
  ctx.setLineDash([]);

  // Camouflage forest leaves & shadow tucked under the mechanism
  ctx.fillStyle = 'rgba(20, 83, 45, 0.65)';
  ctx.beginPath();
  ctx.ellipse(-9, 3, 8, 4, -0.4, 0, Math.PI * 2);
  ctx.ellipse(9, -2, 8, 4, 0.45, 0, Math.PI * 2);
  ctx.fill();

  // Iron & brass toothed rogue spring-plate
  ctx.fillStyle = '#334155';
  ctx.strokeStyle = '#0F172A';
  ctx.lineWidth = 2.2;
  ctx.beginPath();
  for (let i = 0; i < 8; i++) {
    const a = (Math.PI * 2 * i) / 8;
    const r = i % 2 === 0 ? 13 : 9.5;
    if (i === 0) ctx.moveTo(Math.cos(a) * r, Math.sin(a) * r * 0.78);
    else ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r * 0.78);
  }
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Brass inner housing
  ctx.fillStyle = '#B45309';
  ctx.beginPath();
  ctx.ellipse(0, 0, 7.5, 5.8, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Subtle blinking indicator rune (flashes rapidly right before explosion!)
  const blink = isTriggered
    ? Math.sin(time * 48) > 0
    : isArmed && Math.sin(time * 5.2 + h.x) > 0.25;

  ctx.fillStyle = isTriggered
    ? blink
      ? '#FEF08A'
      : '#EF4444'
    : blink
    ? '#FB923C'
    : '#451A03';
  ctx.beginPath();
  ctx.arc(0, 0, isTriggered ? 4.4 : 3.1, 0, Math.PI * 2);
  ctx.fill();

  if (blink) {
    ctx.fillStyle = isTriggered ? 'rgba(251, 146, 60, 0.45)' : 'rgba(251, 146, 60, 0.22)';
    ctx.beginPath();
    ctx.arc(0, 0, isTriggered ? 13 : 8, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}

/**
 * Renders the shadowed ground target zone for Goblin's Thousand Daggers Ultimate.
 */
export function drawThousandDaggersTelegraph(
  ctx: CanvasRenderingContext2D,
  h: HazardZone,
  time: number
): void {
  const fade = Math.min(1, h.life / 0.35);
  ctx.save();
  ctx.translate(h.x, h.y);
  ctx.globalAlpha = fade;

  // Shadowed twilight-emerald target field
  const grad = ctx.createRadialGradient(0, 0, 12, 0, 0, h.radius);
  grad.addColorStop(0, 'rgba(15, 23, 42, 0.45)');
  grad.addColorStop(0.75, 'rgba(16, 185, 129, 0.16)');
  grad.addColorStop(1, 'rgba(250, 204, 21, 0.04)');
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.ellipse(0, 0, h.radius, h.radius * 0.76, 0, 0, Math.PI * 2);
  ctx.fill();

  // Rotating notched rogue-compass perimeter
  ctx.strokeStyle = 'rgba(250, 204, 21, 0.68)';
  ctx.lineWidth = 2.2;
  ctx.setLineDash([12, 8]);
  ctx.beginPath();
  ctx.ellipse(0, 0, h.radius, h.radius * 0.76, 0, 0, Math.PI * 2);
  ctx.stroke();
  ctx.setLineDash([]);

  // 4 inward dagger crosshairs
  ctx.strokeStyle = 'rgba(52, 211, 153, 0.55)';
  ctx.lineWidth = 2;
  for (let i = 0; i < 4; i++) {
    const a = (Math.PI * i) / 2 + time * 0.8;
    const rx = Math.cos(a);
    const ry = Math.sin(a) * 0.76;
    ctx.beginPath();
    ctx.moveTo(rx * h.radius * 0.72, ry * h.radius * 0.72);
    ctx.lineTo(rx * h.radius * 0.96, ry * h.radius * 0.96);
    ctx.stroke();
  }

  ctx.restore();
}

/**
 * Renders an individual world-space falling enchanted dagger projectile during Thousand Daggers.
 */
export function drawFallingDaggerProjectile(
  ctx: CanvasRenderingContext2D,
  proj: Projectile,
  _time: number
): void {
  if (proj.spawnDelay && proj.spawnDelay > 0) return;

  const z = Math.max(0, proj.z || 0);
  const heightRatio = Math.min(1, z / 280);

  ctx.save();

  // 1. Ground target shadow directly on the floor beneath the falling dagger!
  ctx.fillStyle = `rgba(15, 23, 42, ${0.55 * (1 - heightRatio * 0.65)})`;
  ctx.beginPath();
  const shadowR = 4 + (1 - heightRatio) * 8;
  ctx.ellipse(proj.x, proj.y, shadowR, shadowR * 0.65, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = `rgba(250, 204, 21, ${0.55 * (1 - heightRatio * 0.5)})`;
  ctx.lineWidth = 1.4;
  ctx.stroke();

  // 2. Descending Enchanted Dagger at 2.5D altitude (proj.x, proj.y - z)
  const drawY = proj.y - z;
  ctx.translate(proj.x, drawY);
  ctx.rotate((proj.angle || 0) * 0.08);

  // Enchanted golden-emerald motion wake above hilt
  const wakeGrad = ctx.createLinearGradient(0, -4, 0, -44);
  wakeGrad.addColorStop(0, 'rgba(250, 204, 21, 0.85)');
  wakeGrad.addColorStop(0.5, 'rgba(52, 211, 153, 0.45)');
  wakeGrad.addColorStop(1, 'rgba(52, 211, 153, 0)');
  ctx.strokeStyle = wakeGrad;
  ctx.lineWidth = 5;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(0, -6);
  ctx.lineTo(0, -42);
  ctx.stroke();

  // Downward-pointing forged steel & gold blade
  ctx.fillStyle = '#F8FAFC';
  ctx.strokeStyle = '#18181B';
  ctx.lineWidth = 2.1;
  ctx.beginPath();
  ctx.moveTo(0, 9); // Sharp tip pointing down
  ctx.lineTo(-4.2, -5);
  ctx.lineTo(4.2, -5);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Golden crossguard & emerald pommel
  ctx.strokeStyle = '#FACC15';
  ctx.lineWidth = 2.8;
  ctx.beginPath();
  ctx.moveTo(-6.2, -5.5);
  ctx.lineTo(6.2, -5.5);
  ctx.stroke();

  ctx.strokeStyle = '#78350F';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(0, -5.5);
  ctx.lineTo(0, -12.5);
  ctx.stroke();

  ctx.fillStyle = '#34D399';
  ctx.beginPath();
  ctx.arc(0, -13.5, 2.5, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}
