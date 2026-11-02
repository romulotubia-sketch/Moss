import { audio } from '../audio/AudioManager';
import { getAbilityById } from '../data/abilities';
import { getHeroById } from '../data/heroes';
import { DUNGEON_EVENTS, rollUpgradeChoices } from '../data/upgrades';
import {
  isBasicAttackAbility,
  startAbilityAnimation,
  updateAbilityAnimation,
} from '../systems/AnimationController';
import {
  addFloatingText,
  damageEnemy,
  executeAbilityPhase,
  healPlayer,
  hurtPlayer,
  resolveCircleObstacles,
  spawnParticles,
  updateMinionsAndHazards,
  WorldEffectsContext,
} from '../systems/CombatSystem';
import {
  createHubRoom,
  generateDungeonSequence,
  nextEntityId,
  spawnEnemiesForRoom,
  spawnRoomPropsPickups,
} from '../systems/DungeonGenerator';
import { updateEnemiesAI } from '../systems/EnemyAI';
import { renderGameWorld } from '../systems/Renderer';
import {
  spawnFallingDaggerImpactVfx,
  spawnWindrunnerEndVfx,
} from '../systems/GoblinVFX';
import {
  spawnBoneColossusEndVfx,
  spawnBoneSpearPierceVfx,
  spawnBoneSpearShatterVfx,
  spawnBoneStormEndVfx,
  spawnRibcageShieldBlockVfx,
  spawnRibcageShieldEndVfx,
  spawnUndeadResiliencePulseVfx,
} from '../systems/SkeletonVFX';
import {
  createVFXState,
  emitAnticipationVfx,
  pushNode,
  pushRichParticle,
  spawnDissipationBurst,
  spawnUndeadRegenTickVfx,
  updateVFXSystem,
  VFXState,
} from '../systems/VFXSystem';
import {
  AnimPhase,
  DungeonEventDef,
  EnemyState,
  EquippedLoadout,
  FloatingText,
  HazardZone,
  HUDTeachingSnapshot,
  HubStation,
  MinionState,
  Particle,
  PickupItem,
  PlayerState,
  Projectile,
  RoomData,
  RoomType,
  RunSummary,
  SkillAimPreview,
  SlashEffect,
  UpgradeOption,
} from '../types';

export interface GameEngineCallbacks {
  onHudUpdate: (snapshot: HUDTeachingSnapshot) => void;
  onRequestUpgrade: (choices: UpgradeOption[]) => void;
  onRequestEvent: (eventDef: DungeonEventDef) => void;
  onHubStationInteract: (stationId: HubStation['id']) => void;
  onPauseToggle: () => void;
  onRunFinished: (summary: RunSummary) => void;
}

export class GameEngine {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private callbacks: GameEngineCallbacks;

  private mode: 'HUB' | 'DUNGEON' = 'HUB';
  private loadout: EquippedLoadout;
  private rooms: RoomData[] = [];
  private currentRoomIdx = 0;

  private player!: PlayerState;
  private enemies: EnemyState[] = [];
  private minions: MinionState[] = [];
  private hazards: HazardZone[] = [];
  private projectiles: Projectile[];
  private slashes: SlashEffect[] = [];
  private particles: Particle[] = [];
  private floatingTexts: FloatingText[] = [];
  private pickups: PickupItem[] = [];
  private vfx: VFXState = createVFXState();

  private cameraX = 520;
  private cameraY = 380;
  private screenShake = 0;
  private elapsedRunTime = 0;
  private renderTime = 0;

  // Run telemetry for Victory/Defeat summary
  private enemiesDefeated = 0;
  private damageDealt = 0;
  private roomsClearedCount = 0;
  private upgradesPicked: string[] = [];
  private finishTimer = -1;
  private runEnded = false;

  // Mobile MOBA dual-thumb input state
  private touchAttackHeld = false;
  private joyX = 0;
  private joyY = 0;

  // MOBA Hold-to-Aim & Release-to-Cast Ground Indicator state
  private skillAimPreview: SkillAimPreview | null = null;
  private skillAimTimer = 0;
  private heldSkillAimId: string | null = null;
  private skillAimManual = false;
  private castAutoTargetActive = false;

  private manualPaused = false;
  private orientationPaused = false;
  private rafId: number | null = null;
  private lastTimestamp = 0;
  private hudThrottle = 0;

  private persistentGold = 0;
  private portalTriggerCooldown = 0;

  constructor(
    canvas: HTMLCanvasElement,
    mode: 'HUB' | 'DUNGEON',
    loadout: EquippedLoadout,
    callbacks: GameEngineCallbacks,
    persistentGold = 0
  ) {
    this.canvas = canvas;
    const context = canvas.getContext('2d');
    if (!context) throw new Error('2D Canvas context unavailable');
    this.ctx = context;
    this.mode = mode;
    this.persistentGold = persistentGold;
    this.projectiles = [];
    this.loadout = {
      heroId: loadout.heroId,
      normalSkills: [loadout.normalSkills[0], loadout.normalSkills[1]],
      ultimate: loadout.ultimate,
    };
    this.callbacks = callbacks;

    this.initSession();
    this.bindEvents();
  }

  private get isSimulationPaused(): boolean {
    return this.manualPaused || this.orientationPaused;
  }

  private applyInnateHeroPassivesToStats(heroId: string, base: PlayerState['stats']): PlayerState['stats'] {
    const cloned = { ...base };
    if (heroId === 'zombie') {
      // Zombie Passive 1 (Undead Resilience): +20 Bonus Max HP
      cloned.maxHp += 20;
    } else if (heroId === 'skeleton') {
      // Skeleton Passive 2 (Bone Mastery): +10% Innate Critical Strike Chance
      cloned.critChance = Math.min(0.85, cloned.critChance + 0.1);
    }
    return cloned;
  }

  private initSession(): void {
    const hero = getHeroById(this.loadout.heroId);
    const clonedStats = this.applyInnateHeroPassivesToStats(hero.id, hero.baseStats);

    if (this.mode === 'HUB') {
      this.rooms = [createHubRoom()];
      this.currentRoomIdx = 0;
    } else {
      this.rooms = generateDungeonSequence();
      this.currentRoomIdx = 0;
    }

    const startRoom = this.rooms[0];

    this.player = {
      heroId: hero.id,
      x: startRoom.width / 2,
      y: startRoom.height - 140,
      vx: 0,
      vy: 0,
      radius: 18,
      facingAngle: -Math.PI / 2,
      hp: clonedStats.maxHp,
      maxHp: clonedStats.maxHp,
      shield: 0,
      ultEnergy: this.mode === 'HUB' ? 100 : 25,
      level: 1,
      xp: 0,
      xpToNext: 50,
      gold: this.mode === 'HUB' ? this.persistentGold : 0,
      stats: clonedStats,
      regenTimer: 0,
      regenTickTimer: 0,
      regenPerSecond: 0,
      lordOfDecayTimer: 0,
      lordOfDecayMax: 10,
      passiveRegenTimer: 1.0,
      passiveRegenSurgeTimer: 0,
      passiveAmbientTimer: 0.45,
      ribcageShieldTimer: 0,
      ribcageShieldHp: 0,
      ribcageShieldMaxHp: 0,
      boneStormTimer: 0,
      boneStormMaxTimer: 5,
      boneStormHitTimers: {},
      boneColossusTimer: 0,
      boneColossusMax: 10,
      windrunnerTimer: 0,
      windrunnerMaxTimer: 5.5,
      windrunnerEvadeCooldown: 0,
      poisonedBladesTimer: 0,
      poisonedBladesMaxTimer: 6.5,
      nimbleReflexesCooldown: 0,
      nimbleEvadeTimer: 0,
      kingOfThievesBuffTimer: 0,
      kingOfThievesStacks: 0,
      goblinVanishTimer: 0,
      daggerFlurryState: null,
      phantomFrenzyState: null,
      kingOfThievesState: null,
      dodgeTimer: 0,
      dodgeCooldown: 0,
      dodgeDirX: 0,
      dodgeDirY: -1,
      invulnTimer: 0,
      hurtFlash: 0,
      isDead: false,
      deathTimer: 0,
      walkCycle: 0,
      idleTime: 0,
      comboStep: 0,
      activeAnim: null,
      cooldowns: {},
    };

    this.setupRoomEntities(startRoom);
  }

  public updateLoadoutInHub(newLoadout: EquippedLoadout): void {
    const heroChanged = this.loadout.heroId !== newLoadout.heroId;
    this.loadout = {
      heroId: newLoadout.heroId,
      normalSkills: [newLoadout.normalSkills[0], newLoadout.normalSkills[1]],
      ultimate: newLoadout.ultimate,
    };

    if (heroChanged) {
      const hero = getHeroById(newLoadout.heroId);
      const nextStats = this.applyInnateHeroPassivesToStats(hero.id, hero.baseStats);
      this.player.heroId = hero.id;
      this.player.stats = nextStats;
      this.player.maxHp = nextStats.maxHp;
      this.player.hp = nextStats.maxHp;
      this.player.activeAnim = null;
      this.player.lordOfDecayTimer = 0;
      this.player.regenTimer = 0;
      this.player.ribcageShieldTimer = 0;
      this.player.ribcageShieldHp = 0;
      this.player.boneStormTimer = 0;
      this.player.boneColossusTimer = 0;
      this.player.windrunnerTimer = 0;
      this.player.windrunnerEvadeCooldown = 0;
      this.player.poisonedBladesTimer = 0;
      this.player.nimbleReflexesCooldown = 0;
      this.player.nimbleEvadeTimer = 0;
      this.player.kingOfThievesBuffTimer = 0;
      this.player.kingOfThievesStacks = 0;
      this.player.goblinVanishTimer = 0;
      this.player.daggerFlurryState = null;
      this.player.phantomFrenzyState = null;
      this.player.kingOfThievesState = null;
      this.minions = [];
      this.hazards = this.hazards.filter((h) => h.kind !== 'GOBLIN_TRAP');
      this.vfx.nodes = [];
      addFloatingText(
        this.floatingTexts,
        this.player.x,
        this.player.y - 26,
        `${hero.name} Ready!`,
        hero.accentColor,
        15,
        true
      );
    } else {
      addFloatingText(
        this.floatingTexts,
        this.player.x,
        this.player.y - 24,
        'Loadout Updated!',
        '#38BDF8',
        14,
        true
      );
    }

    this.player.cooldowns = {};
    this.player.ultEnergy = 100;
    spawnParticles(this.particles, this.player.x, this.player.y, '#34D399', 16, 35, 130, 3, 6, 0.45, true);
    this.emitHudSnapshot();
  }

  private setupRoomEntities(room: RoomData): void {
    this.enemies = spawnEnemiesForRoom(room, 0);
    this.projectiles = [];
    this.slashes = [];
    this.hazards = [];
    this.pickups = spawnRoomPropsPickups(room);
    this.player.daggerFlurryState = null;
    this.player.phantomFrenzyState = null;
    this.player.kingOfThievesState = null;
    this.player.goblinVanishTimer = 0;
    // Preserve player-following regeneration aura across room doors while clearing floor room VFX
    this.vfx.nodes = this.vfx.nodes.filter((n) => n.followPlayer);
    this.vfx.particles = [];

    this.player.x = room.width / 2;
    this.player.y = room.type === RoomType.HUB ? room.height - 195 : room.height - 130;
    this.player.facingAngle = -Math.PI / 2;
    for (let i = 0; i < this.minions.length; i++) {
      this.minions[i].x = this.player.x + (i - 1) * 36;
      this.minions[i].y = this.player.y + 24;
    }

    if (room.type === RoomType.HEALING) {
      this.hazards.push({
        id: nextEntityId('spring'),
        kind: 'HEALING_SPRING',
        x: room.width / 2,
        y: room.height / 2 - 10,
        radius: 82,
        life: 999,
        maxLife: 999,
        tickTimer: 0.2,
        damage: 0,
        friendly: true,
      });
    }

    this.cameraX = this.player.x;
    this.cameraY = this.player.y;
    this.emitHudSnapshot();
  }

  public start(): void {
    this.resizeCanvas();
    this.lastTimestamp = performance.now();
    const loop = (now: number) => {
      const rawDt = (now - this.lastTimestamp) / 1000;
      this.lastTimestamp = now;
      const dt = Math.min(0.05, Math.max(0.001, rawDt));

      if (!this.isSimulationPaused) {
        this.update(dt);
      }
      this.render();
      this.rafId = requestAnimationFrame(loop);
    };
    this.rafId = requestAnimationFrame(loop);
  }

  public destroy(): void {
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
    this.unbindEvents();
  }

  public setPaused(paused: boolean): void {
    this.manualPaused = paused;
    if (paused) {
      this.touchAttackHeld = false;
      this.joyX = 0;
      this.joyY = 0;
      this.heldSkillAimId = null;
      this.skillAimManual = false;
      this.castAutoTargetActive = false;
      this.skillAimPreview = null;
    } else {
      this.lastTimestamp = performance.now();
    }
  }

  public setOrientationPaused(paused: boolean): void {
    this.orientationPaused = paused;
    if (paused) {
      this.touchAttackHeld = false;
      this.joyX = 0;
      this.joyY = 0;
      this.heldSkillAimId = null;
      this.skillAimManual = false;
      this.castAutoTargetActive = false;
      this.skillAimPreview = null;
    } else {
      this.lastTimestamp = performance.now();
      this.resizeCanvas();
    }
  }

  public setJoystickVector(dx: number, dy: number): void {
    this.joyX = dx;
    this.joyY = dy;
  }

  public setTouchAttackHeld(held: boolean): void {
    this.touchAttackHeld = held;
    if (held) {
      this.triggerBasicAttack();
    }
  }

  /**
   * Begins Hold-to-Aim preview when pressing & holding a skill button (cast happens ONLY on release).
   */
  public beginSkillAimHold(abilityId: string): void {
    if (this.isSimulationPaused || this.player.isDead) return;
    const def = getAbilityById(abilityId);
    const rangeMul =
      this.player.lordOfDecayTimer > 0
        ? 1.24
        : this.player.boneColossusTimer > 0 && abilityId === 'skeleton_bone_slash'
        ? 1.18
        : 1.0;
    const initialAngle = this.getTapSkillAimAngle(abilityId);

    this.heldSkillAimId = abilityId;
    this.skillAimManual = false;
    if (!this.player.activeAnim) {
      this.player.facingAngle = initialAngle;
    }
    this.skillAimPreview = {
      abilityId,
      angle: initialAngle,
      range: def.range * rangeMul,
      style: def.aimStyle,
    };
    this.skillAimTimer = 0;
  }

  /**
   * Cancels Hold-to-Aim without casting if pointer is cancelled or dragged onto Cancel zone.
   */
  public cancelSkillAimHold(): void {
    this.heldSkillAimId = null;
    this.skillAimManual = false;
    this.skillAimPreview = null;
    this.skillAimTimer = 0;
  }

  /**
   * Live directional aiming steering when thumb drags while holding a MOBA skill button.
   */
  public steerSkillAim(abilityId: string, angle: number | null): void {
    if (angle === null) {
      if (this.heldSkillAimId === abilityId) {
        this.heldSkillAimId = null;
        this.skillAimManual = false;
      }
      return;
    }
    this.skillAimManual = true;
    this.castAutoTargetActive = false;
    const def = getAbilityById(abilityId);
    const rangeMul =
      this.player.lordOfDecayTimer > 0
        ? 1.24
        : this.player.boneColossusTimer > 0 && abilityId === 'skeleton_bone_slash'
        ? 1.18
        : 1.0;
    this.player.facingAngle = angle;

    // Steer active wind-up cast if already in anticipation
    if (
      this.player.activeAnim &&
      this.player.activeAnim.abilityId === abilityId &&
      this.player.activeAnim.phase === AnimPhase.ANTICIPATION
    ) {
      this.player.activeAnim.aimAngle = angle;
    }

    this.skillAimPreview = {
      abilityId,
      angle,
      range: def.range * rangeMul,
      style: def.aimStyle,
    };
    if (this.heldSkillAimId !== abilityId) {
      this.skillAimTimer = 0.22;
    }
  }

  public applyUpgrade(opt: UpgradeOption): void {
    opt.apply(this.player.stats, this.player);
    this.upgradesPicked.push(opt.name);
    audio.playLevelUp();
    spawnParticles(this.particles, this.player.x, this.player.y, opt.accentColor, 22, 45, 165, 3, 6, 0.55, true);
    addFloatingText(this.floatingTexts, this.player.x, this.player.y - 24, opt.name, opt.accentColor, 15, true);
    this.emitHudSnapshot();
  }

  public completeEventChoice(resultMessage: string): void {
    const room = this.rooms[this.currentRoomIdx];
    room.eventResolved = true;
    room.cleared = true;
    room.portalOpen = true;
    this.roomsClearedCount += 1;
    audio.playRoomClear();
    addFloatingText(this.floatingTexts, this.player.x, this.player.y - 26, 'Blessing Received!', '#FBBF24', 15, true);
    spawnParticles(this.particles, this.player.x, this.player.y, '#FBBF24', 20, 45, 160, 3, 6, 0.55, true);
    void resultMessage;
    this.emitHudSnapshot();
  }

  public getPlayerState(): PlayerState {
    return this.player;
  }

  private getNearestEnemyAimAngle(maxDistance = Infinity): number | null {
    let bestEnemy: EnemyState | null = null;
    let bestDist = maxDistance;

    // Prefer hostile dungeon enemies first if present; otherwise include any living target (e.g. Training Dummy)
    const hasHostile = this.enemies.some(
      (e) => !e.dead && e.hp > 0 && e.kind !== 'TRAINING_DUMMY'
    );

    for (const e of this.enemies) {
      if (e.dead || e.hp <= 0) continue;
      if (hasHostile && e.kind === 'TRAINING_DUMMY') continue;
      const d = Math.hypot(e.x - this.player.x, e.y - this.player.y);
      if (d < bestDist) {
        bestDist = d;
        bestEnemy = e;
      }
    }

    if (bestEnemy) {
      return Math.atan2(bestEnemy.y - this.player.y, bestEnemy.x - this.player.x);
    }
    return null;
  }

  private getSkillNearEnemyRange(abilityId?: string): number {
    if (!abilityId) return 320;
    const def = getAbilityById(abilityId);
    return Math.max(290, Math.min(390, def.range * 1.45));
  }

  /**
   * Tap-Cast Auto-Targeting:
   * 1) If an enemy is NEAR (within proximity range), automatically target the nearest enemy.
   * 2) If NO enemy is near during skill tapping, automatically cast in the direction of the joystick
   *    (falling back to the hero's current facing angle only if the joystick is neutral).
   */
  private getTapSkillAimAngle(abilityId?: string): number {
    const nearRange = this.getSkillNearEnemyRange(abilityId);
    const nearestEnemyAngle = this.getNearestEnemyAimAngle(nearRange);
    if (nearestEnemyAngle !== null) {
      return nearestEnemyAngle;
    }

    const moveVec = this.computeMoveInputVector();
    if (Math.hypot(moveVec.x, moveVec.y) > 0.08) {
      return Math.atan2(moveVec.y, moveVec.x);
    }

    return this.player.facingAngle;
  }

  private getSmartAimAngle(_abilityId?: string): number {
    // MOBA Smart Target-Lock for basic attacks: aim toward closest living enemy within 360px
    const nearestEnemyAngle = this.getNearestEnemyAimAngle(360);
    if (nearestEnemyAngle !== null) {
      return nearestEnemyAngle;
    }

    const moveVec = this.computeMoveInputVector();
    if (Math.hypot(moveVec.x, moveVec.y) > 0.08) {
      return Math.atan2(moveVec.y, moveVec.x);
    }

    return this.player.facingAngle;
  }

  public triggerBasicAttack(): void {
    if (this.isSimulationPaused || this.player.isDead) return;
    // Allow seamless attack chaining if activeAnim is null OR nearly done recovering from a previous basic swing
    if (
      this.player.activeAnim &&
      !(
        isBasicAttackAbility(this.player.activeAnim.abilityId) &&
        this.player.activeAnim.phase === AnimPhase.RECOVERY &&
        this.player.activeAnim.phaseTimer >= this.player.activeAnim.phaseDuration * 0.75
      )
    ) {
      return;
    }

    const hero = getHeroById(this.loadout.heroId);
    const basicId = hero.basicAttackId;
    if ((this.player.cooldowns[basicId] || 0) > 0) return;

    const def = getAbilityById(basicId);
    const transformSpeedMul =
      this.player.lordOfDecayTimer > 0
        ? 1.45
        : this.player.boneColossusTimer > 0
        ? 1.15
        : this.player.windrunnerTimer > 0
        ? 1.18
        : 1.0;
    const speedMul = this.player.stats.attackSpeed * transformSpeedMul;
    this.player.cooldowns[basicId] = def.cooldown / speedMul;

    this.castAutoTargetActive = false;
    startAbilityAnimation(this.player, basicId, this.getSmartAimAngle(basicId));
  }

  /**
   * STRICT EQUIPMENT ENFORCEMENT + RELEASE-TO-CAST ACTIVATION:
   * Invoked when releasing the Normal Skill button. If tapped (overrideAngle === undefined),
   * automatically targets the nearest nearby enemy, or casts in the joystick direction if none is near!
   */
  public triggerNormalSkill(slotIndex: 0 | 1, overrideAngle?: number): void {
    this.heldSkillAimId = null;
    this.skillAimManual = false;
    if (this.isSimulationPaused || this.player.isDead) {
      this.skillAimPreview = null;
      return;
    }
    if (this.player.activeAnim && !isBasicAttackAbility(this.player.activeAnim.abilityId)) {
      this.skillAimPreview = null;
      return;
    }

    const hero = getHeroById(this.loadout.heroId);
    const abilityId = this.loadout.normalSkills[slotIndex];
    if (!abilityId || !hero.normalSkillIds.includes(abilityId)) return;
    if ((this.player.cooldowns[abilityId] || 0) > 0) {
      this.skillAimPreview = null;
      return;
    }

    const def = getAbilityById(abilityId);
    const isTapAutoAim = overrideAngle === undefined;
    const aimAngle = overrideAngle ?? this.getTapSkillAimAngle(abilityId);
    this.castAutoTargetActive = isTapAutoAim;
    this.player.cooldowns[abilityId] = def.cooldown;
    startAbilityAnimation(this.player, abilityId, aimAngle);

    if (def.aimStyle !== 'SELF') {
      const rangeMul =
        this.player.lordOfDecayTimer > 0
          ? 1.24
          : this.player.boneColossusTimer > 0 && abilityId === 'skeleton_bone_slash'
          ? 1.18
          : 1.0;
      this.skillAimPreview = {
        abilityId,
        angle: aimAngle,
        range: def.range * rangeMul,
        style: def.aimStyle,
      };
      this.skillAimTimer = Math.max(0.18, def.anticipationTime + 0.06);
    } else {
      this.skillAimPreview = null;
    }

    this.emitHudSnapshot();
  }

  /**
   * STRICT EQUIPMENT ENFORCEMENT + RELEASE-TO-CAST ULTIMATE ACTIVATION:
   * Invoked when releasing the Ultimate Skill button. If tapped (overrideAngle === undefined),
   * automatically targets the nearest nearby enemy, or casts in the joystick direction if none is near!
   */
  public triggerUltimate(overrideAngle?: number): void {
    this.heldSkillAimId = null;
    this.skillAimManual = false;
    if (this.isSimulationPaused || this.player.isDead) {
      this.skillAimPreview = null;
      return;
    }
    if (this.player.activeAnim && !isBasicAttackAbility(this.player.activeAnim.abilityId)) {
      this.skillAimPreview = null;
      return;
    }

    const hero = getHeroById(this.loadout.heroId);
    const ultId = this.loadout.ultimate;
    if (!ultId || !hero.ultimateIds.includes(ultId)) return;
    if (this.player.ultEnergy < 100 || (this.player.cooldowns[ultId] || 0) > 0) {
      this.skillAimPreview = null;
      return;
    }

    const def = getAbilityById(ultId);
    const isTapAutoAim = overrideAngle === undefined;
    const aimAngle = overrideAngle ?? this.getTapSkillAimAngle(ultId);
    this.castAutoTargetActive = isTapAutoAim;
    this.player.ultEnergy = 0;
    this.player.cooldowns[ultId] = def.cooldown;
    startAbilityAnimation(this.player, ultId, aimAngle);

    if (def.aimStyle !== 'SELF') {
      this.skillAimPreview = {
        abilityId: ultId,
        angle: aimAngle,
        range: def.range,
        style: def.aimStyle,
      };
      this.skillAimTimer = Math.max(0.2, def.anticipationTime + 0.06);
    } else {
      this.skillAimPreview = null;
    }

    this.emitHudSnapshot();
  }

  public triggerDodge(): void {
    if (
      this.isSimulationPaused ||
      this.player.isDead ||
      this.player.dodgeCooldown > 0 ||
      this.player.dodgeTimer > 0
    ) {
      return;
    }
    audio.playDodge();

    let dx = 0;
    let dy = 0;
    const moveVec = this.computeMoveInputVector();
    if (Math.hypot(moveVec.x, moveVec.y) > 0.1) {
      dx = moveVec.x;
      dy = moveVec.y;
    } else {
      const a = this.player.facingAngle;
      dx = Math.cos(a);
      dy = Math.sin(a);
    }

    this.player.dodgeDirX = dx;
    this.player.dodgeDirY = dy;
    this.player.dodgeTimer = 0.22;
    this.player.dodgeCooldown = Math.max(0.85, 1.35 / (this.player.stats.moveSpeed / 215));
    this.player.invulnTimer = Math.max(this.player.invulnTimer, 0.26);

    spawnParticles(this.particles, this.player.x, this.player.y + 10, '#E2E8F0', 8, 30, 95, 3, 5, 0.3);
  }

  public triggerInteract(): void {
    if (this.isSimulationPaused || this.player.isDead) return;
    const room = this.rooms[this.currentRoomIdx];

    if (room.hubStations) {
      for (const st of room.hubStations) {
        if (Math.hypot(this.player.x - st.x, this.player.y - st.y) <= st.radius + 46) {
          audio.playUiClick();
          if (st.id === 'CAMPFIRE_HEAL') {
            this.player.hp = this.player.maxHp;
            this.player.ultEnergy = 100;
            addFloatingText(this.floatingTexts, this.player.x, this.player.y - 20, 'Restored & Charged!', '#FBBF24', 15, true);
            spawnParticles(this.particles, st.x, st.y, '#FB923C', 18, 40, 140, 3, 6, 0.5, true);
            this.emitHudSnapshot();
          } else {
            this.callbacks.onHubStationInteract(st.id);
          }
          return;
        }
      }
    }

    for (const p of this.pickups) {
      if (p.kind === 'TREASURE_CHEST' && !p.opened) {
        if (Math.hypot(this.player.x - p.x, this.player.y - p.y) <= 78) {
          this.openTreasureChest(p, room);
          return;
        }
      }
    }

    if (room.type === RoomType.EVENT && !room.eventResolved) {
      const cx = room.width / 2;
      const cy = room.height / 2 - 20;
      if (Math.hypot(this.player.x - cx, this.player.y - cy) <= 92) {
        const ev = DUNGEON_EVENTS[Math.floor(Math.random() * DUNGEON_EVENTS.length)];
        this.setPaused(true);
        this.callbacks.onRequestEvent(ev);
        return;
      }
    }
  }

  private openTreasureChest(chest: PickupItem, room: RoomData): void {
    chest.opened = true;
    room.cleared = true;
    room.portalOpen = true;
    this.roomsClearedCount += 1;
    audio.playRoomClear();

    for (let i = 0; i < 8; i++) {
      const a = (Math.PI * 2 * i) / 8;
      this.pickups.push({
        id: nextEntityId('chest_gold'),
        kind: 'GOLD',
        x: chest.x,
        y: chest.y,
        vx: Math.cos(a) * 120,
        vy: Math.sin(a) * 120,
        value: 6,
        bobOffset: i,
      });
    }
    spawnParticles(this.particles, chest.x, chest.y, '#FBBF24', 24, 50, 190, 4, 7, 0.55, true);

    if (!room.rewardClaimed) {
      room.rewardClaimed = true;
      setTimeout(() => {
        if (!this.runEnded) {
          this.setPaused(true);
          this.callbacks.onRequestUpgrade(rollUpgradeChoices(this.loadout, 3));
        }
      }, 420);
    }
  }

  private computeMoveInputVector(): { x: number; y: number } {
    let mx = 0;
    let my = 0;

    // Smooth 360-degree floating virtual joystick vector
    if (Math.hypot(this.joyX, this.joyY) > 0.08) {
      mx = this.joyX;
      my = this.joyY;
    }

    const len = Math.hypot(mx, my);
    if (len > 1) {
      mx /= len;
      my /= len;
    }
    return { x: mx, y: my };
  }

  private update(dt: number): void {
    this.renderTime += dt;
    if (this.mode === 'DUNGEON' && !this.runEnded) {
      this.elapsedRunTime += dt;
    }

    if (this.heldSkillAimId && !this.skillAimManual && this.skillAimPreview) {
      const liveAutoAngle = this.getTapSkillAimAngle(this.heldSkillAimId);
      this.skillAimPreview.angle = liveAutoAngle;
      if (!this.player.activeAnim) {
        this.player.facingAngle = liveAutoAngle;
      }
    } else if (!this.heldSkillAimId && this.skillAimTimer > 0) {
      this.skillAimTimer -= dt;
      if (this.skillAimTimer <= 0) {
        this.skillAimPreview = null;
      }
    }

    const room = this.rooms[this.currentRoomIdx];
    const p = this.player;

    const worldCtx: WorldEffectsContext = {
      enemies: this.enemies,
      minions: this.minions,
      hazards: this.hazards,
      projectiles: this.projectiles,
      slashes: this.slashes,
      particles: this.particles,
      floatingTexts: this.floatingTexts,
      pickups: this.pickups,
      vfx: this.vfx,
      addScreenShake: (amt: number) => {
        this.screenShake = Math.min(18, Math.max(this.screenShake, amt));
      },
      recordDamageDealt: (amt: number) => {
        if (this.mode === 'DUNGEON') this.damageDealt += amt;
      },
      recordEnemyDefeated: () => {
        if (this.mode === 'DUNGEON') this.enemiesDefeated += 1;
      },
    };

    if (p.isDead) {
      p.deathTimer += dt;
      if (p.deathTimer >= 1.25 && !this.runEnded) {
        this.runEnded = true;
        this.callbacks.onRunFinished({
          victory: false,
          roomsCleared: this.roomsClearedCount,
          totalRooms: this.rooms.length,
          enemiesDefeated: this.enemiesDefeated,
          damageDealt: this.damageDealt,
          goldCollected: p.gold,
          levelReached: p.level,
          upgradesPicked: this.upgradesPicked,
          durationSec: Math.round(this.elapsedRunTime),
        });
      }
      updateVFXSystem(this.vfx, dt, p.x, p.y, false, p.facingAngle, false);
      this.updateVisualTimers(dt);
      return;
    }

    p.idleTime += dt;
    for (const key of Object.keys(p.cooldowns)) {
      if (p.cooldowns[key] > 0) {
        p.cooldowns[key] = Math.max(0, p.cooldowns[key] - dt);
      }
    }
    if (p.dodgeCooldown > 0) p.dodgeCooldown = Math.max(0, p.dodgeCooldown - dt);
    if (p.invulnTimer > 0) p.invulnTimer = Math.max(0, p.invulnTimer - dt);
    if (p.hurtFlash > 0) p.hurtFlash = Math.max(0, p.hurtFlash - dt);

    if (p.regenTimer > 0) {
      const prevRegen = p.regenTimer;
      p.regenTimer = Math.max(0, p.regenTimer - dt);
      p.regenTickTimer -= dt;
      if (p.regenTickTimer <= 0) {
        p.regenTickTimer = 0.5;
        healPlayer(p, p.regenPerSecond * 0.5, worldCtx);
        spawnUndeadRegenTickVfx(this.vfx, p.x, p.y, 4);
      }
      if (prevRegen > 0 && p.regenTimer === 0) {
        spawnDissipationBurst(this.vfx, p.x, p.y, '#4ADE80', 'MINION_POOF');
      }
    }

    if (p.lordOfDecayTimer > 0) {
      const prevLord = p.lordOfDecayTimer;
      p.lordOfDecayTimer = Math.max(0, p.lordOfDecayTimer - dt);
      if (prevLord > 0 && p.lordOfDecayTimer === 0) {
        spawnDissipationBurst(this.vfx, p.x, p.y, '#10B981', 'LORD_END');
      }
    }

    // Zombie Innate Passives (Undead Resilience & Plague Carrier): always active for Zombie!
    if (p.heroId === 'zombie') {
      if (p.passiveRegenSurgeTimer > 0) {
        p.passiveRegenSurgeTimer = Math.max(0, p.passiveRegenSurgeTimer - dt);
      }
      p.passiveRegenTimer -= dt;
      if (p.passiveRegenTimer <= 0) {
        p.passiveRegenTimer = 1.0;
        if (p.hp < p.maxHp) {
          const regenAmt = p.passiveRegenSurgeTimer > 0 ? 6 : 2;
          healPlayer(p, regenAmt, worldCtx);
          spawnUndeadResiliencePulseVfx(this.vfx, p.x, p.y, p.passiveRegenSurgeTimer > 0);
        }
      }

      // Subtle drifting Plague Carrier toxic spore motes around Zombie
      if (Math.random() < dt * 2.4) {
        const a = Math.random() * Math.PI * 2;
        pushRichParticle(this.vfx, {
          x: p.x + Math.cos(a) * 14,
          y: p.y + Math.sin(a) * 10,
          z: 6,
          vx: (Math.random() - 0.5) * 12,
          vy: -10,
          vz: 18,
          gravity: -6,
          drag: 1.5,
          size: 3.0,
          endSize: 0.8,
          rotation: 0,
          vRot: 0,
          life: 0.55,
          maxLife: 0.55,
          color: '#A3E635',
          secondaryColor: '#14532D',
          alpha: 0.72,
          shape: 'GLOW_SPORE',
          layer: 'OVER',
          bounceFactor: 0,
        });
      }
    }

    // Skeleton Skill & Ultimate Timers (Ribcage Shield, Bone Storm, Bone Colossus)
    if (p.ribcageShieldTimer > 0) {
      const prev = p.ribcageShieldTimer;
      p.ribcageShieldTimer = Math.max(0, p.ribcageShieldTimer - dt);
      if (prev > 0 && p.ribcageShieldTimer === 0) {
        p.ribcageShieldHp = 0;
        spawnRibcageShieldEndVfx(this.vfx, p.x, p.y, false);
      }
    }

    if (p.boneStormTimer > 0) {
      const prev = p.boneStormTimer;
      p.boneStormTimer = Math.max(0, p.boneStormTimer - dt);
      if (prev > 0 && p.boneStormTimer === 0) {
        spawnBoneStormEndVfx(this.vfx, p.x, p.y);
      }
    }

    if (p.boneColossusTimer > 0) {
      const prev = p.boneColossusTimer;
      p.boneColossusTimer = Math.max(0, p.boneColossusTimer - dt);
      if (prev > 0 && p.boneColossusTimer === 0) {
        spawnBoneColossusEndVfx(this.vfx, p.x, p.y);
      }
    }

    // Goblin Skill, Passive & Ultimate Timers (Windrunner, Poisoned Blades, Nimble Reflexes, King of Thieves)
    if (p.windrunnerEvadeCooldown > 0) {
      p.windrunnerEvadeCooldown = Math.max(0, p.windrunnerEvadeCooldown - dt);
    }
    if (p.nimbleReflexesCooldown > 0) {
      p.nimbleReflexesCooldown = Math.max(0, p.nimbleReflexesCooldown - dt);
    }
    if (p.nimbleEvadeTimer > 0) {
      p.nimbleEvadeTimer = Math.max(0, p.nimbleEvadeTimer - dt);
    }
    if (p.goblinVanishTimer > 0) {
      p.goblinVanishTimer = Math.max(0, p.goblinVanishTimer - dt);
    }
    if (p.kingOfThievesBuffTimer > 0) {
      const prevThief = p.kingOfThievesBuffTimer;
      p.kingOfThievesBuffTimer = Math.max(0, p.kingOfThievesBuffTimer - dt);
      if (prevThief > 0 && p.kingOfThievesBuffTimer === 0) {
        p.kingOfThievesStacks = 0;
        spawnDissipationBurst(this.vfx, p.x, p.y, '#C084FC', 'MINION_POOF');
      }
    }

    if (p.windrunnerTimer > 0) {
      const prevWind = p.windrunnerTimer;
      p.windrunnerTimer = Math.max(0, p.windrunnerTimer - dt);
      const curSpd = Math.hypot(p.vx, p.vy);
      if (curSpd > 38 && Math.random() < dt * 15) {
        const isLeaf = Math.random() < 0.35;
        pushRichParticle(this.vfx, {
          x: p.x + (Math.random() - 0.5) * 16,
          y: p.y + 8 + (Math.random() - 0.5) * 8,
          z: 5,
          vx: -p.vx * 0.28 + (Math.random() - 0.5) * 24,
          vy: -p.vy * 0.28 + (Math.random() - 0.5) * 24,
          vz: 24 + Math.random() * 20,
          gravity: isLeaf ? 45 : -8,
          drag: 2.0,
          size: isLeaf ? 4.2 : 4.6,
          endSize: 1.0,
          rotation: Math.atan2(p.vy, p.vx),
          vRot: 8,
          life: 0.32,
          maxLife: 0.32,
          color: isLeaf ? '#4ADE80' : '#5EEAD4',
          secondaryColor: '#0F766E',
          alpha: 0.85,
          shape: isLeaf ? 'FOREST_LEAF' : 'SPECTRAL_WISP',
          layer: 'UNDER',
          bounceFactor: 0,
        });
      }
      if (curSpd > 80 && Math.random() < dt * 7.5) {
        pushNode(this.vfx, {
          kind: 'GOB_SHADOW_AFTERIMAGE',
          layer: 'UNDER',
          x: p.x,
          y: p.y,
          angle: p.facingAngle,
          radius: 19,
          life: 0.18,
          maxLife: 0.18,
          seed: this.renderTime * 17,
          isLord: false,
        });
      }
      if (prevWind > 0 && p.windrunnerTimer === 0) {
        spawnWindrunnerEndVfx(this.vfx, p.x, p.y);
      }
    }

    if (p.poisonedBladesTimer > 0) {
      const prevPoison = p.poisonedBladesTimer;
      p.poisonedBladesTimer = Math.max(0, p.poisonedBladesTimer - dt);
      if (Math.random() < dt * 7) {
        const side = Math.random() < 0.5 ? -1 : 1;
        const ba = p.facingAngle + side * 0.65;
        pushRichParticle(this.vfx, {
          x: p.x + Math.cos(ba) * 16,
          y: p.y + Math.sin(ba) * 13,
          z: 8,
          vx: (Math.random() - 0.5) * 16,
          vy: (Math.random() - 0.5) * 14,
          vz: 18,
          gravity: 190,
          drag: 1.8,
          size: 3.1,
          endSize: 0.8,
          rotation: 0,
          vRot: 0,
          life: 0.3,
          maxLife: 0.3,
          color: '#A3E635',
          secondaryColor: '#14532D',
          alpha: 0.88,
          shape: 'TOXIC_DROPLET',
          layer: 'OVER',
          bounceFactor: 0.25,
        });
      }
      if (prevPoison > 0 && p.poisonedBladesTimer === 0) {
        spawnDissipationBurst(this.vfx, p.x, p.y, '#84CC16', 'MINION_POOF');
      }
    }

    if (room.type === RoomType.HUB && room.hubStations) {
      const fire = room.hubStations.find((s) => s.id === 'CAMPFIRE_HEAL');
      if (fire && Math.hypot(p.x - fire.x, p.y - fire.y) < fire.radius + 20) {
        p.ultEnergy = Math.min(100, p.ultEnergy + dt * 25);
        if (p.hp < p.maxHp) p.hp = Math.min(p.maxHp, p.hp + dt * 20);
      }
    }

    // Repeatable Basic Attack while holding Mobile Attack button AND moving simultaneously!
    if (this.touchAttackHeld) {
      this.triggerBasicAttack();
    }

    // Stage 1: Emit Anticipation VFX synchronized with character wind-up pose
    if (p.activeAnim && p.activeAnim.phase === AnimPhase.ANTICIPATION) {
      // Keep tap-cast skills locked onto a nearby enemy — or following joystick if no enemy is near!
      if (this.castAutoTargetActive && !isBasicAttackAbility(p.activeAnim.abilityId)) {
        const nearRange = this.getSkillNearEnemyRange(p.activeAnim.abilityId);
        const nearEnemyAngle = this.getNearestEnemyAimAngle(nearRange);
        let updatedAngle: number | null = nearEnemyAngle;

        if (updatedAngle === null) {
          const liveJoy = this.computeMoveInputVector();
          if (Math.hypot(liveJoy.x, liveJoy.y) > 0.08) {
            updatedAngle = Math.atan2(liveJoy.y, liveJoy.x);
          }
        }

        if (updatedAngle !== null) {
          p.activeAnim.aimAngle = updatedAngle;
          p.facingAngle = updatedAngle;
          if (this.skillAimPreview && this.skillAimPreview.abilityId === p.activeAnim.abilityId) {
            this.skillAimPreview.angle = updatedAngle;
          }
        }
      }
      if (
        p.activeAnim.abilityId === 'zombie_ult_graveyard' ||
        p.activeAnim.abilityId === 'skeleton_ult_bone_colossus'
      ) {
        this.screenShake = Math.max(this.screenShake, 3.6);
      }
      this.vfx.anticipationEmitTimer -= dt;
      if (this.vfx.anticipationEmitTimer <= 0) {
        this.vfx.anticipationEmitTimer = 0.055;
        emitAnticipationVfx(
          this.vfx,
          p.activeAnim.abilityId,
          p.x,
          p.y,
          p.activeAnim.aimAngle,
          p.heroId === 'goblin'
            ? p.poisonedBladesTimer > 0
            : p.lordOfDecayTimer > 0 || p.boneColossusTimer > 0
        );
      }
    } else {
      this.vfx.anticipationEmitTimer = 0;
      if (!p.activeAnim || p.activeAnim.phase !== AnimPhase.ANTICIPATION) {
        this.castAutoTargetActive = false;
      }
    }

    // Stage 2 & 3: Update 3-phase ability animation & trigger Execution + Impact VFX
    const execTrigger = updateAbilityAnimation(p, dt);
    if (execTrigger) {
      executeAbilityPhase(p, execTrigger, room, worldCtx);
    }

    // Simultaneous 360° Movement & Attacking / Skill Casting
    const moveVec = this.computeMoveInputVector();
    const goblinBuffSpeedMul =
      (p.windrunnerTimer > 0 ? 1.38 : 1.0) * (p.kingOfThievesBuffTimer > 0 ? 1.2 : 1.0);
    const transformSpeedMul =
      (p.lordOfDecayTimer > 0 ? 1.28 : p.boneColossusTimer > 0 ? 1.12 : 1.0) *
      goblinBuffSpeedMul;

    if (p.dodgeTimer > 0) {
      p.dodgeTimer = Math.max(0, p.dodgeTimer - dt);
      const dodgeSpd = p.stats.moveSpeed * 2.35;
      p.vx = p.dodgeDirX * dodgeSpd;
      p.vy = p.dodgeDirY * dodgeSpd;
    } else {
      let castMoveFactor = 1.0;
      if (p.activeAnim) {
        const activeDef = getAbilityById(p.activeAnim.abilityId);
        castMoveFactor = activeDef.allowMoveWhileCasting ? 1.0 : 0.25;
      }
      // Goblin Passive 1 (Nimble Reflexes) grants crisp, snappy agility acceleration
      const accelRate = p.heroId === 'goblin' ? 26 : 18;
      const targetVx = moveVec.x * p.stats.moveSpeed * transformSpeedMul * castMoveFactor;
      const targetVy = moveVec.y * p.stats.moveSpeed * transformSpeedMul * castMoveFactor;
      p.vx += (targetVx - p.vx) * Math.min(1, dt * accelRate);
      p.vy += (targetVy - p.vy) * Math.min(1, dt * accelRate);
    }

    if (!p.phantomFrenzyState && !p.kingOfThievesState) {
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      resolveCircleObstacles(p, room);
    }

    const speedMag = Math.hypot(p.vx, p.vy);
    if (speedMag > 14) {
      p.walkCycle += dt * (speedMag / 22);
      if (!p.activeAnim && !this.heldSkillAimId) {
        p.facingAngle = Math.atan2(p.vy, p.vx);
      }
      if (Math.random() < dt * 7) {
        this.particles.push({
          x: p.x + (Math.random() - 0.5) * 10,
          y: p.y + 15,
          vx: -p.vx * 0.1,
          vy: -8,
          size: 2.6,
          color: 'rgba(148, 163, 184, 0.45)',
          alpha: 0.6,
          life: 0.3,
          maxLife: 0.3,
        });
      }
    }

    updateMinionsAndHazards(dt, p, room, worldCtx);
    updateEnemiesAI(dt, p, room, worldCtx);
    this.updateProjectiles(dt, room, worldCtx);
    this.updatePickups(dt, room, worldCtx);
    this.checkRoomState(dt, room);
    updateVFXSystem(
      this.vfx,
      dt,
      p.x,
      p.y,
      speedMag > 16,
      p.facingAngle,
      p.lordOfDecayTimer > 0,
      p.boneColossusTimer > 0
    );
    this.updateVisualTimers(dt);

    const camLerp = Math.min(1, dt * 8.5);
    this.cameraX += (p.x - this.cameraX) * camLerp;
    this.cameraY += (p.y - this.cameraY) * camLerp;

    if (this.screenShake > 0) {
      this.screenShake = Math.max(0, this.screenShake - dt * 28);
    }

    this.hudThrottle += dt;
    if (this.hudThrottle >= 0.05) {
      this.hudThrottle = 0;
      this.emitHudSnapshot();
    }
  }

  private updateProjectiles(dt: number, room: RoomData, worldCtx: WorldEffectsContext): void {
    const wall = 48;
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const proj = this.projectiles[i];

      // 2.5D Aerial Falling Dagger Projectiles (Goblin's Thousand Daggers Ultimate!)
      if (proj.visualKind === 'FALLING_DAGGER') {
        if (proj.spawnDelay && proj.spawnDelay > 0) {
          proj.spawnDelay -= dt;
          continue;
        }

        proj.life -= dt;
        proj.z = (proj.z ?? 260) + (proj.vz ?? -720) * dt;

        if (proj.z <= 0 || proj.life <= 0) {
          let hitAnyEnemy = false;
          const maxPerEnemy = proj.maxHitsPerEnemy ?? 5;

          for (const enemy of this.enemies) {
            if (enemy.dead) continue;
            if (Math.hypot(enemy.x - proj.x, enemy.y - proj.y) <= proj.radius + enemy.radius) {
              const prevHits = proj.sharedHitCounts?.[enemy.id] || 0;
              if (prevHits < maxPerEnemy) {
                if (proj.sharedHitCounts) {
                  proj.sharedHitCounts[enemy.id] = prevHits + 1;
                }
                hitAnyEnemy = true;
                const pushA = Math.atan2(enemy.y - proj.y, enemy.x - proj.x);
                damageEnemy(this.player, enemy, proj.damage, pushA, 65, worldCtx, {
                  critBonusChance: 0.12,
                  silent: true,
                  colorOverride: '#FACC15',
                  impactStyle: 'IMPACT_BURST_DAGGER',
                });
              }
            }
          }

          audio.playFallingDaggerHit();
          spawnFallingDaggerImpactVfx(this.vfx, proj.x, proj.y, hitAnyEnemy);
          this.projectiles.splice(i, 1);
        }
        continue;
      }

      proj.life -= dt;
      const stepDist = Math.hypot(proj.vx, proj.vy) * dt;
      proj.x += proj.vx * dt;
      proj.y += proj.vy * dt;
      if (proj.distanceTraveled !== undefined) {
        proj.distanceTraveled += stepDist;
      }

      let hitWall =
        proj.x < wall || proj.x > room.width - wall || proj.y < wall || proj.y > room.height - wall;

      if (!hitWall) {
        for (const obs of room.obstacles) {
          if (
            proj.x + proj.radius * 0.5 > obs.x &&
            proj.x - proj.radius * 0.5 < obs.x + obs.w &&
            proj.y + proj.radius * 0.5 > obs.y &&
            proj.y - proj.radius * 0.5 < obs.y + obs.h
          ) {
            hitWall = true;
            break;
          }
        }
      }

      const exceededMaxRange =
        proj.maxDistance !== undefined &&
        proj.distanceTraveled !== undefined &&
        proj.distanceTraveled >= proj.maxDistance;

      if (hitWall || proj.life <= 0 || exceededMaxRange) {
        if (proj.visualKind === 'BONE_SPEAR') {
          spawnBoneSpearShatterVfx(
            this.vfx,
            proj.x,
            proj.y,
            proj.angle ?? Math.atan2(proj.vy, proj.vx)
          );
        } else {
          spawnParticles(this.particles, proj.x, proj.y, proj.color, 6, 25, 85, 2, 4, 0.25);
        }
        this.projectiles.splice(i, 1);
        continue;
      }

      if (proj.friendly) {
        // Friendly piercing projectiles (Skeleton Bone Spear & Reaper's Judgment Dark Energy Wave!)
        const hitAngle = proj.angle ?? Math.atan2(proj.vy, proj.vx);
        const hitSet = proj.hitEnemyIds || [];
        let consumed = false;

        for (const enemy of this.enemies) {
          if (enemy.dead || hitSet.includes(enemy.id)) continue;
          if (Math.hypot(proj.x - enemy.x, proj.y - enemy.y) <= proj.radius + enemy.radius) {
            hitSet.push(enemy.id);
            proj.hitEnemyIds = hitSet;

            const isReaperWave = proj.visualKind === 'REAPER_WAVE';
            damageEnemy(this.player, enemy, proj.damage, hitAngle, isReaperWave ? 220 : 145, worldCtx, {
              energyGain: isReaperWave ? 0 : 6,
              critBonusChance: isReaperWave ? 0.2 : 0.08,
              critMultiplierOverride: isReaperWave ? 2.15 : undefined,
              colorOverride: isReaperWave ? '#818CF8' : '#F8FAFC',
              impactStyle: isReaperWave ? 'IMPACT_BURST_REAPER' : 'IMPACT_BURST_BONE',
            });

            if (proj.visualKind === 'BONE_SPEAR') {
              spawnBoneSpearPierceVfx(this.vfx, enemy.x, enemy.y, hitAngle, false);
            }

            if (!proj.piercing) {
              consumed = true;
              break;
            }
          }
        }

        if (consumed) {
          this.projectiles.splice(i, 1);
        }
      } else {
        // Enemy projectiles: check Skeletal Warrior minion interception, Bone Storm deflection, Ribcage Shield block, then Player hit
        let interceptedByMinion = false;
        for (const m of this.minions) {
          if (m.kind === 'SKELETON_WARRIOR' && m.hp !== undefined && m.hp > 0) {
            if (Math.hypot(proj.x - m.x, proj.y - m.y) <= proj.radius + m.radius * 0.85) {
              m.hp -= proj.damage;
              m.hurtFlash = 0.2;
              audio.playBoneBlock();
              spawnParticles(this.particles, proj.x, proj.y, '#BAE6FD', 5, 30, 90, 2, 4, 0.25);
              interceptedByMinion = true;
              break;
            }
          }
        }
        if (interceptedByMinion) {
          this.projectiles.splice(i, 1);
          continue;
        }

        const dist = Math.hypot(proj.x - this.player.x, proj.y - this.player.y);

        // Active Bone Storm has a swirling deflection ring around Skeleton!
        if (
          this.player.boneStormTimer > 0 &&
          dist <= 76 &&
          dist >= 34 &&
          Math.random() < 0.55
        ) {
          audio.playBoneBlock();
          spawnRibcageShieldBlockVfx(
            this.vfx,
            proj.x,
            proj.y,
            Math.atan2(proj.y - this.player.y, proj.x - this.player.x)
          );
          addFloatingText(this.floatingTexts, proj.x, proj.y - 10, 'Deflected!', '#BAE6FD', 12);
          this.projectiles.splice(i, 1);
          continue;
        }

        // Active Ribcage Shield intercepts projectiles at its rib-barrier perimeter (radius 30px)!
        const hitRadius =
          this.player.ribcageShieldTimer > 0 && this.player.ribcageShieldHp > 0
            ? 30
            : this.player.radius * 0.8;

        if (dist <= proj.radius + hitRadius) {
          const hitA = Math.atan2(proj.vy, proj.vx);
          hurtPlayer(this.player, proj.damage, hitA, worldCtx, proj.damageType || 'MAGIC');
          this.projectiles.splice(i, 1);
        }
      }
    }
  }

  private updatePickups(dt: number, room: RoomData, worldCtx: WorldEffectsContext): void {
    for (let i = this.pickups.length - 1; i >= 0; i--) {
      const item = this.pickups[i];
      if (item.kind === 'TREASURE_CHEST') {
        if (!item.opened && Math.hypot(this.player.x - item.x, this.player.y - item.y) <= 44) {
          this.openTreasureChest(item, room);
        }
        continue;
      }

      item.x += item.vx * dt;
      item.y += item.vy * dt;
      item.vx *= Math.pow(0.01, dt);
      item.vy *= Math.pow(0.01, dt);

      const dx = this.player.x - item.x;
      const dy = this.player.y - item.y;
      const dist = Math.hypot(dx, dy) || 1;

      if (dist < 145 || room.cleared) {
        const pullSpd = room.cleared ? 360 : 250;
        item.x += (dx / dist) * pullSpd * dt;
        item.y += (dy / dist) * pullSpd * dt;
      }

      if (dist <= this.player.radius + 12) {
        audio.playPickup(item.kind);
        if (item.kind === 'XP') {
          this.player.xp += item.value;
          if (this.player.xp >= this.player.xpToNext) {
            this.player.xp -= this.player.xpToNext;
            this.player.level += 1;
            this.player.xpToNext = Math.round(this.player.xpToNext * 1.32);
            this.player.maxHp += 10;
            this.player.stats.maxHp += 10;
            this.player.stats.attackDamage += 3;
            this.player.hp = Math.min(this.player.maxHp, this.player.hp + 20);
            audio.playLevelUp();
            addFloatingText(this.floatingTexts, this.player.x, this.player.y - 26, `Level ${this.player.level}!`, '#34D399', 16, true);
          }
        } else if (item.kind === 'GOLD') {
          this.player.gold += item.value;
          addFloatingText(this.floatingTexts, this.player.x, this.player.y - 14, `+${item.value}g`, '#FBBF24', 13);
        } else if (item.kind === 'HEART') {
          healPlayer(this.player, item.value, worldCtx);
        } else if (item.kind === 'ENERGY') {
          this.player.ultEnergy = Math.min(100, this.player.ultEnergy + item.value * this.player.stats.energyGainRate);
          addFloatingText(this.floatingTexts, this.player.x, this.player.y - 14, '+Soul', '#C084FC', 13);
        }

        this.pickups.splice(i, 1);
      }
    }
  }

  private checkRoomState(dt: number, room: RoomData): void {
    if (this.portalTriggerCooldown > 0) {
      this.portalTriggerCooldown = Math.max(0, this.portalTriggerCooldown - dt);
    }

    if (this.mode === 'HUB') {
      if (
        this.portalTriggerCooldown <= 0 &&
        Math.hypot(this.player.x - room.portalPos.x, this.player.y - 72) <= 46
      ) {
        this.portalTriggerCooldown = 0.8;
        this.player.y = 132;
        this.player.vy = 0;
        this.joyX = 0;
        this.joyY = 0;
        this.callbacks.onHubStationInteract('DUNGEON_PORTAL');
      }
      return;
    }

    const livingEnemies = this.enemies.filter((e) => !e.dead).length;
    if (!room.cleared && (room.type === RoomType.NORMAL || room.type === RoomType.ELITE || room.type === RoomType.BOSS)) {
      if (livingEnemies === 0) {
        if (room.wavesRemaining > 0) {
          room.wavesRemaining -= 1;
          const nextWave = spawnEnemiesForRoom(room, 1);
          for (const ne of nextWave) {
            spawnParticles(this.particles, ne.x, ne.y, '#34D399', 12, 30, 120, 3, 5, 0.45, true);
          }
          this.enemies.push(...nextWave);
        } else {
          room.cleared = true;
          this.roomsClearedCount += 1;
          audio.playRoomClear();

          if (room.type === RoomType.BOSS) {
            this.finishTimer = 1.35;
            addFloatingText(this.floatingTexts, this.player.x, this.player.y - 30, 'Crypt Cleansed!', '#FBBF24', 18, true);
          } else {
            room.portalOpen = true;
            if (!room.rewardClaimed) {
              room.rewardClaimed = true;
              setTimeout(() => {
                if (!this.runEnded) {
                  this.setPaused(true);
                  this.callbacks.onRequestUpgrade(rollUpgradeChoices(this.loadout, 3));
                }
              }, 480);
            }
          }
        }
      }
    }

    if (this.finishTimer > 0) {
      this.finishTimer -= dt;
      if (this.finishTimer <= 0 && !this.runEnded) {
        this.runEnded = true;
        this.callbacks.onRunFinished({
          victory: true,
          roomsCleared: this.roomsClearedCount,
          totalRooms: this.rooms.length,
          enemiesDefeated: this.enemiesDefeated,
          damageDealt: this.damageDealt,
          goldCollected: this.player.gold,
          levelReached: this.player.level,
          upgradesPicked: this.upgradesPicked,
          durationSec: Math.round(this.elapsedRunTime),
        });
      }
    }

    if (room.portalOpen && Math.hypot(this.player.x - room.portalPos.x, this.player.y - 62) <= 44) {
      if (this.currentRoomIdx < this.rooms.length - 1) {
        audio.playUiClick();
        this.currentRoomIdx += 1;
        this.setupRoomEntities(this.rooms[this.currentRoomIdx]);
      }
    }
  }

  private updateVisualTimers(dt: number): void {
    for (let i = 0; i < this.enemies.length; i++) {
      const e = this.enemies[i];
      if (e.hitReactionTimer && e.hitReactionTimer > 0) {
        e.hitReactionTimer = Math.max(0, e.hitReactionTimer - dt);
      }
    }

    for (let i = this.slashes.length - 1; i >= 0; i--) {
      this.slashes[i].life -= dt;
      if (this.slashes[i].life <= 0) this.slashes.splice(i, 1);
    }

    for (let i = this.particles.length - 1; i >= 0; i--) {
      const pt = this.particles[i];
      pt.life -= dt;
      pt.x += pt.vx * dt;
      pt.y += pt.vy * dt;
      if (pt.life <= 0) this.particles.splice(i, 1);
    }

    for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
      const ft = this.floatingTexts[i];
      ft.life -= dt;
      ft.y += ft.vy * dt;
      ft.vy *= 0.92;
      if (ft.life <= 0) this.floatingTexts.splice(i, 1);
    }
  }

  private render(): void {
    const rect = this.canvas.getBoundingClientRect();
    const viewW = rect.width;
    const viewH = rect.height;
    if (viewW <= 0 || viewH <= 0) return;

    const shakeX = this.screenShake > 0 ? (Math.random() - 0.5) * this.screenShake * 1.4 : 0;
    const shakeY = this.screenShake > 0 ? (Math.random() - 0.5) * this.screenShake * 1.4 : 0;

    const camX = this.cameraX + shakeX;
    const camY = this.cameraY + shakeY;

    renderGameWorld(this.ctx, viewW, viewH, {
      room: this.rooms[this.currentRoomIdx],
      player: this.player,
      enemies: this.enemies,
      minions: this.minions,
      hazards: this.hazards,
      projectiles: this.projectiles,
      slashes: this.slashes,
      particles: this.particles,
      floatingTexts: this.floatingTexts,
      pickups: this.pickups,
      vfx: this.vfx,
      cameraX: camX,
      cameraY: camY,
      joystickMoving: Math.hypot(this.joyX, this.joyY) > 0.08,
      skillAimPreview: this.skillAimPreview,
      time: this.renderTime,
    });
  }

  private emitHudSnapshot(): void {
    const room = this.rooms[this.currentRoomIdx];
    const boss = this.enemies.find((e) => e.isBoss && !e.dead);

    let nearbyStation: HubStation | null = null;
    if (room.hubStations) {
      for (const st of room.hubStations) {
        if (Math.hypot(this.player.x - st.x, this.player.y - st.y) <= st.radius + 46) {
          nearbyStation = st;
          break;
        }
      }
    }

    const nearbyChest =
      this.pickups.some(
        (pk) =>
          pk.kind === 'TREASURE_CHEST' &&
          !pk.opened &&
          Math.hypot(this.player.x - pk.x, this.player.y - pk.y) <= 78
      ) ||
      (room.type === RoomType.EVENT &&
        !room.eventResolved &&
        Math.hypot(this.player.x - room.width / 2, this.player.y - (room.height / 2 - 20)) <= 92);

    this.callbacks.onHudUpdate({
      hp: Math.ceil(this.player.hp),
      maxHp: this.player.maxHp,
      ultEnergy: Math.floor(this.player.ultEnergy),
      level: this.player.level,
      xp: this.player.xp,
      xpToNext: this.player.xpToNext,
      gold: this.player.gold,
      roomIndex: room.index,
      totalRooms: this.rooms.length,
      roomName: room.name,
      roomType: room.type,
      roomCleared: room.cleared,
      enemiesAlive: this.enemies.filter((e) => !e.dead && e.kind !== 'TRAINING_DUMMY').length,
      cooldowns: { ...this.player.cooldowns },
      dodgeCooldown: this.player.dodgeCooldown,
      lordOfDecayRemaining: this.player.lordOfDecayTimer,
      regenRemaining: this.player.regenTimer,
      boneColossusRemaining: this.player.boneColossusTimer,
      ribcageShieldRemaining: this.player.ribcageShieldTimer,
      boneStormRemaining: this.player.boneStormTimer,
      windrunnerRemaining: this.player.windrunnerTimer,
      poisonedBladesRemaining: this.player.poisonedBladesTimer,
      kingOfThievesRemaining: this.player.kingOfThievesBuffTimer,
      minionsActive: this.minions.length,
      bossInfo: boss ? { name: boss.name, hp: Math.ceil(boss.hp), maxHp: boss.maxHp } : null,
      nearbyStation,
      nearbyChest,
      portalReady: room.portalOpen,
    });
  }

  private resizeCanvas = (): void => {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const rect = this.canvas.getBoundingClientRect();
    if (rect.width > 0 && rect.height > 0) {
      this.canvas.width = Math.round(rect.width * dpr);
      this.canvas.height = Math.round(rect.height * dpr);
      this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
  };



  private bindEvents(): void {
    window.addEventListener('resize', this.resizeCanvas);
  }

  private unbindEvents(): void {
    window.removeEventListener('resize', this.resizeCanvas);
  }
}
