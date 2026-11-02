import { audio } from '../audio/AudioManager';
import { getAbilityById } from '../data/abilities';
import {
  ActiveActionAnim,
  DamageType,
  EnemyKind,
  EnemyState,
  FloatingText,
  HazardZone,
  MinionState,
  Particle,
  PickupItem,
  PlayerState,
  Projectile,
  RoomData,
  SlashEffect,
} from '../types';
import { nextEntityId } from './DungeonGenerator';
import {
  spawnDaggerFlurryStrikeVfx,
  spawnExplosiveTrapDetonateVfx,
  spawnExplosiveTrapPlaceVfx,
  spawnGoblinTwinDaggerVfx,
  spawnKingOfThievesFinaleVfx,
  spawnKingOfThievesPortalAmbushVfx,
  spawnNimbleReflexesEvadeVfx,
  spawnPhantomFrenzyConvergenceVfx,
  spawnPhantomFrenzyDashVfx,
  spawnPoisonedBladesCoatVfx,
  spawnShadowstepVfx,
  spawnThousandDaggersLaunchVfx,
  spawnWindrunnerActivateVfx,
} from './GoblinVFX';
import {
  spawnArmyOfBonesSummonVfx,
  spawnBoneColossusTransformVfx,
  spawnBoneMasteryCritSplintersVfx,
  spawnBoneSlashVfx,
  spawnBoneSpearLaunchVfx,
  spawnBoneStormActivateVfx,
  spawnEternalFrameworkGuardVfx,
  spawnPlagueCarrierInfectVfx,
  spawnReapersJudgmentSweepVfx,
  spawnRibcageShieldActivateVfx,
  spawnRibcageShieldBlockVfx,
  spawnRibcageShieldEndVfx,
  spawnSkeletalRushFinishVfx,
  spawnSkeletalRushStepVfx,
  spawnSkeletonBasicStrikeVfx,
  spawnSkeletonWarriorDissolveVfx,
  spawnSkeletonWarriorSlashVfx,
  spawnUndeadResiliencePulseVfx,
} from './SkeletonVFX';
import {
  spawnApocalypseUltVfx,
  spawnDeathsEmbraceSingleGrabVfx,
  spawnDissipationBurst,
  spawnFleshRipperVfx,
  spawnGraveyardBoneClawSwipe,
  spawnGraveyardUltVfx,
  spawnLordOfDecayAscensionVfx,
  spawnPlagueBurstVfx,
  spawnRottingDashStepVfx,
  spawnSkillImpactBurst,
  spawnUndeadRegenCastVfx,
  spawnZombieClawVfx,
  VFXState,
} from './VFXSystem';

export interface WorldEffectsContext {
  enemies: EnemyState[];
  minions: MinionState[];
  hazards: HazardZone[];
  projectiles: Projectile[];
  slashes: SlashEffect[];
  particles: Particle[];
  floatingTexts: FloatingText[];
  pickups: PickupItem[];
  vfx: VFXState;
  addScreenShake: (amount: number) => void;
  recordDamageDealt: (amount: number) => void;
  recordEnemyDefeated: () => void;
}

export function resolveCircleObstacles(
  entity: { x: number; y: number; radius: number },
  room: RoomData
): void {
  const wallMargin = 48;
  entity.x = Math.max(wallMargin + entity.radius, Math.min(room.width - wallMargin - entity.radius, entity.x));
  entity.y = Math.max(wallMargin + entity.radius, Math.min(room.height - wallMargin - entity.radius, entity.y));

  for (const obs of room.obstacles) {
    const closestX = Math.max(obs.x, Math.min(entity.x, obs.x + obs.w));
    const closestY = Math.max(obs.y, Math.min(entity.y, obs.y + obs.h));
    const dx = entity.x - closestX;
    const dy = entity.y - closestY;
    const distSq = dx * dx + dy * dy;

    if (distSq < entity.radius * entity.radius) {
      const dist = Math.sqrt(distSq) || 0.001;
      const overlap = entity.radius - dist;
      entity.x += (dx / dist) * overlap;
      entity.y += (dy / dist) * overlap;
    }
  }

  if (room.npcs) {
    for (const npc of room.npcs) {
      const minDist = entity.radius + npc.radius;
      const dx = entity.x - npc.x;
      const dy = entity.y - npc.y;
      const distSq = dx * dx + dy * dy;
      if (distSq < minDist * minDist) {
        const dist = Math.sqrt(distSq) || 0.001;
        const overlap = minDist - dist;
        entity.x += (dx / dist) * overlap;
        entity.y += (dy / dist) * overlap;
      }
    }
  }
}

export function spawnParticles(
  particles: Particle[],
  x: number,
  y: number,
  color: string,
  count: number,
  speedMin = 40,
  speedMax = 150,
  sizeMin = 3,
  sizeMax = 6,
  life = 0.45,
  glow = false
): void {
  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2;
    const spd = speedMin + Math.random() * (speedMax - speedMin);
    const maxLife = life * (0.7 + Math.random() * 0.5);
    particles.push({
      x,
      y,
      vx: Math.cos(angle) * spd,
      vy: Math.sin(angle) * spd,
      size: sizeMin + Math.random() * (sizeMax - sizeMin),
      color,
      alpha: 1,
      life: maxLife,
      maxLife,
      glow,
    });
  }
}

export function addFloatingText(
  list: FloatingText[],
  x: number,
  y: number,
  text: string,
  color: string,
  size = 15,
  isCrit = false
): void {
  list.push({
    id: nextEntityId('ft'),
    x: x + (Math.random() - 0.5) * 16,
    y: y - 14,
    vy: isCrit ? -62 : -44,
    text,
    color,
    size: isCrit ? size + 4 : size,
    life: isCrit ? 0.85 : 0.68,
    maxLife: isCrit ? 0.85 : 0.68,
    isCrit,
  });
}

function normalizeAngleDiff(a: number, b: number): number {
  let d = a - b;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  return d;
}

export function applyPoisonToEnemy(
  enemy: EnemyState,
  dps: number,
  duration: number,
  addPlagueStack = false,
  vfx?: VFXState,
  maxStacks = 3
): void {
  enemy.poisonTimer = Math.max(enemy.poisonTimer, duration);
  if (addPlagueStack) {
    const nextStacks = Math.min(maxStacks, (enemy.poisonStacks || 0) + 1);
    enemy.poisonStacks = nextStacks;
    enemy.poisonDps = Math.max(enemy.poisonDps, dps * (0.75 + nextStacks * 0.28));
    if (vfx) {
      spawnPlagueCarrierInfectVfx(vfx, enemy.x, enemy.y, nextStacks);
    }
  } else {
    enemy.poisonStacks = Math.max(1, enemy.poisonStacks || 1);
    enemy.poisonDps = Math.max(enemy.poisonDps, dps);
  }
}

export function damageEnemy(
  player: PlayerState,
  enemy: EnemyState,
  rawDamage: number,
  knockAngle: number,
  knockForce: number,
  ctx: WorldEffectsContext,
  options?: {
    canCrit?: boolean;
    critBonusChance?: number;
    critMultiplierOverride?: number;
    energyGain?: number;
    colorOverride?: string;
    silent?: boolean;
    isPoisonAbility?: boolean;
    triggersPlagueCarrier?: boolean;
    preventBoneMasterySplash?: boolean;
    forceBackstab?: boolean;
    appliesGoblinVenom?: boolean;
    impactStyle?:
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
      | 'IMPACT_BURST_BACKSTAB';
  }
): void {
  if (enemy.dead) return;

  // Zombie Passive 2 (Plague Carrier): Poisoned enemies take +8% bonus damage per Plague stack (up to +24%) from poison skills!
  let adjustedRaw = rawDamage;
  if (
    player.heroId === 'zombie' &&
    options?.isPoisonAbility &&
    enemy.poisonTimer > 0 &&
    (enemy.poisonStacks || 0) > 0
  ) {
    adjustedRaw *= 1 + 0.08 * Math.min(3, enemy.poisonStacks || 1);
  }

  // Goblin King of Thieves Stolen Might buff: +5% Attack/Skill Damage per stolen essence stack (up to +25%)
  if (player.heroId === 'goblin' && player.kingOfThievesBuffTimer > 0) {
    const stolenBonus = Math.min(0.25, Math.max(1, player.kingOfThievesStacks) * 0.05);
    adjustedRaw *= 1 + stolenBonus;
  }

  // Goblin Passive 2 (Opportunistic Predator):
  // - +24% Backstab damage when striking enemies from behind (or via Shadowstep / King of Thieves ambush)
  // - +15% Crit Chance & +16% bonus damage against weakened foes (<45% HP)
  const attackFromAngle = Math.atan2(player.y - enemy.y, player.x - enemy.x);
  const isBackstab =
    player.heroId === 'goblin' &&
    !options?.isPoisonAbility &&
    (Boolean(options?.forceBackstab) ||
      Math.abs(normalizeAngleDiff(attackFromAngle, enemy.facingAngle)) > Math.PI * 0.56);
  const isWeakened =
    player.heroId === 'goblin' && enemy.hp / Math.max(1, enemy.maxHp) < 0.45;

  if (isBackstab) {
    adjustedRaw *= 1.24;
  }
  if (isWeakened && !options?.isPoisonAbility) {
    adjustedRaw *= 1.16;
  }

  const canCrit = options?.canCrit ?? true;
  const rawCritChance =
    player.stats.critChance +
    (options?.critBonusChance || 0) +
    (isWeakened && !options?.isPoisonAbility ? 0.15 : 0);
  // Bounded critical strike chance cap (75% max for Goblin)
  const effectiveCritChance =
    player.heroId === 'goblin' ? Math.min(0.75, rawCritChance) : rawCritChance;
  const isCrit = canCrit && Math.random() < effectiveCritChance;
  // Skeleton Passive 2 (Bone Mastery): Sharpened bone technique amplifies critical damage (1.85x vs 1.65x)
  const baseCritMul =
    player.heroId === 'skeleton' ? 1.85 : player.heroId === 'goblin' ? 1.72 : 1.65;
  const critMul = options?.critMultiplierOverride ?? baseCritMul;
  const finalDamage = Math.max(1, Math.round(adjustedRaw * (isCrit ? critMul : 1.0)));

  if (enemy.kind === EnemyKind.TRAINING_DUMMY) {
    // Training dummy absorbs damage endlessly and resets nicely so player can test combos
    enemy.hp = Math.max(100, enemy.hp - finalDamage);
    if (enemy.hp <= 200) enemy.hp = enemy.maxHp;
  } else {
    enemy.hp -= finalDamage;
  }

  enemy.hurtFlash = 0.16;
  enemy.hitReactionTimer = 0.24;
  enemy.lastHitAngle = knockAngle;
  const kbResist = enemy.isBoss ? 0.15 : enemy.isElite ? 0.45 : enemy.kind === EnemyKind.TRAINING_DUMMY ? 0.2 : 1.0;
  enemy.knockVx += Math.cos(knockAngle) * knockForce * kbResist;
  enemy.knockVy += Math.sin(knockAngle) * knockForce * kbResist;

  ctx.recordDamageDealt(finalDamage);

  if (options?.energyGain && options.energyGain > 0) {
    const gain = options.energyGain * player.stats.energyGainRate;
    player.ultEnergy = Math.min(100, player.ultEnergy + gain);
  }

  const resolvedImpactStyle =
    isBackstab && options?.impactStyle === 'IMPACT_BURST_DAGGER'
      ? 'IMPACT_BURST_BACKSTAB'
      : options?.impactStyle;

  addFloatingText(
    ctx.floatingTexts,
    enemy.x,
    enemy.y - enemy.radius * 0.6,
    isCrit ? `${finalDamage}!` : `${finalDamage}`,
    options?.colorOverride ||
      (isCrit ? '#FBBF24' : isBackstab ? '#FDA4AF' : '#F8FAFC'),
    15,
    isCrit || isBackstab
  );

  if (resolvedImpactStyle) {
    spawnSkillImpactBurst(ctx.vfx, enemy.x, enemy.y, knockAngle, resolvedImpactStyle, isCrit);
  } else {
    spawnParticles(
      ctx.particles,
      enemy.x,
      enemy.y,
      isCrit ? '#FBBF24' : '#34D399',
      isCrit ? 8 : 5,
      50,
      150,
      2.5,
      5.5,
      0.32,
      true
    );
  }

  // Zombie Passive 2 (Plague Carrier): Basic & melee attacks have a 45% chance (100% in Lord of Decay) to stack Plague!
  if (player.heroId === 'zombie' && options?.triggersPlagueCarrier && !enemy.dead) {
    const procChance = player.lordOfDecayTimer > 0 ? 1.0 : 0.45;
    if (Math.random() < procChance) {
      applyPoisonToEnemy(enemy, 7 * player.stats.skillPower, 4.0, true, ctx.vfx);
    }
  }

  // Goblin Skill 5 (Poisoned Blades): Coated daggers infect targets with stacking Venom (max 4 stacks, 4.5s; crits apply 2 stacks!)
  if (
    player.heroId === 'goblin' &&
    (player.poisonedBladesTimer > 0 || options?.appliesGoblinVenom) &&
    !enemy.dead &&
    !options?.isPoisonAbility
  ) {
    const venomDps = 10 * player.stats.skillPower;
    applyPoisonToEnemy(enemy, venomDps, 4.5, true, ctx.vfx, 4);
    if (isCrit) {
      applyPoisonToEnemy(enemy, venomDps, 4.5, true, ctx.vfx, 4);
    }
  }

  // Skeleton Passive 2 (Bone Mastery): Critical strikes burst with razor bone splinters that splash nearby foes!
  if (player.heroId === 'skeleton' && isCrit && !options?.preventBoneMasterySplash) {
    spawnBoneMasteryCritSplintersVfx(ctx.vfx, enemy.x, enemy.y, knockAngle);
    const splashDmg = Math.max(2, Math.round(finalDamage * 0.24));
    let splashed = 0;
    for (const other of ctx.enemies) {
      if (other === enemy || other.dead) continue;
      if (Math.hypot(other.x - enemy.x, other.y - enemy.y) <= 74 + other.radius) {
        const spAngle = Math.atan2(other.y - enemy.y, other.x - enemy.x);
        damageEnemy(player, other, splashDmg, spAngle, 65, ctx, {
          canCrit: false,
          preventBoneMasterySplash: true,
          silent: true,
          colorOverride: '#BAE6FD',
          impactStyle: 'IMPACT_BURST_BONE',
        });
        splashed += 1;
        if (splashed >= 3) break;
      }
    }
  }

  if (!options?.silent) {
    audio.playEnemyHit(isCrit);
  }

  if (enemy.hp <= 0 && enemy.kind !== EnemyKind.TRAINING_DUMMY) {
    enemy.hp = 0;
    enemy.dead = true;
    enemy.deathAnim = 0.01;
    ctx.recordEnemyDefeated();
    audio.playEnemyDeath(enemy.isBoss);

    // Zombie Passive 1 (Undead Resilience): Defeating an enemy surges Zombie's regeneration for 3.5s!
    if (player.heroId === 'zombie') {
      player.passiveRegenSurgeTimer = 3.5;
      spawnUndeadResiliencePulseVfx(ctx.vfx, player.x, player.y, true);
    }

    if (enemy.isBoss) {
      ctx.addScreenShake(14);
      spawnParticles(ctx.particles, enemy.x, enemy.y, '#F59E0B', 32, 60, 260, 4, 9, 0.8, true);
    } else {
      spawnParticles(ctx.particles, enemy.x, enemy.y, '#A7F3D0', 12, 40, 170, 3, 6, 0.48, true);
    }

    // Grant bonus Ultimate Energy on kill
    player.ultEnergy = Math.min(100, player.ultEnergy + (enemy.isElite ? 18 : 8) * player.stats.energyGainRate);

    // Spawn cozy drops (XP, Gold, occasional Heart Berry or Soul Spark)
    const xpCount = enemy.isBoss ? 8 : enemy.isElite ? 4 : 2;
    for (let i = 0; i < xpCount; i++) {
      const a = Math.random() * Math.PI * 2;
      ctx.pickups.push({
        id: nextEntityId('xp'),
        kind: 'XP',
        x: enemy.x,
        y: enemy.y,
        vx: Math.cos(a) * (65 + Math.random() * 55),
        vy: Math.sin(a) * (65 + Math.random() * 55),
        value: 14,
        bobOffset: Math.random() * 6,
      });
    }

    const goldCount = enemy.isBoss ? 10 : enemy.isElite ? 4 : 1 + (Math.random() < 0.55 ? 1 : 0);
    for (let i = 0; i < goldCount; i++) {
      const a = Math.random() * Math.PI * 2;
      ctx.pickups.push({
        id: nextEntityId('gold'),
        kind: 'GOLD',
        x: enemy.x,
        y: enemy.y,
        vx: Math.cos(a) * (55 + Math.random() * 65),
        vy: Math.sin(a) * (55 + Math.random() * 65),
        value: 5,
        bobOffset: Math.random() * 6,
      });
    }

    if (Math.random() < (enemy.isElite ? 0.55 : 0.2)) {
      ctx.pickups.push({
        id: nextEntityId('heart'),
        kind: 'HEART',
        x: enemy.x + 8,
        y: enemy.y,
        vx: (Math.random() - 0.5) * 60,
        vy: (Math.random() - 0.5) * 60,
        value: 20,
        bobOffset: Math.random() * 6,
      });
    } else if (Math.random() < 0.22) {
      ctx.pickups.push({
        id: nextEntityId('spark'),
        kind: 'ENERGY',
        x: enemy.x - 8,
        y: enemy.y,
        vx: (Math.random() - 0.5) * 60,
        vy: (Math.random() - 0.5) * 60,
        value: 18,
        bobOffset: Math.random() * 6,
      });
    }
  }
}

export function healPlayer(player: PlayerState, rawAmount: number, ctx: WorldEffectsContext): void {
  if (player.isDead || rawAmount <= 0) return;
  const amount = Math.max(1, Math.round(rawAmount * player.stats.healingPower));
  const prev = player.hp;
  player.hp = Math.min(player.maxHp, player.hp + amount);
  const actual = player.hp - prev;
  if (actual > 0) {
    addFloatingText(ctx.floatingTexts, player.x, player.y - 16, `+${actual}`, '#4ADE80', 14);
  }
}

export function hurtPlayer(
  player: PlayerState,
  rawDamage: number,
  knockAngle: number,
  ctx: WorldEffectsContext,
  damageType: DamageType = 'PHYSICAL',
  evadable = true
): void {
  if (
    player.isDead ||
    player.invulnTimer > 0 ||
    player.dodgeTimer > 0 ||
    player.goblinVanishTimer > 0
  ) {
    return;
  }

  // Goblin Bounded Evasion Mechanics:
  // 1) Active Windrunner Skill: 40% evasion chance with 0.85s internal cooldown
  // 2) Innate Passive 1 (Nimble Reflexes): 20% evasion chance with 3.5s internal cooldown
  if (player.heroId === 'goblin' && evadable) {
    let evaded = false;
    let fromWindrunner = false;

    if (
      player.windrunnerTimer > 0 &&
      player.windrunnerEvadeCooldown <= 0 &&
      Math.random() < 0.4
    ) {
      evaded = true;
      fromWindrunner = true;
      player.windrunnerEvadeCooldown = 0.85;
    } else if (player.nimbleReflexesCooldown <= 0 && Math.random() < 0.2) {
      evaded = true;
      player.nimbleReflexesCooldown = 3.5;
    }

    if (evaded) {
      const sideSign = Math.random() < 0.5 ? 1 : -1;
      const sidestepAngle = knockAngle + sideSign * (Math.PI * 0.5);
      player.invulnTimer = 0.24;
      player.nimbleEvadeTimer = 0.22;
      player.vx += Math.cos(sidestepAngle) * 185;
      player.vy += Math.sin(sidestepAngle) * 185;
      audio.playNimbleEvade();
      spawnNimbleReflexesEvadeVfx(ctx.vfx, player.x, player.y, sidestepAngle, fromWindrunner);
      addFloatingText(
        ctx.floatingTexts,
        player.x,
        player.y - 22,
        fromWindrunner ? 'Gale Evade!' : 'Nimble Evade!',
        '#5EEAD4',
        14,
        true
      );
      return;
    }
  }

  let mitigation = 1.0;

  // Skeleton Passive 1 (Eternal Framework): Reinforced bone plating reduces PHYSICAL damage by 22%!
  if (player.heroId === 'skeleton' && damageType === 'PHYSICAL') {
    mitigation *= 0.78;
    audio.playBoneBlock();
    spawnEternalFrameworkGuardVfx(ctx.vfx, player.x, player.y, knockAngle);
  }

  // Bone Storm deflects 25% of incoming melee/ranged blows while active
  if (player.boneStormTimer > 0) {
    mitigation *= 0.75;
  }

  // Ultimate transformation mitigations (Lord of Decay 20%, Bone Colossus 30%)
  if (player.lordOfDecayTimer > 0) mitigation *= 0.8;
  if (player.boneColossusTimer > 0) mitigation *= 0.7;

  let dmg = Math.max(1, Math.round(rawDamage * mitigation));

  // Skeleton Skill 3 (Ribcage Shield): Detached rib barrier absorbs incoming damage before HP!
  if (player.ribcageShieldTimer > 0 && player.ribcageShieldHp > 0) {
    const absorbed = Math.min(player.ribcageShieldHp, dmg);
    player.ribcageShieldHp -= absorbed;
    dmg -= absorbed;
    audio.playBoneBlock();
    spawnRibcageShieldBlockVfx(ctx.vfx, player.x, player.y, knockAngle + Math.PI);

    if (player.ribcageShieldHp <= 0) {
      player.ribcageShieldHp = 0;
      player.ribcageShieldTimer = 0;
      spawnRibcageShieldEndVfx(ctx.vfx, player.x, player.y, true);
      addFloatingText(ctx.floatingTexts, player.x, player.y - 24, 'Shield Shattered!', '#38BDF8', 14, true);
    } else {
      addFloatingText(ctx.floatingTexts, player.x, player.y - 22, `Blocked -${absorbed}`, '#BAE6FD', 13);
    }

    if (dmg <= 0) {
      player.invulnTimer = 0.26;
      player.vx += Math.cos(knockAngle) * 75;
      player.vy += Math.sin(knockAngle) * 75;
      return;
    }
  }

  player.hp = Math.max(0, player.hp - dmg);
  player.invulnTimer = 0.55;
  player.hurtFlash = 0.22;
  player.vx += Math.cos(knockAngle) * 180;
  player.vy += Math.sin(knockAngle) * 180;

  audio.playPlayerHurt();
  ctx.addScreenShake(6);
  addFloatingText(
    ctx.floatingTexts,
    player.x,
    player.y - 18,
    `-${dmg}`,
    player.heroId === 'skeleton' && damageType === 'PHYSICAL' ? '#E2E8F0' : '#FB7185',
    16
  );
  spawnParticles(ctx.particles, player.x, player.y, '#FB7185', 8, 50, 140, 3, 5, 0.35);

  if (player.hp <= 0) {
    player.isDead = true;
    player.deathTimer = 0;
  }
}

function isEnemyInArc(
  originX: number,
  originY: number,
  aimAngle: number,
  range: number,
  halfArc: number,
  enemy: EnemyState
): boolean {
  const dx = enemy.x - originX;
  const dy = enemy.y - originY;
  const dist = Math.hypot(dx, dy);
  if (dist > range + enemy.radius) return false;
  if (dist < 18) return true;
  let angleDiff = Math.atan2(dy, dx) - aimAngle;
  while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
  while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
  return Math.abs(angleDiff) <= halfArc;
}

export function executeAbilityPhase(
  player: PlayerState,
  anim: ActiveActionAnim,
  room: RoomData,
  ctx: WorldEffectsContext
): void {
  const def = getAbilityById(anim.abilityId);
  const isLord = player.lordOfDecayTimer > 0;
  const lordDmgMul = isLord ? 1.38 : 1.0;
  const lordRadiusMul = isLord ? 1.24 : 1.0;
  const isColossus = player.boneColossusTimer > 0;
  const colossusDmgMul = isColossus ? 1.45 : 1.0;
  const colossusRangeMul = isColossus ? 1.35 : 1.0;
  const boneMasterySkillMul = player.heroId === 'skeleton' ? 1.12 : 1.0;
  const angle = anim.aimAngle;

  if (anim.abilityId === 'zombie_claw') {
    audio.playBasicClaw(anim.comboIndex);
    const range = def.range * lordRadiusMul;
    const dmg = player.stats.attackDamage * lordDmgMul;

    if (Math.hypot(player.vx, player.vy) < 24) {
      player.x += Math.cos(angle) * 5;
      player.y += Math.sin(angle) * 5;
      resolveCircleObstacles(player, room);
    }

    spawnZombieClawVfx(
      ctx.vfx,
      player.x,
      player.y,
      angle,
      range,
      anim.comboIndex % 2 === 1,
      isLord
    );

    for (const enemy of ctx.enemies) {
      if (!enemy.dead && isEnemyInArc(player.x, player.y, angle, range, 0.92, enemy)) {
        damageEnemy(player, enemy, dmg, angle, 185, ctx, {
          energyGain: 7,
          triggersPlagueCarrier: true,
          impactStyle: isLord ? 'IMPACT_BURST_SOVEREIGN' : 'IMPACT_BURST_CLAW',
        });
      }
    }
    return;
  }

  if (anim.abilityId === 'skeleton_bone_strike') {
    audio.playBasicBoneStrike(anim.comboIndex);
    const range = def.range * colossusRangeMul;
    const comboFinisherMul = anim.comboIndex % 3 === 2 ? 1.18 : 1.0;
    const dmg = player.stats.attackDamage * colossusDmgMul * comboFinisherMul;

    if (Math.hypot(player.vx, player.vy) < 28) {
      player.x += Math.cos(angle) * (isColossus ? 8 : 6);
      player.y += Math.sin(angle) * (isColossus ? 8 : 6);
      resolveCircleObstacles(player, room);
    }

    if (isColossus) {
      ctx.addScreenShake(4.5);
    }

    spawnSkeletonBasicStrikeVfx(
      ctx.vfx,
      player.x,
      player.y,
      angle,
      range,
      anim.comboIndex,
      isColossus
    );

    const halfArc = isColossus ? 1.1 : 0.96;
    for (const enemy of ctx.enemies) {
      if (!enemy.dead && isEnemyInArc(player.x, player.y, angle, range, halfArc, enemy)) {
        damageEnemy(player, enemy, dmg, angle, isColossus ? 255 : 175, ctx, {
          energyGain: 7,
          impactStyle: 'IMPACT_BURST_BONE',
        });
      }
    }
    return;
  }

  if (anim.abilityId === 'goblin_twin_daggers') {
    const isPoisonCoated = player.poisonedBladesTimer > 0;
    const isStolenMight = player.kingOfThievesBuffTimer > 0;
    audio.playBasicDaggerStrike(anim.comboIndex, isPoisonCoated);

    const isCrossFinisher = anim.comboIndex % 4 === 3;
    const range = def.range * (isCrossFinisher ? 1.12 : 1.0);
    const dmg = player.stats.attackDamage * (isCrossFinisher ? 1.28 : 1.0);

    if (Math.hypot(player.vx, player.vy) < 30) {
      player.x += Math.cos(angle) * (isCrossFinisher ? 7 : 4.5);
      player.y += Math.sin(angle) * (isCrossFinisher ? 7 : 4.5);
      resolveCircleObstacles(player, room);
    }

    spawnGoblinTwinDaggerVfx(
      ctx.vfx,
      player.x,
      player.y,
      angle,
      range,
      anim.comboIndex,
      isPoisonCoated,
      isStolenMight
    );

    const halfArc = isCrossFinisher ? 1.05 : 0.92;
    for (const enemy of ctx.enemies) {
      if (!enemy.dead && isEnemyInArc(player.x, player.y, angle, range, halfArc, enemy)) {
        damageEnemy(player, enemy, dmg, angle, isCrossFinisher ? 190 : 120, ctx, {
          energyGain: 6.5,
          critBonusChance: isCrossFinisher ? 0.18 : 0,
          impactStyle: 'IMPACT_BURST_DAGGER',
        });
      }
    }
    return;
  }

  // Play unique skill or ultimate SFX
  audio.playSkillCast(anim.abilityId);

  switch (anim.abilityId) {
    case 'zombie_flesh_ripper': {
      const range = def.range * lordRadiusMul;
      const dmg = def.damage * player.stats.skillPower * lordDmgMul;

      player.x += Math.cos(angle) * 26;
      player.y += Math.sin(angle) * 26;
      resolveCircleObstacles(player, room);

      ctx.addScreenShake(7);
      spawnFleshRipperVfx(ctx.vfx, player.x, player.y, angle, range, isLord);

      for (const enemy of ctx.enemies) {
        if (!enemy.dead && isEnemyInArc(player.x, player.y, angle, range, 1.05, enemy)) {
          damageEnemy(player, enemy, dmg, angle, 310, ctx, {
            energyGain: 10,
            triggersPlagueCarrier: true,
            impactStyle: isLord ? 'IMPACT_BURST_SOVEREIGN' : 'IMPACT_BURST_REND',
          });
        }
      }
      break;
    }

    case 'zombie_plague_burst': {
      const range = def.range * lordRadiusMul;
      const dmg = def.damage * player.stats.skillPower * lordDmgMul;
      const poisonDps = 14 * player.stats.skillPower * lordDmgMul;

      ctx.addScreenShake(6);
      spawnPlagueBurstVfx(ctx.vfx, player.x, player.y, range, isLord);

      for (const enemy of ctx.enemies) {
        if (enemy.dead) continue;
        const dist = Math.hypot(enemy.x - player.x, enemy.y - player.y);
        if (dist <= range + enemy.radius) {
          const pushAngle = Math.atan2(enemy.y - player.y, enemy.x - player.x);
          damageEnemy(player, enemy, dmg, pushAngle, 210, ctx, {
            energyGain: 8,
            colorOverride: '#A3E635',
            isPoisonAbility: true,
            impactStyle: 'IMPACT_BURST_PLAGUE',
          });
          applyPoisonToEnemy(enemy, poisonDps, def.duration || 4.5, true, ctx.vfx);
        }
      }
      break;
    }

    case 'zombie_deaths_embrace': {
      const range = def.range * lordRadiusMul;
      const dmg = def.damage * player.stats.skillPower * lordDmgMul;
      const grabDur = def.duration || 1.8;
      ctx.addScreenShake(5);

      const inRange = ctx.enemies
        .filter((e) => !e.dead && Math.hypot(e.x - player.x, e.y - player.y) <= range + e.radius)
        .slice(0, 6);

      if (inRange.length > 0) {
        for (const enemy of inRange) {
          spawnDeathsEmbraceSingleGrabVfx(ctx.vfx, enemy.x, enemy.y, grabDur);
          enemy.rootTimer = Math.max(enemy.rootTimer, grabDur);
          damageEnemy(player, enemy, dmg, angle, 40, ctx, {
            energyGain: 9,
            colorOverride: '#C084FC',
            triggersPlagueCarrier: true,
            impactStyle: 'IMPACT_BURST_SOUL',
          });
        }
      } else {
        // Spawn 3 clusters of underground zombie arms forward so animation always feels tactile even with no targets in range
        for (let i = -1; i <= 1; i++) {
          const a = angle + i * 0.45;
          const gx = player.x + Math.cos(a) * 95;
          const gy = player.y + Math.sin(a) * 95;
          spawnDeathsEmbraceSingleGrabVfx(ctx.vfx, gx, gy, 1.35);
        }
      }
      break;
    }

    case 'zombie_rotting_dash': {
      const dashDist = def.range;
      const startX = player.x;
      const startY = player.y;
      const steps = 5;
      const poolDur = def.duration || 4.0;
      player.invulnTimer = Math.max(player.invulnTimer, 0.32);

      for (let s = 1; s <= steps; s++) {
        player.x = startX + Math.cos(angle) * ((dashDist * s) / steps);
        player.y = startY + Math.sin(angle) * ((dashDist * s) / steps);
        resolveCircleObstacles(player, room);

        spawnRottingDashStepVfx(ctx.vfx, player.x, player.y, angle, s, poolDur, lordRadiusMul, isLord);

        ctx.hazards.push({
          id: nextEntityId('puddle'),
          kind: 'POISON_PUDDLE',
          x: player.x,
          y: player.y,
          radius: 34 * lordRadiusMul,
          life: poolDur,
          maxLife: poolDur,
          tickTimer: 0.15,
          damage: 9 * player.stats.skillPower * lordDmgMul,
          friendly: true,
        });
      }

      // Dash pass-through collision damage & collision impact burst along segment
      const dmg = def.damage * player.stats.skillPower * lordDmgMul;
      for (const enemy of ctx.enemies) {
        if (enemy.dead) continue;
        const distToEnd = Math.hypot(enemy.x - player.x, enemy.y - player.y);
        const distToMid = Math.hypot(enemy.x - (startX + player.x) / 2, enemy.y - (startY + player.y) / 2);
        if (distToEnd <= 56 + enemy.radius || distToMid <= 64 + enemy.radius) {
          ctx.addScreenShake(4.5);
          damageEnemy(player, enemy, dmg, angle, 150, ctx, {
            energyGain: 7,
            colorOverride: '#2DD4BF',
            isPoisonAbility: true,
            impactStyle: 'IMPACT_BURST_DASH',
          });
          applyPoisonToEnemy(enemy, 11 * player.stats.skillPower, 3.5, true, ctx.vfx);
        }
      }
      break;
    }

    case 'zombie_undead_regen': {
      const regenDur = def.duration || 5.0;
      healPlayer(player, 16, ctx);
      player.regenTimer = regenDur;
      player.regenTickTimer = 0.5;
      player.regenPerSecond = 9;
      spawnUndeadRegenCastVfx(ctx.vfx, player.x, player.y, regenDur);
      break;
    }

    case 'zombie_ult_apocalypse': {
      ctx.addScreenShake(9);
      const count = 3;
      const duration = def.duration || 12.0;
      const minionCoords: { x: number; y: number }[] = [];

      for (let i = 0; i < count; i++) {
        const a = angle + ((Math.PI * 2 * i) / count);
        const mx = player.x + Math.cos(a) * 58;
        const my = player.y + Math.sin(a) * 58;
        const climbDuration = 0.72 + i * 0.14;
        const minion: MinionState = {
          id: nextEntityId('minion'),
          kind: 'ZOMBIE_SPROUTLING',
          x: mx,
          y: my,
          vx: 0,
          vy: 0,
          radius: 15,
          life: duration,
          maxLife: duration,
          attackCooldown: 0.25,
          damage: Math.round(def.damage * player.stats.skillPower * lordDmgMul),
          walkCycle: i * 1.7,
          facingAngle: a,
          attackFlash: 0,
          spawnAnim: climbDuration,
          spawnDuration: climbDuration,
        };
        resolveCircleObstacles(minion, room);
        ctx.minions.push(minion);
        minionCoords.push({ x: minion.x, y: minion.y });
      }

      spawnApocalypseUltVfx(ctx.vfx, player.x, player.y, minionCoords);
      break;
    }

    case 'zombie_ult_graveyard': {
      ctx.addScreenShake(12);
      const tombCount = 6;
      const ringRadius = 128;
      const tombDur = def.duration || 5.5;
      const burstDmg = def.damage * player.stats.skillPower * lordDmgMul;
      const tombCoords: { x: number; y: number }[] = [];

      for (let i = 0; i < tombCount; i++) {
        const a = (Math.PI * 2 * i) / tombCount + 0.25;
        const tx = Math.max(85, Math.min(room.width - 85, player.x + Math.cos(a) * ringRadius));
        const ty = Math.max(85, Math.min(room.height - 85, player.y + Math.sin(a) * ringRadius));
        const staggerDelay = i * 0.06;
        ctx.hazards.push({
          id: nextEntityId('tomb'),
          kind: 'TOMBSTONE',
          x: tx,
          y: ty,
          radius: 78,
          life: tombDur + staggerDelay,
          maxLife: tombDur,
          spawnDelay: staggerDelay,
          tickTimer: 0.55 + (i % 3) * 0.15 + staggerDelay,
          damage: 24 * player.stats.skillPower * lordDmgMul,
          friendly: true,
        });
        tombCoords.push({ x: tx, y: ty });
      }

      spawnGraveyardUltVfx(ctx.vfx, player.x, player.y, def.range, tombCoords, tombDur);

      for (const enemy of ctx.enemies) {
        if (enemy.dead) continue;
        const dist = Math.hypot(enemy.x - player.x, enemy.y - player.y);
        if (dist <= def.range + enemy.radius) {
          const pushAngle = Math.atan2(enemy.y - player.y, enemy.x - player.x);
          damageEnemy(player, enemy, burstDmg, pushAngle, 260, ctx, {
            colorOverride: '#E879F9',
            impactStyle: 'IMPACT_BURST_SOUL',
          });
        }
      }
      break;
    }

    case 'zombie_ult_lord_of_decay': {
      ctx.addScreenShake(10);
      const duration = def.duration || 10.0;
      player.lordOfDecayTimer = duration;
      player.lordOfDecayMax = duration;
      healPlayer(player, 24, ctx);

      spawnLordOfDecayAscensionVfx(ctx.vfx, player.x, player.y, def.range, duration);

      const burstDmg = def.damage * player.stats.skillPower;
      for (const enemy of ctx.enemies) {
        if (enemy.dead) continue;
        const dist = Math.hypot(enemy.x - player.x, enemy.y - player.y);
        if (dist <= def.range + enemy.radius) {
          const pushAngle = Math.atan2(enemy.y - player.y, enemy.x - player.x);
          damageEnemy(player, enemy, burstDmg, pushAngle, 250, ctx, {
            colorOverride: '#34D399',
            isPoisonAbility: true,
            impactStyle: 'IMPACT_BURST_SOVEREIGN',
          });
          applyPoisonToEnemy(enemy, 14 * player.stats.skillPower, 4.0, true, ctx.vfx);
        }
      }
      break;
    }

    // =========================================================================
    // SKELETON NORMAL SKILLS & ULTIMATES
    // =========================================================================

    case 'skeleton_bone_slash': {
      const range = def.range * (isColossus ? 1.18 : 1.0);
      const dmg = def.damage * player.stats.skillPower * boneMasterySkillMul * colossusDmgMul;

      player.x += Math.cos(angle) * 20;
      player.y += Math.sin(angle) * 20;
      resolveCircleObstacles(player, room);

      ctx.addScreenShake(6.5);
      spawnBoneSlashVfx(ctx.vfx, player.x, player.y, angle, def.range, isColossus);

      for (const enemy of ctx.enemies) {
        if (!enemy.dead && isEnemyInArc(player.x, player.y, angle, range, 1.12, enemy)) {
          damageEnemy(player, enemy, dmg, angle, 285, ctx, {
            energyGain: 10,
            critBonusChance: 0.08,
            impactStyle: 'IMPACT_BURST_BONE',
          });
        }
      }
      break;
    }

    case 'skeleton_bone_spear': {
      const spearSpeed = 610;
      const dmg = def.damage * player.stats.skillPower * boneMasterySkillMul * colossusDmgMul;
      ctx.addScreenShake(4.5);
      spawnBoneSpearLaunchVfx(ctx.vfx, player.x, player.y, angle);

      ctx.projectiles.push({
        id: nextEntityId('bone_spear'),
        x: player.x + Math.cos(angle) * 20,
        y: player.y + Math.sin(angle) * 20,
        vx: Math.cos(angle) * spearSpeed,
        vy: Math.sin(angle) * spearSpeed,
        radius: 13,
        damage: dmg,
        damageType: 'PHYSICAL',
        friendly: true,
        color: '#F8FAFC',
        life: 1.4,
        visualKind: 'BONE_SPEAR',
        piercing: true,
        hitEnemyIds: [],
        distanceTraveled: 0,
        maxDistance: def.range,
        angle,
      });
      break;
    }

    case 'skeleton_ribcage_shield': {
      const duration = def.duration || 5.5;
      const maxShield = Math.round(58 * player.stats.skillPower * boneMasterySkillMul);
      player.ribcageShieldMaxHp = maxShield;
      player.ribcageShieldHp = maxShield;
      player.ribcageShieldTimer = duration;

      spawnRibcageShieldActivateVfx(ctx.vfx, player.x, player.y, duration);
      addFloatingText(ctx.floatingTexts, player.x, player.y - 22, `+${maxShield} Bone Aegis`, '#38BDF8', 14);

      // Outward rib-expansion wave nudges crowding melee foes back slightly
      for (const enemy of ctx.enemies) {
        if (enemy.dead) continue;
        const dist = Math.hypot(enemy.x - player.x, enemy.y - player.y);
        if (dist <= 68 + enemy.radius) {
          const pushA = Math.atan2(enemy.y - player.y, enemy.x - player.x);
          damageEnemy(
            player,
            enemy,
            14 * player.stats.skillPower * boneMasterySkillMul,
            pushA,
            210,
            ctx,
            {
              energyGain: 6,
              colorOverride: '#BAE6FD',
              impactStyle: 'IMPACT_BURST_BONE',
            }
          );
        }
      }
      break;
    }

    case 'skeleton_skeletal_rush': {
      const dashDist = def.range;
      const startX = player.x;
      const startY = player.y;
      const steps = 5;
      player.invulnTimer = Math.max(player.invulnTimer, 0.32);

      for (let s = 1; s <= steps; s++) {
        player.x = startX + Math.cos(angle) * ((dashDist * s) / steps);
        player.y = startY + Math.sin(angle) * ((dashDist * s) / steps);
        resolveCircleObstacles(player, room);
        spawnSkeletalRushStepVfx(ctx.vfx, player.x, player.y, angle, s, isColossus);
      }
      spawnSkeletalRushFinishVfx(ctx.vfx, player.x, player.y, angle, isColossus);

      const dmg = def.damage * player.stats.skillPower * boneMasterySkillMul * colossusDmgMul;
      const segDx = player.x - startX;
      const segDy = player.y - startY;
      const segLenSq = segDx * segDx + segDy * segDy || 1;

      for (const enemy of ctx.enemies) {
        if (enemy.dead) continue;
        // Precise closest-point-on-segment collision along the entire dash path!
        const t = Math.max(
          0,
          Math.min(1, ((enemy.x - startX) * segDx + (enemy.y - startY) * segDy) / segLenSq)
        );
        const closestX = startX + segDx * t;
        const closestY = startY + segDy * t;
        if (Math.hypot(enemy.x - closestX, enemy.y - closestY) <= 46 + enemy.radius) {
          ctx.addScreenShake(4.5);
          damageEnemy(player, enemy, dmg, angle, 165, ctx, {
            energyGain: 8,
            critBonusChance: 0.12,
            impactStyle: 'IMPACT_BURST_BONE',
          });
        }
      }
      break;
    }

    case 'skeleton_bone_storm': {
      const duration = def.duration || 5.0;
      player.boneStormMaxTimer = duration;
      player.boneStormTimer = duration;
      player.boneStormHitTimers = {};
      ctx.addScreenShake(5);
      spawnBoneStormActivateVfx(ctx.vfx, player.x, player.y, duration);
      break;
    }

    case 'skeleton_ult_bone_colossus': {
      ctx.addScreenShake(12);
      const duration = def.duration || 10.0;
      player.boneColossusMax = duration;
      player.boneColossusTimer = duration;
      healPlayer(player, 22, ctx);

      spawnBoneColossusTransformVfx(ctx.vfx, player.x, player.y, duration);

      const shockDmg = def.damage * player.stats.skillPower * boneMasterySkillMul;
      for (const enemy of ctx.enemies) {
        if (enemy.dead) continue;
        const dist = Math.hypot(enemy.x - player.x, enemy.y - player.y);
        if (dist <= def.range + enemy.radius) {
          const pushA = Math.atan2(enemy.y - player.y, enemy.x - player.x);
          damageEnemy(player, enemy, shockDmg, pushA, 290, ctx, {
            colorOverride: '#38BDF8',
            impactStyle: 'IMPACT_BURST_BONE',
          });
        }
      }
      break;
    }

    case 'skeleton_ult_army_of_bones': {
      ctx.addScreenShake(9);
      const count = 4;
      const duration = def.duration || 12.0;
      const warriorHp = Math.round(54 * player.stats.skillPower);

      for (let i = 0; i < count; i++) {
        const a = angle + ((Math.PI * 2 * i) / count) + 0.35;
        const mx = player.x + Math.cos(a) * 64;
        const my = player.y + Math.sin(a) * 54;
        const emergeTime = 0.48 + i * 0.08;
        const warrior: MinionState = {
          id: nextEntityId('skel_warrior'),
          kind: 'SKELETON_WARRIOR',
          x: mx,
          y: my,
          vx: 0,
          vy: 0,
          radius: 15,
          hp: warriorHp,
          maxHp: warriorHp,
          hurtFlash: 0,
          life: duration,
          maxLife: duration,
          attackCooldown: 0.2,
          damage: Math.round(def.damage * player.stats.skillPower * boneMasterySkillMul),
          walkCycle: i * 1.4,
          facingAngle: a,
          attackFlash: 0,
          spawnAnim: emergeTime,
          spawnDuration: emergeTime,
        };
        resolveCircleObstacles(warrior, room);
        ctx.minions.push(warrior);
        spawnArmyOfBonesSummonVfx(ctx.vfx, warrior.x, warrior.y);
      }
      break;
    }

    case 'skeleton_ult_reapers_judgment': {
      ctx.addScreenShake(13);
      const range = def.range * (isColossus ? 1.15 : 1.0);
      const sweepDmg = def.damage * player.stats.skillPower * boneMasterySkillMul * colossusDmgMul;

      spawnReapersJudgmentSweepVfx(ctx.vfx, player.x, player.y, angle, range);

      // 1) Wide devastating Scythe Harvest Arc (high crit chance & 2.2x crit damage + heavy knockback)
      for (const enemy of ctx.enemies) {
        if (!enemy.dead && isEnemyInArc(player.x, player.y, angle, range, 1.32, enemy)) {
          damageEnemy(player, enemy, sweepDmg, angle, 350, ctx, {
            critBonusChance: 0.25,
            critMultiplierOverride: 2.2,
            colorOverride: '#38BDF8',
            impactStyle: 'IMPACT_BURST_REAPER',
          });
        }
      }

      // 2) Functional Piercing Dark Energy Wave Projectile traveling forward!
      const waveSpeed = 450;
      ctx.projectiles.push({
        id: nextEntityId('reaper_wave'),
        x: player.x + Math.cos(angle) * 34,
        y: player.y + Math.sin(angle) * 34,
        vx: Math.cos(angle) * waveSpeed,
        vy: Math.sin(angle) * waveSpeed,
        radius: 34,
        damage: Math.round(sweepDmg * 0.68),
        damageType: 'PHYSICAL',
        friendly: true,
        color: '#818CF8',
        life: 1.2,
        visualKind: 'REAPER_WAVE',
        piercing: true,
        hitEnemyIds: [],
        distanceTraveled: 0,
        maxDistance: 390,
        angle,
      });
      break;
    }

    // =========================================================================
    // GOBLIN NORMAL SKILLS & ULTIMATES
    // =========================================================================

    case 'goblin_dagger_flurry': {
      const range = def.range;
      const strikeDmg = def.damage * player.stats.skillPower;
      const isPoisonCoated = player.poisonedBladesTimer > 0;

      player.x += Math.cos(angle) * 14;
      player.y += Math.sin(angle) * 14;
      resolveCircleObstacles(player, room);

      // Hit #1 executes immediately; Hits #2..#6 trigger rapidly via daggerFlurryState!
      spawnDaggerFlurryStrikeVfx(
        ctx.vfx,
        player.x,
        player.y,
        angle,
        range,
        1,
        false,
        isPoisonCoated
      );

      for (const enemy of ctx.enemies) {
        if (!enemy.dead && isEnemyInArc(player.x, player.y, angle, range, 0.98, enemy)) {
          damageEnemy(player, enemy, strikeDmg, angle, 75, ctx, {
            energyGain: 2.5,
            critBonusChance: 0.1,
            impactStyle: 'IMPACT_BURST_DAGGER',
          });
        }
      }

      player.daggerFlurryState = {
        hitsRemaining: 5,
        nextHitTimer: 0.055,
        aimAngle: angle,
        totalHits: 6,
      };
      break;
    }

    case 'goblin_shadowstep': {
      const startX = player.x;
      const startY = player.y;
      const dmg = def.damage * player.stats.skillPower;
      player.invulnTimer = Math.max(player.invulnTimer, 0.32);

      // Find best living target in aimed direction cone (or closest target right beside Goblin)
      let bestTarget: EnemyState | null = null;
      let bestScore = Infinity;
      for (const e of ctx.enemies) {
        if (e.dead) continue;
        const dx = e.x - player.x;
        const dy = e.y - player.y;
        const dist = Math.hypot(dx, dy);
        if (dist > def.range + e.radius + 24) continue;
        const diff = Math.abs(normalizeAngleDiff(Math.atan2(dy, dx), angle));
        if (diff <= 0.95 || dist <= 82) {
          const score = dist + diff * 65;
          if (score < bestScore) {
            bestScore = score;
            bestTarget = e;
          }
        }
      }

      if (bestTarget) {
        const behindDist = bestTarget.radius + player.radius + 6;
        player.x = bestTarget.x - Math.cos(bestTarget.facingAngle) * behindDist;
        player.y = bestTarget.y - Math.sin(bestTarget.facingAngle) * behindDist;
        resolveCircleObstacles(player, room);

        const strikeAngle = Math.atan2(bestTarget.y - player.y, bestTarget.x - player.x);
        player.facingAngle = strikeAngle;
        ctx.addScreenShake(5.5);

        spawnShadowstepVfx(ctx.vfx, startX, startY, player.x, player.y, strikeAngle, true);

        damageEnemy(player, bestTarget, dmg, strikeAngle, 210, ctx, {
          energyGain: 11,
          critBonusChance: 0.25,
          forceBackstab: true,
          impactStyle: 'IMPACT_BURST_BACKSTAB',
        });

        // Cleave any tightly packed adjacent foe caught in the twin-dagger cross ambush
        for (const other of ctx.enemies) {
          if (other === bestTarget || other.dead) continue;
          if (Math.hypot(other.x - bestTarget.x, other.y - bestTarget.y) <= 52 + other.radius) {
            damageEnemy(player, other, dmg * 0.72, strikeAngle, 150, ctx, {
              energyGain: 4,
              critBonusChance: 0.15,
              forceBackstab: true,
              impactStyle: 'IMPACT_BURST_BACKSTAB',
            });
          }
        }
      } else {
        // Directional shadow-dash when no target is in the cone
        player.x = startX + Math.cos(angle) * (def.range * 0.8);
        player.y = startY + Math.sin(angle) * (def.range * 0.8);
        resolveCircleObstacles(player, room);
        player.facingAngle = angle;

        spawnShadowstepVfx(ctx.vfx, startX, startY, player.x, player.y, angle, false);

        for (const e of ctx.enemies) {
          if (e.dead) continue;
          if (Math.hypot(e.x - player.x, e.y - player.y) <= 62 + e.radius) {
            damageEnemy(player, e, dmg, angle, 175, ctx, {
              energyGain: 9,
              critBonusChance: 0.2,
              forceBackstab: true,
              impactStyle: 'IMPACT_BURST_BACKSTAB',
            });
          }
        }
      }
      break;
    }

    case 'goblin_explosive_trap': {
      // Enforce maximum of 3 active Goblin traps simultaneously (dismantle oldest cleanly)
      const activeTraps = ctx.hazards.filter((h) => h.kind === 'GOBLIN_TRAP');
      while (activeTraps.length >= 3) {
        const oldest = activeTraps.shift();
        if (oldest) {
          const idx = ctx.hazards.indexOf(oldest);
          if (idx >= 0) ctx.hazards.splice(idx, 1);
          spawnDissipationBurst(ctx.vfx, oldest.x, oldest.y, '#FBBF24', 'MINION_POOF');
        }
      }

      const trapDummy = {
        x: player.x + Math.cos(angle) * 48,
        y: player.y + Math.sin(angle) * 48,
        radius: 14,
      };
      resolveCircleObstacles(trapDummy, room);

      const trapDuration = def.duration || 14.0;
      ctx.hazards.push({
        id: nextEntityId('gob_trap'),
        kind: 'GOBLIN_TRAP',
        x: trapDummy.x,
        y: trapDummy.y,
        radius: def.range, // Blast radius (115)
        life: trapDuration,
        maxLife: trapDuration,
        tickTimer: 0.1,
        damage: def.damage * player.stats.skillPower,
        friendly: true,
        armedTimer: 0.25,
        triggeredTimer: 0,
      });

      spawnExplosiveTrapPlaceVfx(ctx.vfx, trapDummy.x, trapDummy.y);
      break;
    }

    case 'goblin_windrunner': {
      const duration = def.duration || 5.5;
      player.windrunnerMaxTimer = duration;
      player.windrunnerTimer = duration;
      player.windrunnerEvadeCooldown = 0;
      spawnWindrunnerActivateVfx(ctx.vfx, player.x, player.y, duration);
      addFloatingText(ctx.floatingTexts, player.x, player.y - 22, 'Windrunner!', '#5EEAD4', 14);
      break;
    }

    case 'goblin_poisoned_blades': {
      const duration = def.duration || 6.5;
      player.poisonedBladesMaxTimer = duration;
      player.poisonedBladesTimer = duration;
      spawnPoisonedBladesCoatVfx(ctx.vfx, player.x, player.y);
      addFloatingText(ctx.floatingTexts, player.x, player.y - 22, 'Venom Blades!', '#84CC16', 14);
      break;
    }

    case 'goblin_ult_phantom_frenzy': {
      ctx.addScreenShake(8);
      player.invulnTimer = Math.max(player.invulnTimer, 0.96);
      player.goblinVanishTimer = 0.82;
      player.phantomFrenzyState = {
        strikesDone: 0,
        totalStrikes: 7,
        nextStrikeTimer: 0.01,
        originX: player.x,
        originY: player.y,
        visitedEnemyIds: [],
        aimAngle: angle,
      };
      break;
    }

    case 'goblin_ult_king_of_thieves': {
      ctx.addScreenShake(8.5);
      player.invulnTimer = Math.max(player.invulnTimer, 1.0);
      player.goblinVanishTimer = 0.86;
      player.kingOfThievesStacks = 0;
      player.kingOfThievesState = {
        strikesDone: 0,
        totalStrikes: 5,
        nextStrikeTimer: 0.02,
        originX: player.x,
        originY: player.y,
        hitCounts: {},
        lastTargetX: player.x,
        lastTargetY: player.y,
        aimAngle: angle,
      };
      break;
    }

    case 'goblin_ult_thousand_daggers': {
      ctx.addScreenShake(9);
      // Lock target zone onto nearest enemy in aimed cone if present, otherwise 145px ahead
      let zoneX = player.x + Math.cos(angle) * 145;
      let zoneY = player.y + Math.sin(angle) * 145;
      let bestDist = 235;
      for (const e of ctx.enemies) {
        if (e.dead) continue;
        const d = Math.hypot(e.x - player.x, e.y - player.y);
        const diff = Math.abs(normalizeAngleDiff(Math.atan2(e.y - player.y, e.x - player.x), angle));
        if (d < bestDist && (diff <= 1.05 || d <= 90)) {
          bestDist = d;
          zoneX = e.x;
          zoneY = e.y;
        }
      }

      const margin = 105;
      zoneX = Math.max(margin, Math.min(room.width - margin, zoneX));
      zoneY = Math.max(margin, Math.min(room.height - margin, zoneY));
      const zoneRadius = 132;

      ctx.hazards.push({
        id: nextEntityId('daggers_zone'),
        kind: 'THOUSAND_DAGGERS_ZONE',
        x: zoneX,
        y: zoneY,
        radius: zoneRadius,
        life: 1.45,
        maxLife: 1.45,
        tickTimer: 1.0,
        damage: 0,
        friendly: true,
      });

      spawnThousandDaggersLaunchVfx(ctx.vfx, player.x, player.y);

      const daggerCount = 18;
      const sharedHits: Record<string, number> = {};
      const daggerDmg = def.damage * player.stats.skillPower;

      for (let i = 0; i < daggerCount; i++) {
        // Golden-angle spiral distribution for uniform, non-clumping aerial rain across the target zone
        const radialFrac = i === 0 ? 0.08 : Math.sqrt((i + 0.4) / daggerCount) * 0.88;
        const theta = i * 2.39996 + (Math.random() - 0.5) * 0.35;
        const tx = zoneX + Math.cos(theta) * zoneRadius * radialFrac;
        const ty = zoneY + Math.sin(theta) * zoneRadius * 0.76 * radialFrac;

        ctx.projectiles.push({
          id: nextEntityId('fall_dagger'),
          x: tx,
          y: ty,
          vx: 0,
          vy: 0,
          radius: 26,
          damage: daggerDmg,
          damageType: 'PHYSICAL',
          friendly: true,
          color: '#FACC15',
          life: 2.4,
          visualKind: 'FALLING_DAGGER',
          angle: (Math.random() - 0.5) * 1.2,
          z: 275 + (i % 3) * 24,
          vz: -730,
          spawnDelay: 0.08 + i * 0.042,
          sharedHitCounts: sharedHits,
          maxHitsPerEnemy: 5,
        });
      }
      break;
    }
  }
}

function updateGoblinActiveSequences(
  dt: number,
  player: PlayerState,
  room: RoomData,
  ctx: WorldEffectsContext
): void {
  // 1. Dagger Flurry Multi-Hit Sequence (Hits #2..#6)
  if (player.daggerFlurryState) {
    const st = player.daggerFlurryState;
    st.nextHitTimer -= dt;
    if (st.nextHitTimer <= 0 && st.hitsRemaining > 0) {
      const def = getAbilityById('goblin_dagger_flurry');
      const hitNumber = st.totalHits - st.hitsRemaining + 1;
      const isFinalHit = st.hitsRemaining === 1;
      const isPoisonCoated = player.poisonedBladesTimer > 0;
      const angle = player.facingAngle;

      audio.playBasicDaggerStrike(hitNumber, isPoisonCoated);

      if (isFinalHit) {
        player.x += Math.cos(angle) * 16;
        player.y += Math.sin(angle) * 16;
        resolveCircleObstacles(player, room);
        ctx.addScreenShake(4.5);
      }

      spawnDaggerFlurryStrikeVfx(
        ctx.vfx,
        player.x,
        player.y,
        angle,
        def.range,
        hitNumber,
        isFinalHit,
        isPoisonCoated
      );

      const strikeDmg = def.damage * player.stats.skillPower * (isFinalHit ? 1.65 : 1.0);
      const halfArc = isFinalHit ? 1.15 : 0.98;
      for (const enemy of ctx.enemies) {
        if (!enemy.dead && isEnemyInArc(player.x, player.y, angle, def.range * (isFinalHit ? 1.14 : 1.0), halfArc, enemy)) {
          damageEnemy(player, enemy, strikeDmg, angle, isFinalHit ? 195 : 55, ctx, {
            energyGain: isFinalHit ? 4 : 1.5,
            critBonusChance: isFinalHit ? 0.22 : 0.1,
            impactStyle: isFinalHit ? 'IMPACT_BURST_BACKSTAB' : 'IMPACT_BURST_DAGGER',
          });
        }
      }

      st.hitsRemaining -= 1;
      st.nextHitTimer = st.hitsRemaining === 1 ? 0.075 : 0.052;
      if (st.hitsRemaining <= 0) {
        player.daggerFlurryState = null;
      }
    }
  }

  // 2. Ultimate 1: Phantom Frenzy (Rapid untargetable multi-angle omni-slashes -> 4-clone convergence finisher)
  if (player.phantomFrenzyState) {
    const pf = player.phantomFrenzyState;
    pf.nextStrikeTimer -= dt;
    if (pf.nextStrikeTimer <= 0) {
      const def = getAbilityById('goblin_ult_phantom_frenzy');
      const livingInRange = ctx.enemies.filter(
        (e) => !e.dead && Math.hypot(e.x - pf.originX, e.y - pf.originY) <= def.range + 75
      );

      if (pf.strikesDone < pf.totalStrikes) {
        const fromX = player.x;
        const fromY = player.y;

        // Prioritize unvisited enemies first so Phantom Frenzy dances across the whole pack!
        let target: EnemyState | null = null;
        const unvisited = livingInRange.filter((e) => !pf.visitedEnemyIds.includes(e.id));
        if (unvisited.length > 0) {
          target = unvisited[pf.strikesDone % unvisited.length];
          pf.visitedEnemyIds.push(target.id);
        } else if (livingInRange.length > 0) {
          pf.visitedEnemyIds = [];
          target = livingInRange[pf.strikesDone % livingInRange.length];
          pf.visitedEnemyIds.push(target.id);
        }

        const slashAngleOffset = (pf.strikesDone * 2.25) % (Math.PI * 2);
        let toX: number;
        let toY: number;
        let strikeAngle: number;

        if (target) {
          const orbitDist = target.radius + 22;
          toX = target.x - Math.cos(slashAngleOffset) * orbitDist;
          toY = target.y - Math.sin(slashAngleOffset) * orbitDist;
          strikeAngle = Math.atan2(target.y - toX + (toX - target.x), 0); // overridden cleanly below
          strikeAngle = Math.atan2(target.y - toY, target.x - toX);
        } else {
          // Stylish geometric phantom octagon dance around cast point if cast in empty space
          const centerX = pf.originX + Math.cos(pf.aimAngle) * 70;
          const centerY = pf.originY + Math.sin(pf.aimAngle) * 55;
          toX = centerX + Math.cos(slashAngleOffset) * 68;
          toY = centerY + Math.sin(slashAngleOffset) * 52;
          strikeAngle = Math.atan2(centerY - toY, centerX - toX);
        }

        player.x = toX;
        player.y = toY;
        resolveCircleObstacles(player, room);
        player.facingAngle = strikeAngle;

        audio.playBasicDaggerStrike(pf.strikesDone, player.poisonedBladesTimer > 0);
        ctx.addScreenShake(3.8);
        spawnPhantomFrenzyDashVfx(
          ctx.vfx,
          fromX,
          fromY,
          player.x,
          player.y,
          strikeAngle,
          pf.strikesDone
        );

        const dashDmg = def.damage * player.stats.skillPower;
        if (target) {
          damageEnemy(player, target, dashDmg, strikeAngle, 70, ctx, {
            critBonusChance: 0.2,
            impactStyle: 'IMPACT_BURST_DAGGER',
          });
        }
        // Hit any nearby enemy along the slash locus
        for (const other of livingInRange) {
          if (other === target || other.dead) continue;
          if (Math.hypot(other.x - player.x, other.y - player.y) <= 58 + other.radius) {
            damageEnemy(player, other, dashDmg * 0.75, strikeAngle, 55, ctx, {
              critBonusChance: 0.15,
              silent: true,
              impactStyle: 'IMPACT_BURST_DAGGER',
            });
          }
        }

        pf.strikesDone += 1;
        pf.nextStrikeTimer = 0.095;
      } else {
        // Synchronized 4-Clone Convergence X-Burst Finisher + Safe Landing!
        const convCenterX =
          livingInRange.length > 0
            ? livingInRange.reduce((acc, e) => acc + e.x, 0) / livingInRange.length
            : pf.originX + Math.cos(pf.aimAngle) * 65;
        const convCenterY =
          livingInRange.length > 0
            ? livingInRange.reduce((acc, e) => acc + e.y, 0) / livingInRange.length
            : pf.originY + Math.sin(pf.aimAngle) * 50;

        player.x = pf.originX;
        player.y = pf.originY;
        resolveCircleObstacles(player, room);
        player.goblinVanishTimer = 0;

        ctx.addScreenShake(11);
        audio.playBasicDaggerStrike(3, true);
        spawnPhantomFrenzyConvergenceVfx(ctx.vfx, convCenterX, convCenterY, 138);

        const finisherDmg = def.damage * player.stats.skillPower * 1.65;
        for (const e of ctx.enemies) {
          if (e.dead) continue;
          if (Math.hypot(e.x - convCenterX, e.y - convCenterY) <= 145 + e.radius) {
            const pushA = Math.atan2(e.y - convCenterY, e.x - convCenterX);
            damageEnemy(player, e, finisherDmg, pushA, 240, ctx, {
              critBonusChance: 0.3,
              colorOverride: '#34D399',
              impactStyle: 'IMPACT_BURST_BACKSTAB',
            });
          }
        }

        player.phantomFrenzyState = null;
      }
    }
  }

  // 3. Ultimate 2: King of Thieves (Shadow-portal backstab ambushes + vitality/strength theft + Stolen Might buff)
  if (player.kingOfThievesState) {
    const kt = player.kingOfThievesState;
    kt.nextStrikeTimer -= dt;
    if (kt.nextStrikeTimer <= 0) {
      const def = getAbilityById('goblin_ult_king_of_thieves');
      const candidates = ctx.enemies.filter(
        (e) => !e.dead && Math.hypot(e.x - kt.originX, e.y - kt.originY) <= def.range + 85
      );

      if (kt.strikesDone < kt.totalStrikes) {
        // Smart target distribution: always pick the candidate with the fewest hits so far!
        let target: EnemyState | null = null;
        if (candidates.length > 0) {
          candidates.sort((a, b) => {
            const ca = kt.hitCounts[a.id] || 0;
            const cb = kt.hitCounts[b.id] || 0;
            if (ca !== cb) return ca - cb;
            return (
              Math.hypot(a.x - player.x, a.y - player.y) -
              Math.hypot(b.x - player.x, b.y - player.y)
            );
          });
          // Prevent excessive repeat-hit spam on a lone enemy beyond 3 shadow ambushes (fast forward to royal finale!)
          const minHits = kt.hitCounts[candidates[0].id] || 0;
          if (candidates.length === 1 && minHits >= 3) {
            kt.strikesDone = kt.totalStrikes;
            kt.nextStrikeTimer = 0.04;
            return;
          }
          target = candidates[0];
        }

        if (target) {
          kt.hitCounts[target.id] = (kt.hitCounts[target.id] || 0) + 1;
          const behindAngle = target.facingAngle + ((kt.strikesDone % 2 === 0 ? 1 : -1) * 0.22);
          const portalX = target.x - Math.cos(behindAngle) * (target.radius + player.radius + 8);
          const portalY = target.y - Math.sin(behindAngle) * (target.radius + player.radius + 8);
          player.x = portalX;
          player.y = portalY;
          resolveCircleObstacles(player, room);

          const strikeAngle = Math.atan2(target.y - player.y, target.x - player.x);
          player.facingAngle = strikeAngle;
          kt.lastTargetX = player.x;
          kt.lastTargetY = player.y;

          audio.playThiefSiphonHit(kt.strikesDone);
          ctx.addScreenShake(5);
          spawnKingOfThievesPortalAmbushVfx(
            ctx.vfx,
            player.x,
            player.y,
            target.x,
            target.y,
            strikeAngle
          );

          const ambushDmg = def.damage * player.stats.skillPower;
          damageEnemy(player, target, ambushDmg, strikeAngle, 130, ctx, {
            critBonusChance: 0.3,
            forceBackstab: true,
            colorOverride: '#E879F9',
            impactStyle: 'IMPACT_BURST_BACKSTAB',
          });

          // Functional Vitality & Strength Theft!
          healPlayer(player, 8, ctx);
          player.kingOfThievesStacks = Math.min(5, player.kingOfThievesStacks + 1);
          player.kingOfThievesBuffTimer = def.duration || 7.0;
        } else {
          // Shadow portal ambush flourish forward if cast with no targets in range
          const a = kt.aimAngle + (kt.strikesDone - 2) * 0.55;
          const px = kt.originX + Math.cos(a) * 75;
          const py = kt.originY + Math.sin(a) * 58;
          player.x = px;
          player.y = py;
          resolveCircleObstacles(player, room);
          audio.playThiefSiphonHit(kt.strikesDone);
          spawnKingOfThievesPortalAmbushVfx(
            ctx.vfx,
            player.x,
            player.y,
            player.x + Math.cos(a) * 26,
            player.y + Math.sin(a) * 26,
            a
          );
          player.kingOfThievesStacks = Math.min(3, player.kingOfThievesStacks + 1);
          player.kingOfThievesBuffTimer = def.duration || 7.0;
        }

        kt.strikesDone += 1;
        kt.nextStrikeTimer = 0.135;
      } else {
        // Reappear with Royal Thief Shadow-Crown Finale!
        player.goblinVanishTimer = 0;
        ctx.addScreenShake(9.5);
        spawnKingOfThievesFinaleVfx(ctx.vfx, player.x, player.y);
        addFloatingText(
          ctx.floatingTexts,
          player.x,
          player.y - 26,
          `Stolen Might ×${Math.max(1, player.kingOfThievesStacks)}!`,
          '#FACC15',
          15,
          true
        );

        const finaleDmg = def.damage * player.stats.skillPower * 0.9;
        for (const e of ctx.enemies) {
          if (e.dead) continue;
          if (Math.hypot(e.x - player.x, e.y - player.y) <= 110 + e.radius) {
            const pushA = Math.atan2(e.y - player.y, e.x - player.x);
            damageEnemy(player, e, finaleDmg, pushA, 220, ctx, {
              critBonusChance: 0.25,
              colorOverride: '#FACC15',
              impactStyle: 'IMPACT_BURST_BACKSTAB',
            });
          }
        }

        player.kingOfThievesState = null;
      }
    }
  }
}

export function updateMinionsAndHazards(
  dt: number,
  player: PlayerState,
  room: RoomData,
  ctx: WorldEffectsContext
): void {
  // Step Goblin multi-strike skill & ultimate sequences (Dagger Flurry, Phantom Frenzy, King of Thieves)
  updateGoblinActiveSequences(dt, player, room, ctx);
  // Active Bone Storm Orbital Hitboxes around Skeleton!
  if (player.boneStormTimer > 0) {
    for (const key of Object.keys(player.boneStormHitTimers)) {
      player.boneStormHitTimers[key] -= dt;
      if (player.boneStormHitTimers[key] <= 0) {
        delete player.boneStormHitTimers[key];
      }
    }

    const stormRadius = 90;
    const boneMasteryMul = player.heroId === 'skeleton' ? 1.12 : 1.0;
    const stormHitDmg = 16 * player.stats.skillPower * boneMasteryMul;

    for (const enemy of ctx.enemies) {
      if (enemy.dead) continue;
      if ((player.boneStormHitTimers[enemy.id] || 0) > 0) continue;
      const dist = Math.hypot(enemy.x - player.x, enemy.y - player.y);
      if (dist <= stormRadius + enemy.radius) {
        player.boneStormHitTimers[enemy.id] = 0.42;
        const pushA = Math.atan2(enemy.y - player.y, enemy.x - player.x);
        damageEnemy(player, enemy, stormHitDmg, pushA, 90, ctx, {
          energyGain: 3,
          colorOverride: '#BAE6FD',
          impactStyle: 'IMPACT_BURST_BONE',
        });
      }
    }
  }

  // Update Minions (Zombie Apocalypse & Skeleton Army of Bones)
  for (let i = ctx.minions.length - 1; i >= 0; i--) {
    const m = ctx.minions[i];
    const isSkelWarrior = m.kind === 'SKELETON_WARRIOR';
    m.life -= dt;
    if (m.spawnAnim > 0) m.spawnAnim = Math.max(0, m.spawnAnim - dt);
    if (m.attackFlash > 0) m.attackFlash = Math.max(0, m.attackFlash - dt);
    if (m.hurtFlash && m.hurtFlash > 0) m.hurtFlash = Math.max(0, m.hurtFlash - dt);
    if (m.attackCooldown > 0) m.attackCooldown -= dt;

    if (m.life <= 0 || (m.hp !== undefined && m.hp <= 0)) {
      if (isSkelWarrior) {
        spawnSkeletonWarriorDissolveVfx(ctx.vfx, m.x, m.y);
      } else {
        spawnDissipationBurst(ctx.vfx, m.x, m.y, '#FBBF24', 'MINION_POOF');
      }
      ctx.minions.splice(i, 1);
      continue;
    }

    // Hold position while emerging out of the open ground chasm!
    if (m.spawnAnim > 0.14) {
      continue;
    }

    // Find nearest living enemy
    let target: EnemyState | null = null;
    let bestDist = Infinity;
    for (const e of ctx.enemies) {
      if (e.dead) continue;
      const d = Math.hypot(e.x - m.x, e.y - m.y);
      if (d < bestDist) {
        bestDist = d;
        target = e;
      }
    }

    if (target) {
      const dx = target.x - m.x;
      const dy = target.y - m.y;
      const dist = Math.hypot(dx, dy) || 1;
      m.facingAngle = Math.atan2(dy, dx);

      if (dist > target.radius + m.radius + 8) {
        const spd = isSkelWarrior ? 215 : 195;
        m.vx = (dx / dist) * spd;
        m.vy = (dy / dist) * spd;
        m.x += m.vx * dt;
        m.y += m.vy * dt;
        m.walkCycle += dt * 14;
        resolveCircleObstacles(m, room);
      } else if (m.attackCooldown <= 0) {
        m.attackCooldown = isSkelWarrior ? 0.52 : 0.58;
        m.attackFlash = 0.22;
        if (isSkelWarrior) {
          spawnSkeletonWarriorSlashVfx(ctx.vfx, m.x, m.y, m.facingAngle);
          damageEnemy(player, target, m.damage, m.facingAngle, 110, ctx, {
            canCrit: true,
            colorOverride: '#BAE6FD',
            impactStyle: 'IMPACT_BURST_BONE',
          });
        } else {
          spawnZombieClawVfx(ctx.vfx, m.x, m.y, m.facingAngle, 46, i % 2 === 1, false);
          damageEnemy(player, target, m.damage, m.facingAngle, 95, ctx, {
            canCrit: true,
            triggersPlagueCarrier: true,
            colorOverride: '#FCD34D',
            impactStyle: 'IMPACT_BURST_CLAW',
          });
        }
      }
    } else {
      // Orbit cheerfully around player when room is clear
      const idxAngle = player.idleTime * 1.8 + (i * Math.PI * 2) / Math.max(1, ctx.minions.length);
      const goalX = player.x + Math.cos(idxAngle) * 54;
      const goalY = player.y + Math.sin(idxAngle) * 54;
      const dx = goalX - m.x;
      const dy = goalY - m.y;
      const dist = Math.hypot(dx, dy);
      if (dist > 6) {
        m.x += (dx / dist) * Math.min(dist, 175 * dt);
        m.y += (dy / dist) * Math.min(dist, 175 * dt);
        m.walkCycle += dt * 11;
        m.facingAngle = Math.atan2(dy, dx);
      }
    }
  }

  // Update Hazard Zones (Poison Puddles, Tombstones, Boss Vine Telegraphs, Healing Springs)
  for (let i = ctx.hazards.length - 1; i >= 0; i--) {
    const h = ctx.hazards[i];
    if (h.spawnDelay && h.spawnDelay > 0) {
      h.spawnDelay = Math.max(0, h.spawnDelay - dt);
      h.life -= dt;
      continue;
    }
    h.life -= dt;
    h.tickTimer -= dt;

    if (h.kind === 'POISON_PUDDLE') {
      if (h.tickTimer <= 0) {
        h.tickTimer = 0.45;
        for (const e of ctx.enemies) {
          if (e.dead) continue;
          if (Math.hypot(e.x - h.x, e.y - h.y) <= h.radius + e.radius * 0.7) {
            damageEnemy(player, e, h.damage, 0, 0, ctx, {
              canCrit: false,
              colorOverride: '#2DD4BF',
              isPoisonAbility: true,
              silent: true,
            });
            applyPoisonToEnemy(e, h.damage * 1.2, 2.5);
          }
        }
      }
    } else if (h.kind === 'TOMBSTONE') {
      if (h.life <= 0) {
        spawnDissipationBurst(ctx.vfx, h.x, h.y, '#C084FC', 'MINION_POOF');
      } else if (h.tickTimer <= 0) {
        h.tickTimer = 0.85;
        // Lash nearby enemies with articulated skeletal bone hands!
        let lashedAny = false;
        for (const e of ctx.enemies) {
          if (e.dead) continue;
          const dist = Math.hypot(e.x - h.x, e.y - h.y);
          if (dist <= h.radius + e.radius) {
            lashedAny = true;
            const a = Math.atan2(e.y - h.y, e.x - h.x);
            spawnGraveyardBoneClawSwipe(
              ctx.vfx,
              h.x + Math.cos(a) * 16,
              h.y + Math.sin(a) * 16,
              a,
              Math.random() < 0.5
            );
            damageEnemy(player, e, h.damage, a, 110, ctx, {
              colorOverride: '#D8B4FE',
              impactStyle: 'IMPACT_BURST_SOUL',
            });
          }
        }
        if (!lashedAny) {
          spawnParticles(ctx.particles, h.x, h.y, '#C084FC', 3, 18, 50, 2, 4, 0.35, true);
        }
      }
    } else if (h.kind === 'BOSS_VINE_TELEGRAPH') {
      // Explodes when timer hits 0! (Magical ground eruption)
      if (h.life <= 0) {
        spawnParticles(ctx.particles, h.x, h.y, '#84CC16', 18, 50, 190, 4, 7, 0.45, true);
        const dist = Math.hypot(player.x - h.x, player.y - h.y);
        if (dist <= h.radius + player.radius * 0.75) {
          const pushA = Math.atan2(player.y - h.y, player.x - h.x);
          hurtPlayer(player, h.damage, pushA, ctx, 'MAGIC');
        }
        ctx.hazards.splice(i, 1);
        continue;
      }
    } else if (h.kind === 'HEALING_SPRING') {
      h.life = 999; // Persistent room spring
      if (Math.random() < dt * 8) {
        ctx.particles.push({
          x: h.x + (Math.random() - 0.5) * h.radius * 1.4,
          y: h.y + (Math.random() - 0.5) * h.radius * 1.4,
          vx: 0,
          vy: -26,
          size: 3.5,
          color: '#4ADE80',
          alpha: 0.9,
          life: 0.65,
          maxLife: 0.65,
          glow: true,
        });
      }
      if (h.tickTimer <= 0) {
        h.tickTimer = 0.65;
        if (Math.hypot(player.x - h.x, player.y - h.y) <= h.radius + player.radius) {
          healPlayer(player, 14, ctx);
          player.ultEnergy = Math.min(100, player.ultEnergy + 8);
        }
      }
    } else if (h.kind === 'GOBLIN_TRAP') {
      if (h.armedTimer && h.armedTimer > 0) {
        h.armedTimer = Math.max(0, h.armedTimer - dt);
      } else if ((h.triggeredTimer || 0) > 0) {
        h.triggeredTimer = (h.triggeredTimer || 0) - dt;
        if (h.triggeredTimer <= 0) {
          audio.playTrapDetonate();
          ctx.addScreenShake(8.5);
          spawnExplosiveTrapDetonateVfx(ctx.vfx, h.x, h.y, h.radius);

          for (const e of ctx.enemies) {
            if (e.dead) continue;
            const dist = Math.hypot(e.x - h.x, e.y - h.y);
            if (dist <= h.radius + e.radius) {
              const pushA = Math.atan2(e.y - h.y, e.x - h.x);
              damageEnemy(player, e, h.damage, pushA, 285, ctx, {
                energyGain: 9,
                critBonusChance: 0.14,
                colorOverride: '#FB923C',
                impactStyle: 'IMPACT_BURST_DAGGER',
              });
            }
          }
          ctx.hazards.splice(i, 1);
          continue;
        }
      } else {
        // Concealed & armed: check enemy proximity sensor
        for (const e of ctx.enemies) {
          if (e.dead) continue;
          if (Math.hypot(e.x - h.x, e.y - h.y) <= 44 + e.radius) {
            h.triggeredTimer = 0.18;
            break;
          }
        }
        if (h.life <= 0) {
          spawnDissipationBurst(ctx.vfx, h.x, h.y, '#94A3B8', 'MINION_POOF');
        }
      }
    }

    if (h.life <= 0) {
      ctx.hazards.splice(i, 1);
    }
  }
}
