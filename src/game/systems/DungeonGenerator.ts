import {
  EnemyKind,
  EnemyState,
  LobbyDecorPatch,
  LobbyNpcDef,
  Obstacle,
  PickupItem,
  RoomData,
  RoomType,
} from '../types';

let entityCounter = 1;
export function nextEntityId(prefix: string): string {
  entityCounter += 1;
  return `${prefix}_${entityCounter}`;
}

export function createHubRoom(): RoomData {
  const width = 1240;
  const height = 860;

  const obstacles: Obstacle[] = [
    // Four lush swaying Lantern Trees framing the sanctuary garden (collision on trunk base)
    { x: 128, y: 152, w: 46, h: 38, kind: 'TREE' },
    { x: width - 174, y: 152, w: 46, h: 38, kind: 'TREE' },
    { x: 132, y: height - 168, w: 46, h: 38, kind: 'TREE' },
    { x: width - 178, y: height - 168, w: 46, h: 38, kind: 'TREE' },

    // Blooming flower planter beds flanking north gate & southern courtyard
    { x: 392, y: 92, w: 86, h: 40, kind: 'FLOWER_BED' },
    { x: width - 478, y: 92, w: 86, h: 40, kind: 'FLOWER_BED' },
    { x: 268, y: height - 134, w: 94, h: 42, kind: 'FLOWER_BED' },
    { x: width - 362, y: height - 134, w: 94, h: 42, kind: 'FLOWER_BED' },

    // West Hero Sanctuary furniture: Arcane Bookshelf & Herbalist Table
    { x: 146, y: 268, w: 108, h: 44, kind: 'BOOKSHELF' },
    { x: 274, y: 272, w: 86, h: 42, kind: 'TABLE' },

    // Center Courtyard furniture: Cozy Wooden Hearth Bench
    { x: width / 2 - 60, y: 368, w: 120, h: 36, kind: 'BENCH' },

    // East Training Grounds furniture: Wooden Weapon Rack & Supply Crate
    { x: width - 228, y: 268, w: 96, h: 42, kind: 'WEAPON_RACK' },
    { x: width - 156, y: 548, w: 58, h: 58, kind: 'CRATE' },
  ];

  const npcs: LobbyNpcDef[] = [
    {
      id: 'npc_barnaby',
      stationId: 'NPC_LANTERN_KEEPER',
      name: 'Barnaby',
      role: 'Gatekeeper Owl',
      x: 472,
      y: 196,
      radius: 20,
      accentColor: '#F59E0B',
      appearance: 'OWL_KEEPER',
      dialogueLines: [
        'Hoo-hello! Step through the Dungeon Entrance to the north whenever your hero and abilities are ready.',
        'Before entering the crypts, make sure you have 1 Hero, 2 Normal Skills, and 1 Ultimate equipped.',
        'Each dungeon run spans 7 procedural rooms—watch enemy ground telegraphs and save your Dodge for boss slams!',
      ],
    },
    {
      id: 'npc_pip',
      stationId: 'NPC_SPROUT_HERBALIST',
      name: 'Pip',
      role: 'Sanctuary Sprout',
      x: 348,
      y: 590,
      radius: 19,
      accentColor: '#34D399',
      appearance: 'SPROUT_HERBALIST',
      dialogueLines: [
        'Welcome back to the sanctuary! Visit the Hero Sanctuary platform beside me to inspect stats or switch heroes.',
        'Resting near the Cozy Hearthfire in the center rug restores your health and charges your Ultimate to 100%.',
        'Clearing dungeon rooms grants Sanctuary Blessings that boost your claws, poison clouds, or sproutling minions.',
      ],
    },
    {
      id: 'npc_bramble',
      stationId: 'NPC_TRAINING_MASTER',
      name: 'Master Bramble',
      role: 'Combat Instructor',
      x: 842,
      y: 274,
      radius: 21,
      accentColor: '#38BDF8',
      appearance: 'TORTOISE_MASTER',
      dialogueLines: [
        'Step onto the Skill Preparation ring below me to pick 2 of your 5 Normal Skills and 1 of your 3 Ultimates.',
        'Hold any skill button to preview its range and drag to aim—skills cast the moment you release your thumb!',
        'Try your newly equipped abilities on the Scarecrow Dummy right beside me before heading into battle.',
      ],
    },
  ];

  const decorPatches: LobbyDecorPatch[] = [
    // Center cozy hearth rug
    { x: width / 2 - 145, y: 420, w: 290, h: 186, kind: 'RUG' },
    // West Hero Sanctuary wooden platform
    { x: 140, y: 336, w: 236, h: 198, kind: 'WOOD_DECK' },
    // East Skill Preparation wooden platform
    { x: width - 376, y: 356, w: 236, h: 190, kind: 'WOOD_DECK' },
    // Stepping stones from spawn & wings to center and north gate
    { x: width / 2, y: 175, r: 22, kind: 'PATH_STONE' },
    { x: width / 2, y: 235, r: 20, kind: 'PATH_STONE' },
    { x: width / 2, y: 298, r: 22, kind: 'PATH_STONE' },
    { x: width / 2, y: 645, r: 22, kind: 'PATH_STONE' },
    { x: width / 2, y: 710, r: 20, kind: 'PATH_STONE' },
    { x: 418, y: 458, r: 19, kind: 'PATH_STONE' },
    { x: width - 418, y: 458, r: 19, kind: 'PATH_STONE' },
    // Colorful wildflower tufts around the courtyard
    { x: 225, y: 625, r: 14, color: '#F472B6', kind: 'FLOWER_TUFT' },
    { x: 435, y: 685, r: 13, color: '#FBBF24', kind: 'FLOWER_TUFT' },
    { x: 795, y: 675, r: 14, color: '#60A5FA', kind: 'FLOWER_TUFT' },
    { x: 1010, y: 635, r: 13, color: '#F472B6', kind: 'FLOWER_TUFT' },
    { x: 315, y: 198, r: 13, color: '#FBBF24', kind: 'FLOWER_TUFT' },
    { x: 765, y: 188, r: 13, color: '#A78BFA', kind: 'FLOWER_TUFT' },
    { x: 515, y: 332, r: 12, color: '#34D399', kind: 'FLOWER_TUFT' },
    { x: 728, y: 332, r: 12, color: '#F472B6', kind: 'FLOWER_TUFT' },
  ];

  return {
    index: 0,
    type: RoomType.HUB,
    name: 'Moss & Lantern Sanctuary',
    subtitle: 'Explore the sanctuary, select your hero, prepare skills, and enter the crypts',
    width,
    height,
    obstacles,
    npcs,
    decorPatches,
    lanterns: [
      { x: 175, y: 125, color: '#F59E0B' },
      { x: width - 175, y: 125, color: '#F59E0B' },
      { x: 175, y: height - 125, color: '#F59E0B' },
      { x: width - 175, y: height - 125, color: '#F59E0B' },
      { x: 258, y: 435, color: '#34D399' },
      { x: width - 258, y: 450, color: '#38BDF8' },
      { x: width / 2, y: 505, color: '#FB923C' },
    ],
    cleared: true,
    rewardClaimed: true,
    eventResolved: true,
    wavesRemaining: 0,
    portalOpen: true,
    portalPos: { x: width / 2, y: 92 },
    hubStations: [
      {
        id: 'DUNGEON_PORTAL',
        x: width / 2,
        y: 112,
        radius: 56,
        label: 'Dungeon Entrance',
        sublabel: 'Enter the Overgrown Crypts',
        color: '#10B981',
      },
      {
        id: 'HERO_SELECT_AREA',
        x: 258,
        y: 435,
        radius: 52,
        label: 'Hero Sanctuary',
        sublabel: 'Select Hero & View Stats',
        color: '#34D399',
      },
      {
        id: 'SKILL_PREP_AREA',
        x: width - 258,
        y: 452,
        radius: 52,
        label: 'Skill Preparation',
        sublabel: 'Equip 2 Skills & 1 Ultimate',
        color: '#38BDF8',
      },
      {
        id: 'CAMPFIRE_HEAL',
        x: width / 2,
        y: 505,
        radius: 46,
        label: 'Cozy Hearthfire',
        sublabel: 'Restore Health & Ultimate',
        color: '#FB923C',
      },
      {
        id: 'NPC_LANTERN_KEEPER',
        x: 472,
        y: 196,
        radius: 36,
        label: 'Barnaby',
        sublabel: 'Talk · Gatekeeper Owl',
        color: '#F59E0B',
      },
      {
        id: 'NPC_SPROUT_HERBALIST',
        x: 348,
        y: 590,
        radius: 36,
        label: 'Pip',
        sublabel: 'Talk · Sanctuary Sprout',
        color: '#34D399',
      },
      {
        id: 'NPC_TRAINING_MASTER',
        x: 842,
        y: 274,
        radius: 36,
        label: 'Master Bramble',
        sublabel: 'Talk · Combat Instructor',
        color: '#38BDF8',
      },
    ],
  };
}

export function generateDungeonSequence(): RoomData[] {
  // 7-room procedural dungeon run covering all 6 required room types:
  // 1: Normal Combat
  // 2: Normal Combat
  // 3: Treasure OR Event (randomized order)
  // 4: Elite Enemy Room
  // 5: Event OR Treasure (complement of Room 3)
  // 6: Healing Sanctuary Room (before Boss, or swapped with 5)
  // 7: Boss Room
  const treasureFirst = Math.random() < 0.5;
  const roomTypes: RoomType[] = [
    RoomType.NORMAL,
    RoomType.NORMAL,
    treasureFirst ? RoomType.TREASURE : RoomType.EVENT,
    RoomType.ELITE,
    treasureFirst ? RoomType.EVENT : RoomType.TREASURE,
    RoomType.HEALING,
    RoomType.BOSS,
  ];

  const combatTitles = [
    ['Overgrown Antechamber', 'Lantern spores drift through cracked flagstones'],
    ['Fungal Cellar', 'Luminous caps hum in the damp twilight'],
    ['Whispering Cloister', 'Restless bones patrol the mossy pillars'],
  ];

  return roomTypes.map((type, idx) => {
    const roomNum = idx + 1;
    let width = 1080;
    let height = 780;
    let name = '';
    let subtitle = '';
    let obstacles: Obstacle[] = [];

    if (type === RoomType.NORMAL) {
      const pick = combatTitles[idx % combatTitles.length];
      name = pick[0];
      subtitle = pick[1];
      obstacles = generateSymmetricObstacles(width, height, idx % 3);
    } else if (type === RoomType.ELITE) {
      width = 1160;
      height = 820;
      name = 'Hall of the Bramble Guard';
      subtitle = 'Elite Guardian Encounter · High Reward';
      obstacles = generateSymmetricObstacles(width, height, 2);
    } else if (type === RoomType.TREASURE) {
      width = 920;
      height = 680;
      name = 'Gilded Reliquary';
      subtitle = 'Open the ancient chest to claim coins and an upgrade';
      obstacles = [
        { x: 200, y: 190, w: 64, h: 64, kind: 'PILLAR' },
        { x: width - 264, y: 190, w: 64, h: 64, kind: 'PILLAR' },
        { x: 200, y: height - 254, w: 64, h: 64, kind: 'PILLAR' },
        { x: width - 264, y: height - 254, w: 64, h: 64, kind: 'PILLAR' },
      ];
    } else if (type === RoomType.HEALING) {
      width = 920;
      height = 680;
      name = 'Sunlit Dewdrop Spring';
      subtitle = 'Step into the warm herbal spring to restore health before the final sanctum';
      obstacles = [
        { x: 190, y: 200, w: 72, h: 56, kind: 'TABLE' },
        { x: width - 262, y: 200, w: 72, h: 56, kind: 'TABLE' },
      ];
    } else if (type === RoomType.EVENT) {
      width = 920;
      height = 680;
      name = 'Curiosity Alcove';
      subtitle = 'A cozy mysterious encounter awaits in the lantern glow';
      obstacles = [
        { x: 210, y: 210, w: 64, h: 64, kind: 'CRATE' },
        { x: width - 274, y: 210, w: 64, h: 64, kind: 'CRATE' },
      ];
    } else if (type === RoomType.BOSS) {
      width = 1260;
      height = 900;
      name = 'Sanctum of the Crypt Warden';
      subtitle = 'Final Boss · Defeat the Mossbound Crypt Warden';
      obstacles = [
        { x: 250, y: 230, w: 74, h: 74, kind: 'PILLAR' },
        { x: width - 324, y: 230, w: 74, h: 74, kind: 'PILLAR' },
        { x: 250, y: height - 304, w: 74, h: 74, kind: 'PILLAR' },
        { x: width - 324, y: height - 304, w: 74, h: 74, kind: 'PILLAR' },
      ];
    }

    const isNonCombat =
      type === RoomType.TREASURE || type === RoomType.HEALING || type === RoomType.EVENT;

    return {
      index: roomNum,
      type,
      name,
      subtitle,
      width,
      height,
      obstacles,
      lanterns: [
        { x: 150, y: 90, color: '#F59E0B' },
        { x: width - 150, y: 90, color: '#F59E0B' },
        { x: 150, y: height - 90, color: '#F59E0B' },
        { x: width - 150, y: height - 90, color: '#F59E0B' },
      ],
      cleared: type === RoomType.HEALING,
      rewardClaimed: type === RoomType.HEALING || type === RoomType.EVENT,
      eventResolved: type !== RoomType.EVENT,
      wavesRemaining: type === RoomType.NORMAL || type === RoomType.ELITE ? 1 : 0,
      portalOpen: type === RoomType.HEALING,
      portalPos: { x: width / 2, y: 84 },
    };
  });
}

function generateSymmetricObstacles(width: number, height: number, layoutIndex: number): Obstacle[] {
  if (layoutIndex === 0) {
    return [
      { x: 250, y: 220, w: 68, h: 68, kind: 'PILLAR' },
      { x: width - 318, y: 220, w: 68, h: 68, kind: 'PILLAR' },
      { x: 250, y: height - 288, w: 68, h: 68, kind: 'PILLAR' },
      { x: width - 318, y: height - 288, w: 68, h: 68, kind: 'PILLAR' },
    ];
  }
  if (layoutIndex === 1) {
    return [
      { x: width / 2 - 42, y: height / 2 - 42, w: 84, h: 84, kind: 'PILLAR' },
      { x: 210, y: height / 2 - 32, w: 64, h: 64, kind: 'CRATE' },
      { x: width - 274, y: height / 2 - 32, w: 64, h: 64, kind: 'CRATE' },
    ];
  }
  return [
    { x: 300, y: 250, w: 68, h: 68, kind: 'PILLAR' },
    { x: width - 368, y: height - 318, w: 68, h: 68, kind: 'PILLAR' },
    { x: width - 368, y: 250, w: 64, h: 64, kind: 'CRATE' },
    { x: 300, y: height - 314, w: 64, h: 64, kind: 'CRATE' },
  ];
}

export function createEnemy(kind: EnemyKind, x: number, y: number, difficultyScale = 1): EnemyState {
  switch (kind) {
    case EnemyKind.TRAINING_DUMMY:
      return {
        id: nextEntityId('dummy'),
        kind,
        name: 'Cozy Scarecrow Dummy',
        isElite: false,
        isBoss: false,
        x,
        y,
        vx: 0,
        vy: 0,
        knockVx: 0,
        knockVy: 0,
        radius: 24,
        hp: 9999,
        maxHp: 9999,
        speed: 0,
        contactDamage: 0,
        facingAngle: Math.PI / 2,
        walkCycle: 0,
        hurtFlash: 0,
        poisonTimer: 0,
        poisonTickTimer: 0,
        poisonDps: 0,
        rootTimer: 0,
        aiState: 'IDLE',
        aiTimer: 1,
        attackPattern: 0,
        telegraphAngle: 0,
        telegraphRange: 0,
        telegraphWidth: 0,
        telegraphType: 'CIRCLE',
        targetX: x,
        targetY: y,
        dead: false,
        deathAnim: 0,
      };

    case EnemyKind.MOSS_SLIME:
      return {
        id: nextEntityId('slime'),
        kind,
        name: 'Moss Slime',
        isElite: false,
        isBoss: false,
        x,
        y,
        vx: 0,
        vy: 0,
        knockVx: 0,
        knockVy: 0,
        radius: 20,
        hp: Math.round(58 * difficultyScale),
        maxHp: Math.round(58 * difficultyScale),
        speed: 98,
        contactDamage: Math.round(11 * difficultyScale),
        facingAngle: 0,
        walkCycle: Math.random() * 6,
        hurtFlash: 0,
        poisonTimer: 0,
        poisonTickTimer: 0,
        poisonDps: 0,
        rootTimer: 0,
        aiState: 'CHASE',
        aiTimer: 0.8 + Math.random() * 0.8,
        attackPattern: 0,
        telegraphAngle: 0,
        telegraphRange: 115,
        telegraphWidth: 28,
        telegraphType: 'LINE',
        targetX: x,
        targetY: y,
        dead: false,
        deathAnim: 0,
      };

    case EnemyKind.GLOOM_SHROOM:
      return {
        id: nextEntityId('shroom'),
        kind,
        name: 'Gloom Shroom',
        isElite: false,
        isBoss: false,
        x,
        y,
        vx: 0,
        vy: 0,
        knockVx: 0,
        knockVy: 0,
        radius: 21,
        hp: Math.round(52 * difficultyScale),
        maxHp: Math.round(52 * difficultyScale),
        speed: 78,
        contactDamage: Math.round(9 * difficultyScale),
        facingAngle: 0,
        walkCycle: Math.random() * 6,
        hurtFlash: 0,
        poisonTimer: 0,
        poisonTickTimer: 0,
        poisonDps: 0,
        rootTimer: 0,
        aiState: 'CHASE',
        aiTimer: 1.2 + Math.random() * 0.9,
        attackPattern: 0,
        telegraphAngle: 0,
        telegraphRange: 340,
        telegraphWidth: 16,
        telegraphType: 'LINE',
        targetX: x,
        targetY: y,
        dead: false,
        deathAnim: 0,
      };

    case EnemyKind.BONE_SCUTTLER:
      return {
        id: nextEntityId('skelly'),
        kind,
        name: 'Bone Scuttler',
        isElite: false,
        isBoss: false,
        x,
        y,
        vx: 0,
        vy: 0,
        knockVx: 0,
        knockVy: 0,
        radius: 20,
        hp: Math.round(72 * difficultyScale),
        maxHp: Math.round(72 * difficultyScale),
        speed: 132,
        contactDamage: Math.round(14 * difficultyScale),
        facingAngle: 0,
        walkCycle: Math.random() * 6,
        hurtFlash: 0,
        poisonTimer: 0,
        poisonTickTimer: 0,
        poisonDps: 0,
        rootTimer: 0,
        aiState: 'CHASE',
        aiTimer: 0.7,
        attackPattern: 0,
        telegraphAngle: 0,
        telegraphRange: 76,
        telegraphWidth: 1.3,
        telegraphType: 'CONE',
        targetX: x,
        targetY: y,
        dead: false,
        deathAnim: 0,
      };

    case EnemyKind.EMBER_IMP:
      return {
        id: nextEntityId('imp'),
        kind,
        name: 'Lantern Imp',
        isElite: false,
        isBoss: false,
        x,
        y,
        vx: 0,
        vy: 0,
        knockVx: 0,
        knockVy: 0,
        radius: 19,
        hp: Math.round(62 * difficultyScale),
        maxHp: Math.round(62 * difficultyScale),
        speed: 118,
        contactDamage: Math.round(12 * difficultyScale),
        facingAngle: 0,
        walkCycle: Math.random() * 6,
        hurtFlash: 0,
        poisonTimer: 0,
        poisonTickTimer: 0,
        poisonDps: 0,
        rootTimer: 0,
        aiState: 'CHASE',
        aiTimer: 1.3 + Math.random() * 0.7,
        attackPattern: 0,
        telegraphAngle: 0,
        telegraphRange: 280,
        telegraphWidth: 0.6,
        telegraphType: 'CONE',
        targetX: x,
        targetY: y,
        dead: false,
        deathAnim: 0,
      };

    case EnemyKind.BRAMBLE_KNIGHT:
      return {
        id: nextEntityId('elite'),
        kind,
        name: 'Elite Bramble Knight',
        isElite: true,
        isBoss: false,
        x,
        y,
        vx: 0,
        vy: 0,
        knockVx: 0,
        knockVy: 0,
        radius: 30,
        hp: Math.round(285 * difficultyScale),
        maxHp: Math.round(285 * difficultyScale),
        speed: 96,
        contactDamage: Math.round(18 * difficultyScale),
        facingAngle: 0,
        walkCycle: 0,
        hurtFlash: 0,
        poisonTimer: 0,
        poisonTickTimer: 0,
        poisonDps: 0,
        rootTimer: 0,
        aiState: 'CHASE',
        aiTimer: 1.2,
        attackPattern: 0,
        telegraphAngle: 0,
        telegraphRange: 120,
        telegraphWidth: 1.6,
        telegraphType: 'CIRCLE',
        targetX: x,
        targetY: y,
        dead: false,
        deathAnim: 0,
      };

    case EnemyKind.CRYPT_WARDEN_BOSS:
    default:
      return {
        id: nextEntityId('boss'),
        kind: EnemyKind.CRYPT_WARDEN_BOSS,
        name: 'Mossbound Crypt Warden',
        isElite: true,
        isBoss: true,
        x,
        y,
        vx: 0,
        vy: 0,
        knockVx: 0,
        knockVy: 0,
        radius: 42,
        hp: Math.round(780 * difficultyScale),
        maxHp: Math.round(780 * difficultyScale),
        speed: 88,
        contactDamage: 22,
        facingAngle: Math.PI / 2,
        walkCycle: 0,
        hurtFlash: 0,
        poisonTimer: 0,
        poisonTickTimer: 0,
        poisonDps: 0,
        rootTimer: 0,
        aiState: 'CHASE',
        aiTimer: 1.5,
        attackPattern: 0,
        telegraphAngle: 0,
        telegraphRange: 155,
        telegraphWidth: 1.8,
        telegraphType: 'CONE',
        targetX: x,
        targetY: y,
        dead: false,
        deathAnim: 0,
      };
  }
}

export function spawnEnemiesForRoom(room: RoomData, waveIndex = 0): EnemyState[] {
  if (room.type === RoomType.HUB) {
    return [createEnemy(EnemyKind.TRAINING_DUMMY, room.width - 285, 292, 1)];
  }

  const scale = 1 + (room.index - 1) * 0.14 + waveIndex * 0.08;

  if (room.type === RoomType.NORMAL) {
    const list: EnemyState[] = [];
    const count = room.index === 1 ? 4 : 5;
    const pool: EnemyKind[] =
      room.index === 1
        ? [EnemyKind.MOSS_SLIME, EnemyKind.MOSS_SLIME, EnemyKind.BONE_SCUTTLER, EnemyKind.GLOOM_SHROOM]
        : [EnemyKind.MOSS_SLIME, EnemyKind.BONE_SCUTTLER, EnemyKind.GLOOM_SHROOM, EnemyKind.EMBER_IMP];

    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count + 0.4;
      const dist = 210 + (i % 2) * 70;
      const ex = Math.max(120, Math.min(room.width - 120, room.width / 2 + Math.cos(angle) * dist));
      const ey = Math.max(120, Math.min(room.height - 220, room.height / 2 - 40 + Math.sin(angle) * (dist * 0.65)));
      const kind = pool[i % pool.length];
      list.push(createEnemy(kind, ex, ey, scale));
    }
    return list;
  }

  if (room.type === RoomType.ELITE) {
    if (waveIndex === 0) {
      return [
        createEnemy(EnemyKind.BRAMBLE_KNIGHT, room.width / 2, 230, scale),
        createEnemy(EnemyKind.GLOOM_SHROOM, 220, 220, scale),
        createEnemy(EnemyKind.GLOOM_SHROOM, room.width - 220, 220, scale),
      ];
    }
    return [
      createEnemy(EnemyKind.BONE_SCUTTLER, 240, 250, scale),
      createEnemy(EnemyKind.BONE_SCUTTLER, room.width - 240, 250, scale),
      createEnemy(EnemyKind.EMBER_IMP, room.width / 2, 200, scale),
    ];
  }

  if (room.type === RoomType.BOSS) {
    return [
      createEnemy(EnemyKind.CRYPT_WARDEN_BOSS, room.width / 2, 240, 1.15),
      createEnemy(EnemyKind.MOSS_SLIME, 260, 280, 1.1),
      createEnemy(EnemyKind.MOSS_SLIME, room.width - 260, 280, 1.1),
    ];
  }

  return [];
}

export function spawnRoomPropsPickups(room: RoomData): PickupItem[] {
  if (room.type === RoomType.TREASURE) {
    return [
      {
        id: nextEntityId('chest'),
        kind: 'TREASURE_CHEST',
        x: room.width / 2,
        y: room.height / 2 - 20,
        vx: 0,
        vy: 0,
        value: 45,
        bobOffset: 0,
        opened: false,
      },
    ];
  }
  return [];
}
