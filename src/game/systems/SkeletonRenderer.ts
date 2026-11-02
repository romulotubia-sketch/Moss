import { AnimPhase, MinionState, PlayerState, Projectile } from '../types';

interface SkeletonPose {
  bobY: number;
  scaleX: number;
  scaleY: number;
  torsoTilt: number;
  lungeX: number;
  lungeY: number;
  swordArmAngle: number;
  swordWristAngle: number;
  offArmAngle: number;
  scarfWave: number;
  jawOpen: number;
  eyeColor: string;
  bladeGlow: number;
  bladeGlowColor: string;
  holdingSpear: number;
  holdingScythe: number;
  scytheSweepAngle: number;
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * Math.max(0, Math.min(1, t));
}

function computeSkeletonRigPose(player: PlayerState, time: number): SkeletonPose {
  const isMoving = Math.hypot(player.vx, player.vy) > 12;
  const isColossus = player.boneColossusTimer > 0;
  const aim = player.facingAngle;

  const pose: SkeletonPose = {
    bobY: isMoving ? Math.abs(Math.sin(player.walkCycle)) * 4.2 : Math.sin(time * 3.1) * 1.6,
    scaleX: 1,
    scaleY: 1,
    torsoTilt: isMoving ? Math.cos(aim) * 0.1 + Math.sin(player.walkCycle) * 0.06 : Math.sin(time * 1.8) * 0.025,
    lungeX: 0,
    lungeY: 0,
    swordArmAngle: aim + 0.52 + (isMoving ? Math.sin(player.walkCycle) * 0.22 : Math.sin(time * 2.4) * 0.06),
    swordWristAngle: isColossus ? -0.35 : -0.22,
    offArmAngle: aim - 0.68 + (isMoving ? -Math.sin(player.walkCycle) * 0.24 : 0),
    scarfWave: isMoving ? 1.0 : 0.35,
    jawOpen: 0,
    eyeColor: isColossus ? '#FEF08A' : '#38BDF8',
    bladeGlow: isColossus ? 0.65 : 0.22, // Subtle Bone Mastery gleam always present!
    bladeGlowColor: isColossus ? '#38BDF8' : '#BAE6FD',
    holdingSpear: 0,
    holdingScythe: 0,
    scytheSweepAngle: aim,
  };

  if (player.dodgeTimer > 0) {
    pose.scaleX = 1.16;
    pose.scaleY = 0.84;
    pose.torsoTilt = Math.cos(player.dodgeDirX >= 0 ? 0 : Math.PI) * 0.28;
    pose.scarfWave = 1.5;
    pose.swordArmAngle = aim + 1.1;
  }

  const anim = player.activeAnim;
  if (!anim) return pose;

  const p = Math.max(0, Math.min(1, anim.phaseTimer / Math.max(0.01, anim.phaseDuration)));
  const a = anim.aimAngle;

  switch (anim.abilityId) {
    case 'skeleton_bone_strike': {
      // 3-step agile swordsmanship combo (or heavy 2-handed Bone Colossus cleave)
      const step = anim.comboIndex % 3;
      const dir = step === 1 ? -1 : 1;
      const windupOffset = step === 2 ? -dir * 1.65 : -dir * 1.35;
      const followOffset = step === 2 ? dir * 1.48 : dir * 1.24;

      if (anim.phase === AnimPhase.ANTICIPATION) {
        pose.swordArmAngle = lerp(a + 0.4, a + windupOffset, p);
        pose.swordWristAngle = -dir * 0.55 * p;
        pose.torsoTilt = -dir * 0.16 * p;
        pose.scaleX = 1 - 0.06 * p;
        pose.scaleY = 1 + 0.06 * p;
        pose.bladeGlow = 0.45 + 0.45 * p;
      } else if (anim.phase === AnimPhase.EXECUTION) {
        const snap = 1 - Math.pow(1 - p, 3);
        pose.swordArmAngle = lerp(a + windupOffset, a + followOffset, snap);
        pose.swordWristAngle = dir * 0.42 * snap;
        pose.lungeX = Math.cos(a) * (isColossus ? 13 : 8) * Math.sin(p * Math.PI);
        pose.lungeY = Math.sin(a) * (isColossus ? 10 : 6) * Math.sin(p * Math.PI);
        pose.torsoTilt = dir * 0.22;
        pose.scaleX = 1.12;
        pose.scaleY = 0.91;
        pose.scarfWave = 1.35;
        pose.jawOpen = 0.45;
        pose.bladeGlow = 1.0;
      } else {
        pose.swordArmAngle = lerp(a + followOffset, a + 0.52, p);
        pose.swordWristAngle = lerp(dir * 0.42, -0.22, p);
        pose.torsoTilt = lerp(dir * 0.22, 0, p);
      }
      break;
    }

    case 'skeleton_bone_slash': {
      if (anim.phase === AnimPhase.ANTICIPATION) {
        pose.swordArmAngle = lerp(a + 0.4, a - 1.78, p);
        pose.offArmAngle = lerp(a - 0.6, a - 1.35, p);
        pose.swordWristAngle = -0.7 * p;
        pose.lungeX = -Math.cos(a) * 6 * p;
        pose.lungeY = -Math.sin(a) * 5 * p;
        pose.scaleX = 0.92;
        pose.scaleY = 1.08;
        pose.bladeGlow = 0.55 + 0.45 * p;
        pose.bladeGlowColor = '#38BDF8';
      } else if (anim.phase === AnimPhase.EXECUTION) {
        const snap = 1 - Math.pow(1 - p, 3);
        pose.swordArmAngle = lerp(a - 1.78, a + 1.65, snap);
        pose.offArmAngle = lerp(a - 1.35, a + 0.9, snap);
        pose.swordWristAngle = 0.5 * snap;
        pose.lungeX = Math.cos(a) * 14 * Math.sin(p * Math.PI);
        pose.lungeY = Math.sin(a) * 11 * Math.sin(p * Math.PI);
        pose.scaleX = 1.18;
        pose.scaleY = 0.86;
        pose.torsoTilt = 0.26;
        pose.scarfWave = 1.6;
        pose.jawOpen = 0.7;
        pose.eyeColor = '#FEF08A';
        pose.bladeGlow = 1.0;
        pose.bladeGlowColor = '#38BDF8';
      } else {
        pose.swordArmAngle = lerp(a + 1.65, a + 0.52, p);
        pose.torsoTilt = lerp(0.26, 0, p);
      }
      break;
    }

    case 'skeleton_bone_spear': {
      if (anim.phase === AnimPhase.ANTICIPATION) {
        // Off-hand & main hand draw back overhead to assemble and poise the Bone Spear
        pose.offArmAngle = lerp(a - 0.6, a - 2.1, p);
        pose.swordArmAngle = a + 1.35;
        pose.holdingSpear = p;
        pose.torsoTilt = -0.18 * p;
        pose.jawOpen = 0.4 * p;
      } else if (anim.phase === AnimPhase.EXECUTION) {
        // Powerful javelin hurl forward!
        pose.offArmAngle = lerp(a - 2.1, a + 0.15, Math.min(1, p * 2.2));
        pose.lungeX = Math.cos(a) * 10 * Math.sin(p * Math.PI);
        pose.lungeY = Math.sin(a) * 8 * Math.sin(p * Math.PI);
        pose.torsoTilt = 0.24;
        pose.scarfWave = 1.4;
        pose.holdingSpear = Math.max(0, 1 - p * 3.5);
      } else {
        pose.offArmAngle = lerp(a + 0.15, a - 0.68, p);
      }
      break;
    }

    case 'skeleton_ribcage_shield': {
      if (anim.phase === AnimPhase.ANTICIPATION) {
        // Cross arms over chest before flinging ribs outward!
        pose.swordArmAngle = lerp(a + 0.5, Math.PI * 0.75, p);
        pose.offArmAngle = lerp(a - 0.6, Math.PI * 0.25, p);
        pose.scaleX = 0.9;
        pose.scaleY = 1.1;
      } else if (anim.phase === AnimPhase.EXECUTION) {
        // Open chest roar as ribs detach into a protective barrier
        pose.swordArmAngle = 0.25;
        pose.offArmAngle = Math.PI - 0.25;
        pose.scaleX = 1.15;
        pose.scaleY = 0.9;
        pose.jawOpen = 0.85;
        pose.eyeColor = '#38BDF8';
      }
      break;
    }

    case 'skeleton_skeletal_rush': {
      if (anim.phase === AnimPhase.ANTICIPATION) {
        // Deep predator crouch before the high-speed rush
        pose.bobY = 5 * p;
        pose.scaleX = 1.14;
        pose.scaleY = 0.82;
        pose.swordArmAngle = a - 1.5;
        pose.bladeGlow = 0.85;
      } else if (anim.phase === AnimPhase.EXECUTION) {
        pose.scaleX = 1.22;
        pose.scaleY = 0.8;
        pose.torsoTilt = Math.cos(a) * 0.34;
        pose.swordArmAngle = a + 0.25;
        pose.scarfWave = 1.9;
        pose.bladeGlow = 1.0;
        pose.bladeGlowColor = '#38BDF8';
      } else {
        pose.swordArmAngle = lerp(a + 1.3, a + 0.52, p);
      }
      break;
    }

    case 'skeleton_bone_storm': {
      if (anim.phase === AnimPhase.ANTICIPATION) {
        pose.bobY = 3 * p;
        pose.swordArmAngle = -Math.PI / 2 + 0.4;
        pose.offArmAngle = -Math.PI / 2 - 0.4;
      } else if (anim.phase === AnimPhase.EXECUTION) {
        // Spin flourish summoning the bone whirlwind
        const spin = p * Math.PI * 2;
        pose.swordArmAngle = a + spin;
        pose.offArmAngle = a + spin + Math.PI;
        pose.scarfWave = 1.8;
        pose.jawOpen = 0.65;
      }
      break;
    }

    case 'skeleton_ult_bone_colossus': {
      if (anim.phase === AnimPhase.ANTICIPATION) {
        // Levitate slightly while absorbing rising ancient bones
        pose.bobY = -8 * p;
        pose.swordArmAngle = -0.55;
        pose.offArmAngle = -Math.PI + 0.55;
        pose.jawOpen = p;
        pose.eyeColor = '#FEF08A';
        pose.bladeGlow = 1.0;
      } else if (anim.phase === AnimPhase.EXECUTION) {
        // Slam down as the giant Bone Colossus!
        pose.bobY = 4 * (1 - p);
        pose.scaleX = 1.24 - 0.24 * p;
        pose.scaleY = 0.82 + 0.18 * p;
        pose.jawOpen = 1.0;
        pose.eyeColor = '#FEF08A';
        pose.scarfWave = 1.9;
      }
      break;
    }

    case 'skeleton_ult_army_of_bones': {
      if (anim.phase === AnimPhase.ANTICIPATION) {
        // Raise Bone Blade skyward like a general rallying his legion!
        pose.swordArmAngle = -Math.PI / 2;
        pose.swordWristAngle = 0;
        pose.bobY = -5 * p;
        pose.jawOpen = 0.8 * p;
        pose.bladeGlow = 1.0;
        pose.bladeGlowColor = '#38BDF8';
      } else if (anim.phase === AnimPhase.EXECUTION) {
        // Drive sword hilt / command gesture downward to crack the crypt floor
        pose.swordArmAngle = Math.PI / 2 - 0.2;
        pose.bobY = 3;
        pose.jawOpen = 0.9;
        pose.eyeColor = '#38BDF8';
      }
      break;
    }

    case 'skeleton_ult_reapers_judgment': {
      if (anim.phase === AnimPhase.ANTICIPATION) {
        pose.holdingScythe = p;
        pose.scytheSweepAngle = a - 1.55 * p;
        pose.swordArmAngle = a - 1.4 * p;
        pose.offArmAngle = a - 1.1 * p;
        pose.bobY = -6 * p;
        pose.eyeColor = '#818CF8';
        pose.jawOpen = 0.7 * p;
      } else if (anim.phase === AnimPhase.EXECUTION) {
        const snap = 1 - Math.pow(1 - p, 3);
        pose.holdingScythe = 1.0;
        pose.scytheSweepAngle = lerp(a - 1.55, a + 1.55, snap);
        pose.swordArmAngle = pose.scytheSweepAngle;
        pose.offArmAngle = pose.scytheSweepAngle - 0.35;
        pose.lungeX = Math.cos(a) * 15 * Math.sin(p * Math.PI);
        pose.lungeY = Math.sin(a) * 11 * Math.sin(p * Math.PI);
        pose.scarfWave = 2.0;
        pose.eyeColor = '#38BDF8';
        pose.jawOpen = 1.0;
      } else {
        pose.holdingScythe = 1 - p;
        pose.scytheSweepAngle = a + 1.55;
      }
      break;
    }
  }

  return pose;
}

/**
 * Renders the playable Skeleton Hero (normal agile Bonemaster form & giant Bone Colossus ultimate form),
 * plus active Ribcage Shield detached ribs and active Bone Storm orbiting bone fragments!
 */
export function drawSkeletonHero(
  ctx: CanvasRenderingContext2D,
  player: PlayerState,
  time: number
): void {
  const isColossus = player.boneColossusTimer > 0;
  const pose = computeSkeletonRigPose(player, time);
  // Match Zombie's exact chibi scale & sovereign transformation scale (1.0 normal, 1.26 transformed)
  const heroScale = isColossus ? 1.26 : 1.0;
  const hurtWhite = player.hurtFlash > 0.11;

  // 1. Back half of active Bone Storm orbitals (skill effect — kept untouched)
  if (player.boneStormTimer > 0) {
    drawBoneStormOrbitals(ctx, player, time, 'BACK');
  }

  // 2. Back half of detached Ribcage Shield barrier (skill effect — kept untouched)
  if (player.ribcageShieldTimer > 0) {
    drawRibcageShieldOverlay(ctx, player, time, 'BACK');
  }

  ctx.save();
  ctx.translate(player.x, player.y);

  // Sovereign Ground Aura during Bone Colossus (mirrors Zombie's cozy ground glow)
  if (isColossus) {
    const pulse = 42 + Math.sin(time * 7) * 5;
    const grad = ctx.createRadialGradient(0, 6, 8, 0, 6, pulse);
    grad.addColorStop(0, 'rgba(56, 189, 248, 0.45)');
    grad.addColorStop(0.6, 'rgba(99, 102, 241, 0.24)');
    grad.addColorStop(1, 'rgba(56, 189, 248, 0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.ellipse(0, 6, pulse, pulse * 0.68, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  // Death collapse pose if HP reaches 0
  if (player.hp <= 0) {
    ctx.globalAlpha = 0.75;
    ctx.translate(0, 10);
    ctx.rotate(1.3);
  }

  // Soft Ground Shadow (exact same anchor & proportions as Zombie!)
  ctx.fillStyle = 'rgba(0, 0, 0, 0.44)';
  ctx.beginPath();
  ctx.ellipse(0, 17, 17 * heroScale, 7 * heroScale, 0, 0, Math.PI * 2);
  ctx.fill();

  // Apply combat lunge, bouncy walk bob, tilt, and squash-stretch
  ctx.translate(pose.lungeX, pose.lungeY - pose.bobY);
  ctx.rotate(pose.torsoTilt);
  ctx.scale(pose.scaleX * heroScale, pose.scaleY * heroScale);

  const outline = '#18181B';
  const boneCream = hurtWhite ? '#FFFFFF' : isColossus ? '#F0F9FF' : '#FFFBEB';
  const boneWarmShade = hurtWhite ? '#FFFFFF' : isColossus ? '#E0F2FE' : '#FEF3C7';
  const isMoving = Math.hypot(player.vx, player.vy) > 12;
  const stride = isMoving ? Math.sin(player.walkCycle) * 2.6 : 0;

  // --- A. COZY FLUTTERING ADVENTURER SCARF TAIL (behind cloak) ---
  const scarfDir = Math.cos(player.facingAngle) >= 0 ? -1 : 1;
  const scarfFlutter = Math.sin(time * 8.5 + player.walkCycle) * 2.8 * pose.scarfWave;
  ctx.save();
  ctx.fillStyle = hurtWhite ? '#FFFFFF' : isColossus ? '#0284C7' : '#38BDF8';
  ctx.strokeStyle = outline;
  ctx.lineWidth = 2.6;
  ctx.lineJoin = 'round';
  ctx.beginPath();
  ctx.moveTo(scarfDir * 6, -1);
  ctx.quadraticCurveTo(
    scarfDir * (16 + pose.scarfWave * 4),
    1 + scarfFlutter * 0.6,
    scarfDir * (20 + pose.scarfWave * 5),
    10 + scarfFlutter
  );
  ctx.quadraticCurveTo(
    scarfDir * (14 + pose.scarfWave * 3),
    13 + scarfFlutter * 0.8,
    scarfDir * 8,
    6
  );
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.restore();

  // --- B. TINY STUBBY CUTE BONE BOOTS PEEKING UNDER CLOAK HEM ---
  for (const side of [-1, 1]) {
    const footY = 15.2 + side * stride * 0.55;
    ctx.fillStyle = hurtWhite ? '#FFFFFF' : '#475569';
    ctx.strokeStyle = outline;
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    ctx.ellipse(side * 5.2, footY, 4.2, 2.8, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }

  // --- C. COZY EXPLORER CLOAK & CUTE CHIBI RIBCAGE TUNIC (Matches Zombie's Cloak Silhouette!) ---
  const flare = (pose.scarfWave - 0.35) * 4.5;
  if (isColossus) {
    // Cozy Royal Bone-Knight Mantle (mirrors Zombie's Lord of Decay sovereign cloak!)
    const wave = Math.sin(time * 9) * 2.2;
    ctx.fillStyle = hurtWhite ? '#FFFFFF' : '#1E293B';
    ctx.strokeStyle = '#090D12';
    ctx.lineWidth = 2.8;
    ctx.beginPath();
    ctx.moveTo(-14, -5);
    ctx.quadraticCurveTo(-21 - flare, 13, -15 - flare * 0.5, 18.5 + wave * 0.5);
    ctx.lineTo(-7, 14);
    ctx.lineTo(0, 19.5 - wave * 0.5);
    ctx.lineTo(7, 14);
    ctx.lineTo(15 + flare * 0.5, 18.5 + wave * 0.5);
    ctx.quadraticCurveTo(21 + flare, 13, 14, -5);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Cute chunky rounded ivory shoulder pauldrons in Bone Colossus form
    if (!hurtWhite) {
      ctx.fillStyle = boneCream;
      ctx.strokeStyle = outline;
      ctx.lineWidth = 2.4;
      for (const side of [-1, 1]) {
        ctx.beginPath();
        ctx.ellipse(side * 13.5, -1.5, 5.8, 4.2, side * 0.35, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      }
    }
  } else {
    // Warm Slate-Indigo Cozy Explorer Cloak (matching Zombie's patched brown explorer cloak!)
    ctx.fillStyle = hurtWhite ? '#FFFFFF' : '#334155';
    ctx.strokeStyle = outline;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(-13, -4);
    ctx.quadraticCurveTo(-18 - flare, 14, -9 - flare * 0.4, 16);
    ctx.lineTo(9 + flare * 0.4, 16);
    ctx.quadraticCurveTo(18 + flare, 14, 13, -4);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Little cozy stitched sky-blue patch on cloak corner (echoing Zombie's stitched green patch!)
    if (!hurtWhite) {
      ctx.fillStyle = '#0284C7';
      ctx.strokeStyle = outline;
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.roundRect(-10.5, 5.5, 5.8, 5.5, 1.8);
      ctx.fill();
      ctx.stroke();
    }
  }

  // Cute Chibi Ribcage & Cozy Glowing Soul-Heart on Front of Tunic
  const ribsDetached = player.ribcageShieldTimer > 0;
  if (!hurtWhite) {
    // Warm cyan soul-lantern core nestled inside chest
    const heartPulse = 3.1 + Math.sin(time * 9) * 0.6;
    ctx.fillStyle = ribsDetached || isColossus ? '#38BDF8' : 'rgba(56, 189, 248, 0.85)';
    ctx.beginPath();
    ctx.arc(0, 8.2, ribsDetached ? heartPulse + 1.2 : heartPulse, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#E0F2FE';
    ctx.beginPath();
    ctx.arc(0, 8.2, heartPulse * 0.48, 0, Math.PI * 2);
    ctx.fill();

    // 2 Cute Plump Rounded Ivory Rib-Bars (detach cleanly while Ribcage Shield is active!)
    if (!ribsDetached) {
      ctx.lineCap = 'round';
      for (let r = 0; r < 2; r++) {
        const ry = 6.2 + r * 4.2;
        const rw = 6.6 - r * 1.1;
        ctx.strokeStyle = outline;
        ctx.lineWidth = 4.2;
        ctx.beginPath();
        ctx.moveTo(-rw, ry);
        ctx.quadraticCurveTo(0, ry + 1.3, rw, ry);
        ctx.stroke();

        ctx.strokeStyle = boneCream;
        ctx.lineWidth = 2.1;
        ctx.stroke();
      }
    }
  }

  // Plump Cozy Adventurer Scarf Collar (exact same placement as Zombie's scarf!)
  ctx.fillStyle = hurtWhite ? '#FFFFFF' : isColossus ? '#0369A1' : '#0284C7';
  ctx.strokeStyle = outline;
  ctx.lineWidth = 2.6;
  ctx.beginPath();
  ctx.ellipse(0, 1, 13, 5.8, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Warm golden button clasp on cozy scarf
  if (!hurtWhite) {
    ctx.fillStyle = '#FBBF24';
    ctx.strokeStyle = outline;
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.arc(0, 2.2, 2.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }

  // --- D. ADORABLE OVERSIZED CHIBI SKULL HEAD (Matches Zombie's r=13.5 Head at y=-9!) ---
  const lookX = Math.cos(player.facingAngle) * 2.4;
  const lookY = Math.sin(player.facingAngle) * 1.6;
  const blinking = !isColossus && pose.jawOpen < 0.2 && Math.sin(time * 1.75 + 0.9) > 0.985;

  // Main chubby-cute round cranium + soft rounded lower jaw contour
  ctx.fillStyle = boneCream;
  ctx.strokeStyle = outline;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(0, -9.2, 13.5, Math.PI * 0.78, Math.PI * 0.22, false);
  // Plump rounded chibi cheeks curving into a cute little rounded chin
  const jawDrop = pose.jawOpen * 1.8;
  ctx.quadraticCurveTo(11.5, 1.5, 6.2, 4.2 + jawDrop);
  ctx.quadraticCurveTo(0, 5.6 + jawDrop, -6.2, 4.2 + jawDrop);
  ctx.quadraticCurveTo(-11.5, 1.5, -13.5 * Math.cos(Math.PI * 0.22), -9.2 + 13.5 * Math.sin(Math.PI * 0.22));
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Soft warm cream crown highlight / cheek shade for 2D illustrated warmth
  if (!hurtWhite) {
    ctx.fillStyle = boneWarmShade;
    ctx.beginPath();
    ctx.ellipse(0, -16.5, 7.5, 3.2, 0, 0, Math.PI * 2);
    ctx.fill();

    // Cute little hand-drawn temple squiggle crack (mirrors Zombie's cute stitch detail!)
    ctx.strokeStyle = '#94A3B8';
    ctx.lineWidth = 1.6;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(-9.2, -15.5);
    ctx.lineTo(-6.8, -13.2);
    ctx.lineTo(-8.2, -11.4);
    ctx.stroke();

    // Cozy rosy-peach chibi cheek blushes!
    ctx.fillStyle = 'rgba(251, 146, 60, 0.28)';
    ctx.beginPath();
    ctx.ellipse(-7.8 + lookX * 0.5, -4.6 + lookY * 0.4, 2.8, 1.7, 0, 0, Math.PI * 2);
    ctx.ellipse(7.8 + lookX * 0.5, -4.6 + lookY * 0.4, 2.8, 1.7, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  // Big Expressive Cute Cozy Eyes (matching Zombie's eye spacing, size, sparkles & happy blink!)
  if (blinking) {
    ctx.strokeStyle = '#1E293B';
    ctx.lineWidth = 2.2;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.arc(-4.8 + lookX, -7.8 + lookY, 2.8, Math.PI * 1.15, Math.PI * 1.85);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(4.8 + lookX, -7.8 + lookY, 2.8, Math.PI * 1.15, Math.PI * 1.85);
    ctx.stroke();
  } else {
    for (const side of [-1, 1]) {
      const ex = side * 4.8 + lookX;
      const ey = -8.6 + lookY;

      // Soft rounded dark-slate socket frame
      ctx.fillStyle = '#1E293B';
      ctx.beginPath();
      ctx.arc(ex, ey, isColossus ? 4.2 : 3.9, 0, Math.PI * 2);
      ctx.fill();

      // Big bright friendly glowing iris
      ctx.fillStyle = isColossus ? '#FDE047' : pose.eyeColor;
      ctx.beginPath();
      ctx.arc(ex + lookX * 0.12, ey + lookY * 0.12, isColossus ? 2.9 : 2.65, 0, Math.PI * 2);
      ctx.fill();

      // Big crisp cute white eye-shine + tiny secondary sparkle
      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath();
      ctx.arc(ex - 0.9, ey - 1.0, 1.25, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(ex + 1.0, ey + 0.9, 0.55, 0, Math.PI * 2);
      ctx.fill();
    }

    // Starry ocular wisps in Bone Colossus form (mirrors Zombie's Lord of Decay eye wisps!)
    if (isColossus && !hurtWhite) {
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.85)';
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.moveTo(-5.5 + lookX, -9.2 + lookY);
      ctx.quadraticCurveTo(-11, -14, -13, -17 + Math.sin(time * 12) * 2);
      ctx.moveTo(5.5 + lookX, -9.2 + lookY);
      ctx.quadraticCurveTo(11, -14, 13, -17 + Math.cos(time * 12) * 2);
      ctx.stroke();
    }
  }

  // Tiny cute rounded upside-down heart button nose (friendly & cozy, never harsh!)
  ctx.fillStyle = '#334155';
  ctx.beginPath();
  ctx.arc(lookX * 0.75 - 0.7, -5.2 + lookY * 0.5, 1.05, 0, Math.PI * 2);
  ctx.arc(lookX * 0.75 + 0.7, -5.2 + lookY * 0.5, 1.05, 0, Math.PI * 2);
  ctx.fill();

  // Cute Cozy Smile / Battle-Cry Mouth
  if (pose.jawOpen > 0.35) {
    // Cute determined little 'o' battle cry during big swings & ultimates!
    ctx.fillStyle = '#1E293B';
    ctx.beginPath();
    ctx.ellipse(lookX * 0.7, -1.8 + lookY * 0.5 + jawDrop * 0.5, 2.8, 2.0 + pose.jawOpen * 1.2, 0, 0, Math.PI * 2);
    ctx.fill();
  } else {
    // Sweet friendly stitched/toothy grin matching Zombie's cute smile!
    ctx.strokeStyle = '#1E293B';
    ctx.lineWidth = 1.65;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.arc(lookX * 0.7, -3.1 + lookY * 0.5, 3.3, 0.18, Math.PI - 0.18);
    ctx.stroke();

    // Two tiny vertical cute tooth-stitch ticks on the smile
    ctx.lineWidth = 1.3;
    ctx.beginPath();
    ctx.moveTo(lookX * 0.7 - 1.2, -0.7 + lookY * 0.5);
    ctx.lineTo(lookX * 0.7 - 1.2, 0.9 + lookY * 0.5);
    ctx.moveTo(lookX * 0.7 + 1.2, -0.7 + lookY * 0.5);
    ctx.lineTo(lookX * 0.7 + 1.2, 0.9 + lookY * 0.5);
    ctx.stroke();
  }

  // --- E. SIGNATURE SWAYING HEAD TOPPER (Matches Zombie's Head Sprout & Sovereign Crown!) ---
  ctx.save();
  ctx.translate(0, -22.5);
  ctx.rotate(Math.sin(time * 3.4 + player.walkCycle * 0.5) * 0.16);
  if (isColossus) {
    // Cute Chunky Royal Bone-Knight Crown + Floating Cyan Soul Gem (mirrors Zombie's Lord of Decay Crown!)
    ctx.fillStyle = '#F59E0B';
    ctx.strokeStyle = outline;
    ctx.lineWidth = 2;
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(-10, 2);
    ctx.lineTo(-12.5, -7.5);
    ctx.lineTo(-5, -3);
    ctx.lineTo(0, -11.5);
    ctx.lineTo(5, -3);
    ctx.lineTo(12.5, -7.5);
    ctx.lineTo(10, 2);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    const gemY = -15.5 + Math.sin(time * 8) * 1.8;
    ctx.fillStyle = '#38BDF8';
    ctx.beginPath();
    ctx.moveTo(0, gemY - 4);
    ctx.lineTo(3.2, gemY);
    ctx.lineTo(0, gemY + 4);
    ctx.lineTo(-3.2, gemY);
    ctx.closePath();
    ctx.fill();
  } else {
    // Cute bobbing cozy sky-blue soul-flame wisp curling cheerfully atop skull!
    const wispBob = Math.sin(time * 5.2) * 1.1;
    ctx.fillStyle = '#38BDF8';
    ctx.strokeStyle = '#0C4A6E';
    ctx.lineWidth = 1.7;
    ctx.beginPath();
    ctx.moveTo(-3.2, 0.5);
    ctx.quadraticCurveTo(-4.5, -6 + wispBob, 1.2, -9.8 + wispBob);
    ctx.quadraticCurveTo(4.8, -5.2 + wispBob, 3.0, 0.5);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#E0F2FE';
    ctx.beginPath();
    ctx.arc(-0.2, -3.2 + wispBob * 0.6, 1.8, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();

  // --- F. CUTE CHUNKY CHIBI BONE HANDS & COZY CARTOON BONE BLADE ---
  // Off-hand chibi bone mitten (and poised Bone Spear during Bone Spear wind-up!)
  const offDist = isColossus ? 18 : 15;
  const offHx = Math.cos(pose.offArmAngle) * offDist;
  const offHy = Math.sin(pose.offArmAngle) * offDist + 2;
  drawCozySkeletonHand(ctx, offHx, offHy, boneCream, outline, isColossus);

  if (pose.holdingSpear > 0.05) {
    ctx.save();
    ctx.translate(offHx, offHy);
    ctx.rotate(player.facingAngle);
    ctx.globalAlpha = pose.holdingSpear;
    drawBarbedBoneSpearGraphic(ctx, 0.9);
    ctx.restore();
  }

  // Sword-hand chibi bone mitten + Cozy Rounded Cartoon Bone Broadsword (or Spectral Scythe during Ult 3!)
  const mainDist = isColossus ? 18.5 : 15.5;
  const handX = Math.cos(pose.swordArmAngle) * mainDist;
  const handY = Math.sin(pose.swordArmAngle) * mainDist + 2;

  if (pose.holdingScythe > 0.05) {
    ctx.save();
    ctx.translate(handX, handY);
    ctx.rotate(pose.scytheSweepAngle);
    ctx.globalAlpha = pose.holdingScythe;
    drawSpectralScytheWeapon(ctx);
    ctx.restore();
  } else {
    ctx.save();
    ctx.translate(handX, handY);
    ctx.rotate(pose.swordArmAngle + pose.swordWristAngle);
    drawCozyBoneBlade(ctx, isColossus, pose.bladeGlow, pose.bladeGlowColor, boneCream, outline);
    ctx.restore();
  }

  // Draw main hand on top of sword grip so the cute round bone mitten hugs the hilt!
  drawCozySkeletonHand(ctx, handX, handY, boneCream, outline, isColossus);

  ctx.restore();

  // 3. Front half of detached Ribcage Shield barrier (skill effect — kept untouched)
  if (player.ribcageShieldTimer > 0) {
    drawRibcageShieldOverlay(ctx, player, time, 'FRONT');
  }

  // 4. Front half of active Bone Storm orbitals (skill effect — kept untouched)
  if (player.boneStormTimer > 0) {
    drawBoneStormOrbitals(ctx, player, time, 'FRONT');
  }
}

function drawCozySkeletonHand(
  ctx: CanvasRenderingContext2D,
  hx: number,
  hy: number,
  boneFill: string,
  outline: string,
  isColossus: boolean
): void {
  ctx.save();
  ctx.translate(hx, hy);
  ctx.fillStyle = boneFill;
  ctx.strokeStyle = outline;
  ctx.lineWidth = 2.2;
  ctx.beginPath();
  ctx.arc(0, 0, isColossus ? 5.3 : 4.7, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.restore();
}

function drawCozyBoneBlade(
  ctx: CanvasRenderingContext2D,
  isColossus: boolean,
  glowIntensity: number,
  glowColor: string,
  boneFill: string,
  outline: string
): void {
  const bladeLen = isColossus ? 36 : 25;
  const bladeWidth = isColossus ? 7.4 : 5.6;

  // Soft Bone Mastery / Skill Charge Edge Glow
  if (glowIntensity > 0.08) {
    ctx.save();
    ctx.globalAlpha = Math.min(0.72, glowIntensity * 0.52);
    ctx.fillStyle = glowColor;
    ctx.beginPath();
    ctx.ellipse(bladeLen * 0.52, 0, bladeLen * 0.62, bladeWidth * 1.45, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // Cozy warm leather-wrapped handle
  ctx.strokeStyle = outline;
  ctx.lineWidth = 5;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(-6.5, 0);
  ctx.lineTo(2, 0);
  ctx.stroke();

  ctx.strokeStyle = '#92400E';
  ctx.lineWidth = 2.6;
  ctx.stroke();

  // Cute double-lobed cartoon bone pommel
  ctx.fillStyle = boneFill;
  ctx.strokeStyle = outline;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(-7.8, -1.8, 2.3, 0, Math.PI * 2);
  ctx.arc(-7.8, 1.8, 2.3, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Plump rounded cartoon bone crossguard
  ctx.fillStyle = boneFill;
  ctx.strokeStyle = outline;
  ctx.lineWidth = 2.2;
  ctx.beginPath();
  ctx.roundRect(0.5, -bladeWidth * 1.25, 4.6, bladeWidth * 2.5, 2.3);
  ctx.fill();
  ctx.stroke();

  // Smooth, chunky, cute 2D adventurer bone broadsword blade (no grimdark jagged teeth!)
  ctx.fillStyle = boneFill;
  ctx.strokeStyle = outline;
  ctx.lineWidth = 2.5;
  ctx.lineJoin = 'round';
  ctx.beginPath();
  ctx.moveTo(4.2, -bladeWidth * 0.78);
  ctx.quadraticCurveTo(bladeLen * 0.68, -bladeWidth * 0.92, bladeLen, 0);
  ctx.quadraticCurveTo(bladeLen * 0.68, bladeWidth * 0.92, 4.2, bladeWidth * 0.78);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Soft sky-blue fuller shine down the center of the cozy bone sword
  ctx.strokeStyle = isColossus ? '#38BDF8' : '#7DD3FC';
  ctx.lineWidth = 2.0;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(8, 0);
  ctx.lineTo(bladeLen * 0.72, 0);
  ctx.stroke();
}

function drawSpectralScytheWeapon(ctx: CanvasRenderingContext2D): void {
  // Long dark-iron & bone polearm shaft
  ctx.strokeStyle = '#0F172A';
  ctx.lineWidth = 5.2;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(-24, 0);
  ctx.lineTo(44, 0);
  ctx.stroke();

  ctx.strokeStyle = '#818CF8';
  ctx.lineWidth = 2.2;
  ctx.stroke();

  // Giant curved Spectral Reaper Blade
  ctx.fillStyle = '#38BDF8';
  ctx.strokeStyle = '#E0F2FE';
  ctx.lineWidth = 2.2;
  ctx.beginPath();
  ctx.moveTo(36, -4);
  ctx.quadraticCurveTo(54, 18, 22, 48);
  ctx.quadraticCurveTo(38, 18, 28, 2);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
}

function drawRibcageShieldOverlay(
  ctx: CanvasRenderingContext2D,
  player: PlayerState,
  time: number,
  pass: 'BACK' | 'FRONT'
): void {
  const hpRatio = Math.max(0.2, player.ribcageShieldHp / Math.max(1, player.ribcageShieldMaxHp));
  const ribCount = 6;
  ctx.save();
  ctx.translate(player.x, player.y - 4);

  for (let i = 0; i < ribCount; i++) {
    const a = time * 2.5 + (Math.PI * 2 * i) / ribCount;
    const sinA = Math.sin(a);
    if (pass === 'BACK' && sinA >= 0) continue;
    if (pass === 'FRONT' && sinA < 0) continue;

    const rx = Math.cos(a) * 30;
    const ry = sinA * 21;

    ctx.save();
    ctx.translate(rx, ry);
    ctx.rotate(a + Math.PI / 2);
    ctx.globalAlpha = 0.75 + 0.25 * hpRatio;

    // Translucent cyan marrow barrier web between ribs
    ctx.fillStyle = 'rgba(56, 189, 248, 0.18)';
    ctx.beginPath();
    ctx.ellipse(0, 0, 11, 5, 0, 0, Math.PI * 2);
    ctx.fill();

    // Curved detached ivory rib bone
    ctx.strokeStyle = '#0F172A';
    ctx.lineWidth = 5.4;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.arc(0, 4, 12, Math.PI * 1.15, Math.PI * 1.85);
    ctx.stroke();

    ctx.strokeStyle = '#F8FAFC';
    ctx.lineWidth = 2.8;
    ctx.stroke();
    ctx.restore();
  }

  ctx.restore();
}

function drawBoneStormOrbitals(
  ctx: CanvasRenderingContext2D,
  player: PlayerState,
  time: number,
  pass: 'BACK' | 'FRONT'
): void {
  // Bone Mastery grants 6 orbiting bone shards at varied distances & speeds!
  const shardCount = 6;
  const fade = player.boneStormTimer < 0.35 ? player.boneStormTimer / 0.35 : 1;

  ctx.save();
  ctx.translate(player.x, player.y - 2);
  ctx.globalAlpha = fade;

  for (let i = 0; i < shardCount; i++) {
    const speed = i % 2 === 0 ? 5.6 : 4.4;
    const orbitR = i % 2 === 0 ? 64 : 82;
    const orbitA = time * speed + (Math.PI * 2 * i) / shardCount;
    const sinA = Math.sin(orbitA);
    if (pass === 'BACK' && sinA >= 0) continue;
    if (pass === 'FRONT' && sinA < 0) continue;

    const sx = Math.cos(orbitA) * orbitR;
    const sy = sinA * (orbitR * 0.74);

    // Curved cyan motion wake ribbon trailing behind each orbiting bone shard
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.42)';
    ctx.lineWidth = 3.2;
    ctx.lineCap = 'round';
    ctx.beginPath();
    for (let t = 0; t <= 5; t++) {
      const trailA = orbitA - t * 0.1;
      const tx = Math.cos(trailA) * orbitR;
      const ty = Math.sin(trailA) * (orbitR * 0.74);
      if (t === 0) ctx.moveTo(tx, ty);
      else ctx.lineTo(tx, ty);
    }
    ctx.stroke();

    // Individually tumbling sharpened bone blade-shard
    ctx.save();
    ctx.translate(sx, sy);
    ctx.rotate(time * (9 + i * 1.7) + i);

    ctx.fillStyle = '#F8FAFC';
    ctx.strokeStyle = '#0F172A';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(9, 0);
    ctx.lineTo(1, -4.2);
    ctx.lineTo(-8, -1.5);
    ctx.lineTo(-5, 0);
    ctx.lineTo(-8, 2.2);
    ctx.lineTo(1, 4.2);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }

  ctx.restore();
}

// ============================================================================
// ARMY OF BONES — SKELETAL WARRIOR MINION RENDERER
// ============================================================================

export function drawSkeletonWarriorMinion(
  ctx: CanvasRenderingContext2D,
  m: MinionState,
  time: number
): void {
  ctx.save();
  ctx.translate(m.x, m.y);

  const totalSpawn = m.spawnDuration || 0.55;
  if (m.spawnAnim > 0) {
    // Bone-by-bone emergence out of cracked crypt earth!
    const p = 1 - Math.max(0, Math.min(1, m.spawnAnim / totalSpawn));
    ctx.save();
    ctx.beginPath();
    ctx.rect(-26, -42, 52, 52);
    ctx.clip();

    const riseY = (1 - p) * 32;
    ctx.translate(0, riseY);

    // Bony hand punching up first, followed by helmeted skull & sword
    ctx.fillStyle = '#F1F5F9';
    ctx.strokeStyle = '#18181B';
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.arc(0, -12, 8.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#38BDF8';
    ctx.beginPath();
    ctx.arc(-3, -12, 1.7, 0, Math.PI * 2);
    ctx.arc(3, -12, 1.7, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
    ctx.restore();
    return;
  }

  const attackRatio = m.attackFlash > 0 ? m.attackFlash / 0.22 : 0;
  const isHurt = (m.hurtFlash || 0) > 0;
  const lungeX = Math.cos(m.facingAngle) * attackRatio * 8;
  const lungeY = Math.sin(m.facingAngle) * attackRatio * 7;
  const bob = Math.abs(Math.sin(m.walkCycle)) * 3.2;
  const stride = Math.sin(m.walkCycle) * 3.8;

  // Ground shadow
  ctx.fillStyle = 'rgba(0, 0, 0, 0.34)';
  ctx.beginPath();
  ctx.ellipse(lungeX * 0.4, 12, 10.5, 4.8, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.save();
  ctx.translate(lungeX, lungeY - bob);
  ctx.rotate(Math.cos(m.facingAngle) * attackRatio * 0.18 + Math.sin(m.walkCycle) * 0.05);

  const boneColor = isHurt ? '#FFFFFF' : '#E2E8F0';

  // Little skeletal legs
  ctx.strokeStyle = '#18181B';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(-3.5, 3);
  ctx.lineTo(-4, 10 + stride * 0.5);
  ctx.moveTo(3.5, 3);
  ctx.lineTo(4, 10 - stride * 0.5);
  ctx.stroke();
  ctx.strokeStyle = boneColor;
  ctx.lineWidth = 2;
  ctx.stroke();

  // Ribbed warrior tunic / ribcage
  ctx.fillStyle = isHurt ? '#FFFFFF' : '#1E3A8A';
  ctx.strokeStyle = '#18181B';
  ctx.lineWidth = 2.2;
  ctx.beginPath();
  ctx.roundRect(-7, -5, 14, 10, 4);
  ctx.fill();
  ctx.stroke();

  ctx.strokeStyle = boneColor;
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.moveTo(-4.5, -2);
  ctx.lineTo(4.5, -2);
  ctx.moveTo(-4, 1.2);
  ctx.lineTo(4, 1.2);
  ctx.stroke();

  // Cute skull head + dented cobalt half-helm
  const lookX = Math.cos(m.facingAngle) * 2;
  const lookY = Math.sin(m.facingAngle) * 1.4;
  ctx.fillStyle = boneColor;
  ctx.strokeStyle = '#18181B';
  ctx.lineWidth = 2.4;
  ctx.beginPath();
  ctx.arc(0, -11, 8.6, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Iron-blue warrior half-helm cap
  ctx.fillStyle = isHurt ? '#FFFFFF' : '#334155';
  ctx.beginPath();
  ctx.arc(0, -12.5, 9.0, Math.PI * 1.05, Math.PI * 1.95);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Glowing cyan warrior eyes
  ctx.fillStyle = '#38BDF8';
  ctx.beginPath();
  ctx.arc(-2.8 + lookX, -10 + lookY, 1.8, 0, Math.PI * 2);
  ctx.arc(2.8 + lookX, -10 + lookY, 1.8, 0, Math.PI * 2);
  ctx.fill();

  // Off-hand bone buckler shield
  const shieldA = m.facingAngle - 0.75;
  ctx.save();
  ctx.translate(Math.cos(shieldA) * 10, Math.sin(shieldA) * 8);
  ctx.fillStyle = '#CBD5E1';
  ctx.strokeStyle = '#18181B';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(0, 0, 5.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#38BDF8';
  ctx.beginPath();
  ctx.arc(0, 0, 1.8, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // Sword hand + mini serrated bone shortsword
  const swordA = m.facingAngle + 0.55 - attackRatio * 1.15;
  ctx.save();
  ctx.translate(Math.cos(swordA) * 10, Math.sin(swordA) * 9);
  ctx.rotate(swordA);
  ctx.fillStyle = '#F8FAFC';
  ctx.strokeStyle = '#18181B';
  ctx.lineWidth = 1.8;
  ctx.beginPath();
  ctx.moveTo(0, -2.5);
  ctx.lineTo(14, 0);
  ctx.lineTo(0, 2.5);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.restore();

  ctx.restore();

  // Overhead mini health bar when damaged (Skeletal Warriors have functional HP!)
  if (m.hp !== undefined && m.maxHp !== undefined && m.hp < m.maxHp) {
    const bw = 24;
    const bh = 3.5;
    const by = -28;
    ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
    ctx.fillRect(-bw / 2 - 1, by - 1, bw + 2, bh + 2);
    ctx.fillStyle = '#38BDF8';
    ctx.fillRect(-bw / 2, by, bw * Math.max(0, m.hp / m.maxHp), bh);
  }

  // Subtle lifetime fade warning in final 0.5s
  if (m.life < 0.5) {
    ctx.fillStyle = `rgba(56, 189, 248, ${(1 - m.life * 2) * 0.25})`;
    ctx.beginPath();
    ctx.arc(0, -6, 12 + Math.sin(time * 20) * 2, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}

// ============================================================================
// SKELETON CUSTOM PROJECTILE RENDERERS (BONE SPEAR & REAPER DARK ENERGY WAVE)
// ============================================================================

function drawBarbedBoneSpearGraphic(ctx: CanvasRenderingContext2D, scale: number): void {
  ctx.save();
  ctx.scale(scale, scale);

  // Carved vertebral bone shaft
  ctx.strokeStyle = '#0F172A';
  ctx.lineWidth = 5.4;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(-22, 0);
  ctx.lineTo(10, 0);
  ctx.stroke();

  ctx.strokeStyle = '#E2E8F0';
  ctx.lineWidth = 2.8;
  ctx.stroke();

  // Barbed ivory spearhead with cyan core groove
  ctx.fillStyle = '#F8FAFC';
  ctx.strokeStyle = '#0F172A';
  ctx.lineWidth = 2.0;
  ctx.beginPath();
  ctx.moveTo(24, 0);
  ctx.lineTo(4, -7.2);
  ctx.lineTo(8, -2.2);
  ctx.lineTo(-4, -3.6);
  ctx.lineTo(-1, 0);
  ctx.lineTo(-4, 3.6);
  ctx.lineTo(8, 2.2);
  ctx.lineTo(4, 7.2);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  ctx.strokeStyle = '#38BDF8';
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.moveTo(2, 0);
  ctx.lineTo(19, 0);
  ctx.stroke();

  ctx.restore();
}

export function drawBoneSpearProjectile(
  ctx: CanvasRenderingContext2D,
  proj: Projectile,
  time: number
): void {
  const angle = proj.angle ?? Math.atan2(proj.vy, proj.vx);
  ctx.save();
  ctx.translate(proj.x, proj.y);
  ctx.rotate(angle);

  // Spiraling cyan slipstream ribbons around the flying javelin (visualizes drill spin!)
  for (const phaseOffset of [0, Math.PI]) {
    ctx.strokeStyle = phaseOffset === 0 ? 'rgba(56, 189, 248, 0.65)' : 'rgba(248, 250, 252, 0.45)';
    ctx.lineWidth = 2.0;
    ctx.beginPath();
    for (let s = 0; s <= 10; s++) {
      const t = s / 10;
      const sx = 16 - t * 48;
      const sy = Math.sin(time * 28 + t * 5.5 + phaseOffset) * (3.5 + t * 4.5);
      if (s === 0) ctx.moveTo(sx, sy);
      else ctx.lineTo(sx, sy);
    }
    ctx.stroke();
  }

  drawBarbedBoneSpearGraphic(ctx, 1.0);
  ctx.restore();
}

export function drawReaperWaveProjectile(
  ctx: CanvasRenderingContext2D,
  proj: Projectile,
  time: number
): void {
  const angle = proj.angle ?? Math.atan2(proj.vy, proj.vx);
  const ratio = Math.min(1, proj.life * 2.5);
  ctx.save();
  ctx.translate(proj.x, proj.y);
  ctx.rotate(angle);
  ctx.globalAlpha = ratio;

  const r = proj.radius * 1.35;

  // Outer abyssal indigo dark-energy crescent wave
  ctx.fillStyle = 'rgba(30, 27, 75, 0.85)';
  ctx.strokeStyle = '#818CF8';
  ctx.lineWidth = 2.4;
  ctx.beginPath();
  ctx.arc(-r * 0.35, 0, r, -1.08, 1.08);
  ctx.quadraticCurveTo(-r * 0.02, 0, -r * 0.35 + Math.cos(-1.08) * r, Math.sin(-1.08) * r);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Inner blazing cyan soul-edge core + trailing spectral flame wisps
  ctx.strokeStyle = '#38BDF8';
  ctx.lineWidth = 4.2;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.arc(-r * 0.32, 0, r * 0.88, -0.92, 0.92);
  ctx.stroke();

  ctx.strokeStyle = '#FFFFFF';
  ctx.lineWidth = 1.8;
  ctx.stroke();

  for (let w = -2; w <= 2; w++) {
    const wy = w * (r * 0.32);
    const flutter = Math.sin(time * 22 + w * 1.9) * 4;
    ctx.fillStyle = w % 2 === 0 ? 'rgba(56, 189, 248, 0.65)' : 'rgba(129, 140, 248, 0.65)';
    ctx.beginPath();
    ctx.moveTo(4, wy - 3);
    ctx.lineTo(-22 + flutter, wy);
    ctx.lineTo(4, wy + 3);
    ctx.closePath();
    ctx.fill();
  }

  ctx.restore();
}
