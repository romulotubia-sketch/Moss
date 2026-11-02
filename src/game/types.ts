export enum ScreenState {
  HUB = 'HUB',
  DUNGEON = 'DUNGEON',
}

export enum AbilityCategory {
  BASIC = 'BASIC',
  NORMAL = 'NORMAL',
  ULTIMATE = 'ULTIMATE',
}

export enum AnimPhase {
  NONE = 'NONE',
  ANTICIPATION = 'ANTICIPATION',
  EXECUTION = 'EXECUTION',
  RECOVERY = 'RECOVERY',
}

export enum RoomType {
  HUB = 'HUB',
  NORMAL = 'NORMAL',
  ELITE = 'ELITE',
  TREASURE = 'TREASURE',
  HEALING = 'HEALING',
  EVENT = 'EVENT',
  BOSS = 'BOSS',
}

export enum EnemyKind {
  TRAINING_DUMMY = 'TRAINING_DUMMY',
  MOSS_SLIME = 'MOSS_SLIME',
  GLOOM_SHROOM = 'GLOOM_SHROOM',
  BONE_SCUTTLER = 'BONE_SCUTTLER',
  EMBER_IMP = 'EMBER_IMP',
  BRAMBLE_KNIGHT = 'BRAMBLE_KNIGHT',
  CRYPT_WARDEN_BOSS = 'CRYPT_WARDEN_BOSS',
}

export type DamageType = 'PHYSICAL' | 'MAGIC' | 'POISON';

export type SkillAimStyle = 'DIRECTIONAL_CONE' | 'DIRECTIONAL_ARROW' | 'AOE_RING' | 'SELF';

export interface SkillAimPreview {
  abilityId: string;
  angle: number;
  range: number;
  style: SkillAimStyle;
}

export interface AbilityDefinition {
  id: string;
  heroId: string;
  name: string;
  category: AbilityCategory;
  cooldown: number; // seconds
  energyCost: number; // 0 for normal, 100 for ultimate
  damage: number;
  range: number;
  duration?: number;
  anticipationTime: number; // seconds
  executionTime: number; // seconds
  recoveryTime: number; // seconds
  aimStyle: SkillAimStyle;
  allowMoveWhileCasting: boolean;
  summary: string;
  detail: string;
  accentColor: string;
  iconKey: string;
  tags: string[];
}

export interface HeroStats {
  maxHp: number;
  moveSpeed: number;
  attackDamage: number;
  attackSpeed: number; // multiplier, 1.0 baseline
  critChance: number; // 0.0 to 1.0
  skillPower: number; // multiplier, 1.0 baseline
  healingPower: number; // multiplier, 1.0 baseline
  energyGainRate: number; // multiplier, 1.0 baseline
}

export interface PassiveDefinition {
  id: string;
  heroId: string;
  name: string;
  iconKey: string;
  accentColor: string;
  description: string;
  gameplayEffect: string;
}

export interface HeroDefinition {
  id: string;
  name: string;
  title: string;
  subtitle: string;
  lore: string;
  accentColor: string;
  unlocked: boolean;
  baseStats: HeroStats;
  basicAttackId: string;
  normalSkillIds: string[]; // Exactly 5
  ultimateIds: string[]; // Exactly 3
  passiveIds: [string, string]; // Exactly 2 innate passives
}

export interface EquippedLoadout {
  heroId: string;
  normalSkills: [string, string]; // Strictly 2 out of 5
  ultimate: string; // Strictly 1 out of 3
}

export interface ActiveActionAnim {
  abilityId: string;
  phase: AnimPhase;
  phaseTimer: number;
  phaseDuration: number;
  executedHit: boolean;
  aimAngle: number;
  comboIndex: number;
}

export interface PlayerState {
  heroId: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  facingAngle: number;
  hp: number;
  maxHp: number;
  shield: number;
  ultEnergy: number; // 0..100
  level: number;
  xp: number;
  xpToNext: number;
  gold: number;
  stats: HeroStats;
  // Zombie Active buffs / transformations & Passives
  regenTimer: number;
  regenTickTimer: number;
  regenPerSecond: number;
  lordOfDecayTimer: number;
  lordOfDecayMax: number;
  passiveRegenTimer: number;
  passiveRegenSurgeTimer: number;
  passiveAmbientTimer: number;
  // Skeleton Active buffs / transformations
  ribcageShieldTimer: number;
  ribcageShieldHp: number;
  ribcageShieldMaxHp: number;
  boneStormTimer: number;
  boneStormMaxTimer: number;
  boneStormHitTimers: Record<string, number>;
  boneColossusTimer: number;
  boneColossusMax: number;
  // Goblin Active buffs, passives & multi-strike sequences
  windrunnerTimer: number;
  windrunnerMaxTimer: number;
  windrunnerEvadeCooldown: number;
  poisonedBladesTimer: number;
  poisonedBladesMaxTimer: number;
  nimbleReflexesCooldown: number;
  nimbleEvadeTimer: number;
  kingOfThievesBuffTimer: number;
  kingOfThievesStacks: number;
  goblinVanishTimer: number;
  daggerFlurryState: {
    hitsRemaining: number;
    nextHitTimer: number;
    aimAngle: number;
    totalHits: number;
  } | null;
  phantomFrenzyState: {
    strikesDone: number;
    totalStrikes: number;
    nextStrikeTimer: number;
    originX: number;
    originY: number;
    visitedEnemyIds: string[];
    aimAngle: number;
  } | null;
  kingOfThievesState: {
    strikesDone: number;
    totalStrikes: number;
    nextStrikeTimer: number;
    originX: number;
    originY: number;
    hitCounts: Record<string, number>;
    lastTargetX: number;
    lastTargetY: number;
    aimAngle: number;
  } | null;
  // Shared dodge & animation state
  dodgeTimer: number;
  dodgeCooldown: number;
  dodgeDirX: number;
  dodgeDirY: number;
  invulnTimer: number;
  hurtFlash: number;
  isDead: boolean;
  deathTimer: number;
  walkCycle: number;
  idleTime: number;
  comboStep: number;
  activeAnim: ActiveActionAnim | null;
  cooldowns: Record<string, number>;
}

export interface EnemyState {
  id: string;
  kind: EnemyKind;
  name: string;
  isElite: boolean;
  isBoss: boolean;
  x: number;
  y: number;
  vx: number;
  vy: number;
  knockVx: number;
  knockVy: number;
  radius: number;
  hp: number;
  maxHp: number;
  speed: number;
  contactDamage: number;
  facingAngle: number;
  walkCycle: number;
  hurtFlash: number;
  // Poison DoT & Plague Carrier / Poisoned Blades stacks
  poisonTimer: number;
  poisonTickTimer: number;
  poisonDps: number;
  poisonStacks?: number;
  // Root / Slow from Death's Embrace
  rootTimer: number;
  // AI & Telegraph state
  aiState: 'IDLE' | 'CHASE' | 'TELEGRAPH' | 'ATTACK' | 'COOLDOWN';
  aiTimer: number;
  attackPattern: number;
  telegraphAngle: number;
  telegraphRange: number;
  telegraphWidth: number;
  telegraphType: 'CONE' | 'CIRCLE' | 'LINE' | 'RING' | 'GROUND_VINES';
  targetX: number;
  targetY: number;
  dead: boolean;
  deathAnim: number; // 0 to 1 when dying
  hitReactionTimer?: number;
  lastHitAngle?: number;
}

export interface MinionState {
  id: string;
  kind?: 'ZOMBIE_SPROUTLING' | 'SKELETON_WARRIOR';
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  hp?: number;
  maxHp?: number;
  life: number;
  maxLife: number;
  attackCooldown: number;
  damage: number;
  walkCycle: number;
  facingAngle: number;
  attackFlash: number;
  hurtFlash?: number;
  spawnAnim: number;
  spawnDuration?: number;
}

export interface HazardZone {
  id: string;
  kind:
    | 'POISON_PUDDLE'
    | 'TOMBSTONE'
    | 'SPECTRAL_GRAB'
    | 'BOSS_VINE_TELEGRAPH'
    | 'HEALING_SPRING'
    | 'GOBLIN_TRAP'
    | 'THOUSAND_DAGGERS_ZONE';
  x: number;
  y: number;
  radius: number;
  life: number;
  maxLife: number;
  tickTimer: number;
  damage: number;
  friendly: boolean;
  spawnDelay?: number;
  armedTimer?: number;
  triggeredTimer?: number;
}

export interface Projectile {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  damage: number;
  friendly: boolean;
  color: string;
  life: number;
  damageType?: DamageType;
  visualKind?: 'ORB' | 'BONE_SPEAR' | 'REAPER_WAVE' | 'FALLING_DAGGER';
  piercing?: boolean;
  hitEnemyIds?: string[];
  distanceTraveled?: number;
  maxDistance?: number;
  angle?: number;
  appliesPoison?: boolean;
  // 2.5D Aerial projectile fields (used by Goblin's Thousand Daggers)
  z?: number;
  vz?: number;
  gravity?: number;
  targetX?: number;
  targetY?: number;
  spawnDelay?: number;
  sharedHitCounts?: Record<string, number>;
  maxHitsPerEnemy?: number;
}

export interface SlashEffect {
  id: string;
  x: number;
  y: number;
  angle: number;
  radius: number;
  arc: number;
  life: number;
  maxLife: number;
  colorPrimary: string;
  colorSecondary: string;
  flip: boolean;
  style: 'CLAW' | 'TWIN_RIP' | 'NOVA' | 'SKELETAL_SWIPE';
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  alpha: number;
  life: number;
  maxLife: number;
  gravity?: number;
  glow?: boolean;
}

export interface FloatingText {
  id: string;
  x: number;
  y: number;
  vy: number;
  text: string;
  color: string;
  size: number;
  life: number;
  maxLife: number;
  isCrit?: boolean;
}

export interface PickupItem {
  id: string;
  kind: 'XP' | 'GOLD' | 'HEART' | 'ENERGY' | 'TREASURE_CHEST';
  x: number;
  y: number;
  vx: number;
  vy: number;
  value: number;
  bobOffset: number;
  opened?: boolean;
}

export interface Obstacle {
  x: number;
  y: number;
  w: number;
  h: number;
  kind:
    | 'PILLAR'
    | 'CRATE'
    | 'TABLE'
    | 'FOUNTAIN'
    | 'FIREPLACE'
    | 'TREE'
    | 'FLOWER_BED'
    | 'BENCH'
    | 'BOOKSHELF'
    | 'WEAPON_RACK';
}

export type HubStationId =
  | 'HERO_SELECT_AREA'
  | 'SKILL_PREP_AREA'
  | 'DUNGEON_PORTAL'
  | 'CAMPFIRE_HEAL'
  | 'NPC_LANTERN_KEEPER'
  | 'NPC_SPROUT_HERBALIST'
  | 'NPC_TRAINING_MASTER';

export interface HubStation {
  id: HubStationId;
  x: number;
  y: number;
  radius: number;
  label: string;
  sublabel: string;
  color: string;
}

export interface LobbyNpcDef {
  id: string;
  stationId: HubStationId;
  name: string;
  role: string;
  x: number;
  y: number;
  radius: number;
  accentColor: string;
  appearance: 'OWL_KEEPER' | 'SPROUT_HERBALIST' | 'TORTOISE_MASTER';
  dialogueLines: string[];
}

export interface LobbyDecorPatch {
  x: number;
  y: number;
  kind: 'RUG' | 'PATH_STONE' | 'FLOWER_TUFT' | 'WOOD_DECK';
  w?: number;
  h?: number;
  r?: number;
  color?: string;
}

export interface RoomData {
  index: number;
  type: RoomType;
  name: string;
  subtitle: string;
  width: number;
  height: number;
  obstacles: Obstacle[];
  lanterns: { x: number; y: number; color: string }[];
  cleared: boolean;
  rewardClaimed: boolean;
  eventResolved: boolean;
  wavesRemaining: number;
  hubStations?: HubStation[];
  npcs?: LobbyNpcDef[];
  decorPatches?: LobbyDecorPatch[];
  portalOpen: boolean;
  portalPos: { x: number; y: number };
}

export interface UpgradeOption {
  id: string;
  name: string;
  category: string;
  description: string;
  synergyAbilityId?: string;
  synergyLabel?: string;
  accentColor: string;
  apply: (stats: HeroStats, player: PlayerState) => void;
}

export interface DungeonEventChoice {
  label: string;
  effectText: string;
  canChoose?: (player: PlayerState) => boolean;
  resolve: (player: PlayerState) => string;
}

export interface DungeonEventDef {
  id: string;
  title: string;
  description: string;
  choices: DungeonEventChoice[];
}

export interface RunSummary {
  victory: boolean;
  roomsCleared: number;
  totalRooms: number;
  enemiesDefeated: number;
  damageDealt: number;
  goldCollected: number;
  levelReached: number;
  upgradesPicked: string[];
  durationSec: number;
}

export interface HUDTeachingSnapshot {
  hp: number;
  maxHp: number;
  ultEnergy: number;
  level: number;
  xp: number;
  xpToNext: number;
  gold: number;
  roomIndex: number;
  totalRooms: number;
  roomName: string;
  roomType: RoomType;
  roomCleared: boolean;
  enemiesAlive: number;
  cooldowns: Record<string, number>;
  dodgeCooldown: number;
  lordOfDecayRemaining: number;
  boneColossusRemaining: number;
  ribcageShieldRemaining: number;
  boneStormRemaining: number;
  regenRemaining: number;
  windrunnerRemaining: number;
  poisonedBladesRemaining: number;
  kingOfThievesRemaining: number;
  minionsActive: number;
  bossInfo: { name: string; hp: number; maxHp: number } | null;
  nearbyStation: HubStation | null;
  nearbyChest: boolean;
  portalReady: boolean;
}
